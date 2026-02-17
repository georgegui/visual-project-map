# Spec — Specification

## Acceptance Criteria
- [ ] Feature IDs in `features.md` are sequential with no gaps or duplicates
- [ ] Every feature has a status (`proposed`, `planned`, or `implemented`)
- [ ] Every implemented feature references at least one file in its `Files` field
- [ ] `graph-properties.md` properties are numbered (P1–P8) with no gaps
- [ ] New features are checked against `graph-properties.md` for contradictions before adding
- [ ] Changelog at bottom of `features.md` records every status change with date

## Edge Cases
- Feature that contradicts an existing graph property (must be flagged and resolved)
- Feature that duplicates an existing feature (must be detected and merged or rejected)
- Property that needs updating due to a new feature (both files must be updated atomically)

## Validation Checks
- All feature IDs in `features.md` are unique and sequential
- Every `implemented` feature has a non-empty `Files` field
- Every property in `graph-properties.md` is referenced by at least one feature
