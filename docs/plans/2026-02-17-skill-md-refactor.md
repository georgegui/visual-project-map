# SKILL.md Progressive Disclosure Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the 1,804-line SKILL.md into a ~300-line router + 8 reference files, following Anthropic's progressive disclosure best practices.

**Architecture:** Extract each workflow phase into `workflows/*.md`, shared generation into `generation/generation.md`, and worked examples into `examples/*.md`. The SKILL.md becomes a routing table that dispatches to these files based on flags. All content is preserved — this is a reorganization, not a rewrite.

**Tech Stack:** Markdown only. No code changes. Verification via line counts and content diffing.

---

### Task 1: Create directory structure

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/workflows/` (directory)
- Create: `plugins/visual-project-map/skills/visualize-project/generation/` (directory)
- Create: `plugins/visual-project-map/skills/visualize-project/examples/` (directory)

**Step 1: Create directories**

Run:
```bash
mkdir -p plugins/visual-project-map/skills/visualize-project/workflows
mkdir -p plugins/visual-project-map/skills/visualize-project/generation
mkdir -p plugins/visual-project-map/skills/visualize-project/examples
```

**Step 2: Verify**

Run: `ls -la plugins/visual-project-map/skills/visualize-project/`

Expected: Three new empty directories alongside existing `_foundations/`, `SKILL.md`, etc.

---

### Task 2: Extract workflows/scan.md

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/workflows/scan.md`
- Source: `SKILL.md` lines 73–200 (Phase 1 — Discovery)

**Step 1: Create scan.md**

Extract lines 73–200 from current SKILL.md. Add a TOC header at the top:

```markdown
# Phase 1 — Discovery (Scan Mode)

> Source: extracted from SKILL.md Phase 1. Used when scanning an existing project (Input A).

> **SPEC principles**: P8 (CLAUDE.md per module), P10 (embed folder hierarchy)

## Table of Contents
- Step 1.1: Find documentation files
- Step 1.1b: Detect test coverage and review evidence
- Step 1.2: Read documentation
- Step 1.3: Find scripts
- Step 1.4: Detect I/O patterns
- Step 1.5: Synthesize

---
```

Then paste the content of Steps 1.1 through 1.5 (lines 77–199) verbatim.

Also append the scan-mode defaults block (currently in Phase 2 header area, lines 663–672) at the bottom:

```markdown
---

## Scan-Mode Defaults

Apply these throughout Phase 2 when using Input A (directory scan):
- **Always** include `confidence` per `_foundations/inference-rules.md` § "Scan-Mode Confidence Heuristics"
- **Always** include `needsHumanReview` when confidence is `low` or when `TODO`/`FIXME` signals were detected
- Include `checkpointReason` when `needsHumanReview` is true
- **Always** include `interface` with `inputs` and `outputs` — infer from I/O evidence or data flow position
```

**Step 2: Verify line count**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/workflows/scan.md`

Expected: ~150–200 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/workflows/scan.md
git commit -m "refactor: extract Phase 1 scan workflow to workflows/scan.md"
```

---

### Task 3: Extract workflows/design.md

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/workflows/design.md`
- Source: `SKILL.md` lines 202–288 (Phase 1B)

**Step 1: Create design.md**

Extract lines 202–288 from current SKILL.md. Add a TOC header:

```markdown
# Phase 1B — Design from Objective

> Source: extracted from SKILL.md Phase 1B. Used when `--objective` is provided without `--refactor` (Input B).

**Skip this phase entirely if using Input A (directory scan).** This phase replaces Phase 1 when `--objective` or `--objective-file` is provided.

## Table of Contents
- Step 1B.1: Parse the Objective
- Step 1B.2: Identify Workflow Stages
- Step 1B.3: Define Data Flow
- Step 1B.4: Assess Confidence and Review Needs
- Step 1B.5: Synthesize

---
```

Then paste Steps 1B.1 through 1B.5 verbatim.

Also append the design-mode defaults block (currently lines 480–489):

```markdown
---

## Design-Mode Defaults

Apply these throughout Phase 2 when using `--objective`:
- All `status`: `"planned"` — no code exists yet
- **Omit**: `node.files`, `node.style.trust`, `edge.details`, `legend.trustLevels`
- **Always generate**: `module.interface` with inputs and outputs
- **Always generate**: `edge.description` on all cross-module edges
- **Assign per module**: `confidence` and `needsHumanReview` per inference rules
- **Assign per edge**: `confidence` per inference rules
```

**Step 2: Verify line count**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/workflows/design.md`

