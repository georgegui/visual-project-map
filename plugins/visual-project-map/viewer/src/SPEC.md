# Viewer Source — Specification

## Acceptance Criteria
- [ ] All 6 JS files load without errors in strict order (expand-collapse → viewer → diff → plan-overlay → minimap → interactions)
- [ ] Each IIFE/class exposes exactly one global name matching its file purpose
- [ ] No file depends on a file loaded after it (no forward references)
- [ ] All color values come from input JSON or actor defaults — no hardcoded palette in source
- [ ] `CollapseManager` correctly removes/restores child nodes and rebuilds meta-edges on every toggle
- [ ] `GraphViewer` validates input JSON before rendering (duplicate IDs, dangling refs, circular parents)
- [ ] `Interactions` binds all keyboard shortcuts documented in CLAUDE.md without conflicts

## Edge Cases
- Graph JSON with missing optional fields (no legend, no descriptions, no interface)
- Browser with JavaScript disabled (graceful fallback or error message)
- Very large graph (>80 nodes) — layout performance must remain interactive
- Multiple rapid expand/collapse clicks — no orphaned nodes or duplicated edges

## Validation Checks
- Open browser console: zero errors on load with any valid example JSON
- Each global (`CollapseManager`, `GraphViewer`, `GraphDiff`, `PlanOverlay`, `Minimap`, `Interactions`) is defined and callable
- Load order violation (swap two scripts) produces a clear error, not silent failure
