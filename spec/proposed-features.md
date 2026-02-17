# Planned Features

Feature proposals organized by workstream, derived from the 7 design principles
in `ROADMAP.md`. The objective: **an interface map for human-AI collaboration**
with concrete input/output specifications and confidence/checkpoint flags.

See `features.md` for the feature catalog (F58-F72 track these items).
See `graph-properties.md` for the rendering constraints each feature must satisfy.

---

## Priority Phases

| Phase | Workstreams | Focus |
|-------|-------------|-------|
| 1 | A1-A4 | Interface rendering — immediate visual impact |
| 2 | B1, C1-C2 | Schema + skill foundation for confidence/interfaces |
| 3 | B2-B4, E1, E3 | Viewer features using new schema fields |
| 4 | C3-C5, D1-D3 | Skill enhancements (confidence, critical path, design mode) |
| 5 | E2, Workstream F | Polish and lower-priority features |

---

## Workstream A: Interface-First Rendering

*Principles 1, 2, 5 — Interfaces are the primary content; the default view is
the interface map; progressive disclosure follows the interface hierarchy.*

### A1: Enlarge interface port styling (F58)

- **Priority**: Phase 1
- **Status**: `planned`
- **Properties**: P2.10

Interface port nodes are currently 130x24 with 10px font — barely readable at
default zoom. Enlarge to ~180x34 with 11px font. Blue fill for inputs, green
for outputs. Port nodes must be visually distinct from regular child nodes.

### A2: Interface port positioning adjacent to modules (F59)

- **Priority**: Phase 1
- **Status**: `planned`
- **Properties**: P3.4

Position input ports above collapsed modules and output ports below, so they
remain visible in the collapsed (interface map) view. Recompute positions after
layout and after expand/collapse toggle. Ports should not overlap the module box.

### A3: Default zoom cap for collapsed view (F60)

- **Priority**: Phase 1
- **Status**: `planned`

The viewer's `fit()` on initial load zooms too aggressively on small graphs,
making text oversized. Cap the post-fit zoom at ~1.2x so that all modules plus
their interface ports are visible at a readable but not overwhelming scale.

### A4: Collapsed module I/O subtitle (F61)

- **Priority**: Phase 1
- **Status**: `planned`

When a module is collapsed and has no interface port nodes, show a compact I/O
summary as a subtitle on the collapsed module box. Format: top line = module
label, second line = abbreviated inputs/outputs from `module.interface`. This
is a fallback for graphs that have `interface` metadata but no port nodes.

---

## Workstream B: Confidence & Checkpoint Flags

*Viewer Behavior — Confidence and review flags are visually encoded (see SPEC.md).*

### B1: Module/edge confidence schema fields (F62)

- **Priority**: Phase 2
- **Status**: `planned`
- **Properties**: P2.11

Add schema fields:
- `module.confidence`: `"high"` | `"medium"` | `"low"` | `"unknown"` (optional)
- `module.needsHumanReview`: boolean (optional, default false)
- `module.checkpointReason`: string (optional, explains why review is needed)
- `edge.confidence`: `"high"` | `"medium"` | `"low"` | `"unknown"` (optional)
- `graph.criticalPath`: array of node IDs tracing the critical path (optional)

These fields extend the data model without breaking backward compatibility.
Graphs without these fields render exactly as before.

### B2: Confidence rendering on collapsed modules (F63)

- **Priority**: Phase 3
- **Status**: `planned`
- **Properties**: P2.11, P2.12

Render confidence on collapsed module boxes via the Confidence view mode:
- **Color encoding**: green = high, yellow = medium, red = low, gray = unknown
- **Amber badge**: modules with `needsHumanReview: true` show a small amber
  indicator (e.g., an exclamation mark badge) on the collapsed module box

Confidence uses the view-mode color channel, not borders. Border treatment
is reserved for implementation status (P2.2).

### B3: Confidence view mode (F64)

- **Priority**: Phase 3
- **Status**: `planned`

Add a Confidence view mode to the V-key cycle (alongside Module, Provenance,
Actor, Files, Plan, Diff). In this mode:
- Modules and edges are colored by confidence level (green=high, yellow=medium,
  red=low, gray=unknown)
- Legend updates to show confidence color mapping
- Collapsed modules show confidence as the primary visual encoding

### B4: Critical path toggle and highlighting (F65)

- **Priority**: Phase 3
- **Status**: `planned`
- **Properties**: P2.13, P7.4

Add a `P` keyboard shortcut to toggle critical path highlighting. When active:
- Nodes and edges on the `graph.criticalPath` array are highlighted
- Non-critical elements are dimmed (same treatment as path tracing, P7.2)
- A status bar indicator shows "Critical path" when active

The critical path is pre-computed and stored in the graph JSON (by the skill
or by hand), not computed at render time. This is non-destructive highlighting
(P7.4) — toggling off restores the original view.

---

## Workstream C: Skill Generates Interfaces & Confidence

*Principles 6, 7 — The generation skill must produce interpretable interfaces
by default; critical path identification should be automatic.*

### C1: Skill always generates interface port nodes (F66)

