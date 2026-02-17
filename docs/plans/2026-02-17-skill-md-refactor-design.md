# SKILL.md Refactor: Split into Progressive Disclosure Files

**Date:** 2026-02-17
**Status:** Approved
**Scope:** `plugins/visual-project-map/skills/visualize-project/`

## Problem

The current `SKILL.md` is 1,804 lines (25,000+ tokens) — 3.6x over Anthropic's recommended 500-line maximum. This causes:

1. **Context bloat**: All 4 workflow modes load into context even when only one is needed
2. **Poor navigability**: Users and developers can't quickly find where specific actions (refactor, plan) are defined
3. **Maintenance burden**: Every change risks breaking unrelated modes

## Decision

**One skill, split files.** Keep `/visualize-project` as a single skill. The SKILL.md becomes a router (~300 lines) that dispatches to workflow-specific reference files. No UX changes — same skill name, same arguments, same output.

## Proposed File Structure

```
visualize-project/
├── SKILL.md                        # ~300 lines: frontmatter, arguments, routing, edge cases
├── CLAUDE.md                       # (unchanged)
├── SPEC.md                         # (unchanged)
├── _foundations/                    # (unchanged)
│   ├── graph-schema.md
│   ├── inference-rules.md
│   └── color-palette.md
├── workflows/
│   ├── scan.md                     # ~200 lines: Phase 1 (Steps 1.1–1.5)
│   ├── design.md                   # ~90 lines: Phase 1B (Steps 1B.1–1B.5)
│   ├── refactor.md                 # ~70 lines: Phase 1C (Steps 1C.1–1C.5)
│   └── plan.md                     # ~100 lines: Phase 1D (Steps 1D.1–1D.6)
├── generation/
│   └── generation.md               # ~430 lines: Phase 2 + Phase 3 (shared)
└── examples/
    ├── scan-example.md             # ~100 lines
    ├── design-example.md           # ~190 lines
    └── refactor-example.md         # ~95 lines
```

## What Goes Where

### SKILL.md (~300 lines) — the router

- Frontmatter (name, description, argument-hint)
- "When to Use" section
- Arguments table + usage examples
- **Mode routing logic**:
  - `--objective` without `--refactor` → `workflows/design.md`
  - `--refactor` → `workflows/refactor.md`
  - `--plan` → `workflows/plan.md`
  - Otherwise → `workflows/scan.md`
- After discovery: "Read `generation/generation.md` for Phase 2 + Phase 3"
- Edge cases section (~65 lines)
- Incremental mode section (~70 lines)
- Known generation gaps (~15 lines)

### workflows/ — mode-specific discovery phases

Each file contains only the discovery steps for that mode. Mode-specific defaults (e.g., "design-mode: all status = planned") move into the corresponding workflow file.

| File | Content | Source lines |
|------|---------|-------------|
| `scan.md` | Steps 1.1–1.5, scan-mode defaults | 73–200 |
| `design.md` | Steps 1B.1–1B.5, design-mode defaults | 202–288 |
| `refactor.md` | Steps 1C.1–1C.5, refactor-mode defaults | 291–361 |
| `plan.md` | Steps 1D.1–1D.6, plan-mode defaults | 364–466 |

### generation/generation.md (~430 lines) — shared

Phase 2 (graph generation) + Phase 3 (assembly and output), merged into one file:

- Steps 2.0–2.4c: modules, nodes, edges, ports, legend, 1-edge rule, critical path
- Steps 3.1–3.6: assembly, validation, scope check, summary, write file, scaffold, serve

Rationale for merging: Phase 2 and Phase 3 are tightly coupled (validation checks the fields Phase 2 defines). Combined total (~430 lines) is under the 500-line reference file guideline. No cross-file references needed.

### examples/ — worked examples

Each mode's worked example extracted to its own file. Referenced from the corresponding workflow file: "See `examples/scan-example.md` for a complete worked example."

## Runtime Context Budget

| Invocation | Files loaded | Lines |
|------------|-------------|-------|
| Scan (simple) | SKILL.md + scan.md + generation.md | ~930 |
| Design | SKILL.md + design.md + generation.md | ~820 |
| Refactor | SKILL.md + refactor.md + scan.md + generation.md | ~1,000 |
| Plan | SKILL.md + plan.md + scan.md + generation.md | ~1,030 |

All modes load 45-55% fewer lines than the current 1,804-line monolith. The key win: Claude never loads design-mode instructions during a scan, or plan-mode instructions during a refactor.

## Design Principles Applied

1. **Progressive disclosure** (Anthropic best practice): SKILL.md loads first (~300 lines), reference files load only when needed
2. **One level deep** (Anthropic best practice): SKILL.md links to workflow and generation files; workflow files don't link to other workflow files
3. **Under 500 lines** (Anthropic best practice): SKILL.md and each reference file stays under 500 lines
4. **No UX change**: Same skill name, same arguments, same output
5. **Content-preserving**: All instructions are preserved — this is a reorganization, not a rewrite

## What Does NOT Change

- `_foundations/` directory (already well-structured)
- `CLAUDE.md` and `SPEC.md` for the skill
- Skill frontmatter (name, description)
- Any instruction content — only file boundaries change
