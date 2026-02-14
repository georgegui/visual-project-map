# Changelog

## [1.0.0] - 2026-02-13

### Added
- Interactive DAG viewer with Cytoscape.js + dagre layout
- 2-level module hierarchy (phases contain modules contain nodes)
- Collapse/expand with meta-edge deduplication
- Trust level border encoding (normal/auto/AI/verified)
- Actor annotations on edges (human/AI/script/mixed)
- Edge detail panel (script path, inputs, outputs, docs)
- Path tracing (upstream/downstream BFS)
- Search by node label
- Edge label toggle (hidden by default)
- Keyboard shortcuts (F/E/C/L/Esc)
- JSON Schema for input validation
- `visualize-project` Claude Code skill for auto-generating graphs
- Three example graphs (minimal, data-pipeline, ci-cd-workflow)