- **Priority**: Phase 2
- **Status**: `planned`

Update `SKILL.md` to always generate interface port nodes from
`module.interface` fields. Currently, the skill populates `interface.inputs`
and `interface.outputs` metadata but does not always create corresponding
`_isInterfacePort` nodes. The port nodes are what the viewer renders — without
them, interfaces are invisible.

### C2: Skill always generates interfaces (F66)

- **Priority**: Phase 2
- **Status**: `planned`

Change the skill's current guidance ("Only include interfaces you have evidence
for") to always generate interfaces. For Input A (existing projects), the AI
should infer interfaces from file I/O patterns, function signatures, and data
flow. For Input B (design from objective), the AI always has evidence because
it is proposing the workflow. No module should be generated without at least
one named input and one named output.

### C3: Skill generates confidence annotations (F67)

- **Priority**: Phase 4
- **Status**: `planned`

The skill should assess and record confidence per module and per edge:
- **High**: the AI found clear evidence (scripts, tests, documentation)
- **Medium**: the AI inferred the connection from partial evidence
- **Low**: the AI is guessing based on conventions or domain knowledge

For Input B (design mode), all modules start at medium or low by default.

### C4: Skill computes and records critical path (F68)

- **Priority**: Phase 4
- **Status**: `planned`

Given the user's declared objective, the skill should trace which modules and
edges are upstream of the final output and record this as `graph.criticalPath`
(an array of node IDs). Errors at critical-path interfaces propagate to the
result the user cares about.

### C5: Update foundation docs (graph-schema.md, inference-rules.md)

- **Priority**: Phase 4
- **Status**: `planned`

Update the skill's foundation documents to reflect the new schema fields
(confidence, needsHumanReview, checkpointReason, criticalPath) and the new
generation requirements (always generate interfaces, always assess confidence).

---

## Workstream D: Design-from-Objective Mode

*ROADMAP Input B — The user describes what they want to achieve and the AI
designs a workflow from scratch.*

### D1: Add `--objective` argument to skill (F69)

- **Priority**: Phase 4
- **Status**: `planned`

Add `--objective "text"` argument to the visualize-project skill. When
provided, the skill skips Phase 1 (project scanning) and instead designs a
workflow from domain knowledge:
- Modules derived from the objective's implicit stages
- Interfaces inferred from domain conventions
- Edges representing the expected data flow

### D2: Design mode defaults

- **Priority**: Phase 4
- **Status**: `planned`

When using `--objective`:
- Default `confidence` to `"medium"` for well-understood stages, `"low"` for
  domain-specific or novel stages
- Default `needsHumanReview` to `true` on domain-specific modules where the
  AI cannot verify correctness from structure alone
- Generate `checkpointReason` explaining why each flagged module needs review

### D3: Edge cases for design mode

- **Priority**: Phase 4
- **Status**: `planned`

Handle:
- Vague objectives ("make a good project") — ask for clarification or generate
  a high-level skeleton with low confidence
- Large scope — break into phases with a top-level overview graph
- Domain-specific constraints — respect stated constraints in the objective text

---

## Workstream E: Remaining High-Value Features

*Carried forward from previous proposed features that remain relevant.*

### E1: Export as image PNG/SVG (F70)

- **Priority**: Phase 3
- **Status**: `planned`

Cytoscape.js has built-in `cy.png()` and `cy.jpg()` methods. Add a toolbar
button (and keyboard shortcut) to export the current view as a PNG or SVG.
This is the single biggest reach multiplier — users can paste the graph into
PRs, wikis, Slack, and design docs.

### E2: Animated flow simulation (F71)

- **Priority**: Phase 5
- **Status**: `planned`

A "play" button that walks a token through the DAG from entry to exit,
following edge direction in topological order. Play/pause/step controls.
Makes the sequencing of phases viscerally obvious instead of requiring the
user to mentally trace arrows.

### E3: Circular parent guard in collapse logic (F72)

- **Priority**: Phase 3
- **Status**: `planned`

A malformed JSON with circular module parents can hang the browser. Add a
max-depth guard in `expand-collapse.js`'s `_depth()` function. Runtime
validation (F49) already checks for circular parents in the JSON, but the
collapse logic itself should be defensive against unvalidated input.

---

## Workstream F: Future (Lower Priority)

These are worth doing eventually but are not on the critical path for the
ROADMAP objective.

- **Shareable URL with view state** — Encode expand/collapse state, view mode,
  and zoom position into the URL fragment. "Look at this" becomes a link, not
  a screenshot.

- **Embed mode** — Minimal, chrome-free rendering for iframing into READMEs,
  wikis, or dashboards. Activated via `?embed=true`.

- **Filter by module** — Toggle individual modules visible/hidden. Useful for
  focusing on a subset of the workflow.

- **Orphan detection warning** — On load, identify disconnected nodes and show
  a warning. Complements runtime validation (F49).

- **Human checkpoint report** — A structured summary output format listing
  which interfaces the AI recommends for human review, with reasons and
  suggested inspection criteria. Currently this information is encoded in the
  graph JSON; a standalone report would be a separate output artifact.
