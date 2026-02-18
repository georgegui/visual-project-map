---
name: visualize-project
description: >
  Analyze a project directory to generate an interactive workflow graph,
  design a workflow from a natural language objective, propose a
  refactored folder structure toward an objective, or propose new folders
  from SPEC.md changes. Scans CLAUDE.md files, script dependencies, and
  folder structure (Input A), generates a complete workflow design from a
  stated objective (Input B), combines scan + redesign to produce a
  refactoring plan (Input A + --refactor), or detects unmet SPEC.md
  requirements and proposes new folders/files (Input A + --plan).
  Produces a visual-project-map JSON with modules, nodes, edges, and actor annotations.
argument-hint: "[directory-path] [--objective \"...\"] [--refactor] [--plan] [--focus subdir] [--depth N] [--title \"...\"]"
---

# visualize-project

Generate an interactive DAG from a project's structure and documentation.
The output is a JSON file viewable in the visual-project-map viewer.

## When to Use

- User asks to "visualize", "map", or "diagram" a project's workflow
- User wants to understand how scripts/data flow through a codebase
- User asks for an architecture diagram or pipeline overview
- User describes a goal or objective and wants to design a workflow before coding
- User wants to plan a research study, ETL pipeline, ML project, or any multi-step process
- User wants to restructure a project's folder layout toward a stated objective
- User updated a folder's SPEC.md with new requirements and wants to know what to build
- Works on any codebase (Input A) — or with no codebase at all (Input B)

## Arguments

Parse `$ARGUMENTS` as follows:

| Argument | Default | Description |
|----------|---------|-------------|
| First positional | Project root (cwd) | Directory to analyze (Input A) |
| `--objective "..."` | (none) | Design a workflow from this objective (Input B). Mutually exclusive with directory path. |
| `--objective-file path` | (none) | Read objective from a file (Input B). Mutually exclusive with `--objective` and directory path. |
| `--constraints "..."` | (none) | Tool/language/format constraints for design mode (e.g., `"Python only, PostgreSQL, no cloud"`) |
| `--domain hint` | (none) | Domain hint for ambiguous objectives (e.g., `"econometrics"`, `"ml"`, `"etl"`) |
| `--focus path` | (none) | Limit scan to a subdirectory (Input A only) |
| `--depth N` | `2` | Module nesting: `1` = flat, `2` = phases + modules |
| `--title "..."` | Auto from directory/objective | Graph title override |
| `--force` | `false` | Skip incremental mode; regenerate from scratch |
| `--refactor` | `false` | Combine scan + redesign: scan current structure, redesign toward `--objective`, output diff. Requires `--objective`. |
| `--plan` | `false` | Detect unmet SPEC.md requirements and propose new folders/files to satisfy them. Scans SPEC.md files for unchecked acceptance criteria and maps them to missing directories/scripts. |
| `--scaffold` | `false` | Create CLAUDE.md + SPEC.md stubs in project directories (design mode only) |

**Input A** (scan existing project):
- `/visualize-project` — current project
- `/visualize-project /path/to/project` — specific project
- `/visualize-project . --focus scripts/ --depth 1` — flat, scripts only
- `/visualize-project . --title "My Pipeline"` — custom title

**Input B** (design from objective):
- `/visualize-project --objective "Build an ETL pipeline that ingests CSV files, cleans them, and loads into PostgreSQL"`
- `/visualize-project --objective "Estimate causal effect of a policy intervention on employment using diff-in-diff"`
- `/visualize-project --objective-file docs/project-spec.md --constraints "Python, Stata, no cloud services"`
- `/visualize-project --objective "Build a recommendation engine" --domain ml --depth 1`

**Refactor** (restructure existing project):
- `/visualize-project . --refactor --objective "Separate data acquisition from processing"`
- `/visualize-project . --refactor --objective "Group by domain, not by file type" --depth 1`

**Plan** (propose from SPEC.md changes):
- `/visualize-project . --plan` — detect all unmet SPEC.md requirements
- `/visualize-project . --plan --focus scripts/estimation/` — plan only for one subdirectory

---

## How to Execute

### Phase 1 — Discovery

Choose **one** workflow based on the arguments:

