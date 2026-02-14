# Feature Catalog

Tracks every feature of the graph viewer with its current status. Before
adding a new feature, check it against `graph-properties.md` for
contradictions and against this catalog for duplicates.

## Status Definitions

| Status | Meaning |
|--------|---------|
| `implemented` | Working in the current codebase |
| `planned` | Agreed upon, not yet built |
| `experimental` | Prototyped or partially working, may change |
| `proposed` | Suggested, not yet agreed upon |
| `deprecated` | Was implemented, being phased out |

---

## Core Rendering

### F01: Load graph from JSON
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (loadGraph, buildElements)
- **Properties**: P1.1–P1.4
- Fetches a JSON file, converts modules/nodes/edges into Cytoscape elements.

### F02: Dagre hierarchical layout
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (runLayout)
- **Properties**: P3.1, P3.2
- Top-to-bottom layout via dagre with configurable spacing.

### F03: URL parameter for graph selection
- **Status**: `implemented`
- **Files**: `viewer/index.html` (inline script)
- `?graph=path/to/file.json` loads a specific graph. Defaults to
  `examples/minimal.json`.

## Visual Encoding

### F04: Module color coding
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.1
- Modules define (color, borderColor). Children inherit unless overridden.

### F05: Trust level border encoding
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildStyles)
- **Properties**: P2.2
- Border style/width driven by `legend.trustLevels` in the input JSON.

### F06: Node shape semantics
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.3
- Shapes: round-rectangle, diamond, ellipse, rectangle, hexagon.

### F07: Edge style (solid/dashed)
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.4
- Solid = primary flow, dashed = feedback/retry/optional.

### F08: Terminal state color overrides
- **Status**: `implemented`
- **Files**: input JSON per-node `style.color` / `style.borderColor`
- **Properties**: P2.5
- Nodes like INCLUDED (green), EXCLUDED (red) override module colors.

### F09: Edge label backgrounds
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildStyles)
- **Properties**: P3.3
- Opaque text backgrounds prevent label overlap.

## Collapse / Expand

### F10: Module collapse via cy.remove/cy.add
- **Status**: `implemented`
- **Files**: `viewer/src/expand-collapse.js` (CollapseManager)
- **Properties**: P4.1, P4.3
- Custom implementation, no third-party extension.

### F11: Meta-edge deduplication
- **Status**: `implemented`
- **Files**: `viewer/src/expand-collapse.js` (_rebuildEdges)
- **Properties**: P4.2
- Multiple cross-module edges merge into one meta-edge with combined labels.

### F12: Collapsed-by-default on load
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (init)
- **Properties**: P4.1
- All modules start collapsed, giving an overview-first experience.

### F13: Collapsed module visual style
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildStyles, applyCollapsedStyle)
- Collapsed modules render as fixed-size labeled rectangles with higher
  background opacity. Phase modules use a slightly larger style.

### F35: Nested module hierarchy (phases)
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildElements), `viewer/src/expand-collapse.js` (depth-aware collapse/expand)
- **Properties**: P1.2, P4.3
- Modules can have an optional `parent` field pointing to a phase module.
  Phases group related modules and support independent collapse/expand.
  Collapse order: deepest first; expand order: shallowest first. Flat graphs
  (no `parent`) are fully backward-compatible.

### F36: Edge label toggle
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (toggleLabels), `viewer/src/viewer.js` (labels-hidden styles)
- **Properties**: P2.6
- Edge labels are hidden by default. Toggle via toolbar button or `L` key.
  Labels always appear on path-traced edges (F26) and on hover (F15 tooltip).

## Interaction

### F14: Click module to toggle expand/collapse
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (tap handler)
- **Properties**: P6.1

### F15: Hover edge tooltip
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (mouseover/mouseout edge)
- **Properties**: P6.2

### F16: Hover node neighborhood highlighting
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (mouseover/mouseout node:child)
- **Properties**: P6.3
- Dims non-connected elements, highlights immediate neighborhood.

### F17: Keyboard shortcuts (F/E/C)
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (keydown handler)
- **Properties**: P6.4
- F = fit, E = expand all, C = collapse all.

### F18: Pan and zoom
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (initCytoscape), `viewer/src/interactions.js` (zoom)
- **Properties**: P6.5
- Scroll to zoom (0.15x–4x), drag to pan.

### F19: Fit to viewport
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (fit), `viewer/src/interactions.js` (btn-fit)
- **Properties**: P6.6

## UI Chrome

### F20: Auto-generated legend
- **Status**: `implemented`
- **Files**: `viewer/src/viewer.js` (buildLegend)
- **Properties**: P5.1
- Trust level tags + module color swatches.

### F21: Status bar
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (updateStatus)
- **Properties**: P5.2

### F22: Zoom display
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (zoom handler)
- **Properties**: P5.3

### F23: Toolbar buttons
- **Status**: `implemented`
- **Files**: `viewer/index.html`, `viewer/src/interactions.js`
- Expand All, Collapse All, Fit buttons.

## Schema & Validation

### F24: JSON Schema for input validation
- **Status**: `implemented`
- **Files**: `schema.json`
- External validation only (not enforced at runtime).

### F25: Runtime input validation with error messages
- **Status**: `proposed`
- Validate JSON against schema.json on load, show actionable errors in the
  UI instead of silently failing.
- **Properties to verify**: does not conflict with any existing property.

## Filtering & Focus

