# Phase 1D — Plan from SPEC.md Changes

> Extracted from SKILL.md. Used when `--plan` is passed.

**Skip this phase unless `--plan` is passed.** This phase scans SPEC.md files
across the project, identifies unmet requirements, and proposes new folders and
files to satisfy them.

## Table of Contents
- Step 1D.1: Scan Current Structure
- Step 1D.2: Collect SPEC.md Files
- Step 1D.3: Detect Unmet Requirements
- Step 1D.4: Propose New Folders and Files
- Step 1D.5: Compute Plan Annotations
- Step 1D.6: Synthesize

---

### Step 1D.1: Scan Current Structure

Run Phase 1 (Steps 1.1–1.5) as normal to get the current folder structure.
This produces the "current state" model — the baseline graph.

### Step 1D.2: Collect SPEC.md Files

Use Glob to find all SPEC.md files in the project:
```
**/SPEC.md
```
Skip `node_modules/`, `venv/`, `.venv/`, `.git/`, `__pycache__/`, `dist/`,
`build/`, `.next/`.

If `--focus` is set, scope the search under that subdirectory.

Read each SPEC.md. For each file, extract:

- **Parent folder**: The directory containing SPEC.md — this is the module
  the spec belongs to.
- **Acceptance criteria**: Lines matching `- [ ]` (unchecked) and `- [x]`
  (checked). Unchecked criteria are unmet requirements.
- **Edge cases**: Scenarios listed under "Edge Cases" that may imply
  additional scripts or handlers.
- **Validation checks**: Checks under "Validation Checks" that may imply
  test files or validation scripts.

### Step 1D.3: Detect Unmet Requirements

For each unchecked acceptance criterion from Step 1D.2, determine whether
the current project already satisfies it:

1. **Map criterion to artifact**: Does the criterion describe a file, script,
   directory, or capability? Examples:
   - "Output JSON conforms to schema.json" → needs a validation script or test
   - "Handle missing data gracefully" → needs a handler in the data processing module
   - "CLAUDE.md stubs created without overwriting" → needs a scaffolding script
2. **Check if artifact exists**: Search the current directory tree for the
   implied file/script/directory. Use the Phase 1 scan results.
3. **Classify**:
   - **Satisfied**: Artifact exists and appears functional → skip
   - **Partially satisfied**: Artifact exists but is incomplete (e.g., stub
     without implementation) → annotate existing module as `modify`
   - **Unmet**: No corresponding artifact → propose new folder/file as `add`

If git is available in the project, also run:
```
git diff --name-only HEAD~5 -- '**/SPEC.md'
```
to identify recently changed SPEC.md files. Prioritize these in the output
summary — recent changes are most likely to contain the user's latest
requirements.

### Step 1D.4: Propose New Folders and Files

For each unmet requirement from Step 1D.3, design the minimal folder/file
addition that satisfies it. Follow the Folder Premise:

- **New folder**: If the requirement implies a new workflow stage or data
  artifact, create a new module with:
  - `status: "planned"`
  - `description` explaining what it does
  - `interface` with `inputs` and `outputs`
  - `confidence` and `needsHumanReview` per inference rules
- **New file in existing folder**: If the requirement implies a new script
  or handler within an existing module, add a new node with:
  - `status: "planned"`
  - `description` explaining what it does
  - Appropriate edges connecting it to existing nodes

Apply the same module design principles as Phase 1B (Step 1B.2): decompose
requirements into stages, identify data flow, assess confidence.

### Step 1D.5: Compute Plan Annotations

Build the plan overlay using the same format as Phase 1C (Step 1C.4–1C.5):

- **Plan summary**:
  - `goal`: "Satisfy unmet SPEC.md requirements" (or more specific if
    `--focus` was used)
  - `tasks`: One task per proposed addition/modification, referencing the
    SPEC.md criterion that motivated it
- **Plan annotations**:
  - `add` for new modules, nodes, and edges
  - `modify` for existing modules that need additional files/nodes
  - No `remove` annotations — `--plan` only proposes additions

### Step 1D.6: Synthesize

Produce a model with:
- **All current modules, nodes, and edges** (the base graph from Step 1D.1)
- **All proposed modules, nodes, and edges** (additions from Step 1D.4)
- **Plan annotations** (from Step 1D.5)
- **Plan summary** with tasks linked to SPEC.md criteria

This model feeds into Phase 2 with `_generationMode: "plan"`.

---

## Plan-Mode Defaults

Apply these throughout Phase 2 (graph generation):

> - Base graph uses **current** scan results (real folders, files, statuses)
> - Proposed changes encoded in `plan` field (not replacing the base graph)
> - `_generationMode`: `"plan"`
> - New modules/nodes: `status: "planned"`
> - Existing modules/nodes: preserve current status
> - Plan annotations: `add` or `modify` only (no `remove`)
> - **Always generate**: `plan.summary` with goal and tasks linked to SPEC.md criteria
> - **Always generate**: `plan.annotations` for every proposed module, node, and edge
