from pydantic import BaseModel
from typing import Optional


class WorkspaceResponse(BaseModel):
    id: str
    brand_name: str
    timezone: str
    currency: str


class WorkspaceUpdate(BaseModel):
    brand_name: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
