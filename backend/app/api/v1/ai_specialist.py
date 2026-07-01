"""
Specialist AI Endpoints — Domain-specific Claude AI with real data context.
Each module has its own system prompt and data fetchers.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import json, os
from loguru import logger
from ...core.database import fetch, fetchrow

router = APIRouter(prefix="/ai/specialist", tags=["ai_specialist"])


class SpecialistChatRequest(BaseModel):
    message: str
    module: str  # ads|product|finance|seo|forecast|automation|pricing|decision
    session_id: Optional[str] = None
    context_days: int = 30


# ── Shared Claude caller ──────────────────────────────────────────────────────

async def _call_claude_specialist(system_prompt: str, context: dict, user_message: str, history: list = []) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return f"[Demo mode] {user_message[:60]}... — Connect your ANTHROPIC_API_KEY to enable real AI responses."

    try:
        import httpx
        context_str = json.dumps(context, indent=2, default=str)
        full_system = f"{system_prompt}\n\nLive data context:\n```json\n{context_str}\n```"

        messages = history[-6:] + [{"role": "user", "content": user_message}]

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": "claude-3-5-haiku-20241022", "max_tokens": 1024, "system": full_system, "messages": messages}
            )
        if r.status_code == 200:
            return r.json()["content"][0]["text"]
        logger.error(f"Claude error: {r.status_code}")
        return "AI temporarily unavailable. Please try again."
    except Exception as e:
        logger.error(f"Claude specialist error: {e}")
        return "AI temporarily unavailable. Please try again."


# ── Data fetchers ─────────────────────────────────────────────────────────────

async def _ads_context(workspace_id: str, days: int) -> dict:
    try:
        campaigns = await fetch("""
            SELECT name, platform, status,
                   COALESCE(spend,0)::float AS spend,
                   COALESCE(revenue,0)::float AS revenue,
                   COALESCE(roas,0)::float AS roas,
                   COALESCE(impressions,0) AS impressions,
                   COALESCE(clicks,0) AS clicks,
                   COALESCE(ctr,0)::float AS ctr,
                   COALESCE(cpm,0)::float AS cpm,
                   COALESCE(cpc,0)::float AS cpc
            FROM ad_campaigns WHERE workspace_id=$1
              AND updated_at >= NOW() - ($2||' days')::INTERVAL
            ORDER BY spend DESC LIMIT 20
        """, workspace_id, str(days))
        summary = await fetchrow("""
            SELECT COALESCE(SUM(spend),0)::float AS total_spend,
                   COALESCE(SUM(revenue),0)::float AS total_revenue,
                   COALESCE(AVG(roas),0)::float AS avg_roas,
                   COALESCE(SUM(impressions),0) AS impressions,
                   COALESCE(SUM(clicks),0) AS clicks,
                   COALESCE(AVG(cpm),0)::float AS avg_cpm
            FROM ad_spend_daily WHERE workspace_id=$1
              AND date >= CURRENT_DATE - $2
        """, workspace_id, days)
        return {"campaigns": [dict(c) for c in campaigns], "summary": dict(summary) if summary else {}, "period_days": days}
    except Exception as e:
        logger.warning(f"Ads context error: {e}")
        return {}


async def _product_context(workspace_id: str, days: int) -> dict:
    try:
        products = await fetch("""
            SELECT p.title, p.sku,
                   COALESCE(p.inventory_quantity,0) AS stock,
                   COALESCE(p.price,0)::float AS price,
                   COALESCE(SUM(oi.quantity),0) AS units_sold,
                   COALESCE(SUM(oi.price*oi.quantity),0)::float AS revenue,
                   COUNT(DISTINCT o.id) AS orders
            FROM shopify_products p
            LEFT JOIN shopify_order_items oi ON oi.variant_id = p.shopify_variant_id
            LEFT JOIN shopify_orders o ON o.id = oi.order_id
                AND o.workspace_id=$1
                AND o.created_at >= NOW()-($2||' days')::INTERVAL
                AND o.financial_status NOT IN ('refunded','voided')
            WHERE p.workspace_id=$1
            GROUP BY p.id, p.title, p.sku, p.inventory_quantity, p.price
            ORDER BY revenue DESC LIMIT 20
        """, workspace_id, str(days))
        returns = await fetchrow("""
            SELECT COUNT(*) AS total_returns,
                   COALESCE(AVG(CASE WHEN r.status='returned' THEN 1 ELSE 0 END)*100,0)::float AS return_rate
            FROM returns_tracking r WHERE workspace_id=$1
        """, workspace_id)
        return {"top_products": [dict(p) for p in products], "returns": dict(returns) if returns else {}, "period_days": days}
    except Exception as e:
        logger.warning(f"Product context error: {e}")
        return {}


async def _finance_context(workspace_id: str, days: int) -> dict:
    try:
        pl = await fetchrow("""
            SELECT COALESCE(SUM(total_price),0)::float AS gross_revenue,
                   COALESCE(SUM(total_discounts),0)::float AS discounts,
                   COALESCE(SUM(total_tax),0)::float AS tax,
                   COUNT(*) AS orders
            FROM shopify_orders WHERE workspace_id=$1
              AND created_at >= NOW()-($2||' days')::INTERVAL
              AND financial_status NOT IN ('refunded','voided')
        """, workspace_id, str(days))
        expenses = await fetch("""
            SELECT category, COALESCE(SUM(amount),0)::float AS total
            FROM finance_expenses WHERE workspace_id=$1
              AND date >= CURRENT_DATE - $2
            GROUP BY category ORDER BY total DESC
        """, workspace_id, days)
        return {"pl": dict(pl) if pl else {}, "expenses": [dict(e) for e in expenses], "period_days": days}
    except Exception as e:
        logger.warning(f"Finance context error: {e}")
        return {}


async def _forecast_context(workspace_id: str) -> dict:
    try:
        recent = await fetch("""
            SELECT DATE_TRUNC('month', created_at) AS month,
                   SUM(total_price)::float AS revenue,
                   COUNT(*) AS orders
            FROM shopify_orders WHERE workspace_id=$1
              AND created_at >= NOW() - INTERVAL '6 months'
              AND financial_status NOT IN ('refunded','voided')
            GROUP BY 1 ORDER BY 1 DESC
        """, workspace_id)
        forecast = await fetchrow("""
            SELECT * FROM forecast_results WHERE workspace_id=$1
            ORDER BY created_at DESC LIMIT 1
        """, workspace_id)
        return {"monthly_history": [dict(r) for r in recent], "latest_forecast": dict(forecast) if forecast else {}}
    except Exception as e:
        logger.warning(f"Forecast context error: {e}")
        return {}


async def _customer_context(workspace_id: str, days: int) -> dict:
    try:
        stats = await fetchrow("""
            SELECT COUNT(DISTINCT customer_email) AS total_customers,
                   COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_email END) AS repeat_customers,
                   AVG(total_price)::float AS avg_order_value
            FROM (
                SELECT customer_email, COUNT(*) AS order_count, AVG(total_price) AS total_price
                FROM shopify_orders WHERE workspace_id=$1
                  AND created_at >= NOW()-($2||' days')::INTERVAL
                GROUP BY customer_email
            ) sub
        """, workspace_id, str(days))
        segments = await fetch("""
            SELECT rfm_segment, COUNT(*) AS customers, SUM(total_spent)::float AS revenue
            FROM customers WHERE workspace_id=$1 AND rfm_segment IS NOT NULL
            GROUP BY rfm_segment ORDER BY revenue DESC
        """, workspace_id)
        return {"stats": dict(stats) if stats else {}, "rfm_segments": [dict(s) for s in segments], "period_days": days}
    except Exception as e:
        logger.warning(f"Customer context error: {e}")
        return {}


# ── System prompts ────────────────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "ads": """You are GrowthOS Ads AI — a Meta Ads and Google Ads expert for D2C brands.
You have access to real campaign data including spend, ROAS, CTR, CPM, CPC for all active campaigns.
Your role:
- Identify underperforming campaigns (ROAS < 2x) and recommend pausing
- Spot budget misallocation and suggest reallocation
- Detect creative fatigue from frequency/CTR trends
- Give specific, actionable optimizations with expected impact
- Format numbers in Rs with L/Cr notation for large amounts""",

    "product": """You are GrowthOS Product AI — a D2C product and inventory specialist.
