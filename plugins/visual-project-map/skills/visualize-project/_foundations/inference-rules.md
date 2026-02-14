# Inference Rules

Lookup tables for detecting modules, nodes, edges, and their properties
from project structure and documentation.

## Module Design Principles

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

| Signal | Trust | Border |
|--------|-------|--------|
| Raw input, unprocessed data | `normal` | solid, thin |
| Script output, automated result | `auto` | solid, thin + tag |
| AI/LLM-generated content | `ai` | dashed + tag |
| Human-reviewed, manually verified | `verified` | solid, thick + tag |

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
