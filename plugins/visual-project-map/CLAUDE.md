# Visual Project Map Plugin

Claude Code plugin that generates and renders interactive folder-structure DAGs. Contains the generation skill (AI-driven), the browser-based viewer, utility scripts, example graphs, and the JSON schema definition.

## Inputs
- **user invocation**: `/visualize-project` or `/visualize-plan` commands via Claude Code CLI (CLI)
- **project filesystem**: Directory tree, CLAUDE.md files, scripts, and documentation to scan (filesystem)
- **objective text**: Natural language workflow description for design mode (string)

## Outputs
- **graph JSON**: Generated graph files written to `.graphs/{name}.json` conforming to `schema.json` (JSON)
- **interactive viewer**: Browser-based DAG renderer at `viewer/index.html` (HTML/JS)

## Specs
See `SPEC.md` at the repo root for the full specification (actions, folder premise, design principles). See `schema.json` for the graph JSON schema definition.

## Structure
- **`skills/`** — Generation skills (visualize-project, visualize-plan)
- **`viewer/`** — Browser-based Cytoscape.js renderer
- **`scripts/`** — Utility scripts (serve.py)
- **`examples/`** — Sample graph JSON files
- **`schema.json`** — JSON Schema for graph validation
