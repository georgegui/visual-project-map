# Graph Output Properties

Properties that every rendered graph must satisfy. These are constraints on
the visual output, not on the implementation. New features must not violate
these properties.

## P1. Structural Properties

**P1.1 Directed edges.** Every edge has a source and a target. Arrowheads
point from source to target.

**P1.2 Module hierarchy.** The graph supports up to two levels of module
nesting: phases (top-level groupings) contain modules, which contain child
nodes. Phases are optional — a flat graph with only modules and child nodes
is valid. Every child belongs to exactly one module. Every module optionally
belongs to one phase. Deeper nesting (3+ levels) is not supported.

**P1.3 Complete module assignment.** Every non-module node must have a parent
module. Orphan nodes (no module) are not permitted.

**P1.4 Edges connect child nodes.** Edges are defined between child nodes,
never between modules directly. Module-level connections are derived
artifacts (meta-edges) computed during collapse.

## P2. Visual Encoding Properties

**P2.1 Module identity via color.** Each module has a unique (background,
border) color pair. All children of that module inherit the module's colors
unless explicitly overridden.

**P2.2 Trust/provenance via border treatment.** Node border style and width
encode the provenance of the data or action the node represents:
- Solid thin border = normal or automated
- Dashed border = AI/LLM-generated
- Solid thick border = human-verified

The specific trust levels and their visual mappings are defined in the input
JSON's `legend.trustLevels` and can vary per graph. But the principle holds:
border treatment is reserved for provenance encoding. Do not overload border
style for other semantics.

**P2.3 Semantic role via node shape.**
- `round-rectangle` (default) = state or data point
- `diamond` = decision gate or branch point
- `ellipse` = process or action
- Other shapes (`rectangle`, `hexagon`) available for extension

Shape encodes the role of the node in the workflow, not its trust level or
module membership. Do not overload shape for other semantics.

**P2.4 Flow type via edge style.**
- Solid = primary/forward flow (the main path)
- Dashed = feedback loop, retry, optional path, or exceptional flow

Edge style encodes flow directionality (forward vs. backward/optional).
Do not overload edge style for other semantics.

**P2.5 Terminal state via color override.** Terminal or sink nodes (INCLUDED,
EXCLUDED, FAILED, COMPLETE) use color overrides distinct from their parent
module to signal finality. Green for success, red for failure/exclusion.

**P2.6 Labels.** Every node has a visible label. Edge labels are hidden by
default to reduce visual clutter and revealed on demand: via a toggle button
(`L` key), on path-traced edges, or on hover (tooltip). When visible, edge
labels describe the transition or action.

**P2.7 Actor identity via edge color.** Edge line color encodes who performs
the transition between states:
- Gray (`#94a3b8`) = script (deterministic automation, default)
- Indigo (`#6366f1`) = human action
- Amber (`#f59e0b`) = AI/LLM step
- Violet (`#8b5cf6`) = mixed (human + AI collaboration)

Edge color is reserved for actor encoding. Do not overload edge color for
other semantics. The `actor` field is optional — edges without it render in
the default gray.

## P3. Layout Properties

**P3.1 Top-to-bottom flow.** The primary reading direction is top to bottom.
Sources (entry points) appear near the top; sinks (terminals) near the
bottom. This uses dagre with `rankDir: 'TB'`.

**P3.2 Module grouping.** When expanded, a module's children are visually
contained within the module's bounding box with the module's background color.

**P3.3 No overlapping labels.** Edge labels have opaque backgrounds to prevent
overlap with edges or nodes beneath them. Node labels are centered within
their shapes.

## P4. Information Density Properties

**P4.1 Collapsed by default.** On initial load, all modules are collapsed.
The user sees a high-level overview of module-to-module flow before drilling
into detail. (Overview first, detail on demand.)

**P4.2 Meta-edge deduplication.** When a module is collapsed, all edges
connecting its children to outside nodes are replaced by meta-edges between
modules. Multiple real edges between the same pair of modules merge into a
single meta-edge with a combined label:
- 0-2 labels: joined with " / "
- 3+ labels: first label + " +N"

**P4.3 Progressive disclosure.** Expanding a module reveals its children and
replaces meta-edges with real edges. Collapsing reverses this. The user
controls the level of detail.

## P5. Readability Properties

**P5.1 Legend.** A legend strip below the toolbar shows:
- Trust level definitions (with visual tags matching border treatment)
- Actor line color samples (if any edge has an `actor` field)
- Module color swatches with labels

**P5.2 Status feedback.** A status indicator shows the current expand/collapse
state (e.g., "9 modules collapsed", "3 expanded, 6 collapsed").

**P5.3 Zoom indicator.** Current zoom level is displayed as a percentage.

## P6. Interaction Properties

**P6.1 Click module to toggle.** Clicking a collapsed module expands it;
clicking an expanded module's background collapses it. This is the primary
drill-down mechanism.

**P6.2 Hover/click edge for details.** Hovering over an edge shows its label
(and script name if available) in a floating tooltip near the cursor. Clicking
an edge with a `details` object opens a modal detail panel showing script path,
inputs, outputs, updated files, and documentation links. The panel dismisses on
background click or Escape.

**P6.3 Hover node for neighborhood highlight.** Hovering over a child node
highlights its immediate neighborhood (connected nodes + edges) and dims
everything else.

**P6.4 Keyboard shortcuts.** Global keyboard shortcuts exist for frequent
actions (fit, expand all, collapse all). They are disabled when focus is in
a text input.

**P6.5 Pan and zoom.** Scroll to zoom, drag to pan. Zoom is bounded
(min 15%, max 400%).

**P6.6 Fit to viewport.** A fit action (button + keyboard) resets the view
to show the entire graph with padding.

## P7. Filtering and Focus Properties

**P7.1 Non-destructive filtering.** Filtering by attribute (trust level,
module, status) must not remove nodes from the graph data structure. Filtered
nodes are dimmed or hidden but remain in the graph and can be restored. All
filtering is reversible.

**P7.2 Path tracing preserves structure.** Path tracing (highlighting
upstream/downstream of a selected node) highlights a connected subgraph
without altering the underlying graph structure. Non-path elements are dimmed,
not removed.

**P7.3 Search highlights and pans.** Searching for a node by label highlights
a single matching node and pans the viewport to center it. The search does not
modify the graph.
