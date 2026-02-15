---
name: visualize-project
description: >
  Analyze a project directory to generate an interactive workflow graph.
  Scans CLAUDE.md files, script dependencies, and folder structure to
  produce a visual-project-map JSON with modules, nodes, edges, and actor
  annotations. Use when the user asks to visualize a project's workflow,
  architecture, or data pipeline.
argument-hint: "[directory-path] [--focus subdir] [--depth N] [--title \"...\"]"
---

# visualize-project

Generate an interactive DAG from a project's structure and documentation.
The output is a JSON file viewable in the visual-project-map viewer.

## When to Use

- User asks to "visualize", "map", or "diagram" a project's workflow
- User wants to understand how scripts/data flow through a codebase
- User asks for an architecture diagram or pipeline overview
- Works on any codebase — best when CLAUDE.md or README.md files exist

## Arguments

Parse `$ARGUMENTS` as follows:

| Argument | Default | Description |
|----------|---------|-------------|
| First positional | Project root (cwd) | Directory to analyze |
| `--focus path` | (none) | Limit scan to a subdirectory |
| `--depth N` | `2` | Module nesting: `1` = flat, `2` = phases + modules |
| `--title "..."` | Auto from directory name | Graph title override |
| `--force` | `false` | Skip incremental mode; regenerate from scratch |

Examples:
- `/visualize-project` — current project
- `/visualize-project /path/to/project` — specific project
- `/visualize-project . --focus scripts/ --depth 1` — flat, scripts only
- `/visualize-project . --title "My Pipeline"` — custom title

---

## Phase 1 — Discovery

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

---

## Phase 2 — Graph Generation

Transform the discovery results into graph JSON elements.
Consult `_foundations/inference-rules.md` for all lookup tables.
Consult `_foundations/color-palette.md` for color assignments.
Consult `_foundations/graph-schema.md` for field requirements.

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

**Keep it focused:** Aim for 3-10 modules. If you detect >12, merge
related directories or suggest `--focus`. Target 3-8 nodes per module.

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

**Scope guard:** Aim for 8-40 nodes. If >50, only include nodes that
are documented or represent significant state transitions.

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

Derive `{name}` from the project directory name (lowercase, hyphens).
Create `.graphs/` directory if it doesn't exist.
Write to: `.graphs/{name}.json`

Use the Write tool. Format the JSON with 2-space indentation.

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
      "description": "Downloads raw JSON from the API and validates schema conformance.",
      "interface": {
        "inputs": [{ "name": "api_config", "description": "Source API endpoints and credentials", "format": "YAML" }],
        "outputs": [{ "name": "validated_json", "description": "Schema-valid JSON files", "format": "JSON, one file per record" }]
      }
    },
    { "id": "mod_clean", "label": "Clean", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "description": "Normalizes field formats and removes duplicate records." },
    { "id": "mod_export", "label": "Export", "color": "#fef2f2", "borderColor": "#fca5a5",
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

4 modules, 6 nodes, 5 edges — a clean, readable graph with natural language descriptions.
