# Foundations — Specification

## Acceptance Criteria
- [ ] `color-palette.md` defines colors for all 12 module slots plus 4 phase colors
- [ ] `inference-rules.md` covers all lookup dimensions: module design, node shapes, edge styles, actors, status, confidence, roles
- [ ] `graph-schema.md` documents every field in `schema.json` with type, required/optional, and allowed values
- [ ] All three reference files are consistent with each other (no contradictory rules)
- [ ] All reference files are consistent with `schema.json` (field names, allowed values match)

## Edge Cases
- New field added to `schema.json` but not documented in `graph-schema.md` (must be caught during review)
- Inference rule references a color not in `color-palette.md`
- Module count exceeds 12 (color-palette.md should specify wrap-around or extension behavior)

## Validation Checks
- Grep `schema.json` for all field names — each appears in `graph-schema.md`
- Color hex values in `color-palette.md` are valid 6-digit hex codes
- All 11 module design principles in `inference-rules.md` are numbered and cross-referenced
