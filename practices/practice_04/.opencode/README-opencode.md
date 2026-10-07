OpenCode Setup Summary (practice_04)

- Agents: see .opencode/AGENTS.md
- Skill: .opencode/skills/practice04.tdd
- Plugin Hook: .opencode/plugins/practice04-check (runs scripts/check.sh on write/edit/patch)
- MCP Server: .opencode/mcp/server.js configured by .opencode/mcp/config.json

MCP Tools
- weather.features: params { date_iso: YYYY-MM-DD, region_key: string }
- validate.input: params { diff_size: number } -> returns 413 when > 20000
