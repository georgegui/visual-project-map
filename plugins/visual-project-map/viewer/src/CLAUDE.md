# Viewer Source

Vanilla JS modules implementing the graph viewer. No bundler — each file is a `<script>` tag.

## Executor
AI — all source modules are AI-written.

## Status
tested.ai

## Load Order (critical)

Scripts must load in this exact order in `index.html`:

1. **`expand-collapse.js`** — `CollapseManager` class (collapse/expand via `cy.remove()`/`cy.add()`, meta-edge rebuilding)
2. **`plan-overlay.js`** — `PlanOverlay` IIFE (plan annotation glow/badges)
3. **`diff.js`** — `GraphDiff` IIFE (structural diff between two graph JSON versions)
4. **`viewer.js`** — `GraphViewer` IIFE (JSON loading, Cytoscape element/style building, dagre layout, validation)
5. **`minimap.js`** — `Minimap` IIFE (canvas overview with viewport rectangle)
6. **`flow-animation.js`** — `FlowAnimation` IIFE (topological flow walkthrough with play/pause/step)
7. **`interactions.js`** — `Interactions` IIFE (click/hover handlers, keyboard shortcuts, toolbar, panels)

`expand-collapse.js` must load before `viewer.js` (which instantiates `CollapseManager`); `plan-overlay.js` and `diff.js` before `viewer.js` (which references them in `setView()`); all modules before `interactions.js` (which wires them together).

## Inputs
- **graph JSON URL**: Fetched via `?graph=` URL parameter (relative to `index.html`)
- **compare JSON URL**: Optional `?compare=` for diff mode

## Outputs
- **Cytoscape.js graph instance**: Rendered in `#cy` container with all interactions bound

## Conventions
- All modules use IIFE pattern except `CollapseManager` (class)
- Global namespace: `CollapseManager`, `GraphViewer`, `GraphDiff`, `PlanOverlay`, `Minimap`, `FlowAnimation`, `Interactions`
- Colors come from input JSON (module colors, trust level colors, actor colors) — no hardcoded palette in JS except actor defaults
