# Inference Rules

Lookup tables for detecting modules, nodes, edges, and their properties
from project structure and documentation.

## Module Design Principles

> **Naming note:** These 9 module-level principles (numbered 1–9 below) are
> implementation rules for graph *structure*. They are distinct from the
> tool-level rules in `SPEC.md` (Folder Premise, Graph Constraints, Viewer
> Behavior, Skill Requirements), which govern the tool's overall philosophy.
> Key correspondences:
> - SPEC Folder Premise ("complexity inside folders") → enforced by Principles 2, 4, 8 below
> - SPEC Folder Premise ("embed folder hierarchy") → enforced by Principle 1 below
> - SPEC Constraint 2 ("one edge per folder pair") → enforced by Principles 2, 8, 9 below

Modules are **abstraction boundaries**, not just visual groupings. A well-designed
module hides internal complexity behind a small number of entry and exit points —
the same encapsulation principle as classes in software engineering.

### Principle 1: Identify modules from structure first, documentation second

The primary signal for module boundaries is the **codebase itself** — folder
structure, script groupings, data directories, and package organization. These
reflect how the developer actually organized their work. Documentation confirms
and refines these boundaries but should not be the sole source.

Priority order for identifying modules:
1. **Directory structure**: Each subdirectory with scripts or data → candidate module
2. **Package organization**: `__init__.py`, subpackages, import graphs
3. **Data flow boundaries**: Directories that are outputs of one phase and inputs
   to the next (e.g., `data/raw/` → `data/clean/` → `data/output/`)
4. **Documentation sections**: Workflow headers in CLAUDE.md or README.md
5. **Build targets**: Makefile rules, CI stages, npm scripts

### Principle 2: One edge per module pair (strict target)

When any two modules are both collapsed, there should be **exactly 1 edge**
between them (or 0). This is the strict target. Each module should have
**1 entry node** and **1 exit node** as its interface to the outside world.

If you find yourself needing 2+ edges between the same module pair, that is
a structural signal — not a visualization problem:
1. **The modules should be merged** — they are too tightly coupled
2. **A module boundary is drawn wrong** — redraw where data flow narrows
3. **A missing intermediate module** would absorb the fan-out

If you can't describe what goes into a module and what comes out in one
sentence, the module boundary is probably wrong.

### Principle 3: Settle before exporting

A module should resolve its internal branching before connecting to other modules.
If three internal paths all lead to the same external destination, add a collector
node that merges them into one exit — don't draw three cross-module edges. The
module "settles" its internal state, then exports a clean result.

Similarly, a module should have a single entry point that routes internally.
If external modules need to reach two different internal nodes, add a router
entry node that branches inside the module.

### Principle 4: Internal edges should outnumber external edges

If a module has more cross-module edges than internal edges, its boundaries are
wrong. The nodes inside are more coupled to the outside than to each other — redraw
the module boundaries so tightly coupled nodes are together.

### Principle 5: Module size sweet spot is 3-8 nodes

- **< 3 nodes**: The module may not justify its own grouping. Consider merging
  with an adjacent module.
- **3-8 nodes**: Ideal — comprehensible at a glance, enough structure to be useful.
- **> 8 nodes**: Consider splitting into sub-phases or using `--depth 2` to create
  a parent phase with child modules.

### Principle 6: Decisions belong at module boundaries

Decision nodes (diamonds) typically determine which module or phase comes next.
Place them near the boundary — as the last node before edges leave the module.
This keeps branching logic visible at the interface level.

### Principle 7: Terminal nodes attract spaghetti

Terminal/sink nodes (INCLUDED, EXCLUDED, COMPLETE, FAILED) naturally attract
incoming edges from many modules. They are the first place to check for
cross-module edge overload. Route terminal exits through the module's own
exit node — not directly to a global terminal. Let the hierarchy aggregate:
when a phase is collapsed, all its modules' exclusion edges become one
meta-edge to the terminal.

### Principle 8: Hierarchy absorbs complexity

The purpose of nesting modules in phases is to **hide cross-module edges
behind the phase boundary**. At each level of the hierarchy, the 1-edge rule
applies independently:

- **Phase level**: 1 edge between any two phases
- **Module level within a phase**: 1 edge between any two sibling modules
- **Node level within a module**: unconstrained (this is internal complexity)

