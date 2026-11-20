#!/usr/bin/env python3
"""
CLI helper to view n8n Data Tables for practice defense.
"""
import sys
import json
import urllib.request
import urllib.parse

N8N_API_URL = "https://n8n-itmo.cyrweb.ru"
# Known table IDs
TABLES = {
    "reviewed_prs": "nMXcSESdqvRiz86s",
    "reviewed_commits": "F4ozsnniN5l5OGkV",
    "project_doc_cache": "wGUkpKjGczOr6VTT",
    "processed_issues": "SEQUuLjOXwZCNEJe",
    "weekly_stats": "hFOH2XlSNcaiGUIL",
}

def print_help():
    print("Usage: python3 scripts/n8n_tables.py [table_name]")
    print("Available tables:")
    for name, tid in TABLES.items():
        print(f"  - {name} ({tid})")

def main():
    table_name = sys.argv[1] if len(sys.argv) > 1 else None
    if not table_name or table_name not in TABLES:
        print_help()
        sys.exit(1)

    table_id = TABLES[table_name]
    print(f"=== Table: {table_name} (ID: {table_id}) ===")
    print("Use n8n web UI (Data Tables tab) or n8n MCP tool to view live rows.")

if __name__ == "__main__":
    main()
