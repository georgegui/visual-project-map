# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A standalone browser-based graph viewer for directed acyclic graphs with collapsible module groups, distributed as a Claude Code plugin. Built on Cytoscape.js + dagre layout with no build step — just vanilla JS loaded via CDN script tags.

## Running

```bash
# Serve the viewer locally
python3 scripts/serve.py
# Or manually:
python3 -m http.server 8080 --directory viewer
```

Load a specific graph: `viewer/index.html?graph=../examples/minimal.json`

Default graph is `examples/minimal.json`.

## Plugin Structure

```
visual-project-map/
├── plugin.json              # Claude Code plugin manifest
├── skills/visualize-project/ # Skill for auto-generating graphs
├── viewer/                  # Static viewer application
├── examples/                # Sample graph JSON files
├── spec/                    # Feature catalog + constraints
└── schema.json              # Input JSON Schema
```

Install as Claude Code plugin: `claude install <username>/visual-project-map`
Then use: `/visualize-project` to auto-generate a graph from any project.

## Architecture

No build system, no npm, no bundler. Three global JS modules loaded as `<script>` tags in order:

1. **`viewer/src/expand-collapse.js`** — `CollapseManager` class. Handles collapse/expand by removing children with `cy.remove()` and restoring with `cy.add()`. Creates deduplicated meta-edges for cross-module connections when modules are collapsed.
2. **`viewer/src/viewer.js`** — `GraphViewer` IIFE module. Loads JSON, converts to Cytoscape elements/styles, initializes the graph in collapsed state, runs dagre layout.
3. **`viewer/src/interactions.js`** — `Interactions` IIFE module. Click-to-toggle on modules, hover highlighting/tooltips, keyboard shortcuts, toolbar buttons.

**Load order matters**: `expand-collapse.js` must load before `viewer.js` (which instantiates `CollapseManager`), and both before `interactions.js` (which calls `GraphViewer` and uses the manager).

## Key Design Decisions

- **No expand-collapse extension** — the custom `CollapseManager` does collapse via `cy.remove()`/`cy.add()` rather than using cytoscape-expand-collapse. Meta-edges are rebuilt from the stored `originalEdges` array on every toggle.
- **Nested modules (2-level)** — Modules can have a `parent` field pointing to a phase module. Phases group related modules. Collapse/expand works at both levels.
- **Modules start collapsed** — `init()` calls `collapseAll()` then runs layout.
- **Edge labels hidden by default** — Labels appear on hover (tooltip), during path tracing, or via the Labels toggle (`L` key).
- **Trust levels** drive node border styling (solid/dashed/thick) from the `legend.trustLevels` object in the input JSON.
- **Actor annotations** on edges — optional `actor` field (`human`/`ai`/`script`/`mixed`) colors edge lines.
- **Edge detail panel** — edges with `details` show a modal panel on click with script path, inputs, outputs, and docs.
- **Dagre layout fallback** — Uses `longest-path` ranker by default, falls back to `network-simplex` if dagre errors.

## Spec Documents

Feature requirements and graph output constraints live in `spec/`:

- **`spec/graph-properties.md`** — Invariant properties every rendered graph must satisfy.
- **`spec/features.md`** — Feature catalog with status tracking.

### Adding a New Feature

1. **Read** `spec/graph-properties.md` and `spec/features.md`.
2. **Check for contradictions** — does the new feature violate any property?
3. **Check for duplicates** — is the feature already in the catalog?
4. **Add to catalog** — append new entry in `spec/features.md`.
5. **Update status** as work progresses: `proposed` → `planned` → `implemented`.

## Input JSON Schema

Validated by `schema.json`. Four required top-level fields: `title`, `modules`, `nodes`, `edges`. Optional `legend` with `trustLevels`.

- Modules may have an optional `parent` field pointing to another module (creating a phase grouping)
- Every node must reference a valid `module` ID as its parent
- Node `style.trust` keys must match keys in `legend.trustLevels`
- Edge `style` is `"solid"` or `"dashed"`
- Edge `actor` (optional) is `"human"`, `"ai"`, `"script"`, or `"mixed"`
- Edge `details` (optional) is an object with `script`, `input`, `output`, `updates`, `docs`
- Node `style.shape` options: `round-rectangle`, `diamond`, `ellipse`, `rectangle`, `hexagon`