You have access to real sales data by SKU including revenue, units sold, stock levels, and return rates.
Your role:
- Identify stockout risks (velocity vs stock)
- Flag high return rate products (>10%)
- Recommend discount or promotional candidates
- Suggest bundle opportunities based on purchase patterns
- Give specific margin improvement recommendations""",

    "finance": """You are GrowthOS Finance AI — a D2C CFO and profit specialist.
You have access to real P&L data including revenue, discounts, taxes, expenses by category.
Your role:
- Identify the biggest margin drains
- Calculate true contribution margin
- Recommend expense optimization
- Flag concerning trends (rising costs, falling margins)
- Speak in Indian financial context (GST, payment gateway fees, logistics costs)""",

    "forecast": """You are GrowthOS Forecast AI — a demand planning and revenue forecasting specialist.
You have access to 6 months of actual revenue data and the latest forecast model results.
Your role:
- Explain revenue trajectory and growth rate
- Flag seasonal patterns
- Model impact of budget changes on revenue
- Give 30/60/90 day revenue projections with confidence intervals
- Identify demand drivers and risks""",

    "seo": """You are GrowthOS SEO AI — an ecommerce SEO specialist for D2C brands.
You are an expert in Shopify SEO, Google Search Console, Core Web Vitals, and content strategy.
Note: Live GSC data connection is pending. Provide best-practice recommendations based on D2C SEO principles.
Your role:
- Recommend keyword opportunities for D2C product categories
- Audit common Shopify SEO issues (duplicate titles, thin content, missing schema)
- Suggest content calendar for blog/collection pages
- Explain technical SEO improvements""",

    "pricing": """You are GrowthOS Pricing AI — a D2C pricing strategy specialist.
