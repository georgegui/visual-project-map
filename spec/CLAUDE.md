# Spec

Feature catalog and graph output constraints for the visual-project-map viewer.

## Executor
Mixed — features proposed by AI and humans; properties verified by human review.

## Status
tested.ai

## Inputs
- **feature proposals**: New feature descriptions with rationale (free text)
- **property violations**: Reports of features conflicting with graph properties (free text)

## Outputs
- **features.md**: Feature catalog with status tracking (Markdown table)
- **graph-properties.md**: Invariant properties every rendered graph must satisfy (Markdown)

## Key Rules
- Every new feature must be checked against `graph-properties.md` for contradictions
- Every new feature must be checked against `features.md` for duplicates
- Status progression: `proposed` → `planned` → `implemented`
- Feature IDs are sequential: F01, F02, ... F77, ...
