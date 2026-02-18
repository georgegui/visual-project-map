# Graph Generation & Assembly (Phases 2–3)

> Extracted from SKILL.md. Shared across all modes (scan, design, refactor, plan).
> Run this after completing the mode-specific discovery phase from `workflows/`.

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

## Phase 2 — Graph Generation

> **SPEC principles**: P1 (interfaces as primary content), P3 (complexity inside modules),
> P4 (confidence encoded), P5 (progressive disclosure), P6 (skill generates interfaces),
> P10 (modules = directories), P11 (one edge per module pair)

Transform the discovery results into graph JSON elements.
Consult `_foundations/inference-rules.md` for all lookup tables.
Consult `_foundations/color-palette.md` for color assignments.
Consult `_foundations/graph-schema.md` for field requirements.

> **Mode-specific defaults:** Check the active workflow file (`workflows/design.md`,
> `workflows/refactor.md`, or `workflows/plan.md`) for mode-specific defaults that
> apply throughout this phase. Scan mode defaults are in `workflows/scan.md`.

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

**Phase justification test:** Before creating a `--depth 2` phase, verify it
passes all four criteria:
1. **Workflow role**: Can you name it with a verb or domain role? ("Generation",
   "Rendering", "Data Construction" — not "Repository Root" or "Top Level")
2. **Edge reduction**: When collapsed, does the phase reduce visible cross-phase
   edges compared to showing child modules individually?
3. **Sibling coherence**: Do child modules share a common input, output, or
   purpose? (spec + plans = requirements; viewer + scripts = rendering)
4. **Not a filesystem echo**: The phase name should describe *what work happens*,
   not *where files live*. "plugins/" is a location; "Graph Generation" is a role.

If a proposed phase fails any criterion, flatten its children to top-level modules.

**Module coherence check:** Every module must have a single coherent purpose.
If a module description requires "and" between unrelated concerns (e.g.,
"marketplace manifests and CI configuration"), split it or omit the unrelated
parts. A module that bundles unrelated files produces a confusing graph because
the viewer shows it as one box with one interface — implying a shared contract
that doesn't exist.

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
Generate interfaces for **every** non-phase, non-terminal module. Use
evidence from Step 1.4 when available (concrete file I/O patterns).
For modules without direct I/O evidence, infer the interface from:
1. The module's position in the data flow (what does the upstream module
   output? That becomes this module's input)
2. The module's description and exit node labels
3. Directory naming conventions (e.g., `data/clean/` → output is "clean data")

At minimum, every module must have at least one named input and one named
output. Use `"format": "unknown"` when the format cannot be determined —
this is better than omitting the interface entirely, because the collapsed
view (the default) depends on interfaces to show the data contract.

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

**Scan-mode modules** (when using Input A / directory scan):
- **Always** include `confidence` per the heuristics in
  `_foundations/inference-rules.md` § "Scan-Mode Confidence Heuristics"
- **Always** include `needsHumanReview` when confidence is `low` or when
  `TODO`/`FIXME` signals were detected in Step 1.1b
- Include `checkpointReason` when `needsHumanReview` is true — explain what
  triggered the flag (e.g., "No test coverage", "Contains FIXME comments",
  "Complex logic without documentation")
- **Always** include `interface` with `inputs` and `outputs` — infer from
  I/O evidence (Step 1.4) or from the module's position in the data flow

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
Trust drives the Provenance view mode color scheme, not borders (P2.2).

**File annotations:** When a node represents a step with known file I/O
(detected in Step 1.4), add the `files` field:
```json
{ "files": { "reads": ["path/to/input.csv"], "writes": ["path/to/output.csv"] } }
```
Only include paths you actually found in the codebase. Use directory paths
(without trailing slash) when the step reads/writes an entire directory.

**Node I/O annotations:** For nodes representing steps with structured
inputs and outputs (detected in Step 1.4), add the `io` field with the
same structure as `module.interface`:
```json
{
  "io": {
    "inputs": [{ "name": "raw_json", "description": "Raw API response files", "format": "JSON" }],
    "outputs": [{ "name": "validated_json", "description": "Schema-valid records", "format": "JSON" }]
  }
}
```
Focus on nodes at module boundaries (entry/exit points) and complex
processing steps. Simple pass-through nodes do not need `io`. The `io`
field populates the node detail side panel (F73) with richer information
than `files` alone — use `io` for semantic descriptions and `files` for
raw file paths.

**Node documentation:** If a node corresponds to a script or function with
associated documentation (a dedicated README section, docstring, or docs
page), set `docs` to the relative file path or URL:
```json
{ "docs": "docs/api/validate.md" }
```
Only include `docs` when a dedicated documentation artifact exists — do not
point to generic project-level docs.

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

**Scan-mode edges** (when using Input A / directory scan):
- **Always** include `confidence` per the heuristics in
  `_foundations/inference-rules.md` § "Scan-Mode Confidence Heuristics"
  (based on evidence quality: documented = high, file I/O inferred = high,
  directory adjacency only = low)

### 2.3b: Generate Interface Port Nodes

