# Examples

Sample graph JSON files for testing and demonstrating the viewer.

## Executor
Mixed — some examples are AI-generated, others hand-authored.

## Status
tested.ai

## Inputs
- **graph JSON**: Manually authored or skill-generated graph files conforming to `schema.json` (JSON)

## Outputs
- **example graphs**: Ready-to-load JSON files accessible via `viewer/?graph=../examples/{name}.json` (JSON)

## Files
- **`minimal.json`** — Minimal valid graph for smoke testing
- **`minimal-with-plan.json`** — Minimal graph with plan overlay annotations
- **`data-pipeline.json`** — ETL pipeline example (ingest → clean → export)
- **`ci-cd-workflow.json`** — CI/CD pipeline example
- **`visual-project-map.json`** — Self-referential: this project's own architecture graph
- **`visual-project-map-workflow.json`** — This project's workflow graph