Expected: ~90–110 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/workflows/design.md
git commit -m "refactor: extract Phase 1B design workflow to workflows/design.md"
```

---

### Task 4: Extract workflows/refactor.md

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/workflows/refactor.md`
- Source: `SKILL.md` lines 291–361 (Phase 1C)

**Step 1: Create refactor.md**

Extract lines 291–361. Add TOC header:

```markdown
# Phase 1C — Refactor (Scan + Redesign)

> Source: extracted from SKILL.md Phase 1C. Used when `--refactor` is passed. Requires `--objective`.

**Skip this phase unless `--refactor` is passed.** This phase combines Phase 1 (scan) and Phase 1B (design) to produce a refactoring plan.

## Table of Contents
- Step 1C.1: Scan Current Structure
- Step 1C.2: Parse the Refactoring Objective
- Step 1C.3: Design the Target Structure
- Step 1C.4: Compute the Diff
- Step 1C.5: Synthesize

---
```

Then paste Steps 1C.1 through 1C.5 verbatim.

Append refactor-mode defaults (currently lines 490–498):

```markdown
---

## Refactor-Mode Defaults

Apply these throughout Phase 2:
- Base graph uses **current** scan results (real folders, files, statuses)
- Proposed changes encoded in `plan` field (not replacing the base graph)
- `_generationMode`: `"refactor"`
- `_objective`: the refactoring objective text
- Module `status`: preserve current values for unchanged modules; use `"planned"` for new modules
- **Always generate**: `plan.summary` with goal and tasks
- **Always generate**: `plan.annotations` for every changed module, node, and edge
```

**Step 2: Verify line count**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/workflows/refactor.md`

Expected: ~70–90 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/workflows/refactor.md
git commit -m "refactor: extract Phase 1C refactor workflow to workflows/refactor.md"
```

---

### Task 5: Extract workflows/plan.md

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/workflows/plan.md`
- Source: `SKILL.md` lines 364–466 (Phase 1D)

**Step 1: Create plan.md**

Extract lines 364–466. Add TOC header:

```markdown
# Phase 1D — Plan from SPEC.md Changes

> Source: extracted from SKILL.md Phase 1D. Used when `--plan` is passed.

**Skip this phase unless `--plan` is passed.** This phase scans SPEC.md files, identifies unmet requirements, and proposes new folders and files to satisfy them.

## Table of Contents
- Step 1D.1: Scan Current Structure
- Step 1D.2: Collect SPEC.md Files
- Step 1D.3: Detect Unmet Requirements
- Step 1D.4: Propose New Folders and Files
- Step 1D.5: Compute Plan Annotations
- Step 1D.6: Synthesize

---
```

Then paste Steps 1D.1 through 1D.6 verbatim.

Append plan-mode defaults (currently lines 500–509):

```markdown
---

## Plan-Mode Defaults

Apply these throughout Phase 2:
- Base graph uses **current** scan results (real folders, files, statuses)
- Proposed changes encoded in `plan` field (not replacing the base graph)
- `_generationMode`: `"plan"`
- New modules/nodes: `status: "planned"`
- Existing modules/nodes: preserve current status
- Plan annotations: `add` or `modify` only (no `remove`)
- **Always generate**: `plan.summary` with goal and tasks linked to SPEC.md criteria
- **Always generate**: `plan.annotations` for every proposed module, node, and edge
```

**Step 2: Verify line count**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/workflows/plan.md`

Expected: ~100–120 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/workflows/plan.md
git commit -m "refactor: extract Phase 1D plan workflow to workflows/plan.md"
```

---

### Task 6: Extract generation/generation.md

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/generation/generation.md`
- Source: `SKILL.md` lines 469–510 (Phase 2 intro/defaults), 511–925 (Phase 2 steps), 928–1242 (Phase 3)

**Step 1: Create generation.md**

This is the largest extraction. Add TOC header:

```markdown
# Phase 2 — Graph Generation + Phase 3 — Assembly & Output

> Source: extracted from SKILL.md Phases 2–3. Shared across all modes (scan, design, refactor, plan).

## Table of Contents

### Phase 2 — Graph Generation
- 2.0: Write Graph Description
- 2.1: Define Modules
- 2.2: Define Nodes
- 2.3: Define Edges
- 2.3b: Generate Interface Port Nodes
- 2.4: Define Legend (optional)

### Phase 3 — Assembly & Output
- 3.1: Construct JSON
- 2.4b: Enforce 1-Edge-Per-Module-Pair Rule
- 2.4c: Compute Critical Path
- 3.2: Validate
- 3.3: Scope Check
- 3.4: Present Summary
- 3.5: Write File
- 3.5b: Suggest CLAUDE.md Scaffolding (Design Mode Only)
- 3.6: Serve and View

---
```