### F26: Path tracing (upstream/downstream)
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (tracePath, clearPathTrace)
- **Properties**: P7.2, P6.3
- Click a leaf node to highlight all ancestors (upstream) and descendants
  (downstream) via BFS edge traversal. Dims everything else. Click background
  or press Escape to clear. Extends F16 (neighborhood highlighting) from
  immediate neighbors to full transitive reachability. Works with both flat
  and nested module graphs.

### F27: Search / find node by label
- **Status**: `implemented`
- **Files**: `viewer/src/interactions.js` (search input handler), `viewer/index.html` (search input)
- **Properties**: P7.3
- Text input in toolbar. Type to filter matching node labels (case-insensitive
  substring). Matching nodes highlighted, non-matches dimmed, viewport pans to
  first match. Status bar shows match count. Press Escape to clear. Keyboard
  shortcut `/` to focus search. Only searches leaf nodes (not modules).

### F28: Filter by trust level
- **Status**: `proposed`
- **Properties**: P7.1
- Toggle buttons or checkboxes to show/hide nodes by trust level (as defined
  in `legend.trustLevels`). Filtered nodes are dimmed, not removed.

### F29: Filter by module
- **Status**: `proposed`
- **Properties**: P7.1
- Toggle individual modules visible/hidden. Useful for focusing on a subset
  of the workflow.

## Extended Data Model

### F30: Optional node status attribute
- **Status**: `proposed`
- **Properties**: P2.1–P2.3 (must not conflict)
- Extend schema to accept optional `style.status` on nodes with values:
  `not-started`, `in-progress`, `blocked`, `done`, `needs-review`. Visual
  encoding TBD — must not overload color (P2.1), border (P2.2), or shape
  (P2.3). Candidates: small icon badge, text annotation, or subtle background
  pattern.

### F31: Module summary badges
- **Status**: `proposed`
- **Properties**: P4.1, P5.2
- When a module is collapsed, show a small annotation on the collapsed module
  node (e.g., "5/8 done", "12 nodes"). Requires F30 (status attribute) for
  progress summaries; falls back to child count without it.

### F32: Optional node evidence/links attribute
- **Status**: `proposed`
- Extend schema to accept optional `evidence` array on nodes. Each entry is
  an object with `type` (url, commit, file, figure) and `value` (the link).
  Displayed in tooltip or detail panel on click. No property conflict.

## Structural Analysis

### F33: Orphan detection warning
- **Status**: `proposed`
- On load, identify nodes with no incoming AND no outgoing edges (excluding
  designated entry/exit points if flagged). Show warning in status bar (P5.2).
  Complements F25 (runtime validation).

### F34: Bottleneck highlighting
- **Status**: `proposed`
- Optional overlay showing nodes with highest in-degree or out-degree. Toggle
  via toolbar button. Visual treatment: thicker glow or badge with degree
  count. No property conflict.

## Actor & Detail Encoding

### F37: Actor annotations on edges
- **Status**: `implemented`
- **Files**: `schema.json` (actor field), `viewer/src/viewer.js` (buildElements, buildStyles, buildLegend), `viewer/src/expand-collapse.js` (meta-edge actor propagation)
- **Properties**: P2.7
- Edge line color encodes who performs the transition: human (indigo), AI
  (amber), script (gray, default), mixed (violet). Actor colors propagate
  through meta-edges when modules are collapsed. Legend shows actor line
  samples when any edge has an `actor` field.

### F38: Edge detail panel
- **Status**: `implemented`
- **Files**: `schema.json` (details object), `viewer/src/viewer.js` (buildElements), `viewer/src/interactions.js` (showDetailPanel, hideDetailPanel), `viewer/index.html` (detail-panel div + CSS)
- **Properties**: P6.2 (extends tooltip)
- Clicking an edge with a `details` object opens a modal panel showing
  script path, input files, output files, updated fields, and documentation
  links. Enhanced tooltip also shows script name on hover. Panel dismisses
  on backdrop click or Escape.

## Tooling & Generation

### F39: visualize-project skill (auto-generate graph JSON)
- **Status**: `implemented`
- **Files**: `skills/visualize-project/SKILL.md`, `skills/visualize-project/_foundations/`
- **Properties**: P1.1–P1.4 (output must satisfy all structural properties)
- Claude Code skill that analyzes a project's folder structure, CLAUDE.md
  files, and script dependencies to auto-generate a graph-viewer JSON.
  Supports `--focus`, `--depth`, `--title` arguments. Uses the graph
  schema, color palette, and inference rules from `_foundations/`.
  Turns the graph-viewer into a general-purpose project visualization tool.

---

## Changelog

| Date | Feature | Change |
|------|---------|--------|
| 2026-02-13 | F01–F24 | Initial catalog: documented all implemented features |
| 2026-02-13 | F25 | Added as proposed |
| 2026-02-13 | F26–F34 | Added 9 proposed features from GPT Pro triage (see `references/gpt-pro-suggestions.md`) |
| 2026-02-13 | F26, F27 | Implemented: path tracing (BFS upstream/downstream) and search (label substring) |
| 2026-02-13 | F35 | Implemented: nested module hierarchy (phases). Updated P1.2 from single-level to 2-level. |
| 2026-02-13 | F36 | Implemented: edge label toggle (hidden by default, shown on path trace/hover/toggle) |
| 2026-02-13 | — | Default graph changed to nested variant |
| 2026-02-13 | F37 | Implemented: actor annotations on edges (P2.7). Color-coded edge lines for human/AI/script/mixed. |
| 2026-02-13 | F38 | Implemented: edge detail panel. Click edges with `details` for script/input/output info. |
| 2026-02-13 | F39 | Implemented: visualize-project skill for auto-generating graph JSON from project structure. |
