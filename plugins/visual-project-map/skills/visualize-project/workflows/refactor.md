# Phase 1C — Refactor (Scan + Redesign)

> Extracted from SKILL.md. Used when `--refactor` is passed. Requires `--objective`.

**Skip this phase unless `--refactor` is passed.** This phase combines Phase 1 (scan)
and Phase 1B (design) to produce a refactoring plan. Requires `--objective`.

## Table of Contents
- Step 1C.1: Scan Current Structure
- Step 1C.2: Parse the Refactoring Objective
- Step 1C.3: Design the Target Structure
- Step 1C.4: Compute the Diff
- Step 1C.5: Synthesize

---

### Step 1C.1: Scan Current Structure

Run Phase 1 (Steps 1.1–1.5) as normal to get the current folder structure,
documentation, scripts, and data flow. This produces the "current state" model.

### Step 1C.2: Parse the Refactoring Objective

Read the `--objective` text. Unlike Phase 1B (which designs from scratch), here
the objective describes how to *restructure* the existing project. Extract:

- **Structural goal**: What reorganization is the user asking for?
  (e.g., "separate X from Y", "group by domain", "flatten hierarchy",
  "extract shared utilities")
- **Constraints**: What must be preserved? (e.g., "keep the API layer",
  "don't move test files")
- **Scope**: Does the objective affect the whole project or a subset?
  Use `--focus` if provided.

### Step 1C.3: Design the Target Structure

Using the current structure from Step 1C.1 and the objective from Step 1C.2,
design the proposed folder structure. Follow Phase 1B principles (Steps 1B.2–1B.5)
but with these constraints:

- **Reuse existing code references**: Every file path, script, and CLAUDE.md from
  the scan should appear somewhere in the proposed structure. Nothing should be lost.
- **Preserve working modules**: If a current module is well-organized (clear interface,
  single responsibility), keep it unchanged.
- **Propose moves, not rewrites**: The output should describe which folders to
  rename, merge, split, or move — not suggest rewriting code.
- **Keep interfaces stable**: If the current structure has clean data interfaces
  between modules, preserve those boundaries even if the modules are renamed or moved.
- **Ensure folder contracts**: Every proposed folder (new or restructured) must have:
  1. A clear **objective** — one sentence stating what the folder does
  2. Named **inputs and outputs** — the data crossing its boundary
  3. A **SPEC.md stub** — placeholder for acceptance criteria, edge cases, and
     validation checks
  This follows the Folder Premise: the refactoring output is not just a new
  directory tree, but a set of well-defined folder contracts ready for implementation.

### Step 1C.4: Compute the Diff

Compare current modules vs proposed modules:

| Current | Proposed | Annotation |
|---------|----------|------------|
| Module exists, unchanged | Same module | (no annotation) |
| Module exists, renamed/moved | Module with new label/parent | `modify` |
| Module exists, split into 2+ | New modules with current's nodes distributed | `add` (new modules) + `modify` (original) |
| Module exists, merged with another | Single module with both sets of nodes | `modify` (surviving) + `remove` (absorbed) |
| No current equivalent | New module | `add` |
| Module has no proposed equivalent | Module to delete | `remove` |

For each node and edge, determine whether it stays in place, moves to a different
module, or gets added/removed.

### Step 1C.5: Synthesize

Produce a model with:
- **All current modules, nodes, and edges** (the base graph)
- **All proposed modules, nodes, and edges** (additions and modifications)
- **Plan annotations** mapping each change to `add`, `modify`, or `remove`
- **Plan summary** with a goal (the objective) and tasks (one per structural change)

This model feeds into Phase 2 with `_generationMode: "refactor"`.

---

## Refactor-Mode Defaults

Apply these throughout Phase 2 (graph generation):

> - Base graph uses **current** scan results (real folders, files, statuses)
> - Proposed changes encoded in `plan` field (not replacing the base graph)
> - `_generationMode`: `"refactor"`
> - `_objective`: the refactoring objective text
> - Module `status`: preserve current values for unchanged modules; use `"planned"` for new modules
> - **Always generate**: `plan.summary` with goal and tasks
> - **Always generate**: `plan.annotations` for every changed module, node, and edge