Then paste lines 469–509 (Phase 2 intro with SPEC principles and all mode-specific defaults blocks) followed by lines 511–1242 (all Phase 2 + Phase 3 steps) verbatim.

**Important:** Remove the mode-specific defaults blocks that were already copied to workflow files (scan-mode module/node/edge instructions at lines 663–672, 836–840). Instead, add a note: "See the active workflow file for mode-specific defaults."

Actually — keep ALL generation instructions in this file including the mode-conditional blocks within steps (e.g., "Design-mode modules" subsection within Step 2.1, "Scan-mode edges" within Step 2.3). These are interspersed within the generation steps and belong here since they tell the generator what to do differently per mode. Only the top-level defaults blocks (the `>` quoted blocks at lines 480–509) should be moved to workflow files.

**Step 2: Verify line count**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/generation/generation.md`

Expected: ~430–460 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/generation/generation.md
git commit -m "refactor: extract Phase 2+3 generation pipeline to generation/generation.md"
```

---

### Task 7: Extract examples/

**Files:**
- Create: `plugins/visual-project-map/skills/visualize-project/examples/scan-example.md`
- Create: `plugins/visual-project-map/skills/visualize-project/examples/design-example.md`
- Create: `plugins/visual-project-map/skills/visualize-project/examples/refactor-example.md`
- Source: `SKILL.md` lines 1385–1499 (scan), 1502–1691 (design), 1694–1787 (refactor)

**Step 1: Create scan-example.md**

Extract lines 1385–1499. Add header:

```markdown
# Worked Example — Scan Mode

> Reference example for `/visualize-project /path/to/project`. Shows the complete output for a scan of an existing data pipeline project.

---
```

Then paste the example content verbatim.

**Step 2: Create design-example.md**

Extract lines 1502–1691. Add header:

```markdown
# Worked Example — Design Mode

> Reference example for `/visualize-project --objective "..."`. Shows the complete output for designing a staggered DiD causal inference workflow.

---
```

Then paste the example content verbatim.

**Step 3: Create refactor-example.md**

Extract lines 1694–1787. Add header:

```markdown
# Worked Example — Refactor Mode

> Reference example for `/visualize-project . --refactor --objective "..."`. Shows the complete output for restructuring a flat scripts directory into stage-specific directories.

---
```

Then paste the example content verbatim.