| Condition | Workflow file | Description |
|-----------|--------------|-------------|
| `--refactor` flag | Read `workflows/refactor.md` | Scan current + redesign toward objective |
| `--plan` flag | Read `workflows/plan.md` | Detect unmet SPEC.md requirements |
| `--objective` (without `--refactor`) | Read `workflows/design.md` | Design workflow from scratch |
| Otherwise (default) | Read `workflows/scan.md` | Scan existing project structure |

> **Note:** Refactor and Plan modes both start by running the scan workflow
> internally (their Step 1 says "Run Phase 1 scan"). Read `workflows/scan.md`
> first, then the mode-specific file.

### Phase 2 — Graph Generation + Phase 3 — Assembly

After completing the discovery phase, read `generation/generation.md` for the
shared graph generation and output pipeline. This covers:
- Defining modules, nodes, edges, and interface ports (Phase 2)
- Validation, assembly, file writing, and serving (Phase 3)

Consult `_foundations/` for reference tables:
- `_foundations/inference-rules.md` — lookup tables for confidence, status, roles
- `_foundations/color-palette.md` — color assignments
- `_foundations/graph-schema.md` — field requirements

### Worked Examples

For complete input→output examples, see:
- `examples/scan-example.md` — scan of an existing data pipeline
- `examples/design-example.md` — design of a staggered DiD workflow
- `examples/refactor-example.md` — restructuring a flat scripts directory

---

## Edge Cases

### No CLAUDE.md found
Fall back to README.md for workflow information. If no README either,
check for Makefile, package.json (`scripts` section), docker-compose.yml,
or CI config (`.github/workflows/`). Use directory structure + script
filenames as the primary signal.

### Flat project (no subdirectories)
Create a single module. Each script or documented step becomes a node.
Use `--depth 1` automatically.

### Monorepo with many packages
Suggest `--focus` for individual packages. If the user wants the full
view, create one module per package with high-level edges only.

### Vague objective (design mode)
If the objective is too vague to decompose (e.g., "do some data analysis"),
ask the user for clarification: What is the final deliverable? What data
sources? If the user insists, generate a high-level skeleton with 3-4
modules, all at `confidence: "low"`, and note in each module's
`checkpointReason` what information is needed to refine.

### Very large scope (design mode)
If the objective implies >12 modules (e.g., "build a complete SaaS platform"),
suggest breaking into sub-projects. Alternatively, generate a high-level
`--depth 1` overview and suggest the user run separate `--objective` calls
for each major subsystem.