When a phase is collapsed, all internal edges vanish. If your collapsed-phase
view still shows 5 edges to the same target, the phase boundaries are wrong.

**Corollary 1**: If N modules all fan out from the same source or converge on
the same target, wrap them in a sub-phase. The fan-out/fan-in becomes
internal to that sub-phase and disappears when collapsed.

**Corollary 2: No level-skipping edges.** Edges may only connect nodes or
modules that share a common parent at the same depth. A node inside module A
(child of phase X) must not connect directly to a node inside module B
(child of phase Y). Instead, route through exit/entry nodes at each boundary:

```
WRONG: A_internal ──→ B_internal    (skips phase boundaries)
RIGHT: A_internal → A_exit → X_exit → Y_entry → B_entry → B_internal
```

In practice, "settling before exporting" (Principle 3) at each level achieves
this automatically. If a module's exclusion path needs to reach a global
terminal, the exclusion should terminate within the module itself — the module
is the scope for that decision. Don't draw cross-phase edges to a shared
EXCLUDED node; let each module have its own terminal state.

**Exception**: Backward recovery edges (dashed) may skip levels as a rare
exception, since routing them through every boundary would add more complexity
than it removes. Mark them clearly with dashed style.

### Principle 9: Multiple edges = wrong boundaries

When you discover 2+ edges between the same module pair, do NOT fix it by
adding more nodes. Instead, ask which restructuring eliminates the coupling:

| Symptom | Restructure |
|---------|-------------|
| 1 source → N target modules | Wrap targets in a sub-phase; add dispatcher at phase level |
| N source modules → 1 target | Wrap sources in a sub-phase; add collector at phase level |
| 2+ edges between same pair, different meanings | Add entry/exit router nodes inside one of the modules |
| Backward edge crosses 2+ phases | Accept as rare recovery path (dashed), or add rework phase |

The goal is not zero cross-module edges — it's exactly **one** per
connected pair at each hierarchy level.

### Generation Sequence

Follow this order to produce clean graphs:

1. **Draft modules** from folder structure and codebase organization
2. **Assign nodes** to the module where they have the most sibling connections
3. **Draw internal edges** within each module
4. **Add entry/exit nodes** — each module gets exactly 1 entry and 1 exit node
   that serve as its interface to the outside
5. **Draw cross-module edges** — connect only exit→entry between modules
6. **Count edges per module pair** — any pair with 2+? Restructure (Principle 9)
7. **Verify at each level** — collapse phases mentally; do you see 1 edge per pair?

The anti-pattern is "draw all nodes, draw all edges, then group into modules."
That produces spaghetti because module boundaries become afterthoughts. Design
modules top-down as abstractions, then populate them with nodes.

---

## Role Assignment (process vs data)

The `role` field distinguishes **process** modules/nodes (things that do work)
from **data** modules/nodes (artifacts that are produced or consumed). This lets
viewers instantly see what the key computational components are versus what the
inputs and outputs are.

### Module Role Inference

| Signal | Role | Example |
|--------|------|---------|
| Directory named `data/`, `datasets/`, `corpus/`, `assets/`, `resources/` | `data` | `data/raw/`, `data/processed/` |
| Directory whose contents are primarily non-code (CSV, JSON data, images) | `data` | `output/`, `results/`, `figures/` |
| Module whose primary purpose is storing/holding artifacts between stages | `data` | "Project Inventory", "Graph JSON" |
| Config/template directories | `data` | `config/`, `templates/` |
| Directory with scripts that transform, validate, or process | `process` | `scripts/clean/`, `src/` |
| Module whose primary purpose is computation/transformation | `process` | "Discovery", "Rendering" |
| Default (no clear signal) | omit (defaults to `process`) | |

**Rule of thumb**: If you describe the module with a noun (inventory, config,
output), it's likely `data`. If you describe it with a verb (discover, clean,
export), it's likely `process`.

### Node Role Inference

