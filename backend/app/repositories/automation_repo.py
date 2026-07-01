from ..core.database import fetch, fetchrow, execute


async def get_automation_rules(workspace_id: str) -> list[dict]:
    return await fetch(
        """
        SELECT id, workspace_id, name, description, is_active,
               trigger_type, trigger_config, action_type, action_config,
               last_triggered_at, trigger_count, created_at, updated_at
        FROM automation_rules
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        """,
        workspace_id,
    )


async def get_automation_rule(workspace_id: str, rule_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, name, description, is_active,
               trigger_type, trigger_config, action_type, action_config,
               last_triggered_at, trigger_count, created_at, updated_at
        FROM automation_rules
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, rule_id,
    )


async def create_automation_rule(
    workspace_id: str,
    name: str,
    description: str | None,
    trigger_type: str,
    trigger_config: dict,
    action_type: str,
    action_config: dict,
) -> dict | None:
    import json
    return await fetchrow(
        """
        INSERT INTO automation_rules
            (workspace_id, name, description, trigger_type, trigger_config, action_type, action_config)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, workspace_id, name, description, is_active,
                  trigger_type, trigger_config, action_type, action_config,
                  last_triggered_at, trigger_count, created_at, updated_at
        """,
        workspace_id, name, description, trigger_type,
        json.dumps(trigger_config), action_type, json.dumps(action_config),
    )


async def update_automation_rule(
    workspace_id: str,
    rule_id: str,
    **kwargs,
) -> dict | None:
    import json
    allowed = {"name", "description", "is_active", "trigger_type", "trigger_config", "action_type", "action_config"}
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return await get_automation_rule(workspace_id, rule_id)

    # JSON-encode config fields
    if "trigger_config" in updates and isinstance(updates["trigger_config"], dict):
        updates["trigger_config"] = json.dumps(updates["trigger_config"])
    if "action_config" in updates and isinstance(updates["action_config"], dict):
        updates["action_config"] = json.dumps(updates["action_config"])

    set_clauses = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())
    return await fetchrow(
        f"""
        UPDATE automation_rules
        SET {set_clauses}, updated_at = now()
        WHERE workspace_id = $1 AND id = $2
        RETURNING id, workspace_id, name, description, is_active,
                  trigger_type, trigger_config, action_type, action_config,
                  last_triggered_at, trigger_count, created_at, updated_at
        """,
        workspace_id, rule_id, *values,
    )


async def delete_automation_rule(workspace_id: str, rule_id: str) -> None:
    await execute(
        "DELETE FROM automation_rules WHERE workspace_id = $1 AND id = $2",
        workspace_id, rule_id,
    )


async def toggle_automation_rule(workspace_id: str, rule_id: str) -> dict | None:
    return await fetchrow(
        """
        UPDATE automation_rules
        SET is_active = NOT is_active, updated_at = now()
        WHERE workspace_id = $1 AND id = $2
        RETURNING id, workspace_id, name, is_active, updated_at
        """,
        workspace_id, rule_id,
    )
