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

### Principle 2: Modules are interfaces with few ports

Each module should have at most **2-3 entry nodes** (where edges arrive from
other modules) and **2-3 exit nodes** (where edges leave to other modules).
Internal nodes connect only to siblings within the same module.

If you can't describe what goes into a module and what comes out in one sentence,
the module boundary is probably wrong.

### Principle 3: Settle before exporting

A module should resolve its internal branching before connecting to other modules.
If three internal paths all lead to the same external destination, add a collector
node that merges them into one exit — don't draw three cross-module edges. The
module "settles" its internal state, then exports a clean result.

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
cross-module edge overload. Almost every graph benefits from adding collector
nodes in source modules before routing to terminals.

### Generation Sequence

Follow this order to produce clean graphs:

1. **Draft modules** from folder structure and codebase organization
2. **Assign nodes** to the module where they have the most sibling connections
3. **Draw internal edges** within each module
4. **Identify exit/entry points** — which nodes need cross-module connections?
5. **Check the budget** — any node with >3 cross-module edges? Add collectors/dispatchers
6. **Verify encapsulation** — can you describe each module's interface in one sentence?

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

When building the graph, minimize edges that cross module boundaries.
Cross-module edges create visual clutter, especially when modules are
collapsed and meta-edges accumulate.

### Rule: Maximum 3 cross-module edges per node

If a node would have >3 cross-module incoming edges or >3 cross-module
outgoing edges, restructure with collector or dispatcher nodes.

### Collector Pattern (many-to-one fan-in)

When multiple nodes in Module A all connect to a single target in Module B:

```
BEFORE (3 cross-module edges):
  A_pass  ──→ B_target
  A_warn  ──→ B_target
  A_fail  ──→ B_target

AFTER (1 cross-module edge):
  A_pass  ──→ A_ready   (intra-module)
  A_warn  ──→ A_ready   (intra-module)
  A_fail  ──→ A_ready   (intra-module)
  A_ready ──→ B_target  (1 cross-module edge)
```

### Dispatcher Pattern (one-to-many fan-out)

When a node fans out to targets in many different modules:

```
BEFORE (6 cross-module edges):
  A_pass  ──→ B_pend, C_pend, D_pend
  A_human ──→ B_pend, C_pend, D_pend

AFTER (3 cross-module edges):
  A_pass  ──→ A_ready   (intra-module)
  A_human ──→ A_ready   (intra-module)
  A_ready ──→ B_pend    (cross-module)
  A_ready ──→ C_pend    (cross-module)
  A_ready ──→ D_pend    (cross-module)
```

### When to Apply

| Condition | Action |
|-----------|--------|
| Same node pair duplicated (A_x → B, A_y → B) | Add collector in Module A |
| Same source fans to 4+ modules | Add dispatcher node |
| Terminal node receives from 4+ modules | Add collectors in source modules |

## Scope Warnings

| Condition | Action |
|-----------|--------|
| >50 nodes | Warn user, suggest `--focus` |
| >80 nodes | Strongly recommend `--focus` |
| <3 nodes | Warn: graph may be too sparse to be useful |
| >12 modules | Wrap colors; suggest `--depth 1` for flat view |
| No CLAUDE.md found | Fall back to README.md, Makefile, package.json |
| No documentation at all | Use directory structure + script filenames only |