| Signal | Role | Example |
|--------|------|---------|
| Node represents a file, directory, or dataset | `data` | "raw_json", "output.csv" |
| Node represents an intermediate artifact between steps | `data` | "validated_records", "clean_corpus" |
| Node represents config, templates, or static input | `data` | "schema.json", "prompt_template" |
| Node represents a computation, transformation, or action | `process` | "validate", "normalize" |
| Decision/gate nodes | `process` (keep diamond shape) | "quality_check" |
| Terminal nodes (COMPLETE, FAILED) | `process` (default) | "COMPLETE" |
| Default (no clear signal) | omit (defaults to `process`) | |

**Interaction with shapes**: `role: "data"` sets the shape to hexagon, but
diamond-shaped nodes (decisions) and interface port nodes (ellipses) keep their
shapes regardless of role. Only set `role: "data"` on nodes that truly represent
artifacts, not on process nodes that happen to produce output.

### When to use role

- **Always assign** `role: "data"` to modules/nodes that are clearly data
  artifacts. This is the primary visual signal for distinguishing I/O from logic.
- **Never assign** `role: "process"` explicitly — it's the default when `role`
  is omitted. Only use the field to mark data elements.
- **Mixed modules**: If a module contains both processing and data nodes, set
  the module role based on its primary purpose. Individual nodes within can
  have their own role overrides.

---

## Status Assignment (implementation maturity)

The `status` field conveys how mature each component is — from a gleam in
someone's eye (`planned`) to human-approved production code (`verified`). In
AI-assisted workflows, this is critical: viewers need to see at a glance which
parts of the graph represent real, working code and which are aspirational.

### Status Values

| Status | Meaning | Typical Signal |
|--------|---------|----------------|
| `verified` | Human reviewed and approved | Has tests, passing CI, reviewed PR |
| `ai-tested` | AI iterated and tests pass | AI wrote it, tests pass, no human review yet |
| `needs-review` | AI flags for human attention | Complex logic, security-sensitive, or AI uncertain |
| `draft` | AI wrote first pass, untested | Code exists but no tests or validation |
| `planned` | Described but no code yet | Documented in specs/plans but not implemented |

### Module Status Inference

| Signal | Status |
|--------|--------|
| Module's scripts all have test files + tests pass + has reviewed PRs | `verified` |
| Module's scripts have tests, tests pass, no human review evidence | `ai-tested` |
| Module has scripts but AI is uncertain about correctness or coverage | `needs-review` |
| Module has scripts but no test coverage | `draft` |
| Module described in docs/plans but directory is empty or doesn't exist | `planned` |
| No clear signal | omit (defaults to `ai-tested` visual treatment) |

### Node Status Inference

| Signal | Status |
|--------|--------|
| Node represents a step with tested, reviewed implementation | `verified` |
| Node represents a step with AI-written code + passing tests | `ai-tested` |
| Node represents complex/sensitive logic that AI flagged | `needs-review` |
| Node represents a step with initial code but no validation | `draft` |
| Node represents a step described in plans but not yet coded | `planned` |
| No clear signal | omit (defaults to `ai-tested` visual treatment) |

### Inference Heuristics

When scanning a project, use these signals to determine status:

| Evidence | Inferred Status |
|----------|----------------|
| File has corresponding `test_*.py` or `*.test.ts` + tests pass | `ai-tested` or higher |
| File appears in merged/reviewed PRs | `verified` |
| File has TODO/FIXME/HACK comments | `needs-review` |
| File exists but is mostly boilerplate or stubs | `draft` |
| Path referenced in docs/plans but `ls` shows no file | `planned` |
| Directory exists but is empty | `planned` |
| No test file exists for the script | `draft` |
| Complex business logic without clear test coverage | `needs-review` |

### When to assign status

- **Always assign** status to modules. This is the most impactful level — users
  see module status when the graph is collapsed (the default view).
- **Assign to nodes** when they vary within a module. If all nodes in a module
  share the same status, set it on the module and omit from individual nodes.
- **Omit** when the default (`ai-tested`) is accurate. Only add the field to
  distinguish from the default.
- **For new projects** being visualized for the first time, default to `ai-tested`
  for existing code and `planned` for documented-but-unimplemented components.
- **For design-mode graphs** (`--objective`), default all to `planned` since
  no code exists yet.

---

## Design-Mode Confidence Heuristics

When generating a graph from a natural language objective (`--objective`), the LLM
must self-assess confidence for each module and edge. There is no codebase to scan,
so confidence reflects how standard vs domain-specific each stage is.

