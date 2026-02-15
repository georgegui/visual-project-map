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
- **Files**: `src/viewer.js` (loadGraph, buildElements)
- **Properties**: P1.1–P1.4
- Fetches a JSON file, converts modules/nodes/edges into Cytoscape elements.

### F02: Dagre hierarchical layout
- **Status**: `implemented`
- **Files**: `src/viewer.js` (runLayout)
- **Properties**: P3.1, P3.2
- Top-to-bottom layout via dagre with configurable spacing.

### F03: URL parameter for graph selection
- **Status**: `implemented`
- **Files**: `index.html` (inline script)
- `?graph=path/to/file.json` loads a specific graph. Defaults to
  `examples/rct-workflow.json`.

## Visual Encoding

### F04: Module color coding
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.1
- Modules define (color, borderColor). Children inherit unless overridden.

### F05: Trust level border encoding
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildStyles)
- **Properties**: P2.2
- Border style/width driven by `legend.trustLevels` in the input JSON.

### F06: Node shape semantics
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.3
- Shapes: round-rectangle, diamond, ellipse, rectangle, hexagon.

### F07: Edge style (solid/dashed)
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.4
- Solid = primary flow, dashed = feedback/retry/optional.

### F08: Terminal state color overrides
- **Status**: `implemented`
- **Files**: input JSON per-node `style.color` / `style.borderColor`
- **Properties**: P2.5
- Nodes like INCLUDED (green), EXCLUDED (red) override module colors.

### F09: Edge label backgrounds
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildStyles)
- **Properties**: P3.3
- Opaque text backgrounds prevent label overlap.

## Collapse / Expand

### F10: Module collapse via cy.remove/cy.add
- **Status**: `implemented`
- **Files**: `src/expand-collapse.js` (CollapseManager)
- **Properties**: P4.1, P4.3
- Custom implementation, no third-party extension.

### F11: Meta-edge deduplication
- **Status**: `implemented`
- **Files**: `src/expand-collapse.js` (_rebuildEdges)
- **Properties**: P4.2
- Multiple cross-module edges merge into one meta-edge with combined labels.

### F12: Collapsed-by-default on load
- **Status**: `implemented`
- **Files**: `src/viewer.js` (init)
- **Properties**: P4.1
- All modules start collapsed, giving an overview-first experience.

### F13: Collapsed module visual style
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildStyles, applyCollapsedStyle)
- Collapsed modules render as fixed-size labeled rectangles with higher
  background opacity. Phase modules use a slightly larger style.

### F35: Nested module hierarchy (phases)
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements), `src/expand-collapse.js` (depth-aware collapse/expand)
- **Properties**: P1.2, P4.3
- Modules can have an optional `parent` field pointing to a phase module.
  Phases group related modules and support independent collapse/expand.
  Collapse order: deepest first; expand order: shallowest first. Flat graphs
  (no `parent`) are fully backward-compatible.

### F36: Edge label toggle
- **Status**: `implemented`
- **Files**: `src/interactions.js` (toggleLabels), `src/viewer.js` (labels-hidden styles)
- **Properties**: P2.6
- Edge labels are hidden by default. Toggle via toolbar button or `L` key.
  Labels always appear on path-traced edges (F26) and on hover (F15 tooltip).

## Interaction

### F14: Click module to toggle expand/collapse
- **Status**: `implemented`
- **Files**: `src/interactions.js` (tap handler)
- **Properties**: P6.1

### F15: Hover edge tooltip
- **Status**: `implemented`
- **Files**: `src/interactions.js` (mouseover/mouseout edge)
- **Properties**: P6.2

### F16: Hover node neighborhood highlighting
- **Status**: `implemented`
- **Files**: `src/interactions.js` (mouseover/mouseout node:child)
- **Properties**: P6.3
- Dims non-connected elements, highlights immediate neighborhood.

### F17: Keyboard shortcuts (F/E/C)
- **Status**: `implemented`
- **Files**: `src/interactions.js` (keydown handler)
- **Properties**: P6.4
- F = fit, E = expand all, C = collapse all.

### F18: Pan and zoom
- **Status**: `implemented`
- **Files**: `src/viewer.js` (initCytoscape), `src/interactions.js` (zoom)
- **Properties**: P6.5
- Scroll to zoom (0.15x–4x), drag to pan.

