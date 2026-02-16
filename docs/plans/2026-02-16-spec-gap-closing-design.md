# Design: Close the SPEC.md Gap

**Date**: 2026-02-16
**Status**: Approved
**Scope**: Features F58, F59, F60, F61, F63, F64

## Problem

The viewer's collapsed view currently treats interface ports as regular child nodes — they disappear when a module collapses. SPEC.md Principles 1, 2, and 4 require that collapsed modules show their interface ports, confidence indicators, and human-review flags without expanding anything. The data layer already supports these fields (`interface`, `confidence`, `needsHumanReview`); the visual encoding needs to catch up.

## Design

### F58: Interface Port Rendering (viewer.js)

Add distinct visual styling for nodes with `_isInterfacePort: true`:

- **Input ports**: left-facing pentagon shape, positioned at module top
- **Output ports**: right-facing pentagon shape, positioned at module bottom
- Port label font smaller (10px) and italic
- Port background inherits module color at 80% opacity

Implementation: Add Cytoscape style selectors `node[_isInterfacePort][_portDirection="input"]` and `node[_isInterfacePort][_portDirection="output"]` in `buildStyles()`.

### F59: Port Survival on Collapse (expand-collapse.js)

**Approach: Port Exclusion** — Modify `CollapseManager.collapse()` to skip `_isInterfacePort` nodes when removing module descendants.

Key changes:
1. `collapse(moduleId)`: Filter descendants to exclude port nodes before `cy.remove()`
2. New `positionPorts(moduleId)`: After collapse, reposition surviving ports — inputs above, outputs below the collapsed module box
3. `expand(moduleId)`: Release port position constraints so dagre reclaims them
4. `_rebuildEdges()`: No change needed — ports remain in the graph, so edges to/from ports stay intact naturally

### F60: Port-to-Port Meta-edges (expand-collapse.js)

When both source and target modules are collapsed, edges between their ports remain visible (ports survive collapse per F59). No meta-edge rewriting needed for port-connected edges. Non-port cross-module edges still get the existing meta-edge treatment.

### F61: Module Interface in Detail Panel (interactions.js + index.html)

When clicking a collapsed module, show its interface contract in the detail panel:

- **Inputs** section listing each input name, description, format
- **Outputs** section listing each output name, description, format
- Source: `module.interface.inputs[]` and `module.interface.outputs[]` from the graph JSON

Add CSS for the interface section in the detail panel.

### F63: Human-Review Badge (viewer.js + index.html)

Modules with `needsHumanReview: true` get a visual indicator visible in collapsed state:

- Append " ⚠" to the collapsed module label text
- Add CSS class `needs-review` with amber left-border accent (4px solid #f59e0b)
- Visible at all zoom levels without expanding

### F64: Confidence View Mode (interactions.js + viewer.js)

Add `'confidence'` to the V-key view cycle array. When active:

- Module background colors mapped from `module.confidence`:
  - `high` → green (#d1fae5)
  - `medium` → yellow (#fef3c7)
  - `low` → red (#fee2e2)
  - `unknown`/missing → gray (#f3f4f6)
- Non-module elements dimmed to 40% opacity
- Legend updates to show confidence color mapping

## Implementation Order

F58 → F61 → F63 → F59 → F60 → F64

Rationale: F58 establishes port styling before F59 makes them survive collapse. F61 and F63 are independent viewer additions. F60 depends on F59. F64 is self-contained.

## Files Changed

| File | Features | Estimated Lines |
|------|----------|----------------|
| `viewer/src/viewer.js` | F58, F63, F64 | ~50 |
| `viewer/src/expand-collapse.js` | F59, F60 | ~40 |
| `viewer/src/interactions.js` | F61, F64 | ~30 |
| `viewer/index.html` | F61, F63 | ~20 |
| `spec/features.md` | All | Status updates |

## Verification

Each feature is testable by loading the project's own graph (`.graphs/visual-project-map.json`) which already has interface ports and can be extended with confidence/review fields.
