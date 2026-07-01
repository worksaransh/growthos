from ..core.database import fetch, fetchrow, execute


async def get_leads(
    workspace_id: str,
    status: str | None = None,
    pipeline_stage: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    conditions = ["workspace_id = $1"]
    args = [workspace_id]
    idx = 2

    if status:
        conditions.append(f"status = ${idx}")
        args.append(status)
        idx += 1
    if pipeline_stage:
        conditions.append(f"pipeline_stage = ${idx}")
        args.append(pipeline_stage)
        idx += 1

    where = " AND ".join(conditions)
    args.extend([limit, offset])

    return await fetch(
        f"""
        SELECT id, workspace_id, name, email, phone, company, source,
               status, pipeline_stage, deal_value, assigned_to, notes, tags,
               last_contacted_at, created_at, updated_at
        FROM crm_leads
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT ${idx} OFFSET ${idx + 1}
        """,
        *args,
    )


async def get_lead(workspace_id: str, lead_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, name, email, phone, company, source,
               status, pipeline_stage, deal_value, assigned_to, notes, tags,
               last_contacted_at, created_at, updated_at
        FROM crm_leads
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, lead_id,
    )


async def create_lead(
    workspace_id: str,
    name: str,
    email: str | None = None,
    phone: str | None = None,
    company: str | None = None,
    source: str | None = None,
    status: str = "new",
    pipeline_stage: str = "lead",
    deal_value: float = 0,
    assigned_to: str | None = None,
    notes: str | None = None,
    tags: list[str] | None = None,
) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO crm_leads
            (workspace_id, name, email, phone, company, source, status,
             pipeline_stage, deal_value, assigned_to, notes, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, workspace_id, name, email, phone, company, source,
                  status, pipeline_stage, deal_value, assigned_to, notes, tags,
                  last_contacted_at, created_at, updated_at
        """,
        workspace_id, name, email, phone, company, source, status,
        pipeline_stage, deal_value, assigned_to, notes, tags,
    )


async def update_lead(workspace_id: str, lead_id: str, **kwargs) -> dict | None:
    allowed = {
        "name", "email", "phone", "company", "source", "status",
        "pipeline_stage", "deal_value", "assigned_to", "notes", "tags",
        "last_contacted_at",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return await get_lead(workspace_id, lead_id)

    set_clauses = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())
    return await fetchrow(
        f"""
        UPDATE crm_leads
        SET {set_clauses}, updated_at = now()
        WHERE workspace_id = $1 AND id = $2
        RETURNING id, workspace_id, name, email, phone, company, source,
                  status, pipeline_stage, deal_value, assigned_to, notes, tags,
                  last_contacted_at, created_at, updated_at
        """,
        workspace_id, lead_id, *values,
    )


async def delete_lead(workspace_id: str, lead_id: str) -> None:
    await execute(
        "DELETE FROM crm_leads WHERE workspace_id = $1 AND id = $2",
        workspace_id, lead_id,
    )


async def get_pipeline_summary(workspace_id: str) -> list[dict]:
    return await fetch(
        """
        SELECT pipeline_stage, status,
               COUNT(*) AS lead_count,
               COALESCE(SUM(deal_value), 0) AS total_value
        FROM crm_leads
        WHERE workspace_id = $1
        GROUP BY pipeline_stage, status
        ORDER BY pipeline_stage, status
        """,
        workspace_id,
    )
