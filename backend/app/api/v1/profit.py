from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from datetime import date, timedelta
from ...repositories.profit_repo import (
    get_profit_config,
    upsert_profit_config,
    get_profit_by_product,
    get_profit_by_channel,
)
from ...repositories.metrics_repo import get_metrics_summary

router = APIRouter(prefix="/profit", tags=["profit"])

DEFAULT_CONFIG = {
    "cogs_pct": 0.35,
    "shipping_cost_per_order": 60.0,
    "packaging_cost_per_order": 15.0,
    "payment_gateway_pct": 0.02,
    "return_processing_cost": 80.0,
    "tax_pct": 0.18,
    "additional_opex_monthly": 0.0,
}


class ProfitConfigUpdate(BaseModel):
    cogs_pct: float = 0.35
    shipping_cost_per_order: float = 60.0
    packaging_cost_per_order: float = 15.0
    payment_gateway_pct: float = 0.02
    return_processing_cost: float = 80.0
    tax_pct: float = 0.18
    additional_opex_monthly: float = 0.0


def _compute_profit(metrics: dict, config: dict, period_days: int) -> dict:
    net_revenue = float(metrics.get("net_revenue") or 0)
    total_orders = int(metrics.get("total_orders") or 0)
    total_ad_spend = float(metrics.get("total_ad_spend") or 0)

    cogs = net_revenue * float(config["cogs_pct"])
    shipping = total_orders * float(config["shipping_cost_per_order"])
    packaging = total_orders * float(config["packaging_cost_per_order"])
    payment_fee = net_revenue * float(config["payment_gateway_pct"])
    opex_daily = float(config["additional_opex_monthly"]) / 30
    opex = opex_daily * period_days

    gross_profit = net_revenue - cogs - shipping - packaging - payment_fee
    net_profit = gross_profit - total_ad_spend - opex
    contribution_margin = (gross_profit - total_ad_spend) / net_revenue if net_revenue > 0 else 0

    return {
        "net_revenue": round(net_revenue, 2),
        "total_orders": total_orders,
        "total_ad_spend": round(total_ad_spend, 2),
        "cogs": round(cogs, 2),
        "shipping_cost": round(shipping, 2),
        "packaging_cost": round(packaging, 2),
        "payment_fees": round(payment_fee, 2),
        "gross_profit": round(gross_profit, 2),
        "net_profit": round(net_profit, 2),
        "contribution_margin": round(contribution_margin, 4),
        "opex": round(opex, 2),
    }


@router.get("/config")
async def get_config(request: Request):
    workspace_id = request.state.workspace_id
    config = await get_profit_config(workspace_id)
    if not config:
        return DEFAULT_CONFIG
    return config


@router.post("/config")
async def save_config(request: Request, body: ProfitConfigUpdate):
    workspace_id = request.state.workspace_id
    config = await upsert_profit_config(
        workspace_id,
        cogs_pct=body.cogs_pct,
        shipping_cost_per_order=body.shipping_cost_per_order,
        packaging_cost_per_order=body.packaging_cost_per_order,
        payment_gateway_pct=body.payment_gateway_pct,
        return_processing_cost=body.return_processing_cost,
        tax_pct=body.tax_pct,
        additional_opex_monthly=body.additional_opex_monthly,
    )
    logger.info(f"Saved profit config for workspace {workspace_id}")
    return config


@router.get("/summary")
async def profit_summary(
    request: Request,
    start_date: str | None = None,
    end_date: str | None = None,
):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=30)).isoformat()
    ed = end_date or today.isoformat()

    metrics = await get_metrics_summary(workspace_id, sd, ed)
    config = await get_profit_config(workspace_id)
    if not config:
        config = DEFAULT_CONFIG

    start = date.fromisoformat(sd)
    end = date.fromisoformat(ed)
    period_days = max((end - start).days, 1)

    result = _compute_profit(metrics or {}, config, period_days)
    result["period"] = {"start_date": sd, "end_date": ed, "days": period_days}
    return result


@router.get("/by-product")
async def profit_by_product(
    request: Request,
    start_date: str | None = None,
    end_date: str | None = None,
):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=30)).isoformat()
    ed = end_date or today.isoformat()
    rows = await get_profit_by_product(workspace_id, sd, ed)
    return {"products": rows, "period": {"start_date": sd, "end_date": ed}}


@router.get("/by-channel")
async def profit_by_channel(
    request: Request,
    start_date: str | None = None,
    end_date: str | None = None,
):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=30)).isoformat()
    ed = end_date or today.isoformat()
    rows = await get_profit_by_channel(workspace_id, sd, ed)
    return {"channels": rows, "period": {"start_date": sd, "end_date": ed}}
