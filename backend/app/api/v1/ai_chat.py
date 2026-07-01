"""
AI Chat — /api/v1/ai/chat
Founder AI: natural language → live GrowthOS data → AI answer.
Uses Anthropic Claude API with function-calling against GrowthOS data.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import os
from loguru import logger
from ...core.database import fetch, fetchrow

router = APIRouter(prefix="/ai", tags=["ai"])


# ── Models ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context_days: int = 30


# ── Data context fetchers ─────────────────────────────────────────────────────

async def _get_dashboard_context(workspace_id: str, days: int = 30) -> dict:
    """Fetch key metrics for AI context."""
    try:
        row = await fetchrow("""
            SELECT
                COALESCE(SUM(total_price), 0)::float       AS revenue,
                COUNT(*)                                     AS orders,
                COALESCE(AVG(total_price), 0)::float        AS aov,
                COUNT(DISTINCT customer_email)               AS unique_customers
            FROM shopify_orders
            WHERE workspace_id = $1
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
              AND financial_status NOT IN ('refunded', 'voided')
        """, workspace_id, str(days))

        ad_row = await fetchrow("""
            SELECT
                COALESCE(SUM(spend), 0)::float   AS total_spend,
                COALESCE(SUM(revenue), 0)::float AS ad_revenue,
                COALESCE(AVG(roas), 0)::float    AS avg_roas
            FROM ad_spend_daily
            WHERE workspace_id = $1
              AND date >= CURRENT_DATE - $2
        """, workspace_id, days)

        return {
            "period_days": days,
            "revenue": round(row["revenue"] or 0, 2),
            "orders": row["orders"] or 0,
            "aov": round(row["aov"] or 0, 2),
            "unique_customers": row["unique_customers"] or 0,
            "ad_spend": round((ad_row["total_spend"] if ad_row else 0) or 0, 2),
            "ad_revenue": round((ad_row["ad_revenue"] if ad_row else 0) or 0, 2),
            "roas": round((ad_row["avg_roas"] if ad_row else 0) or 0, 2),
        }
    except Exception as e:
        logger.warning(f"Dashboard context error: {e}")
        return {}


async def _get_top_products(workspace_id: str, days: int = 30, limit: int = 5) -> list:
    try:
        rows = await fetch("""
            SELECT
                oi.product_title,
                SUM(oi.quantity)         AS units_sold,
                SUM(oi.price * oi.quantity) AS revenue
            FROM shopify_order_items oi
            JOIN shopify_orders o ON o.id = oi.order_id
            WHERE o.workspace_id = $1
              AND o.created_at >= NOW() - ($2 || ' days')::INTERVAL
              AND o.financial_status NOT IN ('refunded', 'voided')
            GROUP BY oi.product_title
            ORDER BY revenue DESC
            LIMIT $3
        """, workspace_id, str(days), limit)
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning(f"Top products error: {e}")
        return []


async def _get_campaigns_context(workspace_id: str, days: int = 30) -> list:
    try:
        rows = await fetch("""
            SELECT
                name, platform, status,
                COALESCE(spend, 0)::float   AS spend,
                COALESCE(revenue, 0)::float AS revenue,
                COALESCE(roas, 0)::float    AS roas,
                COALESCE(impressions, 0)    AS impressions,
                COALESCE(clicks, 0)         AS clicks
            FROM ad_campaigns
            WHERE workspace_id = $1
              AND updated_at >= NOW() - ($2 || ' days')::INTERVAL
            ORDER BY spend DESC
            LIMIT 10
        """, workspace_id, str(days))
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning(f"Campaigns context error: {e}")
        return []


async def _get_profit_context(workspace_id: str, days: int = 30) -> dict:
    try:
        row = await fetchrow("""
            SELECT
                COALESCE(SUM(o.total_price), 0)::float              AS gross_revenue,
                COALESCE(SUM(o.total_discounts), 0)::float          AS discounts,
                COALESCE(SUM(o.total_tax), 0)::float                AS tax,
                COALESCE(
                    (SELECT SUM(amount) FROM finance_expenses
                     WHERE workspace_id = $1
                       AND date >= CURRENT_DATE - $2
                       AND category = 'marketing'), 0
                )::float                                             AS marketing_spend,
                COALESCE(
                    (SELECT SUM(amount) FROM finance_expenses
                     WHERE workspace_id = $1
                       AND date >= CURRENT_DATE - $2
                       AND category = 'logistics'), 0
                )::float                                             AS logistics_spend
            FROM shopify_orders o
            WHERE o.workspace_id = $1
              AND o.created_at >= NOW() - ($2 || ' days')::INTERVAL
              AND o.financial_status NOT IN ('refunded', 'voided')
        """, workspace_id, str(days))
        if row:
            gr = row["gross_revenue"] or 0
            ms = row["marketing_spend"] or 0
            ls = row["logistics_spend"] or 0
            net = gr - ms - ls
            return {
                "gross_revenue": round(gr, 2),
                "marketing_spend": round(ms, 2),
                "logistics_spend": round(ls, 2),
                "estimated_net": round(net, 2),
                "marketing_pct": round((ms / gr * 100) if gr else 0, 1),
            }
        return {}
    except Exception as e:
        logger.warning(f"Profit context error: {e}")
        return {}


# ── Session helpers ───────────────────────────────────────────────────────────

async def _get_or_create_session(workspace_id: str, user_id: str, session_id: Optional[str]) -> str:
    if session_id:
        row = await fetchrow(
            "SELECT id FROM ai_chat_sessions WHERE id = $1 AND workspace_id = $2",
            session_id, workspace_id
        )
        if row:
            return str(row["id"])

    from ...core.database import execute
    row = await fetchrow("""
        INSERT INTO ai_chat_sessions (workspace_id, user_id, title)
        VALUES ($1, $2, 'New conversation')
        RETURNING id
    """, workspace_id, user_id)
    return str(row["id"])


async def _save_messages(session_id: str, user_msg: str, ai_msg: str):
    from ...core.database import execute
    await execute("""
        INSERT INTO ai_chat_messages (session_id, role, content)
        VALUES ($1, 'user', $2), ($1, 'assistant', $3)
    """, session_id, user_msg, ai_msg)
    # Update session timestamp
    await execute(
        "UPDATE ai_chat_sessions SET updated_at = now() WHERE id = $1", session_id
    )


async def _get_session_history(session_id: str, limit: int = 10) -> list:
    rows = await fetch("""
        SELECT role, content FROM ai_chat_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2
    """, session_id, limit)
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


# ── AI response generation ────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are GrowthOS AI — the intelligent co-founder for D2C brands.
You have access to real-time business data: revenue, orders, ad spend, ROAS, products, campaigns, and profit metrics.

Your role:
- Answer questions about the business with specific numbers, insights, and actionable recommendations
- Identify trends, problems, and opportunities proactively
- Speak like a data-savvy business partner, not a generic AI assistant
- Always ground answers in the provided data context
- Format numbers in Indian Rupees (₹) with lakhs/crores notation when > 1 lakh
- When you spot anomalies (ROAS drop, revenue spike, etc.), flag them proactively
- Keep responses concise but insightful — founders are busy

Data context will be provided in the user message."""