You have access to product pricing data and sales velocity.
Your role:
- Identify price elasticity patterns
- Recommend optimal price points
- Suggest promotional pricing strategy
- Compare margins at different price points
- Flag underpriced high-demand products""",

    "automation": """You are GrowthOS Automation AI — a D2C marketing automation specialist.
You design automation rules and workflows for Shopify + Meta + WhatsApp ecosystems.
Your role:
- Design rule-based automations (IF trigger THEN action)
- Suggest cart recovery sequences
- Build win-back campaign logic
- Create inventory alert automations
- Generate automation rules in structured JSON format when asked""",

    "decision": """You are GrowthOS Decision AI — a D2C strategic advisor and business intelligence specialist.
You analyze complex business decisions using data-driven frameworks.
Your role:
- Evaluate business decisions with risk/reward analysis
- Run financial impact scenarios
- Compare strategic options with pros/cons
- Give a clear recommendation with confidence level
- Consider Indian D2C market context (seasonality, payment methods, logistics challenges)""",
}


# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.post("/chat")
async def specialist_chat(request: Request, body: SpecialistChatRequest):
    """Specialist AI chat with domain-specific real data context."""
    workspace_id = request.state.workspace_id
    module = body.module

    if module not in SYSTEM_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown module: {module}. Valid: {list(SYSTEM_PROMPTS.keys())}")

    # Fetch domain-specific context
    context = {}
    days = body.context_days

    if module == "ads":
        context = await _ads_context(workspace_id, days)
    elif module == "product":
        context = await _product_context(workspace_id, days)
    elif module in ("finance", "pricing"):
        context = await _finance_context(workspace_id, days)
    elif module == "forecast":
        context = await _forecast_context(workspace_id)
    elif module in ("decision", "automation"):
        context = {
            "ads": await _ads_context(workspace_id, days),
            "finance": await _finance_context(workspace_id, days),
        }
    else:
        context = {"module": module, "note": "Providing expert recommendations based on D2C best practices"}

    system_prompt = SYSTEM_PROMPTS[module]
    response = await _call_claude_specialist(system_prompt, context, body.message)

    return {"response": response, "module": module, "context_keys": list(context.keys())}


@router.get("/modules")
async def list_modules():
    """List available AI specialist modules."""
    return {"modules": list(SYSTEM_PROMPTS.keys())}