### F19: Fit to viewport
- **Status**: `implemented`
- **Files**: `src/viewer.js` (fit), `src/interactions.js` (btn-fit)
- **Properties**: P6.6

## UI Chrome

### F20: Auto-generated legend
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildLegend)
- **Properties**: P5.1
- Trust level tags + module color swatches.

### F21: Status bar
- **Status**: `implemented`
- **Files**: `src/interactions.js` (updateStatus)
- **Properties**: P5.2

### F22: Zoom display
- **Status**: `implemented`
- **Files**: `src/interactions.js` (zoom handler)
- **Properties**: P5.3

### F23: Toolbar buttons
- **Status**: `implemented`
- **Files**: `index.html`, `src/interactions.js`
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
- **Files**: `src/interactions.js` (tracePath, clearPathTrace)
- **Properties**: P7.2, P6.3
- Click a leaf node to highlight all ancestors (upstream) and descendants
  (downstream) via BFS edge traversal. Dims everything else. Click background
  or press Escape to clear. Extends F16 (neighborhood highlighting) from
  immediate neighbors to full transitive reachability. Works with both flat
  and nested module graphs.

### F27: Search / find node by label
- **Status**: `implemented`
- **Files**: `src/interactions.js` (search input handler), `index.html` (search input)
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
- **Files**: `schema.json` (actor field), `src/viewer.js` (buildElements, buildStyles, buildLegend), `src/expand-collapse.js` (meta-edge actor propagation)
- **Properties**: P2.7
- Edge line color encodes who performs the transition: human (indigo), AI
  (amber), script (gray, default), mixed (violet). Actor colors propagate
  through meta-edges when modules are collapsed. Legend shows actor line
  samples when any edge has an `actor` field.

### F38: Edge detail panel
- **Status**: `implemented`
- **Files**: `schema.json` (details object), `src/viewer.js` (buildElements), `src/interactions.js` (showDetailPanel, hideDetailPanel), `index.html` (detail-panel div + CSS)
- **Properties**: P6.2 (extends tooltip)
- Clicking an edge with a `details` object opens a modal panel showing
  script path, input files, output files, updated fields, and documentation
  links. Enhanced tooltip also shows script name on hover. Panel dismisses
  on backdrop click or Escape.

## Tooling & Generation

### F39: visualize-workflow skill (auto-generate graph JSON)
- **Status**: `implemented`
- **Files**: `.claude/skills/visualize-workflow/SKILL.md`, `.claude/skills/_foundations/`
- **Properties**: P1.1–P1.4 (output must satisfy all structural properties)
- Claude Code skill that analyzes a project's folder structure, CLAUDE.md
  files, and script dependencies to auto-generate a graph-viewer JSON.
  Supports `--focus`, `--depth`, `--title` arguments. Uses the graph
  schema, color palette, and inference rules from `_foundations/`.
  Turns the graph-viewer into a general-purpose project visualization tool.

## View Modes

### F40: View mode switcher (Module/Provenance/Actor/Files)
- **Status**: `implemented`
- **Files**: `src/viewer.js` (setView, rebuildLegendForView, view-specific CSS), `src/interactions.js` (view button handlers, V key), `index.html` (view buttons)
- **Properties**: P2.1, P2.2, P2.7, P5.1
- Four mutually exclusive color scheme views: **Module** (default, module-colored),
  **Provenance** (trust-state colored: raw/ai_generated/needs_human_review/human_verified),
  **Actor** (dominant edge actor colored), **Files** (node labels replaced with file I/O paths).
  Toolbar buttons cycle through views; `V` key rotates. Legend updates to show only
  context-relevant items per active view.

### F41: Node file annotations
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements fileLabel), `src/interactions.js` (hover tooltip, showNodeDetailPanel)
- Nodes can have an optional `files` object with `reads: string[]` and `writes: string[]`.
  Displayed on hover (tooltip with emoji indicators), on double-click (modal detail panel
  showing full paths), and inline in Files view mode (F40).

### F42: Node detail panel (double-click)
- **Status**: `implemented`
- **Files**: `src/interactions.js` (dbltap handler, showNodeDetailPanel)
- **Properties**: P6.2 (extends detail panel concept from edges to nodes)
- Double-clicking a leaf node with `files` data opens a modal panel showing the node's
  trust level badge and full read/write file paths. Same dismiss behavior as edge detail
  panel (F38).

