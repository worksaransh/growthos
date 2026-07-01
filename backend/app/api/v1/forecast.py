from fastapi import APIRouter, Request, HTTPException
from loguru import logger
from datetime import date, timedelta
from ...repositories.forecast_repo import get_forecasts, save_forecast, delete_old_forecasts
from ...repositories.metrics_repo import get_metrics

router = APIRouter(prefix="/forecast", tags=["forecast"])


def simple_linear_forecast(values: list[float], horizon_days: int):
    n = len(values)
    if n < 2:
        last = values[0] if values else 0
        predictions = [last] * horizon_days
        return predictions, 0.0

    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(values) / n
    numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean
    predictions = [intercept + slope * (n + i) for i in range(horizon_days)]
    # Variance for confidence bounds
    residuals = [values[i] - (intercept + slope * i) for i in range(n)]
    std_dev = (sum(r ** 2 for r in residuals) / max(n - 2, 1)) ** 0.5
    return predictions, std_dev


@router.get("")
async def list_forecasts(
    request: Request,
    metric: str | None = None,
    horizon_days: int | None = None,
):
    workspace_id = request.state.workspace_id
    rows = await get_forecasts(workspace_id, metric=metric, horizon_days=horizon_days)
    return {"forecasts": rows}


@router.post("/generate")
async def generate_forecast(request: Request):
    workspace_id = request.state.workspace_id
    logger.info(f"Generating forecast for workspace {workspace_id}")

    today = date.today()
    start_date = (today - timedelta(days=90)).isoformat()
    end_date = today.isoformat()

    metrics_rows = await get_metrics(workspace_id, start_date, end_date)
    if not metrics_rows:
        raise HTTPException(status_code=422, detail="Not enough historical data to generate forecast")

    # Clean old forecasts
    await delete_old_forecasts(workspace_id)

    results = []
    horizons = [30, 60, 90]
    scenarios = {
        "expected": 1.0,
        "best": 1.5,
        "worst": 0.5,
    }

    metrics_to_forecast = {
        "revenue": [float(r.get("net_revenue") or 0) for r in metrics_rows],
        "orders": [float(r.get("total_orders") or 0) for r in metrics_rows],
        "ad_spend": [float(r.get("total_ad_spend") or 0) for r in metrics_rows],
    }

    # Compute profit series using default: revenue * 0.3 margin proxy
    metrics_to_forecast["profit"] = [
        float(r.get("net_revenue") or 0) * 0.3 - float(r.get("total_ad_spend") or 0)
        for r in metrics_rows
    ]

    for metric_name, values in metrics_to_forecast.items():
        for horizon in horizons:
            predictions, std_dev = simple_linear_forecast(values, horizon)
            # Use the sum over the horizon period as the aggregate predicted value
            predicted_sum = max(sum(predictions), 0)
            lower = max(predicted_sum - std_dev * (horizon ** 0.5), 0)
            upper = predicted_sum + std_dev * (horizon ** 0.5)
            n = len(values)
            confidence = min(1.0, n / 90) if n >= 7 else 0.3
            forecast_date = (today + timedelta(days=horizon)).isoformat()

            for scenario, multiplier in scenarios.items():
                scenario_value = predicted_sum * multiplier
                scenario_lower = lower * multiplier
                scenario_upper = upper * multiplier

                row = await save_forecast(
                    workspace_id=workspace_id,
                    forecast_date=forecast_date,
                    horizon_days=horizon,
                    metric=metric_name,
                    predicted_value=round(scenario_value, 2),
                    lower_bound=round(scenario_lower, 2),
                    upper_bound=round(scenario_upper, 2),
                    confidence_score=round(confidence, 4),
                    scenario=scenario,
                )
                if row:
                    results.append(row)

    logger.info(f"Generated {len(results)} forecast records for workspace {workspace_id}")
    return {"forecasts_generated": len(results), "forecasts": results}