### Contradictory constraints (design mode)
If `--constraints` conflicts with the objective (e.g., objective says "use
deep learning" but constraints say "no GPU"), flag the contradiction in the
relevant module's `checkpointReason` and set `confidence: "low"`. Do not
silently ignore the conflict.

### Refactor with no clear improvement
If the current structure already matches the objective (or is already well-organized
for the stated goal), tell the user: "The current structure already aligns with
this objective. No refactoring needed." Generate the scan graph without plan
annotations.

### Refactor scope too large
If the refactoring would touch >80% of modules, suggest using `--objective`
(design mode) instead — at that scale, it's a redesign rather than a refactor.

### No SPEC.md files found (--plan)
Warn user: "No SPEC.md files found in the project. The `--plan` action requires
folders to have SPEC.md files with acceptance criteria. Consider running
`--scaffold` first to generate SPEC.md stubs, then adding acceptance criteria."
Fall back to a normal scan (describe action).

### All criteria already satisfied (--plan)
Report: "All SPEC.md acceptance criteria appear to be satisfied. No new folders
or files to propose." Output the current graph without plan annotations.

### SPEC.md with only checked items (--plan)
Skip that folder — all its criteria are met. Only include folders with unchecked
`- [ ]` items in the plan output.

### >100 scripts
Only visualize scripts that are:
1. Referenced in documentation (CLAUDE.md, README, Makefile)
2. Entry points (`main.py`, `cli.py`, `__main__.py`, `run.sh`)
3. Have clear I/O relationships with other visualized scripts
Do not attempt to graph every utility or helper script.

### Already has a graph (incremental regeneration)
If `.graphs/{name}.json` exists, use **incremental mode** instead of
rebuilding from scratch:

1. **Read the existing graph** — load `.graphs/{name}.json` and build a
   lookup of all existing module IDs, node IDs, and edge keys
   (`source->target`).

2. **Re-scan the project** — run Phase 1 discovery as normal to get a
   fresh mental model of the project structure.

3. **Diff against existing** — for each element in the fresh analysis:
   - If an existing module/node/edge still matches the codebase: **keep it
     unchanged** (preserve its ID, label, color, and any manual refinements
     the user may have made).
   - If a new script/step/directory appears: **add** the corresponding
     module/node/edge with a new ID following the naming convention.
   - If an existing element's source (script, docs) no longer exists in
     the codebase: mark it as a candidate for **removal** but do NOT
     auto-remove — list it for the user to confirm.
   - If a label, module assignment, or edge relationship changed:
     **update** only the changed fields, keeping the existing ID.

4. **Preserve manual refinements** — the following fields are considered
   user-editable and must NOT be overwritten during incremental updates:
   - Node/module `label` (if it differs from what the skill would generate
     and the underlying source hasn't changed)
   - `description` fields (on graph, modules, nodes, edges)
   - `style.color`, `style.borderColor` overrides
   - `interfaceContract` content
   - Module `interface` content
   - `plan` field (belongs to visualize-plan, not this skill)
   - Edge `label` and `details.docs`
   - Module/node `status` (user may have manually upgraded/downgraded)
   - Module/node `role` (user may have manually overridden)

5. **Write with diff** — save to `.graphs/{name}.json` and also save the
   previous version to `.graphs/{name}.prev.json` so the viewer can show
   a diff overlay via `?graph=.../{name}.json&compare=.../{name}.prev.json`.

6. **Present changes** — before writing, show a summary table:
   ```
   Incremental Update: "Project Title"
     Modules: 8 (1 added, 0 removed)
     Nodes:   24 → 27 (+3 added, 0 removed)
     Edges:   31 → 34 (+3 added, 0 removed)

     New nodes:
       + cln_dedupe2 in mod_clean  (new script: scripts/clean/dedupe_v2.py)
       + exp_parquet in mod_export (new script: scripts/export/to_parquet.py)
       + exp_validate in mod_export (new step from CLAUDE.md)

     Candidates for removal (confirm before deleting):
       ? exp_csv in mod_export (scripts/export/to_csv.py no longer exists)
   ```
   Ask the user to confirm additions and removals before writing.

If the user passes `--force` or explicitly asks to overwrite, skip
incremental mode and regenerate from scratch.

**Design → Scan transition:** When a user runs `/visualize-project .` (Input A)
on a project that already has a design-mode graph (identified by
`_generationMode: "design"` in the existing JSON), incremental mode handles the
transition naturally:
- Modules that now have corresponding directories/scripts upgrade from `planned`
  to `draft` or `ai-tested` based on scan evidence
- Modules still without code remain `planned`
- `confidence` and `needsHumanReview` fields are preserved (user may have refined)
- `_generationMode` updates to `"scan"` once any module has code
- New modules discovered during scanning are added as usual
- The `_objective` field is preserved for reference

---

## Known Generation Gaps (Resolved)

Gaps between the SPEC's requirements and the skill's generation procedure.
Previously these were unimplemented; they are now addressed in the steps
listed below.

| Gap | Feature | Resolution |
|-----|---------|------------|
| GAP-1 | Interface port nodes (F66) | **Resolved** — Step 2.3b generates `_isInterfacePort` nodes from `module.interface` |
| GAP-2 | Critical path (F68) | **Resolved** — Step 2.4c computes `criticalPath` array |
| GAP-3 | Scan-mode confidence (F67) | **Resolved** — inference-rules.md § "Scan-Mode Confidence Heuristics" + Step 2.1 scan-mode instructions |
| GAP-4 | Scan-mode `_generationMode` | **Resolved** — Step 3.5 now instructs setting `"scan"` for Input A |
| GAP-5 | `node.io` and `node.docs` | **Resolved** — Step 2.2 now includes generation instructions |
| GAP-6 | Status data collection | **Resolved** — Step 1.1b collects test files, TODO/FIXME, assertion patterns |
| GAP-7 | Interface completeness | **Resolved** — Step 2.1 now requires interfaces on all non-terminal modules (infer when evidence is limited) |
