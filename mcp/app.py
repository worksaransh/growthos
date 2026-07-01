"""
Shared FastMCP singleton.
Import this in all tool modules to avoid circular imports.
"""
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="GrowthOS",
    instructions="""
You are connected to GrowthOS — an AI-powered D2C operating system for
Indian ecommerce brands. Available capabilities:

• Dashboard metrics — revenue, ROAS, orders, profit, CAC (trailing N days)
• Meta Ads — campaigns, ad sets, ads, insights, pixel events, budget control
• Google Ads — campaigns, keywords, search terms, budget mutations
• Shopify — orders, products, customers, inventory, discounts
• CRM — leads pipeline, create/update leads
• Automation rules — list, toggle, create ROAS/spend triggers
• Notifications — read alerts, mark read
• Sync — trigger manual data syncs, check integration health

All monetary values are in INR. Dates use YYYY-MM-DD format.
ROAS values are dimensionless ratios. Cost micros (Google) = INR × 1,000,000.
""",
)
