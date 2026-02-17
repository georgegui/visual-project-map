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

### F59: Interface port positioning adjacent to modules
- **Status**: `implemented`
- **Properties**: P3.4
- **Workstream**: A2
- **Files**: `src/viewer.js` (positionPorts function), `src/interactions.js` (positionPorts calls after layout)
- Port nodes use `_moduleRef` instead of Cytoscape `parent`, so they survive
  collapse naturally. After layout, `positionPorts()` snaps input ports above
  and output ports below their collapsed module. Called in init and after
  every expand/collapse toggle.

## Visual Encoding

### F04: Module color coding
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.1
- Modules define (color, borderColor). Children inherit unless overridden.

### F05: Trust level visual encoding
- **Status**: `implemented`
- **Files**: `src/viewer.js` (buildStyles)
- **Properties**: P2.2
- Trust levels defined in `legend.trustLevels` drive the Provenance view mode
  color scheme (F40). Legacy `borderStyle`/`borderWidth` fields retained for
  backward compatibility but ignored — border is driven by status (P2.2).

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

### F58: Prominent interface port styling
- **Status**: `implemented`
- **Properties**: P2.10
- **Workstream**: A1
- **Files**: `src/viewer.js` (buildStyles port selectors)
- Enlarge interface port nodes (180x34, 10px italic font). Blue fill for inputs
  (round-rectangle), green for outputs (tag shape). Ports visually distinct from
  regular child nodes via dashed border, italic font, and directional shape.

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

### F61: Collapsed module I/O subtitle
- **Status**: `implemented`
- **Workstream**: A4
- **Files**: `src/viewer.js` (applyCollapsedStyle, removeCollapsedStyle, collapsed-module text-wrap)
- When a module is collapsed and has no `_isInterfacePort` nodes, appends a
  compact I/O summary to the label (e.g., "→ inputs | outputs →"). Label is
  restored on expand via `_origLabel` data. Collapsed-module style now supports
  `text-wrap: wrap`.

## Interaction

### F14: Click module to toggle expand/collapse
- **Status**: `implemented`
- **Files**: `src/interactions.js` (tap handler)
- **Properties**: P6.1

