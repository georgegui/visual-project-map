# Workflows

Skill workflow definitions for each visualize-project mode. Each Markdown file is a self-contained prompt that the SKILL.md router dispatches to based on user input.

## Executor
AI — these workflows are executed by Claude Code as skill prompts.

## Status
tested.ai

## Inputs
- **user arguments**: Mode flags and parameters parsed by the SKILL.md router (CLI args)
- **project context**: Directory tree, CLAUDE.md files, and scripts discovered during scan (filesystem)

## Outputs
- **discovery results**: Module list, node list, edge list, and interface definitions passed to generation phase (structured data in context)

## Files
- **`scan.md`** — Phase 1: scan existing project structure and infer modules/nodes/edges
- **`design.md`** — Phase 1B: design a workflow from a natural language objective
- **`refactor.md`** — Phase 1C: scan existing project + redesign toward an objective
- **`plan.md`** — Phase 1D: detect unmet SPEC.md requirements and generate plan annotations