### F43: Context-sensitive legend
- **Status**: `implemented`
- **Files**: `src/viewer.js` (rebuildLegendForView)
- **Properties**: P5.1
- Legend content changes based on active view mode (F40). Module view shows module swatches,
  Provenance view shows trust level tags, Actor view shows actor line colors, Files view
  shows file emoji indicators. Reduces legend clutter compared to showing all categories
  simultaneously.

## Plan Overlay

### F44: Plan overlay view mode
- **Status**: `implemented`
- **Files**: `src/plan-overlay.js` (PlanOverlay module), `src/viewer.js` (setView plan case, plan styles, plan legend), `src/interactions.js` (plan button visibility, V key cycling), `index.html` (Plan button, CSS)
- **Properties**: P2.8
- Optional `plan` field in graph JSON triggers a Plan view button. When active,
  annotated nodes/edges glow green (add), amber (modify), or red (remove) via
  overlay shadows. Unchanged elements dim to 30% opacity. Switching to any other
  view clears all plan styling. No conflict with existing visual encodings
  (P2.1-P2.7) because plan uses overlay glow (unused channel).

### F45: Plan summary panel
- **Status**: `implemented`
- **Files**: `src/interactions.js` (buildPlanSummaryPanel), `index.html` (plan-summary-panel div + CSS)
- **Properties**: P5.1 (extends)
- Slide-in panel from the right showing plan goal and task list. Click a task
  to highlight its `nodeIds` on the graph. Toggle via Summary button (visible
  in plan view). Panel shows `plan.summary.goal` and `plan.summary.tasks[]`.

### F46: Collapsed module plan badges
- **Status**: `implemented`
- **Files**: `src/plan-overlay.js` (apply, getModuleCounts, formatBadge)
- **Properties**: P4.1 (extends)
- When a module is collapsed in plan view, its label includes a badge showing
  counts of annotated children: `+N ~M -R` (add/modify/remove). Badges are
  removed when leaving plan view.

### F47: Plan tooltip/detail integration
- **Status**: `implemented`
- **Files**: `src/interactions.js` (mouseover handlers, showDetailPanel, showNodeDetailPanel)
- **Properties**: P6.2 (extends)
- In plan view, hovering annotated nodes/edges shows the plan annotation
  description in the tooltip. The detail panel (click/double-click) also shows
  the plan status and description alongside existing information.

### F48: visualize-plan skill
- **Status**: `implemented`
- **Files**: `.claude/skills/visualize-plan/SKILL.md`
- **Properties**: P1.1-P1.4 (output must satisfy all structural properties)
- Claude Code skill that reads an existing graph JSON and a plan document,
  matches plan tasks to graph nodes/edges, and emits a `plan` field. Complements
  the `visualize-workflow` skill (F39) for plan-time visualization.

## Quality of Life

### F49: Runtime input validation
- **Status**: `implemented`
- **Files**: `src/viewer.js` (validateGraph, showErrorPanel, loadGraph error handling), `index.html` (error-panel div + CSS)
- **Properties**: P1.1–P1.4
- Validates graph JSON on load: required fields, duplicate IDs, dangling references,
  circular parent chains. Blocking errors show in a modal error panel. Non-blocking
  warnings (orphan nodes, empty graph) logged to console with status bar note.

### F50: Auto-refresh / watch mode
- **Status**: `implemented`
- **Files**: `src/viewer.js` (watchGraph, stopWatch, reloadGraph), `src/interactions.js` (toggleWatch, W key), `index.html` (Watch button)
- Client-side polling via HEAD requests every 2 seconds, comparing Last-Modified
  headers. When the JSON changes, the viewer reloads in-place preserving view mode.
  Toggle via Watch toolbar button or `W` key.

### F51: Minimap
- **Status**: `implemented`
- **Files**: `src/minimap.js` (Minimap module), `src/interactions.js` (toggleMinimap, M key), `index.html` (canvas + CSS + button)
- **Properties**: P6.1 (extends navigation)
- Canvas-based overview inset in bottom-right corner showing all nodes/edges at
  thumbnail scale with a viewport rectangle. Click to navigate. Debounced redraws
  on pan/zoom/layout. Toggle via Minimap button or `M` key.

### F52: Breadcrumb navigation
- **Status**: `implemented`
- **Files**: `src/interactions.js` (breadcrumb helpers, renderBreadcrumb, click handlers), `index.html` (breadcrumb div + CSS)
- **Properties**: P6.1 (extends navigation)
- Clickable trail bar below legend showing drill-down path (e.g. Graph > Phase > Module).
  Tracks most-recently expanded module chain. Click "Graph" to collapse all, click any
  ancestor to collapse everything deeper. Hidden when all modules are collapsed.

