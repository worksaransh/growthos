from fastapi import APIRouter, Request, HTTPException
from loguru import logger
from ...repositories.customer_repo import (
    get_customers,
    get_customer,
    get_customer_segments,
    get_customer_ltv_distribution,
    get_customer_orders,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/segments")
async def customer_segments(request: Request):
    workspace_id = request.state.workspace_id
    logger.info(f"Getting customer segments for workspace {workspace_id}")
    segments = await get_customer_segments(workspace_id)
    return {"segments": segments}


@router.get("/ltv")
async def customer_ltv(request: Request):
    workspace_id = request.state.workspace_id
    distribution = await get_customer_ltv_distribution(workspace_id)
    return {"ltv_distribution": distribution}


@router.get("")
async def list_customers(
    request: Request,
    segment: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    workspace_id = request.state.workspace_id
    rows = await get_customers(workspace_id, segment=segment, limit=limit, offset=offset)
    return {"customers": rows, "count": len(rows)}


@router.get("/{customer_id}")
async def get_customer_detail(request: Request, customer_id: str):
    workspace_id = request.state.workspace_id
    customer = await get_customer(workspace_id, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders = await get_customer_orders(workspace_id, customer_id)
    return {"customer": customer, "orders": orders}