def _format_inr(value: float) -> str:
    if value >= 10000000:
        return f"₹{value/10000000:.1f}Cr"
    if value >= 100000:
        return f"₹{value/100000:.1f}L"
    if value >= 1000:
        return f"₹{value/1000:.1f}K"
    return f"₹{value:.0f}"


async def _call_claude(messages: list, context: dict) -> str:
    """Call Claude API with business context."""
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        # Fallback: generate a smart mock answer from context
        return _fallback_answer(messages[-1]["content"] if messages else "", context)

    try:
        import httpx
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        # Inject context into system message
        context_str = json.dumps(context, indent=2)
        system = f"{SYSTEM_PROMPT}\n\nCurrent business data (last {context.get('metrics', {}).get('period_days', 30)} days):\n```json\n{context_str}\n```"

        payload = {
            "model": "claude-3-5-haiku-20241022",
            "max_tokens": 1024,
            "system": system,
            "messages": messages,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
        if r.status_code == 200:
            data = r.json()
            return data["content"][0]["text"]
        else:
            logger.error(f"Claude API error: {r.status_code} {r.text}")
            return _fallback_answer(messages[-1]["content"] if messages else "", context)
    except Exception as e:
        logger.error(f"Claude API exception: {e}")
        return _fallback_answer(messages[-1]["content"] if messages else "", context)


def _fallback_answer(question: str, context: dict) -> str:
    """Smart fallback when no API key is set."""
    metrics = context.get("metrics", {})
    q = question.lower()

    if any(w in q for w in ["revenue", "sales", "earning"]):
        rev = metrics.get("revenue", 0)
        orders = metrics.get("orders", 0)
        return (
            f"In the last {metrics.get('period_days', 30)} days, your revenue is **{_format_inr(rev)}** "
            f"across **{orders:,} orders** with an AOV of **{_format_inr(metrics.get('aov', 0))}**.\n\n"
            f"To add ANTHROPIC_API_KEY to your .env for full AI analysis, visit Settings → Integrations."
        )
    if any(w in q for w in ["roas", "ads", "campaign", "marketing"]):
        roas = metrics.get("roas", 0)
        spend = metrics.get("ad_spend", 0)
        return (
            f"Your ad spend is **{_format_inr(spend)}** with an average ROAS of **{roas:.1f}x**. "
            f"Ad-attributed revenue: **{_format_inr(metrics.get('ad_revenue', 0))}**.\n\n"
            f"Add your ANTHROPIC_API_KEY for deeper campaign-level insights."
        )
    return (
        f"Here's a snapshot of your last {metrics.get('period_days', 30)} days:\n"
        f"• Revenue: **{_format_inr(metrics.get('revenue', 0))}**\n"
        f"• Orders: **{metrics.get('orders', 0):,}**\n"
        f"• AOV: **{_format_inr(metrics.get('aov', 0))}**\n"
        f"• Ad Spend: **{_format_inr(metrics.get('ad_spend', 0))}** @ {metrics.get('roas', 0):.1f}x ROAS\n\n"
        f"Add ANTHROPIC_API_KEY to your .env for full AI-powered analysis."
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat")
async def ai_chat(request: Request, body: ChatRequest):
    """Send a message to GrowthOS AI and get a data-powered answer."""
    workspace_id = request.state.workspace_id
    user_id = str(request.state.user_id)

    # Fetch business context in parallel
    import asyncio
    metrics, top_products, campaigns, profit = await asyncio.gather(
        _get_dashboard_context(workspace_id, body.context_days),
        _get_top_products(workspace_id, body.context_days),
        _get_campaigns_context(workspace_id, body.context_days),
        _get_profit_context(workspace_id, body.context_days),
        return_exceptions=True,
    )

    context = {
        "metrics": metrics if isinstance(metrics, dict) else {},
        "top_products": top_products if isinstance(top_products, list) else [],
        "campaigns": campaigns if isinstance(campaigns, list) else [],
        "profit": profit if isinstance(profit, dict) else {},
    }

    # Get session & history
    session_id = await _get_or_create_session(workspace_id, user_id, body.session_id)
    history = await _get_session_history(session_id)

    # Build message list
    messages = history + [{"role": "user", "content": body.message}]

    # Call Claude
    ai_response = await _call_claude(messages, context)

    # Persist
    await _save_messages(session_id, body.message, ai_response)

    return {
        "session_id": session_id,
        "response": ai_response,
        "context_used": {
            "revenue": context["metrics"].get("revenue"),
            "orders": context["metrics"].get("orders"),
            "roas": context["metrics"].get("roas"),
        },
    }


@router.get("/sessions")
async def list_sessions(request: Request):
    """List AI chat sessions for this workspace."""
    workspace_id = request.state.workspace_id
    rows = await fetch("""
        SELECT s.id, s.title, s.created_at, s.updated_at,
               (SELECT content FROM ai_chat_messages
                WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) AS last_message
        FROM ai_chat_sessions s
        WHERE s.workspace_id = $1
        ORDER BY s.updated_at DESC
        LIMIT 20
    """, workspace_id)
    return [dict(r) for r in rows]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(request: Request, session_id: str):
    """Get all messages for a session."""
    workspace_id = request.state.workspace_id
    # Verify ownership
    session = await fetchrow(
        "SELECT id FROM ai_chat_sessions WHERE id = $1 AND workspace_id = $2",
        session_id, workspace_id
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    rows = await fetch("""
        SELECT id, role, content, created_at
        FROM ai_chat_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
    """, session_id)
    return [dict(r) for r in rows]


@router.delete("/sessions/{session_id}")
async def delete_session(request: Request, session_id: str):
    """Delete an AI chat session."""
    workspace_id = request.state.workspace_id
    from ...core.database import execute
    await execute(
        "DELETE FROM ai_chat_sessions WHERE id = $1 AND workspace_id = $2",
        session_id, workspace_id
    )
    return {"success": True}
