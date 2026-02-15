# Proposed Features

Feature proposals organized by which aspect of the project goal they serve:
**Let anyone instantly see how a software project works.**

---

## "Instantly" — Reduce Time to Understanding

### PF-1: Runtime input validation (extends F25)

- **Priority**: High
- **Status**: `implemented` (F49)
- **Depends on**: F24 (schema)

Bad JSON silently breaks the graph. Users waste time debugging blank screens
instead of reading their project. Validate JSON against `schema.json` on load
and show actionable error messages in the UI.

### PF-2: Auto-refresh / watch mode

- **Priority**: High
- **Status**: `implemented` (F50)
- **Depends on**: F01

After regenerating a graph, the user must manually reload the browser. The
viewer should detect file changes and hot-reload, or the serve script should
trigger a re-serve automatically. Change code, see updated graph — no manual
step in between.

### PF-3: Minimap

- **Priority**: Medium
- **Status**: `implemented` (F51)
- **Depends on**: F18 (pan/zoom)

On large graphs users lose spatial context while zoomed in. A small overview
inset in the corner showing the full graph with a viewport rectangle eliminates
disorientation and enables click-to-navigate.

### PF-4: Breadcrumb navigation

- **Priority**: Medium
- **Status**: `implemented` (F52)
- **Depends on**: F35 (nested hierarchy), F14 (click-to-toggle)

When drilling into nested phases and modules, show a clickable trail
(`Graph > Phase: Input > mod_discovery`) so users always know where they
are in the hierarchy and can jump back to any level with one click.

---

## "Anyone" — Accessibility and Shareability

### PF-5: Export as image (SVG/PNG)

- **Priority**: High
- **Status**: `proposed`

The graph only lives in the browser session. Users cannot paste it into a PR
description, wiki, Slack message, or design doc. A toolbar button to export
the current view as SVG or PNG is probably the single biggest reach multiplier.

### PF-6: Shareable URL with view state

- **Priority**: Medium
- **Status**: `proposed`
- **Depends on**: F03 (URL params), F10 (collapse/expand)

Encode the current expand/collapse state, view mode, and zoom position into
the URL fragment so a link recreates exactly what the user is seeing. "Look at
this" becomes a link, not a screenshot.

### PF-7: Embed mode

- **Priority**: Low
- **Status**: `proposed`

A minimal, chrome-free rendering suitable for iframing into READMEs, wikis,
or internal dashboards. Strips toolbar, legend, and status bar for compact
display. Activated via `?embed=true` URL parameter.

---

## "See How a Project Works" — Deeper Understanding

### PF-8: Filter by module (extends F29)

- **Priority**: Medium
- **Status**: `proposed`
- **Depends on**: F29

Large projects have phases the user does not care about. Toggling modules on/off
lets users focus on the slice that matters without altering the underlying graph.

### PF-9: Animated flow simulation

- **Priority**: High
- **Status**: `proposed`
- **Depends on**: F01, F07

A "play" button that walks a token through the DAG from entry to exit, step by
step, following edge direction. Makes the sequencing of phases viscerally obvious
instead of requiring the user to mentally trace arrows. Pause/step controls for
pacing.

### PF-10: Natural language summary per module

- **Priority**: Medium
- **Status**: `proposed`
- **Depends on**: F39 (visualize-project skill)

When a user expands a module, show a one-sentence auto-generated description of
what it does ("Downloads raw data from the API and validates JSON structure").
The skill already analyzes docs — surface that analysis as a `description` field
on each module, rendered as a subtitle in the viewer.

### PF-11: Graph diff

- **Priority**: Medium
- **Status**: `proposed`

Compare two versions of the same project graph side-by-side or as an overlay
(nodes added, removed, or moved). Answers "what changed since last sprint?" —
the temporal version of "how does it work?"

### PF-12: Incremental regeneration

- **Priority**: Low
- **Status**: `proposed`
- **Depends on**: F39 (visualize-project skill)

Re-running `/visualize-project` rebuilds from scratch. It should detect what
changed in the codebase and update only affected modules/nodes/edges, preserving
any manual refinements the user made to the graph JSON.

---

## Robustness — Keep the "See" Accurate

### PF-13: Schema sync

- **Priority**: High
- **Status**: `proposed`
- **Depends on**: F24 (schema)

`schema.json` is missing properties the code actively uses (`parent`, `files`,
`interface`, `_isInterfacePort`). Validation rejects valid graphs. Fix the
schema to match reality before runtime validation (PF-1) can be useful.

### PF-14: Circular parent guard

- **Priority**: High
- **Status**: `proposed`
- **Depends on**: F35 (nested hierarchy)

A malformed JSON with circular module parents hangs the browser. Add cycle
detection with a visited set or max-depth limit in the collapse/expand logic.

### PF-15: Orphan detection (extends F33)

- **Priority**: Medium
- **Status**: `proposed`
- **Depends on**: F33

Disconnected nodes suggest missing edges in the generation. Surface this as a
warning on load to help users fix incomplete graphs.

---

## Top 3 (highest impact toward the stated goal)

1. **PF-5: Export as image** — unlocks sharing, which is how "anyone" actually sees it
2. **PF-9: Animated flow simulation** — transforms "see how it works" from static reading to dynamic demonstration
3. **PF-2: Auto-refresh** — makes "instantly" literal; change code, see updated graph
