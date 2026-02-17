# Skills — Specification

## Acceptance Criteria
- [ ] Each skill subdirectory contains a SKILL.md entry point that Claude Code can execute
- [ ] Each skill produces graph JSON conforming to `schema.json`
- [ ] Skills are independent — no skill imports from or depends on another skill at runtime
- [ ] Both skills (visualize-project, visualize-plan) are registered in the plugin manifest

## Edge Cases
- User invokes a skill that doesn't exist (Claude Code handles this, not the skills directory)
- Both skills invoked on the same graph in sequence (plan overlay after generation)

## Validation Checks
- Each SKILL.md is parseable and contains the required frontmatter fields
- Running each skill on the project itself produces valid output
