# Design: Shape-Based Process vs Data Distinction

**Date:** 2026-02-16
**Status:** Approved

## Problem

When viewing a graph, there is no visual distinction between modules/nodes that represent **processes** (things that do work) and **data artifacts** (things that pass between processes). Both use the same round-rectangle shape and similar colors. The audience cannot immediately tell what are the key components vs what are inputs and outputs.

## Solution

Use **shape** as the primary visual signal. Add a `role` field to the schema. Elements with `role: "data"` render as hexagons; elements with `role: "process"` (or omitted) keep the default round-rectangle.

## Visual Rules

| Level | Process (default) | Data (`role: "data"`) |
|---|---|---|
| Collapsed module | Round-rectangle, module color, solid border | Hexagon, module color, solid border |
| Expanded module (compound parent) | Round-rectangle container, solid border | Round-rectangle container, dotted border |
| Child node | Round-rectangle / ellipse / diamond (per `style.shape`) | Hexagon |

Interface ports and decision diamonds keep their existing shapes regardless of module role.

## Schema Change

Add to both module and node properties in `schema.json`:

```json
"role": {
  "type": "string",
  "enum": ["process", "data"],
  "description": "Visual role: process (does work, round-rectangle) or data (artifact, hexagon)"
}
```

## Example Graph Updates

4 modules get `"role": "data"`: `mod_inventory`, `mod_blueprint`, `mod_json`, `mod_rendered`.
Their child nodes also get `"role": "data"`.

## Files Changed

| File | Change |
|---|---|
| `schema.json` | Add `role` to module and node properties |
| `viewer.js` | Pass `role` through in `buildElements()`, add hexagon style for `[role="data"]` |
| `expand-collapse.js` | Pass `role` through when creating collapsed module nodes |
| `interactions.js` | No changes needed |
| `examples/visual-project-map.json` | Add `"role": "data"` to 4 modules + their child nodes |
| `spec/features.md` | Add F74 |
