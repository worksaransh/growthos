from pydantic import BaseModel
from typing import Optional
from datetime import date


class KPIData(BaseModel):
    value: float
    delta_pct: Optional[float] = None


class DashboardMetricsResponse(BaseModel):
    revenue: KPIData
    orders: KPIData
    ad_spend: KPIData
    blended_roas: KPIData
    cac: KPIData
    aov: KPIData
    gross_profit: KPIData
    mer: KPIData
    last_synced: dict[str, Optional[str]]


class TrendPoint(BaseModel):
    date: str
    revenue: float
    spend: float


class TrendResponse(BaseModel):
    data: list[TrendPoint]


class DateRangeRequest(BaseModel):
    start_date: date
    end_date: date
    compare: bool = False
