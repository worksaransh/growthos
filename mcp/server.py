"""
GrowthOS MCP Server — entry point
==================================
Loads .env, imports all tool modules (which register @mcp.tool decorators
on the shared FastMCP singleton in mcp/app.py), then starts the server.

Usage:
    # stdio — for Claude Desktop
    python mcp/server.py

    # HTTP — for testing / remote clients
    python mcp/server.py --transport http --port 8001
"""

import os
import sys
import argparse
from pathlib import Path

# ── Bootstrap: project root on sys.path + load .env ─────────────────────────

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))


def _load_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        idx = line.find("=")
        if idx == -1:
            continue
        key, val = line[:idx].strip(), line[idx + 1:].strip()
        if key not in os.environ:
            os.environ[key] = val


_load_env()

# ── Import shared app singleton ──────────────────────────────────────────────

from mcp.app import mcp  # noqa: E402

# ── Register all tools by importing their modules ────────────────────────────
# Each module does `from mcp.app import mcp` and decorates functions with @mcp.tool

import mcp.tools.dashboard       # noqa: F401, E402
import mcp.tools.meta_ads        # noqa: F401, E402
import mcp.tools.google_ads      # noqa: F401, E402
import mcp.tools.shopify_tools   # noqa: F401, E402
import mcp.tools.crm_tools       # noqa: F401, E402
import mcp.tools.sync_tools      # noqa: F401, E402

# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GrowthOS MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http"],
        default="stdio",
        help="stdio (default) for Claude Desktop; http for remote/testing",
    )
    parser.add_argument("--port", type=int, default=8001)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    if args.transport == "http":
        print(f"🚀 GrowthOS MCP Server — HTTP on {args.host}:{args.port}")
        mcp.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        mcp.run(transport="stdio")
