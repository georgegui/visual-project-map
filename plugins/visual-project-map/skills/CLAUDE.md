# Skills

Claude Code skill definitions for the visual-project-map plugin. Each subdirectory is an independent skill with its own SKILL.md entry point.

## Inputs
- **user invocation**: `/visualize-project` or `/visualize-plan` commands with arguments (CLI)
- **project context**: Current working directory, existing graph files, CLAUDE.md documentation (filesystem)

## Outputs
- **graph JSON**: Generated or annotated graph files written to `.graphs/` (JSON conforming to `schema.json`)

## Skills
- **`visualize-project/`** — Main generation skill. Scans a project (describe), designs a workflow (initialize), or proposes restructuring (refactor). Split into router + workflow files + shared generation. See internal CLAUDE.md.
- **`visualize-plan/`** — Plan overlay skill. Reads an existing graph + plan document, annotates elements as add/modify/remove. Simple: single-pass matching.

Both skills produce graph JSON consumed by the viewer via `scripts/serve.py`.
