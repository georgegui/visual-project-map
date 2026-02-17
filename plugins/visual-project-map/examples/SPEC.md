# Examples — Specification

## Acceptance Criteria
- [ ] Every JSON file in this directory conforms to `schema.json`
- [ ] Every example loads in the viewer without console errors
- [ ] `minimal.json` is the smallest valid graph (minimum required fields only)
- [ ] Each example demonstrates a distinct feature or use case (no redundant examples)
- [ ] File names are descriptive and use lowercase-hyphen convention

## Edge Cases
- Example with plan overlay annotations (minimal-with-plan.json)
- Example with trust levels and provenance encoding
- Example exceeding typical size (stress test for viewer performance)

## Validation Checks
- Load each example via `viewer/?graph=../examples/{name}.json` — all render correctly
- Validate each JSON against `schema.json` programmatically
- Self-referential graph (visual-project-map.json) matches current project structure