### F53: Schema sync
- **Status**: `implemented`
- **Files**: `schema.json`, `skills/visualize-project/_foundations/graph-schema.md`
- **Properties**: P1.1–P1.4
- Synced `schema.json` with all properties the code actually uses: module `parent`,
  module `interface`, node `files`, node `_isInterfacePort`/`_portDirection`/
  `interfaceContract`, edge `id`, trustLevel `color`/`borderColor`. Updated the
  graph-schema.md foundation doc to match.

### F54: Graph diff
- **Status**: `implemented`
- **Files**: `src/diff.js` (GraphDiff module), `src/viewer.js` (diff styles, diff legend, diff view mode), `src/interactions.js` (V key cycling with diff), `index.html` (Diff button, diff.js script, ?compare= URL handling)
- **Properties**: P2.9 (new)
- Compare two graph JSON versions via `?graph=new.json&compare=old.json`. Computes
  structural diff (added/removed/modified) for modules, nodes, and edges. Diff view
  mode shows green/amber/red/dimmed overlay. V key cycling includes Diff when loaded.
  Legend shows diff summary counts.

### F55: Incremental regeneration
- **Status**: `implemented`
- **Files**: `skills/visualize-project/SKILL.md` (incremental mode section, --force flag)
- **Properties**: P1.1–P1.4
- When `.graphs/{name}.json` already exists, the skill uses incremental mode: re-scans
  the project, diffs against the existing graph, preserves manual refinements (labels,
  colors, contracts), adds new elements, and lists removals for user confirmation.
  Saves previous version as `{name}.prev.json` for diff overlay. `--force` flag
  skips incremental mode.

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
| 2026-02-13 | — | Default graph changed to nested variant (`rct-workflow-nested.json`) |
| 2026-02-13 | F37 | Implemented: actor annotations on edges (P2.7). Color-coded edge lines for human/AI/script/mixed. |
| 2026-02-13 | F38 | Implemented: edge detail panel. Click edges with `details` for script/input/output info. |
| 2026-02-13 | F39 | Implemented: visualize-workflow skill for auto-generating graph JSON from project structure. |
| 2026-02-14 | F40 | Implemented: view mode switcher (Module/Provenance/Actor/Files) with V key cycling |
| 2026-02-14 | F41 | Implemented: node file annotations (reads/writes) with hover tooltip and Files view |
| 2026-02-14 | F42 | Implemented: node detail panel on double-click (trust badge + file paths) |
| 2026-02-14 | F43 | Implemented: context-sensitive legend per active view mode |
| 2026-02-14 | P4b | Added: cross-module edge minimization properties (P4b.1–P4b.3) |
| 2026-02-14 | — | RCT JSON restructured with 5 collector/dispatcher nodes. Cross-module edges: 33 → 22. |
| 2026-02-14 | F44 | Implemented: plan overlay view mode (green/amber/red glow on annotated elements) |
| 2026-02-14 | F45 | Implemented: plan summary panel (slide-in goal + task list with node highlighting) |
| 2026-02-14 | F46 | Implemented: collapsed module plan badges (+N ~M -R counts) |
| 2026-02-14 | F47 | Implemented: plan tooltip/detail integration (annotation descriptions on hover/click) |
| 2026-02-14 | F48 | Implemented: visualize-plan skill for overlaying plans onto existing graphs |
| 2026-02-14 | P2.8 | Added: plan status via overlay glow (unused visual channel) |
| 2026-02-15 | F49 | Implemented: runtime input validation with error panel |
| 2026-02-15 | F50 | Implemented: auto-refresh watch mode (HEAD polling, W key) |
| 2026-02-15 | F51 | Implemented: canvas minimap with click-to-navigate (M key) |
| 2026-02-15 | F52 | Implemented: breadcrumb navigation for drill-down hierarchy |
| 2026-02-15 | F53 | Implemented: schema sync (added parent, files, interface, port fields) |
| 2026-02-15 | F54 | Implemented: graph diff view mode (?compare= URL, diff.js, green/amber/red overlay) |
| 2026-02-15 | F55 | Implemented: incremental regeneration (skill preserves refinements, saves .prev.json) |
