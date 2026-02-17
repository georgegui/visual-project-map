# Visualize Plan — Specification

## Acceptance Criteria
- [ ] Plan annotations preserve graph structural validity (no broken refs, no duplicate IDs)
- [ ] Every annotation status is one of: `add`, `modify`, `remove`
- [ ] `plan.summary` contains `goal` (string) and `tasks` (array of strings)
- [ ] `plan.annotations` maps element IDs to `{ status, description }` objects
- [ ] Annotated graph loads in the viewer with Plan view mode showing correct glow colors
- [ ] Elements not mentioned in the plan remain unchanged

## Edge Cases
- Plan document references elements not in the graph (should warn, not crash)
- Plan annotates a module AND its child nodes (both should render correctly)
- Empty plan document (should produce graph with empty plan field or no plan field)
- Plan with only `remove` annotations (viewer should show red glow on marked elements)

## Validation Checks
- Load annotated graph in viewer, switch to Plan view — green/amber/red glow appears on correct elements
- Annotated graph still passes `schema.json` validation
- Round-trip: annotate, then re-run visualize-project — plan field is preserved (incremental mode)
