---
name: visualize-project
description: >
  Analyze a project directory to generate an interactive workflow graph,
  design a workflow from a natural language objective, or propose a
  refactored folder structure toward an objective. Scans CLAUDE.md
  files, script dependencies, and folder structure (Input A), generates
  a complete workflow design from a stated objective (Input B), or combines
  scan + redesign to produce a refactoring plan (Input A + --refactor).
  Produces a visual-project-map JSON with modules, nodes, edges, and actor annotations.
argument-hint: "[directory-path] [--objective \"...\"] [--refactor] [--focus subdir] [--depth N] [--title \"...\"]"
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

---

## Phase 1 — Discovery

> **SPEC principles**: P8 (CLAUDE.md per module), P10 (embed folder hierarchy)

Scan the project to build a mental model of its structure and workflows.
Do steps 1.1-1.4 in parallel where possible.

### Step 1.1: Find documentation files

Use Glob to find:
```
**/CLAUDE.md
**/README.md
Makefile
*.sh
pyproject.toml
package.json
docker-compose.yml
```
If `--focus` is set, scope all globs under that subdirectory.
Skip `node_modules/`, `venv/`, `.venv/`, `.git/`, `__pycache__/`,
`dist/`, `build/`, `.next/`.

### Step 1.2: Read documentation

Read each CLAUDE.md and README.md found. Extract:

- **Workflow sections**: Look for headers containing "Workflow", "Pipeline",
  "Procedure", "Steps", "How to", "Usage". These define sequential processes.
- **Numbered/ordered lists**: `1. Do X  2. Do Y  3. Do Z` — these become
  sequential nodes connected by solid edges.
- **Code blocks with commands**: `python3 scripts/foo.py` or `npm run build`
  — these become edges with `actor: "script"` and populated `details`.
- **File paths in backticks**: Input/output files for edge `details`.
- **Section headings**: Major sections → candidate modules.
- **Decision language**: "if", "check", "verify", "gate", "validate",
  "decide", "when" → diamond-shaped decision nodes.
- **Human language**: "review", "approve", "manually", "human", "inspect"
  → edges with `actor: "human"`.
- **AI language**: "AI", "LLM", "Claude", "GPT", "model", "prompt"
  → edges with `actor: "ai"`.

### Step 1.3: Find scripts

Use Glob to find scripts:
```
**/*.py
**/*.ts
**/*.js
**/*.sh
**/*.R
```
Group by parent directory. Each directory with 2+ scripts is a candidate
module. Note script names — they often describe the workflow step.

### Step 1.4: Detect I/O patterns

For key scripts (those referenced in documentation, or entry points like
`main.py`, `run.sh`, `Makefile` targets), use Grep to find:

| Pattern | Meaning |
|---------|---------|
| `open(`, `read_csv`, `read_json`, `json.load`, `yaml.load` | Input files |
| `to_csv`, `to_json`, `json.dump`, `write(`, `savefig` | Output files |
| `subprocess`, `os.system`, `exec(` | Script invocations |
| `import` from sibling packages | Module dependencies |

Only do this for the ~10 most important scripts. Do not read every file
in a large codebase.

### Step 1.5: Synthesize

Before generating the graph, form a mental model by combining **all** signals
— folder structure, script groupings, data directories, and documentation:

- What are the major phases? Identify these from **directory structure first**
  (e.g., `scripts/ingest/`, `scripts/clean/`, `scripts/export/`), then confirm
  with documentation (e.g., "Workflow: Ingest → Clean → Export").
- What data flows between phases? Look for directories that are outputs of one
  phase and inputs to the next (e.g., `data/raw/` → `data/processed/`).
- Where are decision points? Look for gate/check scripts, conditional logic,
  validation steps.
- Who does what? (human, script, AI)
- **Module interfaces**: For each candidate module, can you state in one sentence
  what goes in and what comes out? If not, the boundary may need adjustment.

Consult `_foundations/inference-rules.md` § "Module Design Principles" for the
full set of principles governing module design.

- **Directory completeness check**: Compare the candidate module list against
  the full directory tree. Every non-trivial directory (containing scripts,
  data, or documentation) should appear as a module or be explicitly excluded
  with a reason (e.g., `.git/`, `node_modules/`). Missing directories cause
  gaps in the graph that are hard to spot later.

---

## Phase 1B — Design from Objective (Input B only)

**Skip this phase entirely if using Input A (directory scan).** This phase replaces
Phase 1 when `--objective` or `--objective-file` is provided.

### Step 1B.1: Parse the Objective

Read the objective text (from `--objective` string or `--objective-file` contents).
Extract:

- **Domain**: What field is this? (econometrics, ML, ETL, web dev, data science, etc.)
  Use `--domain` hint if provided; otherwise infer from keywords.
- **Final deliverable**: What is the end product? (estimate, model, database, report,
  dashboard, API, etc.)
- **Key entities**: What are the main data objects? (records, patients, transactions,
  images, documents, etc.)
- **Constraints**: From `--constraints` flag and from the objective text itself
  (languages, tools, data sources, scale, timeline).
- **Scale signals**: Words like "large-scale", "real-time", "batch", "distributed"
  affect architecture.
- **Decision/human signals**: "review", "approve", "expert judgment", "domain knowledge"
  → stages that need `needsHumanReview: true`.
- **AI signals**: "LLM", "model", "classify", "predict", "generate" → stages with
  `actor: "ai"`.

### Step 1B.2: Identify Workflow Stages

Decompose the objective into sequential stages using domain knowledge. Do NOT use
rigid templates — the LLM already knows how these workflows are structured. Instead,
reason from first principles about what must happen to get from raw inputs to the
final deliverable.

**Guiding questions:**
1. What data do I need, and where does it come from?
2. What cleaning/validation does the raw data need?
3. What domain-specific transformations produce the analytical variables?
4. What analytical/modeling steps produce the result?
5. What validation/review gates ensure quality?
6. How is the result packaged and delivered?

Each answer becomes a candidate module. Group related answers into phases if
`--depth 2`.

**Domain-specific patterns** (use as starting points, not rigid templates):
- **Research/econometrics**: data acquisition → sample construction → variable
  construction → estimation → inference → reporting
- **ETL**: extract → validate → transform → load → verify
- **ML pipeline**: data collection → feature engineering → training → evaluation →
  deployment → monitoring
- **Web application**: data layer → business logic → API → frontend → deployment

### Step 1B.3: Define Data Flow

