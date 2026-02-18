# Visual Project Map Plugin — Specification

## Acceptance Criteria

### Manifest Versions Match
- `.claude-plugin/marketplace.json` → `plugins[0].version` matches `plugins/visual-project-map/.claude-plugin/plugin.json` → `version`
- Version bump requires updating both files

### Skills Execute
- `/visualize-project` dispatches to the correct workflow based on input mode (scan, design, refactor, plan)
- `/visualize-plan` annotates an existing graph with plan overlay metadata
- Both skills produce valid graph JSON on success

### JSON Validates
- Generated graph JSON conforms to `schema.json`
- Required top-level fields: `title`, `modules`, `nodes`, `edges`
- Every node references a valid `module` ID
- Edge `source` and `target` reference valid node IDs
- Optional fields (`legend`, `description`, `interface`, `plan`) conform to their sub-schemas

### Viewer Renders
- `viewer/index.html` loads and renders any valid graph JSON without errors
- Collapse/expand, pan/zoom, tooltips, and keyboard shortcuts function correctly
- All 7 view modes cycle without errors: Module, Provenance, Actor, Files, Confidence, Plan, Diff
- Export (PNG, SVG) produces valid output
