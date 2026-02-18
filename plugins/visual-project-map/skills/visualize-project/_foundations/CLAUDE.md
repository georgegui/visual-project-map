# Foundations

Reference lookup tables and schema documentation used by the visualize-project skill during graph generation.

## Executor
AI — reference tables are AI-authored and maintained.

## Status
tested.ai

## Inputs
- **skill phase context**: The current generation phase (discovery, graph generation, or assembly) determines which tables are consulted (implicit)

## Outputs
- **lookup values**: Colors, inference rules, schema field definitions consumed by the skill (reference data)

## Files
- **`color-palette.md`** — Phase and module color assignments (hex values with semantic labels)
- **`graph-schema.md`** — Field-level documentation for graph JSON schema (mirrors `schema.json`)
- **`inference-rules.md`** — Heuristic lookup tables for module design, actor assignment, status assignment, role assignment, confidence scoring, and description extraction
