# Visualize Project — Specification

## Acceptance Criteria
- [ ] Output JSON conforms to `schema.json` (valid modules, nodes, edges, no duplicate IDs, no dangling refs)
- [ ] Every node's `module` references a valid module ID
- [ ] Every edge's `source` and `target` reference valid node IDs
- [ ] No module pair has more than 1 cross-module edge (1-edge rule)
- [ ] Modules have `description` and `interface` fields with meaningful content
- [ ] Design mode (Input B) sets all statuses to `planned`, omits `files`/`trust`/`details`
- [ ] Incremental mode preserves manual refinements (labels, colors, descriptions, interfaces, status, role)
- [ ] `--scaffold` creates CLAUDE.md/SPEC.md files without overwriting existing ones

## Edge Cases
- Project with no CLAUDE.md or README (fall back to scripts + Makefile)
- Flat project with no subdirectories (single module, --depth 1)
- Vague objective (ask for clarification or generate skeleton with low confidence)
- Very large scope (>12 modules — suggest --focus or sub-projects)
- Contradictory constraints (flag in checkpointReason, set confidence: low)
- >100 scripts (only visualize documented/entry-point/I/O-connected scripts)
- Existing graph with manual refinements (incremental mode must preserve them)

## Validation Checks
- Load generated JSON in the viewer — renders without errors
- Cross-module edge count equals number of module pairs with connections
- Every module has at least one child node
- Graph has 3-50 nodes (warn outside this range)

## Human Review Required
Module boundary decisions and cross-module edge routing require judgment about what constitutes a coherent abstraction boundary.

### What requires domain expertise
- Whether module groupings reflect meaningful workflow stages
- Whether interface contracts capture the right data artifacts

### What the AI can handle
- JSON schema conformance
- ID uniqueness and reference integrity
- Cross-module edge counting
- Color and style assignment from lookup tables