### F15: Hover tooltip (edges and nodes)
- **Status**: `implemented`
- **Files**: `src/interactions.js` (mouseover/mouseout edge, mouseover/mouseout node:child)
- **Properties**: P6.2
- Edge hover shows label, script, and description. Node hover shows label, file I/O
  indicators, and a description preview (truncated at 120 chars with "click for full
  detail" hint when longer).

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

### F60: Default zoom cap for collapsed view
- **Status**: `implemented`
- **Workstream**: A3
- **Files**: `src/viewer.js` (fit function maxZoom parameter)
- `fit()` accepts optional `maxZoom` parameter. Initial load calls `fit(50, 1.2)`
  so small graphs don't over-zoom. Large graphs naturally fit below 1.2x.

### F71: Animated flow simulation
- **Status**: `planned`
- **Workstream**: E2
- A "play" button that walks a token through the DAG from entry to exit in
  topological order. Play/pause/step controls. Makes sequencing viscerally
  obvious instead of requiring mental arrow-tracing.

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

### F70: Export as PNG/SVG
- **Status**: `planned`
- **Workstream**: E1
- Toolbar button to export the current view as PNG or SVG using Cytoscape.js
  built-in `cy.png()`. Biggest reach multiplier — users can paste graphs into
  PRs, wikis, Slack, and design docs.

## Schema & Validation

### F24: JSON Schema for input validation
- **Status**: `implemented`
- **Files**: `schema.json`
- External validation only (not enforced at runtime).

### F25: Runtime input validation with error messages
- **Status**: `implemented` (superseded by F49)
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

### F65: Critical path schema field and highlighting
- **Status**: `implemented`
- **Properties**: P2.13, P7.4
- **Workstream**: B4
- Pre-computed `graph.criticalPath` (node ID array) stored in the graph JSON.
  `P` key toggles highlighting: critical path elements highlighted, rest dimmed.
  Non-destructive (like path tracing, P7.2).

## Extended Data Model

### F30: Optional node status attribute
- **Status**: `deprecated` (superseded by F75)
- **Properties**: P2.1–P2.3 (must not conflict)
- Originally proposed `style.status` with values `not-started`, `in-progress`,
  `blocked`, `done`, `needs-review`. Superseded by F75 which implemented
  top-level `status` field with values `planned`, `draft`, `ai-tested`,
  `needs-review`, `verified` — encoded via opacity and border treatment (P2.2).

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

### F62: Module/edge confidence schema fields
- **Status**: `implemented`
- **Properties**: P2.11
- **Workstream**: B1
- **Files**: `schema.json` (confidence/needsHumanReview/checkpointReason on modules, confidence on edges), `skills/visualize-project/_foundations/graph-schema.md` (field docs + confidence visual encoding table), `skills/visualize-project/_foundations/inference-rules.md` (Design-Mode Confidence Heuristics section)
- New optional fields: `module.confidence` (high/medium/low/unknown),
  `module.needsHumanReview` (boolean), `module.checkpointReason` (string),
  `edge.confidence` (high/medium/low/unknown). Backward-compatible — graphs
  without these fields render as before. `graph.criticalPath` deferred to F65/F68.

### F63: needsHumanReview flag and amber badge
- **Status**: `implemented`
- **Properties**: P2.11, P2.12
- **Workstream**: B2
- **Files**: `src/viewer.js` (applyCollapsedStyle badge, `.needs-review` style, buildElements confidence passthrough)
- Collapsed modules with `needsHumanReview: true` get " ⚠" appended to label
  and `.needs-review` class (amber dashed border with subtle overlay). Removed
  on expand via `removeCollapsedStyle`. Confidence/review data passed through
  `buildElements()` from module JSON.

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

### F72: Circular parent guard in collapse logic
- **Status**: `planned`
- **Workstream**: E3
- Add max-depth guard in `expand-collapse.js`'s `_depth()` function. Runtime
  validation (F49) already checks for circular parents in JSON, but the
  collapse logic itself should be defensive against unvalidated input.

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

### F66: Skill always generates interface port nodes
- **Status**: `planned`
- **Properties**: P1.1–P1.4
- **Workstream**: C1-C2
- Update SKILL.md to always generate interface port nodes from
  `module.interface` fields, and to always generate interfaces (removing
  the "only include interfaces you have evidence for" caveat). Every module
  must have at least one named input and one named output.

### F67: Skill generates confidence annotations
- **Status**: `planned` (partially implemented — design mode generates confidence; scan mode does not)
- **Properties**: P1.1–P1.4
- **Workstream**: C3
- The skill assesses and records confidence per module and edge: high (clear
  evidence), medium (partial evidence), low (convention-based guess). For
  design mode (Input B), defaults to medium/low.
- **Gap**: Design-mode confidence generation is implemented in SKILL.md (Step 2.1
  design-mode defaults) and inference-rules.md (Design-Mode Confidence Heuristics).
  Scan-mode confidence generation has no heuristics yet — the skill has no
  mechanism to assign confidence when scanning an existing project.

### F68: Skill generates critical path
- **Status**: `planned`
- **Properties**: P1.1–P1.4
- **Workstream**: C4
- Given the user's objective, the skill traces which modules and edges are
  upstream of the final output and records `graph.criticalPath` (node ID array).

### F69: Design-from-objective skill mode (Input B)
- **Status**: `implemented`
- **Properties**: P1.1–P1.4
- **Workstream**: D1
- **Files**: `skills/visualize-project/SKILL.md` (Phase 1B, design-mode guidance in Phase 2-3, design-mode edge cases, worked example), `skills/visualize-project/_foundations/inference-rules.md` (Design-Mode Defaults section), `schema.json` (`_generationMode`, `_objective`, `_generatedAt` fields)
- `--objective "text"` and `--objective-file path` arguments. Skips project scanning;
  designs a workflow from domain knowledge via Phase 1B. Generates modules with
  interfaces, confidence, and human-review flags. All elements default to
  `status: "planned"`. Compatible with `--constraints`, `--domain`, `--depth`, `--title`.
  Design-mode graphs transition to scan mode via incremental regeneration.

### F76: Design-mode CLAUDE.md scaffolding suggestion
- **Status**: `implemented`
- **Files**: `skills/visualize-project/SKILL.md` (Step 3.5b)
- After writing a design-mode graph, the skill prints a suggested folder structure
  with `CLAUDE.md` stubs for each module. Derives folder names from module labels
  and stub content from module descriptions and interfaces. Print-only — no files
  created. Implements the Folder Premise in SPEC.md (each non-trivial folder has a CLAUDE.md).

### F77: Executable scaffolding via --scaffold flag
- **Status**: `implemented`
- **Files**: `skills/visualize-project/SKILL.md` (--scaffold argument, Step 3.5b expanded)
- **Properties**: P1.1–P1.4
- `--scaffold` flag in design mode creates CLAUDE.md and SPEC.md stubs in project
  directories instead of just printing them. Creates directories, writes CLAUDE.md
  with module objective/inputs/outputs, and writes SPEC.md stubs for modules with
  `needsHumanReview: true`. Skips existing files without overwriting. Without
  `--scaffold`, behavior is unchanged (print-only). Extends F76.

### F78: `refactor` action — scan + redesign toward objective
- **Status**: `implemented`
- **Properties**: P1.1–P1.4
- **Files**: `skills/visualize-project/SKILL.md` (Phase 1C, --refactor flag, refactor-mode guidance)
- New generation action that combines scanning an existing project (Phase 1) with
  redesigning toward a stated objective (Phase 1B). Scans current folder structure,
  redesigns toward the objective while preserving code references, and outputs a graph
  with diff overlay showing the refactoring plan. Invoked via
  `/visualize-project . --refactor --objective "..."`.

### F79: `plan` action — detect SPEC.md changes, propose new folders
- **Status**: `proposed`
- **Properties**: P1.1–P1.4
- New generation action that scans an existing project, detects SPEC.md changes (or
  accepts explicit pointers to changed specs), and proposes new directories and files
  to satisfy the updated requirements. Outputs the current graph with new folders at
  `status: "planned"` and plan overlay annotations. Invoked via
  `/visualize-project . --plan`.

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

### F42: Node detail panel (click / double-click)
- **Status**: `deprecated` (superseded by F73)
- **Files**: `src/interactions.js` (tap handler, dbltap handler, showNodeDetailPanel)
- **Properties**: P6.2 (extends detail panel concept from edges to nodes)
- Single-clicking a leaf node with `description` or `files` opened a modal panel showing
  the node's trust level badge, description, and full read/write file paths. Replaced by
  the non-blocking side panel (F73).

### F43: Context-sensitive legend
- **Status**: `implemented`
- **Files**: `src/viewer.js` (rebuildLegendForView)
- **Properties**: P5.1
- Legend content changes based on active view mode (F40). Module view shows module swatches,
  Provenance view shows trust level tags, Actor view shows actor line colors, Files view
  shows file emoji indicators. Reduces legend clutter compared to showing all categories
  simultaneously.

### F64: Confidence view mode
- **Status**: `implemented`
- **Workstream**: B3
- **Files**: `src/viewer.js` (confidence styles, setView confidence branch, rebuildLegendForView), `src/interactions.js` (V-key cycle), `index.html` (Confidence toolbar button)
- Confidence view mode in V-key cycle and toolbar. Modules colored by
  `module.confidence`: green=high, yellow=medium, red=low, gray=unknown.
  Non-module nodes dimmed. Legend updates with confidence color key.

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

## Natural Language Descriptions

### F56: Description fields on graph, modules, nodes, and edges
- **Status**: `implemented`
- **Files**: `schema.json` (description fields), `src/viewer.js` (buildElements passes descriptions, graph-description element), `src/interactions.js` (tooltips + detail panels show descriptions), `index.html` (graph-description div + dp-desc CSS)
- **Properties**: P5.1 (extends), P6.2 (extends)
- Optional `description` string on graph root, modules, nodes, and edges. Provides
  natural language documentation making the JSON self-describing. Graph description
  shows as a collapsible bar below the legend. Module descriptions appear in tooltips
  (collapsed or expanded) and in the interface panel. Node descriptions appear in
  hover tooltips and the double-click detail panel. Edge descriptions appear in hover
  tooltips and the click detail panel. Descriptions are purely informational — they
  do not affect layout, color, or any visual encoding.

### F57: Skill generates descriptions and module interfaces
- **Status**: `implemented`
- **Files**: `skills/visualize-project/SKILL.md` (Step 2.0, module/node/edge description instructions), `skills/visualize-project/_foundations/inference-rules.md` (Description Extraction section), `skills/visualize-project/_foundations/graph-schema.md` (description fields)
- **Properties**: P1.1–P1.4
- The visualize-project skill now generates descriptions for the graph root (always),
  modules (always), nodes (where non-trivial), and edges (cross-module and conditional).
  It also populates `module.interface` with `inputs`/`outputs` arrays describing data
  crossing module boundaries. Description fields are preserved during incremental
  regeneration as manual refinements.

## Node Detail

### F73: Node detail side panel
- **Status**: `implemented`
- **Files**: `schema.json` (node.io, node.docs), `src/viewer.js` (buildElements io/docs passthrough, ndp-selected style), `src/interactions.js` (showNodeSidePanel, hideNodeSidePanel, rewired tap handler), `index.html` (node-detail-panel div + CSS)
- **Properties**: P6.2 (extends)
- Non-blocking left-side panel that opens on click of a child node with detail data
  (description, io, files, or docs). Shows trust badge, description, docs link, rich I/O
  sections (inputs/outputs with name/description/format/example), file reads/writes, plan
  annotation, and a "Trace Path" button. Shift+click bypasses the panel for path trace.
  Nodes without detail data fall back to path trace on click. Panel closes on Escape,
  background click, or close button. Supersedes F42 (modal node detail panel).
- **Schema fields used**: `node.io` (rich I/O with inputs/outputs arrays — same structure
  as `module.interface`), `node.docs` (link to documentation file or URL). Both are passed
  through `buildElements()` in viewer.js and rendered in the side panel by interactions.js.

### F74: Shape-based role distinction (process vs data)
- **Status**: `implemented`
- **Files**: `schema.json`, `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.3
- Modules and nodes with `role: "data"` render as hexagons. Process modules
  (default) remain round-rectangles. See P2.3 for the channel rule. Decision
  diamonds and interface ports keep their shapes regardless of role.

### F75: Implementation status visual encoding
- **Status**: `implemented`
- **Files**: `schema.json` (status enum on module + node), `src/viewer.js` (buildElements status passthrough, buildStyles status selectors), `skills/visualize-project/_foundations/inference-rules.md` (Status Assignment section), `skills/visualize-project/_foundations/graph-schema.md` (status fields + encoding table), `skills/visualize-project/SKILL.md` (status guidance in Phase 2)
- **Properties**: P2.1 (opacity channel), P2.2 (border channel)
- Five status levels: `planned` (ghost, 20% opacity, dotted border), `draft` (faded, 45% opacity),
  `ai-tested` (default, 85% opacity), `needs-review` (full opacity, orange dashed border),
  `verified` (full opacity, green 3px solid border). Applied to both modules and nodes.
  Skill guidelines include heuristics for inferring status from test coverage, PR history,
  and code existence. Default when omitted is `ai-tested` visual treatment.

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
| 2026-02-15 | F56 | Implemented: description fields on graph, modules, nodes, edges (schema + viewer + tooltips + panels) |
| 2026-02-15 | F57 | Implemented: skill generates descriptions and module interfaces (SKILL.md + inference-rules.md) |
| 2026-02-15 | F25 | Updated status: proposed → implemented (superseded by F49) |
| 2026-02-15 | F58–F72 | Added 15 planned features aligned with ROADMAP.md design principles (workstreams A–E) |
| 2026-02-16 | F73 | Implemented: node detail side panel (left-side non-blocking panel replacing F42 modal) |
| 2026-02-16 | F42 | Updated status: implemented → deprecated (superseded by F73) |
| 2026-02-16 | F74 | Implemented: shape-based role distinction (process=round-rectangle, data=hexagon) |
| 2026-02-16 | F75 | Implemented: status visual encoding (planned/draft/ai-tested/needs-review/verified via opacity+border) |
| 2026-02-16 | F62 | Implemented: confidence/needsHumanReview/checkpointReason schema fields on modules, confidence on edges |
| 2026-02-16 | F69 | Implemented: design-from-objective skill mode (Input B) with Phase 1B, design-mode defaults, worked example |
| 2026-02-16 | F76 | Implemented: design-mode CLAUDE.md scaffolding suggestion (SKILL.md Step 3.5b) |
| 2026-02-16 | F77 | Implemented: executable scaffolding via --scaffold flag (SKILL.md Step 3.5b expanded) |
| 2026-02-16 | F58 | Implemented: enhanced port styling (round-rectangle inputs, tag outputs, italic font) |
| 2026-02-16 | F59 | Implemented: port positioning after collapse via positionPorts() |
| 2026-02-16 | F60 | Implemented: zoom cap at 1.2x for collapsed view |
| 2026-02-16 | F61 | Implemented: I/O subtitle on collapsed modules without port nodes |
| 2026-02-16 | F63 | Implemented: amber badge + dashed border for needsHumanReview modules |
| 2026-02-16 | F64 | Implemented: confidence view mode with color encoding and legend |
| 2026-02-16 | F78 | Implemented: `refactor` action (Phase 1C in SKILL.md — scan + redesign + plan overlay) |
| 2026-02-16 | F79 | Proposed: `plan` action (detect SPEC.md changes, propose new folders, plan overlay) |
| 2026-02-17 | F30 | Deprecated: superseded by F75 (top-level `status` field) |
| 2026-02-17 | F67 | Updated: noted design-mode confidence is implemented, scan-mode still planned |
