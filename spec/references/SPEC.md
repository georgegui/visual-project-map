# References — Specification

## Curation Rules

### Every Suggestion Categorized
- Each suggestion from external sources must be assigned a topic category (e.g., layout, interaction, data model, performance)
- Categories match the sections used in `features.md` where possible

### Every Rejection Has Rationale
- Rejected suggestions must include a brief rationale explaining why
- Valid rejection reasons: conflicts with graph properties, duplicates an existing feature, out of scope, insufficient benefit for complexity cost
- Rationale must reference specific constraints (e.g., "violates GP3: one edge per folder pair")

### File Conventions
- `gpt-pro-suggestions.md` — organized by topic, each suggestion with source attribution
- `rejected-suggestions.md` — each entry has the suggestion text, rejection rationale, and date