### Module Confidence

| Stage Type | Confidence | needsHumanReview | Rationale |
|-----------|-----------|-----------------|-----------|
| Standard data loading (fetch, parse, store) | `high` | `false` | Well-understood patterns with minimal domain variation |
| Standard cleaning (normalize, deduplicate, filter) | `high` | `false` | Generic transformations that apply across domains |
| Standard output/export (format, serialize, deliver) | `high` | `false` | Well-defined transformation to target format |
| Domain-specific variable construction | `low` | `true` | "Requires domain knowledge to choose correct operationalization" |
| Statistical/analytical modeling choices | `low` | `true` | "Multiple valid strategies; choice affects conclusions" |
| Quality thresholds and acceptance criteria | `medium` | `true` | "Thresholds depend on domain norms and use case" |
| Novel or custom algorithm | `low` | `true` | "Non-standard approach; correctness hard to verify automatically" |
| Integration/orchestration (glue between stages) | `medium` | `false` | Dependencies clear but ordering may need refinement |
| Human review/approval gates | `high` | `false` | Gate structure is standard; criteria are domain-specific (captured in description) |

### Edge Confidence

| Edge Type | Confidence | Rationale |
|----------|-----------|-----------|
| Sequential within standard stages | `high` | Ordering is self-evident |
| Cross-module handoff with clear artifact | `high` | Data contract is explicit |
| Conditional branching | `medium` | Branch conditions may need domain refinement |
| Feedback/retry loops | `low` | Loop termination criteria are domain-specific |
| Edges involving domain-specific stages | `low` | Data requirements may be wrong |

### When to set needsHumanReview