For each adjacent stage pair, identify the intermediate artifact that crosses the
boundary:

- **Name**: What is the artifact called? (e.g., "clean_panel", "feature_matrix",
  "model_checkpoint")
- **Format**: What format will it take? (CSV, Parquet, JSON, SQLite, pickle, etc.)
- **Quality checks**: What must be true about this artifact for the next stage to
  proceed? (e.g., "no missing treatment indicators", "all dates in ISO format")

This produces the `module.interface` fields — `inputs` and `outputs` for each module.

### Step 1B.4: Assess Confidence and Review Needs

For each module from Step 1B.2, self-assess using the lookup table in
`_foundations/inference-rules.md` § "Design-Mode Confidence Heuristics":

- Is this stage a **standard pattern** (high confidence) or **domain-specific**
  (low confidence, needs review)?
- Does the stage involve **decisions that require expertise** to validate?
- What specifically should a domain expert check? → `checkpointReason`

### Step 1B.5: Synthesize

Combine the outputs of Steps 1B.1–1B.4 into a structured model:

- **Phases** (if `--depth 2`): group stages into 2–4 high-level phases
- **Modules**: one per workflow stage, with interface, confidence, and review flags
- **Data flow**: the artifacts connecting modules
- **Actor assignments**: which stages are human, AI, script, or mixed
- **Review gates**: where domain experts need to sign off

This model feeds directly into Phase 2 for graph generation. All elements will
have `status: "planned"` and no file annotations.

---

## Phase 1C — Refactor (scan + redesign)

**Skip this phase unless `--refactor` is passed.** This phase combines Phase 1 (scan)
and Phase 1B (design) to produce a refactoring plan. Requires `--objective`.

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

## Phase 2 — Graph Generation

> **SPEC principles**: P1 (interfaces as primary content), P3 (complexity inside modules),
> P4 (confidence encoded), P5 (progressive disclosure), P6 (skill generates interfaces),
> P10 (modules = directories), P11 (one edge per module pair)

Transform the discovery results into graph JSON elements.
Consult `_foundations/inference-rules.md` for all lookup tables.
Consult `_foundations/color-palette.md` for color assignments.
Consult `_foundations/graph-schema.md` for field requirements.

> **Design-mode defaults** (when using `--objective`):
> Apply these throughout Phase 2. See `_foundations/inference-rules.md` §
> "Design-Mode Defaults" for the full table.
> - All `status`: `"planned"` — no code exists yet
> - **Omit**: `node.files`, `node.style.trust`, `edge.details`, `legend.trustLevels`
> - **Always generate**: `module.interface` with inputs and outputs
> - **Always generate**: `edge.description` on all cross-module edges
> - **Assign per module**: `confidence` and `needsHumanReview` per inference rules
> - **Assign per edge**: `confidence` per inference rules

> **Refactor-mode defaults** (when using `--refactor`):
> Apply these throughout Phase 2.
> - Base graph uses **current** scan results (real folders, files, statuses)
> - Proposed changes encoded in `plan` field (not replacing the base graph)
> - `_generationMode`: `"refactor"`
> - `_objective`: the refactoring objective text
> - Module `status`: preserve current values for unchanged modules; use `"planned"` for new modules
> - **Always generate**: `plan.summary` with goal and tasks
> - **Always generate**: `plan.annotations` for every changed module, node, and edge

### 2.0: Write Graph Description

Write a one-paragraph `description` for the graph root that explains:
- What this project/pipeline does end-to-end
- What the major stages are at a high level
- What the final output or outcome is

This becomes the graph's README — anyone viewing it should understand the
overall purpose without expanding a single module. Keep it to 1-3 sentences.

### 2.1: Define Modules

Modules are abstraction boundaries — they hide internal complexity behind
a small interface. Design them **top-down from structure**, not bottom-up
from edges. See `_foundations/inference-rules.md` § "Module Design Principles".

**Identification order** (structure first, docs second):
1. **Folder structure**: Each directory with scripts or a distinct data role
   → candidate module. Parent directories → candidate phases.
2. **Package organization**: `__init__.py`, import graphs, subpackages.
3. **Data flow directories**: Directories that are outputs of one step and
   inputs to the next (e.g., `data/raw/` → `data/clean/`).
4. **Documentation sections**: Workflow headers in CLAUDE.md or README.md
   confirm and label the modules identified from structure.
5. **Build/CI targets**: Makefile rules, CI stages, npm scripts.

When folder structure and documentation disagree, prefer folder structure —
it reflects how the developer actually organized the code.

**Nesting:**
- If `--depth 2`: group related modules into phases (by parent directory
  or by workflow section). Create phase modules with `parent` omitted,
  and child modules with `parent` pointing to their phase.
- If `--depth 1`: no phases, only flat modules.

**Module IDs:**
- Phase: `phase_{name}` (lowercase, underscores)
- Module: `mod_{name}` (lowercase, underscores)

