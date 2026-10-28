Skill: practice04.tdd

Purpose
- Encourage writing edge-case tests for CLI and weather summarization.
- Provide quick checklist before edits.

Guidance
- Before changing logic, add or update a failing test in tests/.
- Validate date parsing, region/crop parameters, and summarization of hourly data including non-numeric values.
- Keep prompts deterministic and explicit.

Verification
- After edits, rely on plugin practice04.checks to run scripts/check.sh, which executes pytest.
