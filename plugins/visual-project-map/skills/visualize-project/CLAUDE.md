# Visualize Project

Claude Code skill that analyzes a project directory (Input A) or designs a workflow from an objective (Input B) to generate an interactive DAG as visual-project-map JSON.

## Executor
AI — the skill is executed by Claude Code as an LLM prompt chain.

## Status
tested.ai

## Inputs
- **project directory**: Path to scan for CLAUDE.md files, scripts, and folder structure (Input A) (filesystem path)
- **objective text**: Natural language description of a workflow to design (Input B) (string via `--objective` or `--objective-file`)
- **constraints**: Tool/language/format constraints for design mode (string via `--constraints`)
- **domain hint**: Domain for ambiguous objectives (string via `--domain`)
- **focus path**: Subdirectory to limit scan (path via `--focus`)
- **depth**: Module nesting level, 1=flat, 2=phases+modules (integer via `--depth`)
- **title override**: Custom graph title (string via `--title`)

## Outputs
- **graph JSON**: Visual-project-map JSON file written to `.graphs/{name}.json` (JSON conforming to `schema.json`)
- **scaffolding suggestion**: Printed folder structure with CLAUDE.md stubs for each module (design mode only, print or `--scaffold`)

## Structure

SKILL.md is a router (~265 lines) that dispatches to workflow-specific files:

- **`workflows/scan.md`** — Phase 1: scan existing project structure
- **`workflows/design.md`** — Phase 1B: design workflow from objective
- **`workflows/refactor.md`** — Phase 1C: scan + redesign toward objective
- **`workflows/plan.md`** — Phase 1D: detect unmet SPEC.md requirements
- **`generation/generation.md`** — Phase 2 + 3: shared graph generation and assembly
- **`examples/scan-example.md`** — Worked example: scan mode
- **`examples/design-example.md`** — Worked example: design mode
- **`examples/refactor-example.md`** — Worked example: refactor mode
- **`_foundations/`** — Reference tables (inference rules, color palette, graph schema)

## Specs
See `SPEC.md` for acceptance criteria. Review focus: graph structural validity, module boundary design, and cross-folder edge minimization.