**Color assignment:**
- Phase modules: use phase colors 0-3 from color-palette.md
- Child modules: use module colors 0-10 from color-palette.md, in order
- Terminal/sink module: always Slate (#11)

**Interface check:** After defining modules, verify each one has a clear
interface — ideally **1 entry point** and **1 exit point** connecting to
other modules. If a module pair would need 2+ edges between them,
restructure: merge them, split differently, or wrap in a sub-phase
(see `_foundations/inference-rules.md` § Principles 2, 8, 9).

**Interface–exit node convention:** The module's `interface.outputs` names
should correspond to the module's exit node(s). If a module has one output
named `"validated_records"`, the last node in the module (from which the
cross-module edge departs) should reflect that — e.g., a collector node
labeled `"validated_records"` or `"validate.output"`. This makes the
collapsed interface map consistent with the expanded internal view.

**Keep it focused:** Aim for 3-10 modules. If you detect >12, merge
related directories or suggest `--focus`. Target 3-8 nodes per module.

**Module docPath:** For each module, if a CLAUDE.md was found in the
corresponding directory during Step 1.1, set `docPath` to its relative
path (e.g., `"plugins/visual-project-map/viewer/src/CLAUDE.md"`). This
lets the viewer show which folders have documentation (SPEC Folder Premise).
Omit `docPath` in design mode since no files exist yet.

**Module descriptions:** Add a `description` field to every module — one
sentence explaining what it does and why it exists as a separate boundary.
Extract from CLAUDE.md section headers, README descriptions, or docstrings.
Example: `"Downloads candidate records from PubMed API, validates schema,
and deduplicates against the existing corpus."`

**Module interfaces:** For each module, populate the `interface` field with
`inputs` and `outputs` arrays describing the data crossing its boundary.
Each entry has `name` (required), `description`, `format`, and `example`.
Extract these from script I/O detected in Step 1.4. Example:
```json
{
  "interface": {
    "inputs": [
      { "name": "raw_records", "description": "JSON files from API fetch", "format": "JSON array, one file per source" }
    ],
    "outputs": [
      { "name": "validated_records", "description": "Schema-conformant records with duplicates removed", "format": "CSV with columns: id, title, abstract, source" }
    ]
  }
}
```
Only include interfaces you have evidence for — don't invent formats.

**Module role:** Assign `role: "data"` to modules that represent data
artifacts, storage, or configuration — things described with nouns
(inventory, config, output). Process modules (described with verbs:
discover, clean, export) are the default and should omit `role`.
See `_foundations/inference-rules.md` § "Role Assignment" for the full
lookup table. Common data modules: directories named `data/`, `output/`,
`config/`; modules holding intermediate artifacts between processing stages.

**Module status:** Assign `status` to every module to convey implementation
maturity. Use these signals:
- `verified` — scripts have tests, tests pass, code has been human-reviewed
- `ai-tested` — AI-written code with passing tests (default if omitted)
- `needs-review` — AI flagged for human attention (complex logic, security)
- `draft` — code exists but no tests or validation
- `planned` — documented in specs/plans but no code yet

See `_foundations/inference-rules.md` § "Status Assignment" for detailed
heuristics. For new projects, default to `ai-tested` for existing code
and `planned` for unimplemented components.

**Design-mode modules** (when using `--objective`):
- Modules come from the stages identified in Step 1B.2, not from folder structure
- **Always** set `status: "planned"` on every module
- **Always** include `interface` with `inputs` and `outputs` — the AI designed
  this workflow, so it always has evidence for the data contract
- **Always** include `confidence` and `needsHumanReview` per the heuristics in
  `_foundations/inference-rules.md` § "Design-Mode Confidence Heuristics"
- **Always** include `checkpointReason` when `needsHumanReview` is true
- Module `description` is especially important in design mode — it's the primary
  documentation since no code or CLAUDE.md exists

### 2.2: Define Nodes

**From workflow steps:** Each numbered step, documented state, or
script invocation → node.

**Node shapes** (from inference-rules.md):
- Default state/step → `round-rectangle`
- Decision/check/gate → `diamond`
- Process/action → `ellipse`
- Terminal success → `round-rectangle` with green color override
- Terminal failure → `round-rectangle` with red color override

**Node IDs:** `{short_module}_{short_state}` — lowercase, underscores,
2-15 chars after prefix. Examples: `disc_new`, `proc_clean`, `out_done`.

**Node labels:** Use `module.state` dot notation for regular nodes.
Use ALL CAPS for terminals (`INCLUDED`, `COMPLETE`, `FAILED`).

**Trust levels:** Only add `style.trust` if the project has clear
provenance semantics (raw → automated → AI → verified). For most
projects, omit trust and the `legend.trustLevels` section entirely.

**File annotations:** When a node represents a step with known file I/O
(detected in Step 1.4), add the `files` field:
```json
{ "files": { "reads": ["path/to/input.csv"], "writes": ["path/to/output.csv"] } }
```
Only include paths you actually found in the codebase. Use directory paths
(without trailing slash) when the step reads/writes an entire directory.

**Node descriptions:** Add a `description` field to nodes where the label
alone is ambiguous or the step is non-trivial. Not every node needs one —
skip descriptions for self-explanatory terminals like `COMPLETE` or trivial
pass-through states. Focus on decision nodes, complex processing steps, and
entry/exit points. Extract from docstrings, inline comments, or README prose.
Example: `"Checks JSON schema conformance. Records with missing required
fields are routed to the error path."`

**Node role:** Assign `role: "data"` to nodes that represent files,
datasets, intermediate artifacts, or configuration — things that are
produced or consumed rather than things that do work. Process nodes
(default) should omit `role`. Decision nodes (diamonds) and interface
ports keep their shapes regardless of role. See
`_foundations/inference-rules.md` § "Role Assignment".

**Node status:** Assign `status` to nodes when they differ from their
parent module's status. If all nodes in a module share the same maturity
level, set `status` on the module and omit from individual nodes.
When nodes within a module vary (e.g., some steps are implemented while
others are planned), set per-node status. See
`_foundations/inference-rules.md` § "Status Assignment".

**Sequential vs parallel internal structure:** Before chaining nodes inside
a module, determine whether steps are truly sequential (each depends on the
previous) or parallel (independent files/resources consulted together).
Do not force parallel data into a sequential chain — this creates false
dependencies and misrepresents the workflow. For parallel resources, create
independent nodes and converge them into a **collector node** that represents
the combined output. The collector node is the module's exit point for
cross-module edges.

Example — a module with three independent reference files:
```
schema.json ──→ ┐
inference.md ──→ ├── lookup_tables (collector)
colors.md ─────→ ┘
```
Not: `schema.json → inference.md → colors.md → exit` (false sequential chain).

**Scope guard:** Aim for 8-40 nodes. If >50, only include nodes that
are documented or represent significant state transitions.

**Design-mode nodes** (when using `--objective`):
- Nodes come from the logical sub-steps within each module (Step 1B.2)
- **Omit** `files` — no files exist yet
- **Omit** `style.trust` — no provenance yet
- All nodes inherit `status: "planned"` from their module (no need to set per-node)
- Node `description` is more important than usual — describe what the step will
  do, not what it currently does
- Decision nodes (diamonds) should describe the branching criteria that a domain
  expert will need to define

### 2.3: Define Edges

**From sequential steps:** Step N → Step N+1: `style: "solid"`.

**From script I/O:** If Script A outputs file X and Script B reads
file X, create an edge A_output → B_input with:
- `style: "solid"`
- `actor: "script"`
- `details: { script, input, output }`

**From documentation flow:** Follow the narrative in CLAUDE.md —
"after downloading, standardize" → edge from download node to
standardize node.

**Edge styles:**
- Forward/primary flow → `"solid"`
- Retry/feedback/loop → `"dashed"`
- Optional/conditional → `"dashed"`

**Actor assignment:**
- Script invocation → `"script"`
- Human action → `"human"`
- AI/LLM step → `"ai"`
- Mixed → `"mixed"`
- No clear signal → omit `actor` field

**Edge labels:** Short verb phrases. Include script name if specific.
Include conditions if branching (`"score >= 70"`, `"all pass"`).

**Edge descriptions:** Add a `description` field to edges where the short
label is insufficient. Focus on cross-module edges (the ones visible when
collapsed), conditional branches, and feedback loops. The description
explains *what* happens and *why* this connection exists. Example:
`"Triggered nightly by cron. Passes validated records as a batch CSV to
the enrichment pipeline."` Skip descriptions for obvious sequential flows
where the label already says everything.

**Edge details:** Populate `details` only for edges that represent
concrete script invocations with known inputs/outputs. Do not invent
paths — only include file paths you actually found.

**Design-mode edges** (when using `--objective`):
- **Omit** `details` — no scripts exist yet
- **Always** include `description` on cross-module edges — since there are no
  code files to inspect, descriptions are the primary documentation for what
  data crosses each boundary
- **Always** include `confidence` per the heuristics in
  `_foundations/inference-rules.md` § "Design-Mode Confidence Heuristics"
- `actor` should be inferred from the stage type: stages described as manual
  review → `"human"`, LLM/model stages → `"ai"`, automated pipelines → `"script"`,
  human-in-the-loop → `"mixed"`
- Edge `label` should describe the transformation or handoff, not a script name

### 2.4: Define Legend (optional)

Only include `legend.trustLevels` if the project explicitly tracks
provenance (raw/auto/ai/verified states). For most projects, omit it.

When included, use this standard set:

```json
{
  "trustLevels": {
    "normal":   { "label": "Normal",   "borderStyle": "solid",  "borderWidth": 1.5 },
    "auto":     { "label": "Script",   "borderStyle": "solid",  "borderWidth": 1.5, "tag": { "text": "auto", "bg": "#dbeafe", "color": "#1e40af" } },
    "ai":       { "label": "LLM",      "borderStyle": "dashed", "borderWidth": 1.5, "tag": { "text": "AI",   "bg": "#fef3c7", "color": "#92400e" } },
    "verified": { "label": "Human",    "borderStyle": "solid",  "borderWidth": 3.5, "tag": { "text": "verified", "bg": "#d1fae5", "color": "#065f46" } }
  }
}
```

---

## Phase 3 — Assembly & Output

> **SPEC principles**: P2 (default view is interface map), P9 (validate and iterate),
> P11 (one edge per module pair — verified in Step 2.4b)

### 3.1: Construct JSON

Assemble the complete JSON object:

```json
{
  "title": "...",
  "description": "One-paragraph overview of the entire graph",
  "modules": [ ... ],
  "nodes": [ ... ],
  "edges": [ ... ],
  "legend": { ... }
}
```

### 2.4b: Enforce 1-Edge-Per-Module-Pair Rule

After defining all edges, verify cross-module connections following
`_foundations/inference-rules.md` § "Cross-Module Edge Minimization":

1. For every pair of modules, count edges between them
2. If any pair has **2+ edges**: restructure — do NOT just add more nodes.
   The right fix is usually one of:
   - Add a collector exit node inside the source module
   - Add a router entry node inside the target module
   - Wrap parallel targets in a sub-phase with dispatcher/collector
   - Merge the two modules if they are too tightly coupled
3. Verify at each hierarchy level: collapse phases mentally and check
   that each phase pair also has at most 1 edge
4. Terminal nodes: route through module exit nodes, not directly

### 3.2: Validate

Before writing, verify:
- Every node's `module` field references a valid module ID
- Every edge's `source` and `target` reference valid node IDs
- No duplicate IDs across modules, nodes
- Module `parent` fields (if any) reference valid phase module IDs
- Node `style.shape` is one of: `round-rectangle`, `diamond`, `ellipse`,
  `rectangle`, `hexagon`
- Edge `style` is `"solid"` or `"dashed"`
- Edge `actor` is `"human"`, `"ai"`, `"script"`, or `"mixed"` (or omitted)
- All color values are `#rrggbb` format
- No module pair has more than 1 edge between them (1-edge rule)
- Module/node `role` is `"process"` or `"data"` (or omitted for default process)
- Module/node `status` is one of: `"planned"`, `"draft"`, `"ai-tested"`, `"needs-review"`, `"verified"` (or omitted)
- Every module has a `status` assigned (either explicit or inferred as ai-tested)
- **Dead-end node check**: For every node in a non-terminal module, verify
  it has a path (through outgoing edges) to at least one cross-module edge
  or terminal node. A node with no outgoing edges and no cross-module edge
  leaving from it is a dead end — it means that node's output is lost.
  Fix by: adding the missing edge to the module's exit/collector node,
  or rethinking whether the node belongs in a different module.

### 3.3: Scope Check

| Condition | Action |
|-----------|--------|
| >50 nodes | Warn user, suggest `--focus` to narrow scope |
| >80 nodes | Strongly recommend `--focus`; offer to reduce |
| <3 nodes | Warn that graph may be too sparse |
| 0 edges | Something went wrong — re-examine sources |

### 3.4: Present Summary

Before writing the file, show the user a summary table:

```
Graph Summary: "Project Title"
  Phases:  3
  Modules: 8
  Nodes:   24
  Edges:   31

  Phase: Input Pipeline
    mod_discovery (4 nodes)
    mod_download  (3 nodes)
  Phase: Processing
    mod_clean     (5 nodes)
    mod_review    (6 nodes)
  Phase: Output
    mod_export    (4 nodes)
    mod_terminal  (2 nodes)
```

Ask: "Write this graph to `.graphs/{name}.json`?" (default: yes)

### 3.5: Write File

**Input A (scan mode):** Derive `{name}` from the project directory name (lowercase,
hyphens).

**Input B (design mode):** Derive `{name}` from the objective text — slugify the
first 4-6 meaningful words (lowercase, hyphens). Examples:
- `"Estimate causal effect of policy on employment"` → `causal-effect-policy-employment`
- `"Build ETL pipeline for CSV to PostgreSQL"` → `etl-csv-to-postgresql`

Add generation metadata to the JSON root:
```json
{
  "_generationMode": "design",
  "_objective": "the user's original objective text",
  "_generatedAt": "2026-02-16T14:30:00Z"
}
```

**Refactor mode:** Use the same `{name}` as the existing graph (overwriting it).
Save the pre-refactor version to `.graphs/{name}.prev.json` for diff overlay.
Add generation metadata:
```json
{
  "_generationMode": "refactor",
  "_objective": "the refactoring objective text",
  "_generatedAt": "2026-02-16T..."
}
```

Create `.graphs/` directory if it doesn't exist.
Write to: `.graphs/{name}.json`

Use the Write tool. Format the JSON with 2-space indentation.

### 3.5b: Suggest CLAUDE.md Scaffolding (Design Mode Only)

**Skip this step if using Input A (directory scan).**

After writing the graph JSON, print a suggested folder structure with `CLAUDE.md`
stubs for each module. The AI just designed the modules and their interfaces, so
it can generate the documentation scaffolding.

Derive the folder name from the module label (lowercase, underscores). Derive the
CLAUDE.md content from the module's `description` and `interface` fields. If the
module has `needsHumanReview: true`, append `; see SPEC.md for review criteria`.

**Default behavior (no `--scaffold`):** Print-only. Show the suggested structure
and let the user decide whether to adopt it.

Format:
```
Suggested folder structure with CLAUDE.md stubs:
  scripts/
    {module_name}/
      CLAUDE.md    # "{one-sentence objective}; inputs: {input names}; outputs: {output names}"
    ...
```

Example output:
```
Suggested folder structure with CLAUDE.md stubs:
  scripts/
    acquire/
      CLAUDE.md    # "Download raw data from API; inputs: api_config; outputs: raw_panel"
    clean/
      CLAUDE.md    # "Apply sample restrictions and balance panel; inputs: raw_panel; outputs: clean_panel; see SPEC.md for review criteria"
    variables/
      CLAUDE.md    # "Construct treatment, outcome, and control variables; inputs: clean_panel; outputs: analytical_dataset; see SPEC.md for review criteria"
    ...
```

**When `--scaffold` is passed:** Create the directories and files instead of
just printing them.

1. For each non-phase module in the graph:
   a. Derive folder path from module label (lowercase, underscores)
   b. Create directory with `os.makedirs(path, exist_ok=True)` (via Bash)
   c. Write CLAUDE.md using the Write tool with this format:

      ```markdown
      # {Module Label}

      {module.description}

      ## Inputs
      {for each interface.inputs entry:}
      - **{name}**: {description} ({format})

      ## Outputs
      {for each interface.outputs entry:}
      - **{name}**: {description} ({format})

      ## Specs
      {if needsHumanReview:}
      See `SPEC.md` for acceptance criteria. Review focus: {checkpointReason}
      {else:}
      See `SPEC.md` for acceptance criteria and edge cases.
      ```

   d. If the module has `needsHumanReview: true`, also write a SPEC.md stub:

      ```markdown
      # {Module Label} — Specification

      ## Acceptance Criteria
      {for each interface.outputs entry:}
      - [ ] Output `{name}` conforms to: {description}

      ## Edge Cases
      - (to be defined)

      ## Validation Checks
      - (to be defined)

      ## Human Review Required
      {checkpointReason}

      ### What requires domain expertise
      - (to be defined)

      ### What the AI can handle
      - (to be defined)
      ```

   e. Print confirmation: `Created {path}/CLAUDE.md` (and `Created {path}/SPEC.md` if applicable)

2. Do NOT overwrite existing CLAUDE.md or SPEC.md files — skip with a note:
   `Skipped {path}/CLAUDE.md (already exists)`

3. After creating files, print the same summary as the print-only mode

This connects to the Folder Premise in SPEC.md: each non-trivial folder has a
CLAUDE.md stating its objective, inputs, and outputs.

### 3.6: Serve and View

After writing, start the viewer using `serve.py` from the plugin's `scripts/`
directory. The serve script accepts an absolute path and automatically copies
the JSON into the viewer's `examples/` directory so the HTTP server can serve it.

```
Graph written to: .graphs/{name}.json

To view:
  python3 <plugin-install-path>/scripts/serve.py 8080 "$(pwd)/.graphs/{name}.json"
```

The `serve.py` script:
1. Copies the absolute graph path into the plugin's `examples/` directory
2. Starts an HTTP server rooted at the plugin directory
3. Opens the viewer in the default browser with the correct relative URL

**Important:** The `?graph=` URL parameter must be a path relative to
`viewer/index.html`, not an absolute filesystem path. The serve script
handles this conversion automatically. If starting the server manually,
use `?graph=../examples/{name}.json`.

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

## Worked Example

Given a project at `/path/to/data-pipeline/`:
```
data-pipeline/
  CLAUDE.md          # Has "Workflow: Ingest → Clean → Export"
  scripts/
    ingest/
      download.py    # reads API, writes raw/*.json
      validate.py    # reads raw/*.json, writes validated/*.json
    clean/
      normalize.py   # reads validated/*.json, writes clean/*.csv
      deduplicate.py # reads clean/*.csv, writes deduped/*.csv
    export/
      build_db.py    # reads deduped/*.csv, writes output.sqlite
  Makefile           # all: ingest clean export
```

Running `/visualize-project /path/to/data-pipeline --depth 1` produces:

```json
{
  "title": "Data Pipeline Workflow",
  "description": "ETL pipeline that downloads records from an API, normalizes and deduplicates them, then loads the results into a SQLite database.",
  "modules": [
    { "id": "mod_ingest", "label": "Ingest", "color": "#dbeafe", "borderColor": "#93c5fd",
      "status": "verified",
      "description": "Downloads raw JSON from the API and validates schema conformance.",
      "interface": {
        "inputs": [{ "name": "api_config", "description": "Source API endpoints and credentials", "format": "YAML" }],
        "outputs": [{ "name": "validated_json", "description": "Schema-valid JSON files", "format": "JSON, one file per record" }]
      }
    },
    { "id": "mod_clean", "label": "Clean", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "status": "ai-tested",
      "description": "Normalizes field formats and removes duplicate records." },
    { "id": "mod_export", "label": "Export", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "draft",
      "description": "Builds the final SQLite database from deduplicated CSV." },
    { "id": "mod_term", "label": "Terminals", "color": "#f1f5f9", "borderColor": "#94a3b8" }
  ],
  "nodes": [
    { "id": "ing_dl",   "module": "mod_ingest", "label": "ingest.download" },
    { "id": "ing_val",  "module": "mod_ingest", "label": "ingest.validate",
      "description": "Checks each JSON file against the expected schema. Invalid files are logged and skipped." },
    { "id": "cln_norm", "module": "mod_clean",  "label": "clean.normalize" },
    { "id": "cln_dup",  "module": "mod_clean",  "label": "clean.deduplicate",
      "description": "Removes exact and fuzzy duplicates using title + DOI matching." },
    { "id": "exp_db",   "module": "mod_export", "label": "export.build_db" },
    { "id": "DONE",     "module": "mod_term",   "label": "COMPLETE",
      "style": { "color": "#d1fae5", "borderColor": "#6ee7b7" } }
  ],
  "edges": [
    { "source": "ing_dl",   "target": "ing_val",  "label": "validate",    "style": "solid", "actor": "script",
      "details": { "script": "scripts/ingest/validate.py", "input": ["raw/*.json"], "output": ["validated/*.json"] } },
    { "source": "ing_val",  "target": "cln_norm", "label": "normalize",   "style": "solid", "actor": "script",
      "description": "Passes validated JSON files to the normalization step. Only schema-valid records cross this boundary." },
    { "source": "cln_norm", "target": "cln_dup",  "label": "deduplicate", "style": "solid", "actor": "script" },
    { "source": "cln_dup",  "target": "exp_db",   "label": "build DB",    "style": "solid", "actor": "script" },
    { "source": "exp_db",   "target": "DONE",     "label": "complete",    "style": "solid" }
  ]
}
```

4 modules, 6 nodes, 5 edges — a clean, readable graph with descriptions and status annotations.

---

## Design-Mode Worked Example

**Objective:** `"Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption"`

Running `/visualize-project --objective "Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption" --depth 2` produces:

```json
{
  "title": "Staggered DiD: Policy Effect on Employment",
  "description": "Causal inference workflow using difference-in-differences with staggered adoption to estimate the effect of a policy intervention on employment outcomes. Three phases: data construction, estimation, and reporting.",
  "_generationMode": "design",
  "_objective": "Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption",
  "_generatedAt": "2026-02-16T15:00:00Z",
  "modules": [
    { "id": "phase_data", "label": "Data Construction", "color": "#e0f2fe", "borderColor": "#7dd3fc",
      "status": "planned",
      "description": "Acquire, clean, and construct the analytical panel dataset with treatment indicators and outcome variables." },
    { "id": "mod_acquire", "label": "Data Acquisition", "color": "#dbeafe", "borderColor": "#93c5fd",
      "parent": "phase_data", "status": "planned", "confidence": "high",
      "description": "Download or import raw administrative data on employment and policy adoption dates.",
      "interface": {
        "inputs": [{ "name": "raw_employment", "description": "Administrative employment records", "format": "CSV or API" },
                   { "name": "policy_dates", "description": "Adoption dates by jurisdiction", "format": "CSV with columns: jurisdiction_id, adoption_date" }],
        "outputs": [{ "name": "raw_panel", "description": "Merged raw panel with employment and policy columns", "format": "CSV" }]
      }
    },
    { "id": "mod_clean", "label": "Sample Construction", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "parent": "phase_data", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Sample restrictions (age range, industry, balanced panel requirement) are domain-specific choices that affect external validity",
      "description": "Apply sample restrictions, handle missing data, and construct a balanced panel.",
      "interface": {
        "inputs": [{ "name": "raw_panel", "description": "Merged raw panel", "format": "CSV" }],
        "outputs": [{ "name": "clean_panel", "description": "Balanced panel with sample restrictions applied", "format": "CSV with columns: unit_id, time, employed, treated, post" }]
      }
    },
    { "id": "mod_variables", "label": "Variable Construction", "color": "#fef3c7", "borderColor": "#fcd34d",
      "parent": "phase_data", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Outcome operationalization (employment rate vs hours vs earnings), control variable selection, and treatment timing coding require domain expertise",
      "description": "Construct treatment indicators, outcome measures, and control variables for the DiD specification.",
      "interface": {
        "inputs": [{ "name": "clean_panel", "description": "Balanced panel dataset", "format": "CSV" }],
        "outputs": [{ "name": "analytical_dataset", "description": "Panel with treatment dummies, cohort indicators, outcome variables, and controls", "format": "CSV or Parquet" }]
      }
    },
    { "id": "phase_estimation", "label": "Estimation", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "planned",
      "description": "Estimate the causal effect using staggered DiD methods with diagnostic checks." },
    { "id": "mod_diagnostic", "label": "Pre-Estimation Diagnostics", "color": "#fee2e2", "borderColor": "#fca5a5",
      "parent": "phase_estimation", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Parallel trends test specification and interpretation require econometric judgment",
      "description": "Test parallel trends assumption and check for anticipation effects before running main specification.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" }],
        "outputs": [{ "name": "diagnostic_results", "description": "Pre-trends test statistics, event-study plot data", "format": "JSON or CSV" }]
      }
    },
    { "id": "mod_estimate", "label": "Main Estimation", "color": "#fce7f3", "borderColor": "#f9a8d4",
      "parent": "phase_estimation", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Estimator choice (Callaway-Sant'Anna vs Sun-Abraham vs imputation) and SE clustering level are critical methodological decisions",
      "description": "Run the staggered DiD estimator with appropriate standard error clustering.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" }],
        "outputs": [{ "name": "estimates", "description": "Point estimates, SEs, confidence intervals by cohort and event time", "format": "JSON or CSV" }]
      }
    },
    { "id": "mod_robustness", "label": "Robustness Checks", "color": "#ede9fe", "borderColor": "#c4b5fd",
      "parent": "phase_estimation", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Which robustness checks matter depends on the setting: alternative controls, different outcome definitions, placebo treatments, leave-one-out jurisdictions",
      "description": "Run sensitivity analyses: alternative specifications, placebo tests, and robustness to sample restrictions.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" },
                   { "name": "estimates", "description": "Main estimates for comparison", "format": "JSON or CSV" }],
        "outputs": [{ "name": "robustness_results", "description": "Table of estimates across specifications", "format": "CSV" }]
      }
    },
    { "id": "phase_reporting", "label": "Reporting", "color": "#ecfdf5", "borderColor": "#6ee7b7",
      "status": "planned",
      "description": "Compile results into publication-ready tables, figures, and narrative." },
    { "id": "mod_tables", "label": "Tables & Figures", "color": "#d1fae5", "borderColor": "#6ee7b7",
      "parent": "phase_reporting", "status": "planned", "confidence": "high",
      "description": "Generate formatted regression tables, event-study plots, and summary statistics.",
      "interface": {
        "inputs": [{ "name": "estimates", "description": "Main and robustness estimates", "format": "JSON or CSV" },
                   { "name": "diagnostic_results", "description": "Pre-trends and diagnostic output", "format": "JSON or CSV" }],
        "outputs": [{ "name": "tables", "description": "LaTeX or HTML formatted tables", "format": "LaTeX (.tex)" },
                    { "name": "figures", "description": "Event-study and coefficient plots", "format": "PDF or PNG" }]
      }
    },
    { "id": "mod_writeup", "label": "Narrative & Review", "color": "#f0fdf4", "borderColor": "#86efac",
      "parent": "phase_reporting", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Interpretation of results and policy implications require domain expertise and careful framing",
      "description": "Draft results narrative, interpret findings, and prepare for co-author or referee review.",
      "interface": {
        "inputs": [{ "name": "tables", "description": "Formatted tables", "format": "LaTeX" },
                   { "name": "figures", "description": "Generated plots", "format": "PDF or PNG" }],
        "outputs": [{ "name": "draft_paper", "description": "Results section draft with embedded tables and figures", "format": "LaTeX or Markdown" }]
      }
    }
  ],
  "nodes": [
    { "id": "acq_fetch", "module": "mod_acquire", "label": "acquire.fetch_data",
      "description": "Download or import raw employment records and policy adoption dates from source." },
    { "id": "acq_merge", "module": "mod_acquire", "label": "acquire.merge_sources",
      "description": "Merge employment data with policy adoption dates on jurisdiction and time." },
    { "id": "cln_restrict", "module": "mod_clean", "label": "clean.apply_restrictions",
      "description": "Apply sample restrictions: age range, industry codes, geographic scope." },
    { "id": "cln_balance", "module": "mod_clean", "label": "clean.balance_panel",
      "description": "Construct a balanced panel, handling entry/exit of units over time.",
      "style": { "shape": "diamond" } },
    { "id": "cln_missing", "module": "mod_clean", "label": "clean.handle_missing",
      "description": "Impute or drop observations with missing outcome or covariate values." },
    { "id": "var_treatment", "module": "mod_variables", "label": "variables.code_treatment",
      "description": "Construct treatment indicators, cohort dummies, and relative-time variables." },
    { "id": "var_outcome", "module": "mod_variables", "label": "variables.define_outcome",
      "description": "Operationalize the employment outcome measure (rate, hours, earnings, etc.)." },
    { "id": "var_controls", "module": "mod_variables", "label": "variables.select_controls",
      "description": "Choose and construct time-varying and time-invariant control variables." },
    { "id": "diag_trends", "module": "mod_diagnostic", "label": "diagnostic.test_parallel_trends",
      "description": "Run pre-trends test: regress outcome on leads of treatment to check for differential pre-trends." },
    { "id": "diag_check", "module": "mod_diagnostic", "label": "diagnostic.review_diagnostics",
      "description": "Evaluate diagnostic results. If pre-trends fail, revisit sample or specification.",
      "style": { "shape": "diamond" } },
    { "id": "est_run", "module": "mod_estimate", "label": "estimate.run_did",
      "description": "Estimate the staggered DiD model using chosen estimator (e.g., Callaway-Sant'Anna)." },
    { "id": "est_cluster", "module": "mod_estimate", "label": "estimate.cluster_se",
      "description": "Compute clustered standard errors at the appropriate level (jurisdiction, state, etc.)." },
    { "id": "rob_alt_spec", "module": "mod_robustness", "label": "robustness.alt_specifications",
      "description": "Re-estimate with alternative outcome definitions, control sets, and sample windows." },
    { "id": "rob_placebo", "module": "mod_robustness", "label": "robustness.placebo_tests",
      "description": "Run placebo tests with fake treatment dates or untreated subsamples." },
    { "id": "rob_compare", "module": "mod_robustness", "label": "robustness.compare_estimators",
      "description": "Compare results across estimators (TWFE, CS, SA, imputation) for robustness." },
    { "id": "tab_summary", "module": "mod_tables", "label": "tables.summary_stats",
      "description": "Generate summary statistics table for treatment and control groups." },
    { "id": "tab_main", "module": "mod_tables", "label": "tables.main_results",
      "description": "Format main regression results into a publication-ready table." },
    { "id": "tab_event", "module": "mod_tables", "label": "tables.event_study_plot",
      "description": "Generate event-study coefficient plot with confidence intervals." },
    { "id": "wr_draft", "module": "mod_writeup", "label": "writeup.draft_results",
      "description": "Write the results section narrative interpreting the estimates and robustness findings." },
    { "id": "wr_review", "module": "mod_writeup", "label": "writeup.co_author_review",
      "description": "Submit draft for co-author review and incorporate feedback." }
  ],
  "edges": [
    { "source": "acq_fetch", "target": "acq_merge", "label": "merge", "style": "solid" },
    { "source": "acq_merge", "target": "cln_restrict", "label": "restrict sample", "style": "solid",
      "description": "Pass merged raw panel to sample construction for filtering.", "confidence": "high" },
    { "source": "cln_restrict", "target": "cln_balance", "label": "balance", "style": "solid" },
    { "source": "cln_balance", "target": "cln_missing", "label": "handle missing", "style": "solid" },
    { "source": "cln_missing", "target": "var_treatment", "label": "construct variables", "style": "solid",
      "description": "Pass clean balanced panel to variable construction.", "confidence": "high" },
    { "source": "var_treatment", "target": "var_outcome", "label": "define outcome", "style": "solid" },
    { "source": "var_outcome", "target": "var_controls", "label": "add controls", "style": "solid" },
    { "source": "var_controls", "target": "diag_trends", "label": "run diagnostics", "style": "solid",
      "description": "Pass analytical dataset to pre-estimation diagnostics.", "confidence": "high" },
    { "source": "diag_trends", "target": "diag_check", "label": "evaluate", "style": "solid" },
    { "source": "diag_check", "target": "est_run", "label": "trends OK", "style": "solid",
      "description": "Proceed to estimation if parallel trends assumption is supported.", "confidence": "medium" },
    { "source": "diag_check", "target": "var_treatment", "label": "revise spec", "style": "dashed",
      "description": "If pre-trends fail, return to variable construction to adjust specification.", "confidence": "low" },
    { "source": "est_run", "target": "est_cluster", "label": "compute SEs", "style": "solid" },
    { "source": "est_cluster", "target": "rob_alt_spec", "label": "run robustness", "style": "solid",
      "description": "Pass main estimates to robustness checks for sensitivity analysis.", "confidence": "high" },
    { "source": "rob_alt_spec", "target": "rob_placebo", "label": "placebo", "style": "solid" },
    { "source": "rob_placebo", "target": "rob_compare", "label": "compare", "style": "solid" },
    { "source": "rob_compare", "target": "tab_summary", "label": "generate tables", "style": "solid",
      "description": "Pass all estimates to table/figure generation.", "confidence": "high" },
    { "source": "tab_summary", "target": "tab_main", "label": "main table", "style": "solid" },
    { "source": "tab_main", "target": "tab_event", "label": "event plot", "style": "solid" },
    { "source": "tab_event", "target": "wr_draft", "label": "draft narrative", "style": "solid",
      "description": "Pass formatted tables and figures to narrative drafting.", "confidence": "high" },
    { "source": "wr_draft", "target": "wr_review", "label": "review", "style": "solid", "actor": "human",
      "description": "Co-author reviews the draft and provides feedback.", "confidence": "high" }
  ]
}
```

3 phases, 8 modules, 20 nodes, 20 edges — all `status: "planned"`, no `files`, no `details`, no `trustLevels`. Domain-specific modules (`mod_variables`, `mod_estimate`, `mod_robustness`, `mod_writeup`) flagged with `needsHumanReview: true` and specific `checkpointReason` explaining what requires expertise.

---

## Refactor-Mode Worked Example

**Existing project** at `/path/to/pipeline/`:
```
pipeline/
  scripts/
    download.py     # fetches from API → data/raw/
    clean.py        # data/raw/ → data/clean/
    export.py       # data/clean/ → output/
  data/
    raw/
    clean/
  output/
  CLAUDE.md         # "Pipeline: download → clean → export"
```

**Command:** `/visualize-project . --refactor --objective "Group scripts by pipeline stage"`

**Phase 1C analysis:**
- Step 1C.1 (scan): flat `scripts/` directory with 3 scripts, `data/` with raw/clean, `output/`
- Step 1C.2 (objective): structural goal is to move scripts from flat `scripts/` into stage-specific directories
- Step 1C.3 (target): proposed structure — `scripts/ingest/download.py`, `scripts/clean/clean.py`, `scripts/export/export.py`
- Step 1C.4 (diff): `mod_scripts` splits into `mod_ingest`, `mod_clean`, `mod_export`

**Output** (abbreviated — base graph + plan overlay):

```json
{
  "title": "Pipeline Workflow",
  "description": "Download-clean-export pipeline, with proposed restructuring into stage-specific directories.",
  "_generationMode": "refactor",
  "_objective": "Group scripts by pipeline stage",
  "_generatedAt": "2026-02-16T16:00:00Z",
  "modules": [
    { "id": "mod_scripts", "label": "Scripts", "color": "#dbeafe", "borderColor": "#93c5fd",
      "status": "ai-tested",
      "description": "Flat scripts directory (current). Refactoring proposes splitting by stage." },
    { "id": "mod_ingest", "label": "Ingest", "color": "#e0f2fe", "borderColor": "#7dd3fc",
      "status": "planned",
      "description": "Proposed: stage-specific directory for data acquisition scripts." },
    { "id": "mod_clean", "label": "Clean", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "status": "planned",
      "description": "Proposed: stage-specific directory for data cleaning scripts." },
    { "id": "mod_export", "label": "Export", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "planned",
      "description": "Proposed: stage-specific directory for export scripts." }
  ],
  "nodes": [
    { "id": "scr_dl", "module": "mod_scripts", "label": "scripts.download" },
    { "id": "scr_cln", "module": "mod_scripts", "label": "scripts.clean" },
    { "id": "scr_exp", "module": "mod_scripts", "label": "scripts.export" },
    { "id": "ing_dl", "module": "mod_ingest", "label": "ingest.download" },
    { "id": "cln_cln", "module": "mod_clean", "label": "clean.clean" },
    { "id": "exp_exp", "module": "mod_export", "label": "export.export" }
  ],
  "edges": [
    { "source": "scr_dl", "target": "scr_cln", "label": "clean", "style": "solid", "actor": "script" },
    { "source": "scr_cln", "target": "scr_exp", "label": "export", "style": "solid", "actor": "script" },
    { "source": "ing_dl", "target": "cln_cln", "label": "clean", "style": "solid", "actor": "script" },
    { "source": "cln_cln", "target": "exp_exp", "label": "export", "style": "solid", "actor": "script" }
  ],
  "plan": {
    "summary": {
      "goal": "Group scripts by pipeline stage",
      "tasks": [
        { "id": "t1", "label": "Create scripts/ingest/ and move download.py", "nodeIds": ["ing_dl"] },
        { "id": "t2", "label": "Create scripts/clean/ and move clean.py", "nodeIds": ["cln_cln"] },
        { "id": "t3", "label": "Create scripts/export/ and move export.py", "nodeIds": ["exp_exp"] },
        { "id": "t4", "label": "Remove flat scripts/ directory", "nodeIds": ["scr_dl", "scr_cln", "scr_exp"] }
      ]
    },
    "annotations": {
      "mod_scripts": { "status": "remove", "description": "Flat scripts/ directory replaced by stage-specific directories" },
      "mod_ingest": { "status": "add", "description": "New directory: scripts/ingest/" },
      "mod_clean": { "status": "add", "description": "New directory: scripts/clean/" },
      "mod_export": { "status": "add", "description": "New directory: scripts/export/" },
      "scr_dl": { "status": "remove", "description": "Moves to scripts/ingest/download.py" },
      "scr_cln": { "status": "remove", "description": "Moves to scripts/clean/clean.py" },
      "scr_exp": { "status": "remove", "description": "Moves to scripts/export/export.py" },
      "ing_dl": { "status": "add", "description": "download.py in new ingest directory" },
      "cln_cln": { "status": "add", "description": "clean.py in new clean directory" },
      "exp_exp": { "status": "add", "description": "export.py in new export directory" }
    }
  }
}
```

4 modules (1 current + 3 proposed), 6 nodes (3 current + 3 proposed), 4 edges. The plan overlay shows `mod_scripts` in red (remove) and the three new modules in green (add). The viewer renders the refactoring plan as a visual diff.
