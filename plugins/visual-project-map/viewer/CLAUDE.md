# Viewer

Browser-based DAG renderer built on Cytoscape.js + dagre layout with no build step.

## Executor
AI — all viewer JS is AI-written.

## Status
tested.ai

## Inputs
- **graph JSON**: A JSON file conforming to `schema.json` with `title`, `modules`, `nodes`, `edges`, and optional `legend` (JSON)

## Outputs
- **interactive graph**: Rendered DAG in the browser with collapse/expand, pan/zoom, tooltips, path tracing, search, view modes, and detail panels (HTML/CSS/JS)

## Specs
See `SPEC.md` for acceptance criteria and edge cases.

## Architecture
No build system, no npm, no bundler. Three global JS modules loaded as `<script>` tags in strict order — see `src/CLAUDE.md` for load order. Entry point is `index.html`.