> **SPEC principle**: P1 (interfaces as primary content), P2.10 (port visual
> encoding), P3.4 (port positioning)

For each non-phase, non-terminal module with an `interface` field, create
interface port nodes that make the data contract visible in the collapsed
view. This is what transforms the graph from "boxes connected by edges"
into an **interface map** — the SPEC's primary design promise.

**For each `interface.inputs` entry**, create a port node:
```json
{
  "id": "{mod_short}_in_{name_slug}",
  "module": "{module_id}",
  "label": "{input_name}",
  "_isInterfacePort": true,
  "_portDirection": "input",
  "interfaceContract": { "name": "...", "description": "...", "format": "...", "example": "..." }
}
```

**For each `interface.outputs` entry**, create a port node:
```json
{
  "id": "{mod_short}_out_{name_slug}",
  "module": "{module_id}",
  "label": "{output_name}",
  "_isInterfacePort": true,
  "_portDirection": "output",
  "interfaceContract": { "name": "...", "description": "...", "format": "...", "example": "..." }
}
```

**Port IDs:** Use `{mod_short}_in_{slug}` and `{mod_short}_out_{slug}`.
The slug is the interface entry name, lowercased with spaces/hyphens
replaced by underscores. Examples: `ing_in_api_config`,
`ing_out_validated_json`, `cln_in_validated_json`.

**Edge routing through ports:** After creating port nodes, reroute
cross-module edges to pass through them:

1. For each cross-module edge `A_exit → B_entry`:
   - Find the output port on module A that matches the data being passed
   - Find the input port on module B that matches the data being received
   - Replace with three edges:
     ```
     A_exit → A_out_port    (intra-module, no label)
     A_out_port → B_in_port  (cross-module, carries the original label + description)
     B_in_port → B_entry     (intra-module, no label)
     ```
2. Intra-module edges to/from ports are unlabeled routing connectors
3. The cross-module port-to-port edge carries the semantic label,
   description, actor, confidence, and details from the original edge

**When collapsed**, the viewer hides internal nodes but keeps port nodes
visible. The user sees: module boxes with named input/output ports
connected by labeled edges — the interface map.

**Scope:** Generate port nodes for all non-phase, non-terminal modules.
Terminal modules (containing COMPLETE, FAILED, etc.) do not need ports.
Phase modules do not get ports — their interfaces are expressed through
their child modules' ports.

### 2.4: Define Legend (optional)

Only include `legend.trustLevels` if the project explicitly tracks
provenance (raw/auto/ai/verified states). For most projects, omit it.

When included, use this standard set. Note: `borderStyle`/`borderWidth` are
legacy fields retained for backward compatibility; border treatment is driven
by `status`, not trust levels:

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

### 2.4c: Compute Critical Path

> **SPEC principles**: P2.13 (critical path highlight), P7.4 (non-destructive)

After finalizing all edges, compute the critical path — the longest
dependency chain from an entry node to the final output. The viewer
highlights this path when the user presses `P` (F65).

1. **Identify the primary terminal node**: The success terminal (typically
   `COMPLETE` or the last output node in the final module). If the graph
   has multiple terminals, use the primary success path.

2. **Trace backward from the terminal**: Follow incoming edges backward.
   At each branch, choose the path that:
   - Passes through the most **cross-module boundaries** (these represent
     the major pipeline stages)
   - Uses **solid edges** (forward flow) over dashed edges (feedback loops)
   - Is the **longest path** in terms of node count if still ambiguous

3. **Collect the path**: Record node IDs in forward order (entry → terminal).
   Include both internal nodes and port nodes on the critical path.

4. **Emit**: Add the path to the graph root:
   ```json
   { "criticalPath": ["first_node", "second_node", ..., "terminal_node"] }
   ```

**Example**: For a pipeline `Ingest → Clean → Export → COMPLETE`, the
critical path includes the main processing nodes from each module:
```json
"criticalPath": ["ing_in_api", "ing_dl", "ing_val", "ing_out_json",
  "cln_in_json", "cln_norm", "cln_dup", "cln_out_csv",
  "exp_in_csv", "exp_db", "exp_out_db", "DONE"]
```

The critical path helps users identify which modules are on the longest
dependency chain — changes to these modules have the highest impact on the
overall pipeline.

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
- Every non-phase, non-terminal module has an `interface` with at least one input and one output
- Every non-phase, non-terminal module has `confidence` assigned
- Every module with `interface` has corresponding `_isInterfacePort` nodes
- Cross-module edges route through port nodes (port-to-port, not internal-to-internal)
- `criticalPath` array is present and contains valid node IDs forming a connected path
- `_generationMode` is set (`"scan"`, `"design"`, `"refactor"`, or `"plan"`)

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

Add generation metadata to the JSON root.

**Scan mode** (Input A):
```json
{
  "_generationMode": "scan",
  "_generatedAt": "2026-02-16T14:30:00Z"
}
```

**Design mode** (Input B):
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

**Plan mode:** Use the same `{name}` as the existing graph (overwriting it).
Save the pre-plan version to `.graphs/{name}.prev.json` for diff overlay.
Add generation metadata:
```json
{
  "_generationMode": "plan",
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
