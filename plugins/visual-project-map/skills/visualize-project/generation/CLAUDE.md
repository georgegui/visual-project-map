# Generation

Shared graph generation and assembly logic used by all visualize-project workflow modes. Converts discovery results into valid visual-project-map JSON.

## Executor
AI — graph generation is performed by Claude Code following the generation prompt.

## Status
tested.ai

## Inputs
- **discovery results**: Module list, node list, edge list, and interface definitions from the workflow phase (structured data in context)
- **schema constraints**: Graph JSON schema from `schema.json` and graph properties from `spec/graph-properties.md` (reference)

## Outputs
- **graph JSON**: Complete visual-project-map JSON file conforming to `schema.json` (JSON written to `.graphs/`)

## Files
- **`generation.md`** — Phase 2 + 3: graph element construction, validation, and JSON assembly
