from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from ...repositories.product_repo import get_products, get_product, get_product_sales_history, update_product_cost

router = APIRouter(prefix="/products", tags=["products"])


class ProductCostUpdate(BaseModel):
    cost_per_item: float


@router.get("")
async def list_products(
    request: Request,
    sort_by: str = "total_revenue",
    limit: int = 50,
    offset: int = 0,
):
    workspace_id = request.state.workspace_id
    logger.info(f"Listing products for workspace {workspace_id}")
    rows = await get_products(workspace_id, sort_by=sort_by, limit=limit, offset=offset)
    return {"products": rows, "count": len(rows)}


@router.get("/{product_id}")
async def get_product_detail(request: Request, product_id: str):
    workspace_id = request.state.workspace_id
    product = await get_product(workspace_id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    history = await get_product_sales_history(workspace_id, product_id)
    return {"product": product, "sales_history": history}


@router.post("/{product_id}/cost")
async def set_product_cost(request: Request, product_id: str, body: ProductCostUpdate):
    workspace_id = request.state.workspace_id
    product = await get_product(workspace_id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await update_product_cost(workspace_id, product_id, body.cost_per_item)
    logger.info(f"Updated cost for product {product_id} to {body.cost_per_item}")
    return {"message": "Cost updated successfully", "cost_per_item": body.cost_per_item}
