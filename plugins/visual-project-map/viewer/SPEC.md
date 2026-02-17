# Viewer — Specification

## Acceptance Criteria
- [ ] Graph JSON loads and renders without errors for all valid `schema.json`-conformant inputs
- [ ] All modules start collapsed on initial load (overview-first)
- [ ] Click module to expand/collapse toggles correctly at both phase and module levels
- [ ] Meta-edges deduplicate correctly when modules are collapsed (combined labels, actor propagation)
- [ ] Dagre layout produces top-to-bottom flow with no overlapping labels
- [ ] View modes (Module/Provenance/Actor/Files/Plan/Diff) switch cleanly with no residual styling
- [ ] Path tracing highlights full upstream/downstream without altering graph data
- [ ] Runtime validation catches structural errors (duplicate IDs, dangling refs, circular parents) and shows actionable error panel

## Edge Cases
- Graph with no edges (single-node graph)
- Graph with circular parent references (must be caught by validation)
- Graph with >50 nodes (performance and readability)
- Graph with deeply nested phases (max 2 levels enforced)
- Graph with empty modules (no child nodes)
- Meta-edge label overflow (3+ labels use "+N" format)

## Validation Checks
- Load each example JSON from `examples/` — all must render without console errors
- Expand all → collapse all round-trip preserves original view
- View mode cycling (V key) returns to Module view after full rotation
- Search, path trace, and breadcrumb all clear correctly on Escape
