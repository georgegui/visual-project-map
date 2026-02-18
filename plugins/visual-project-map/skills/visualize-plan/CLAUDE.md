# Visualize Plan

Claude Code skill that overlays an implementation plan onto an existing workflow graph, annotating nodes and edges as add/modify/remove.

## Executor
AI — the skill is executed by Claude Code as an LLM prompt.

## Status
tested.ai

## Inputs
- **plan document**: Markdown file describing tasks, changes, and affected components (Markdown, positional arg)
- **existing graph JSON**: The graph to annotate, loaded from `.graphs/` or via `--graph` flag (JSON conforming to `schema.json`)

## Outputs
- **annotated graph JSON**: The same graph with a `plan` field added containing `summary` (goal + tasks) and `annotations` (per-element add/modify/remove status) (JSON, overwrites the input graph)

## Specs
See the parent skill's `SPEC.md` for graph structural constraints. Plan annotations must not break graph validity — they overlay metadata, not structure.
