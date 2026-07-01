from fastapi import APIRouter, Request, HTTPException
from ...repositories.workspace_repo import create_workspace

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/session")
async def exchange_session(request: Request):
    user_id = request.state.user_id
    return {"user_id": user_id, "workspace_id": request.state.workspace_id}


@router.post("/workspace/init")
async def init_workspace(request: Request):
    user_id = request.state.user_id
    body = await request.json()
    brand_name = body.get("brand_name", "My Brand")
    ws = await create_workspace(user_id, brand_name)
    if not ws:
        raise HTTPException(status_code=500, detail="Failed to create workspace")
    return ws