**Step 4: Verify line counts**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/examples/*.md`

Expected: scan ~120, design ~195, refactor ~100.

**Step 5: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/examples/
git commit -m "refactor: extract worked examples to examples/*.md"
```

---

### Task 8: Rewrite SKILL.md as the router

**Files:**
- Modify: `plugins/visual-project-map/skills/visualize-project/SKILL.md`

This is the critical task. The new SKILL.md keeps:
- **Lines 1–14**: Frontmatter (unchanged)
- **Lines 16–70**: Title, When to Use, Arguments table + examples (unchanged)
- **NEW**: Mode routing section (~30 lines)
- **Lines 1245–1382**: Edge cases + incremental mode (relocated, unchanged content)
- **Lines 1790–1804**: Known generation gaps (relocated, unchanged content)

**Step 1: Write the new SKILL.md**

The new file structure:

```
Lines 1-14:   Frontmatter (verbatim from current)
Lines 16-70:  # visualize-project, When to Use, Arguments (verbatim from current)
NEW:          ## How to Execute (routing section)
Lines 1245-1310: ## Edge Cases (verbatim from current)
Lines 1311-1382: ## Incremental Mode (verbatim from current)
Lines 1790-1804: ## Known Generation Gaps (verbatim from current)
```

The new **"How to Execute"** routing section:

```markdown
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

> **Note:** Refactor and Plan modes both start by running the scan workflow internally (their Step 1 says "Run Phase 1 scan"). Read `workflows/scan.md` first, then the mode-specific file.

### Phase 2 — Graph Generation + Phase 3 — Assembly

After completing the discovery phase, read `generation/generation.md` for the shared graph generation and output pipeline.

### Worked Examples

For complete input→output examples, see:
- `examples/scan-example.md` — scan of an existing data pipeline
- `examples/design-example.md` — design of a staggered DiD workflow
- `examples/refactor-example.md` — restructuring a flat scripts directory
```

**Step 2: Verify line count of new SKILL.md**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/SKILL.md`

Expected: ~280–320 lines.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/SKILL.md
git commit -m "refactor: rewrite SKILL.md as progressive disclosure router (~300 lines)"
```

---

### Task 9: Verify completeness

**Files:**
- Read: All new files + original SKILL.md (from git)

**Step 1: Count total lines across all split files**

Run:
```bash
wc -l plugins/visual-project-map/skills/visualize-project/SKILL.md \
     plugins/visual-project-map/skills/visualize-project/workflows/*.md \
     plugins/visual-project-map/skills/visualize-project/generation/*.md \
     plugins/visual-project-map/skills/visualize-project/examples/*.md
```

Expected: Total should be roughly 1,804 + ~80 (added TOC headers) = ~1,880 lines.

**Step 2: Check no content was lost**

Extract key section headers from the original and verify each appears in exactly one split file:

```bash
# Check that all original phase headers exist somewhere in the split files
for header in "Step 1.1:" "Step 1.2:" "Step 1.3:" "Step 1.4:" "Step 1.5:" \
              "Step 1B.1:" "Step 1B.2:" "Step 1B.3:" "Step 1B.4:" "Step 1B.5:" \
              "Step 1C.1:" "Step 1C.2:" "Step 1C.3:" "Step 1C.4:" "Step 1C.5:" \
              "Step 1D.1:" "Step 1D.2:" "Step 1D.3:" "Step 1D.4:" "Step 1D.5:" "Step 1D.6:" \
              "2.0: Write" "2.1: Define Modules" "2.2: Define Nodes" "2.3: Define Edges" \
              "2.3b: Generate" "2.4: Define Legend" "2.4b: Enforce" "2.4c: Compute" \
              "3.1: Construct" "3.2: Validate" "3.3: Scope" "3.4: Present" \
              "3.5: Write" "3.5b: Suggest" "3.6: Serve"; do
    count=$(grep -rl "$header" plugins/visual-project-map/skills/visualize-project/ --include="*.md" | wc -l)
    if [ "$count" -eq 0 ]; then
        echo "MISSING: $header"
    elif [ "$count" -gt 1 ]; then
        echo "DUPLICATE: $header (in $count files)"
    fi
done
```

Expected: No MISSING or DUPLICATE lines.

**Step 3: Verify SKILL.md is under 500 lines**

Run: `wc -l plugins/visual-project-map/skills/visualize-project/SKILL.md`

Expected: Under 500 lines. Target ~300.

**Step 4: Commit verification note (if any fixes were needed)**

If fixes were needed, commit them. Otherwise, no commit needed.

---

### Task 10: Update CLAUDE.md files

**Files:**
- Modify: `plugins/visual-project-map/skills/visualize-project/CLAUDE.md`
- Modify: `plugins/visual-project-map/skills/CLAUDE.md`

**Step 1: Update skill CLAUDE.md**

The `CLAUDE.md` in `visualize-project/` should mention the new file structure. Add after the existing "## Specs" section:

```markdown
## Structure
- **`SKILL.md`** — Router: arguments, mode dispatch, edge cases (~300 lines)
- **`workflows/`** — Mode-specific discovery phases (scan, design, refactor, plan)
- **`generation/`** — Shared graph generation + assembly pipeline
- **`examples/`** — Worked examples (one per mode)
- **`_foundations/`** — Reference tables (schema, inference rules, colors)
```

**Step 2: Update parent CLAUDE.md**

In `skills/CLAUDE.md`, update the description of `visualize-project/` to reflect the split:

Change: `Complex: 3 phases, foundation tables, worked examples.`
To: `Split into router + workflow files + shared generation. See internal CLAUDE.md.`

**Step 3: Commit**

```bash
git add plugins/visual-project-map/skills/visualize-project/CLAUDE.md \
       plugins/visual-project-map/skills/CLAUDE.md
git commit -m "docs: update CLAUDE.md files to reflect SKILL.md split structure"
```

---

### Task 11: Update spec/features.md

**Files:**
- Modify: `spec/features.md`

**Step 1: Add feature entry for the refactor**

Add a new feature entry (or update the changelog) documenting the SKILL.md split as a completed improvement.

**Step 2: Commit**

```bash
git add spec/features.md
git commit -m "docs: record SKILL.md progressive disclosure refactor in feature catalog"
```
