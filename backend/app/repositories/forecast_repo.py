from ..core.database import fetch, fetchrow, execute


async def get_forecasts(
    workspace_id: str,
    metric: str | None = None,
    horizon_days: int | None = None,
) -> list[dict]:
    conditions = ["workspace_id = $1"]
    args = [workspace_id]
    idx = 2

    if metric:
        conditions.append(f"metric = ${idx}")
        args.append(metric)
        idx += 1
    if horizon_days:
        conditions.append(f"horizon_days = ${idx}")
        args.append(horizon_days)
        idx += 1

    where = " AND ".join(conditions)
    return await fetch(
        f"""
        SELECT id, workspace_id, forecast_date, horizon_days, metric,
               predicted_value, lower_bound, upper_bound, confidence_score,
               scenario, generated_at
        FROM forecast_results
        WHERE {where}
        ORDER BY generated_at DESC, forecast_date ASC
        """,
        *args,
    )


async def save_forecast(
    workspace_id: str,
    forecast_date: str,
    horizon_days: int,
    metric: str,
    predicted_value: float,
    lower_bound: float | None,
    upper_bound: float | None,
    confidence_score: float | None,
    scenario: str = "expected",
) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO forecast_results
            (workspace_id, forecast_date, horizon_days, metric, predicted_value,
             lower_bound, upper_bound, confidence_score, scenario)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, workspace_id, forecast_date, horizon_days, metric,
                  predicted_value, lower_bound, upper_bound, confidence_score,
                  scenario, generated_at
        """,
        workspace_id, forecast_date, horizon_days, metric, predicted_value,
        lower_bound, upper_bound, confidence_score, scenario,
    )


async def delete_old_forecasts(workspace_id: str) -> None:
    await execute(
        """
        DELETE FROM forecast_results
        WHERE workspace_id = $1
          AND generated_at < now() - INTERVAL '7 days'
        """,
        workspace_id,
    )