Set `needsHumanReview: true` on a module when ANY of these apply:
- The module involves domain-specific decisions (variable definitions, model selection)
- The module sets thresholds or acceptance criteria
- The module's correctness depends on context the LLM cannot verify
- The `checkpointReason` would be non-trivial (i.e., there's something specific to flag)

Always provide a `checkpointReason` string when `needsHumanReview` is true.

---

## Design-Mode Defaults

When generating a graph from `--objective` (design mode), no code exists yet.
Apply these defaults throughout graph generation:

| Field | Default | Rationale |
|-------|---------|-----------|
| All `status` | `"planned"` | No code exists yet |
| `module.confidence` | Per heuristic table above | Self-assessed certainty |
| `module.needsHumanReview` | Per heuristic table above | Flag domain-specific stages |
| `module.checkpointReason` | Required when `needsHumanReview: true` | Explain what needs expert input |
| `module.interface` | **Always required** | AI is designing, so always has evidence for the data contract |
| `node.files` | **Omit** | No files exist |
| `node.style.trust` | **Omit** | No provenance yet |
| `edge.details` | **Omit** | No scripts exist |
| `edge.description` | **Required on cross-module edges** | No code files to reference; descriptions are primary documentation |
| `edge.actor` | Inferred from stage type | Use domain knowledge (e.g., "human review" → `human`) |
| `legend.trustLevels` | **Omit** | Not meaningful without real provenance |
| `_generationMode` | `"design"` | Marks graph as design-mode output |
| `_objective` | The user's objective text | Preserves the original intent |
| `_generatedAt` | Current ISO 8601 timestamp | Records when the design was created |

### Visual appearance of design-mode graphs

Because all elements have `status: "planned"`, the graph renders at 20% opacity
with dotted borders and gray labels. This immediately communicates "nothing is built
yet." As the user implements components and re-scans with Input A (`/visualize-project .`),
elements gradually gain opacity — a natural progress indicator.

---

## Module Detection

A directory or section becomes a module when ANY signal matches:

| Signal | Source | Priority | Example |
|--------|--------|----------|---------|
| Directory with CLAUDE.md | Glob | 1 | `scripts/review/CLAUDE.md` |
| Directory with 2+ scripts | Glob | 1 | `scripts/discovery/*.py` |
| Data directory with distinct I/O role | Glob | 1 | `data/raw/`, `data/clean/` |
| Package with `__init__.py` or `__main__.py` | Glob | 2 | `scripts/lib/` |
| Directory with Makefile target | Read | 2 | `build:`, `test:`, `deploy:` |
| Top-level workflow section in CLAUDE.md | Read | 3 | `### Workflow: Download` |
| Named pipeline stage in docs | Read | 3 | `## Phase 1 — Discovery` |
| CI/CD stage | Read | 3 | `.github/workflows/` jobs |

When signals conflict (e.g., docs describe 3 phases but folders suggest 5),
prefer the folder structure — it reflects actual organization.

### Module ID Convention

- Prefix: `mod_` for regular modules, `phase_` for phase groupings
- Body: lowercase directory or section name, underscores for spaces
- Examples: `mod_discovery`, `mod_review`, `phase_input`

## Node Detection

### Shape Assignment

| Signal (in text) | Shape | Meaning |
|-------------------|-------|---------|
| Default / data state / step | `round-rectangle` | State or data point |
| "if", "check", "gate", "verify", "validate", "decide" | `diamond` | Decision/branch |
| "process", "run", "execute", "transform", "compute" | `ellipse` | Process/action |
| Terminal: "complete", "done", "included", "success" | `round-rectangle` | Terminal (green override) |
| Terminal: "fail", "error", "excluded", "rejected" | `round-rectangle` | Terminal (red override) |

### Trust Level Assignment

Only include trust levels when the project has clear provenance semantics.
Trust levels drive the Provenance view mode color scheme, not borders (P2.2).

| Signal | Trust | Provenance View Color |
|--------|-------|-----------------------|
| Raw input, unprocessed data | `normal` | Default (module color) |
| Script output, automated result | `auto` | Default + tag |
| AI/LLM-generated content | `ai` | Trust color + tag |
| Human-reviewed, manually verified | `verified` | Trust color + tag |

### Node ID Convention

- Format: `{module_prefix}_{short_name}` (lowercase, underscores)
- Keep short: 2-15 chars after prefix
- Examples: `disc_new`, `acq_downloaded`, `rev_pass`

### Node Label Convention

- Format: `module_name.state_name` (dot notation)
- Terminal labels: ALL CAPS (`INCLUDED`, `EXCLUDED`, `FAILED`, `COMPLETE`)
- Examples: `discovery.scored`, `review.ai_pass`, `INCLUDED`

## Edge Detection

### Style Assignment

| Signal | Style |
|--------|-------|
| Sequential steps (1 → 2 → 3) | `"solid"` |
| Script A output feeds Script B | `"solid"` |
| "retry", "loop", "re-run", "feedback" | `"dashed"` |
| "optional", "may", "if available" | `"dashed"` |
| Error recovery path | `"dashed"` |
| Default | `"solid"` |

### Actor Assignment

| Signal (in text or file type) | Actor |
|-------------------------------|-------|
| `.py`, `.sh`, `.ts` script invocation | `"script"` |
| `Makefile`, `CI/CD`, `cron`, automated | `"script"` |
| "review", "approve", "manually", "human" | `"human"` |
| "AI", "LLM", "Claude", "GPT", "model" | `"ai"` |
| "review + fix", human edits AI output | `"mixed"` |
| Default (no signal) | omit field |

### Edge Label Convention

- Short verb phrases: "validate", "clean", "review"
- Script names when specific: "clean_*.py", "build_registry.py"
- Conditions: "score >= 70", "all pass", "any fail"

## Description Extraction

Natural language descriptions make the graph self-documenting. Extract them
from existing project documentation — do not invent content.

### Sources (priority order)

| Element | Primary Source | Fallback |
|---------|---------------|----------|
| Graph `description` | CLAUDE.md first paragraph or "## Overview" | README.md project description |
| Module `description` | CLAUDE.md section matching module name | README.md section, docstring in `__init__.py` |
| Node `description` | Docstring in the script the node represents | Inline comment near the function definition |
| Edge `description` | Prose connecting two documented steps | Script-level comment explaining the handoff |

### When to include descriptions

| Element | Include description? |
|---------|---------------------|
| Graph root | **Always** — every graph gets a description |
| Modules | **Always** — every module gets a description |
| Nodes: decision/gate (diamond) | **Yes** — explain the branching criteria |
| Nodes: complex processing | **Yes** — explain what the step does |
| Nodes: simple pass-through | **Skip** — the label is sufficient |
| Nodes: terminals (COMPLETE, FAILED) | **Skip** — self-explanatory |
| Edges: cross-module | **Yes** — explain what data crosses the boundary |
| Edges: conditional/branching | **Yes** — explain the condition |
| Edges: simple sequential within a module | **Skip** — the label is sufficient |

### Module interface extraction

For each module, populate `interface.inputs` and `interface.outputs`:

| Signal | Interface field |
|--------|----------------|
| Script `open()`, `read_csv()`, CLI args | `inputs[].name` + `format` |
| Script `to_csv()`, `json.dump()`, stdout | `outputs[].name` + `format` |
| Data directory as input | `inputs[].name` = directory name |
| Data directory as output | `outputs[].name` = directory name |
| README describing data format | `inputs/outputs[].description` + `format` |
| Example file in repo | `inputs/outputs[].example` (first few lines) |

## Edge Details Detection

Populate `details` when edges represent script invocations:

| Detail field | How to detect |
|-------------|---------------|
| `script` | Explicit script path in docs or backtick reference |
| `input` | `open(`, `read_csv(`, `json.load(`, CLI args, stdin |
| `output` | `to_csv(`, `json.dump(`, `write(`, stdout redirect |
| `updates` | In-place file modifications, database writes |
| `docs` | Referenced markdown files, README links |

## Cross-Module Edge Minimization

**Core rule: 1 edge per module pair.** When any two modules are collapsed,
there should be at most 1 edge between them. Multiple edges between the same
pair means the module boundaries need restructuring (see Principles 2, 8, 9).

### Restructuring Patterns

#### Pattern 1: Collector (many internal → one exit)

When multiple internal paths all need to reach the same external target,
merge them into a single exit node:

```
BEFORE (3 cross-module edges from A to B):
  A_pass  ──→ B_target
  A_warn  ──→ B_target
  A_fail  ──→ B_target

AFTER (1 cross-module edge):
  A_pass  ──→ A_exit    (intra-module)
  A_warn  ──→ A_exit    (intra-module)
  A_fail  ──→ A_exit    (intra-module)
  A_exit  ──→ B_entry   (1 cross-module edge)
```

#### Pattern 2: Router Entry (one external → many internal)

When external modules send to different internal nodes, add a single
entry router:

```
BEFORE (2 edges from X to different nodes in A):
  X_exit  ──→ A_path1
  X_exit  ──→ A_path2

AFTER (1 cross-module edge):
  X_exit  ──→ A_entry   (1 cross-module edge)
  A_entry ──→ A_path1   (intra-module)
  A_entry ──→ A_path2   (intra-module)
```

#### Pattern 3: Sub-Phase Wrapping (fan-out to N parallel modules)

When one source dispatches to N parallel modules that later converge,
wrap them in a sub-phase:

```
BEFORE (N cross-module edges):
  Source ──→ ModA, ModB, ModC, ModD

AFTER (1 cross-module edge when sub-phase collapsed):
  Source ──→ Dispatcher   (1 edge into sub-phase)
  Dispatcher ──→ ModA     (internal to sub-phase)
  Dispatcher ──→ ModB     (internal to sub-phase)
  ...
  ModA ──→ Collector      (internal to sub-phase)
  ModB ──→ Collector      (internal to sub-phase)
  ...
  Collector ──→ Target    (1 edge out of sub-phase)
```

The dispatcher and collector are direct children of the sub-phase, not
members of any child module. They serve as the sub-phase's interface.

### Verification Checklist

After defining all edges, verify at each hierarchy level:

| Level | Check |
|-------|-------|
| Phase → Phase | At most 1 forward + 1 backward edge per pair |
| Module → Module (same phase) | At most 1 edge per pair |
| Node → Node (same module) | Unconstrained |
| Any node → Terminal | Terminal within own module, not cross-phase |
| Cross-level | No edges skip hierarchy levels (except dashed recovery) |

## Scope Warnings

| Condition | Action |
|-----------|--------|
| >50 nodes | Warn user, suggest `--focus` |
| >80 nodes | Strongly recommend `--focus` |
| <3 nodes | Warn: graph may be too sparse to be useful |
| >12 modules | Wrap colors; suggest `--depth 1` for flat view |
| No CLAUDE.md found | Fall back to README.md, Makefile, package.json |
| No documentation at all | Use directory structure + script filenames only |
