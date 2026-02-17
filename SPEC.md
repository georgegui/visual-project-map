# Roadmap

## Objective

Visual Project Map visualizes a project's **folder structure** and overlays the **logical data flow** between folders that the filesystem cannot express.

1. **Map what exists.** Given an existing project, scan its directory tree and show how data flows between directories — which folder's output becomes another folder's input.

2. **Design what should exist.** Given an objective, design the folder structure that achieves it — what directories to create, what each contains, and how data flows between them.

In both cases, the visualization answers two questions in a single view:

- **"Where is this code?"** — from the folder hierarchy (same as `tree`)
- **"What depends on what?"** — from the edges (what `tree` can't show)

## Actions

The tool supports four actions — verbs describing what the user wants to accomplish.

| Action | Purpose | SKILL.md label | Status |
|--------|---------|---------------|--------|
| `describe` | Map an existing project's folder structure | Input A | Implemented |
| `initialize` | Design a new folder structure from an objective | Input B | Implemented |
| `refactor` | Restructure existing folders toward an objective | Input A + --refactor | Implemented |
| `plan` | Propose new files/folders from a SPEC update | — | Planned |

> **Viewer loading (formerly Input C):** Rendering an existing `.json` graph is a viewer operation, not a generation action. Point the viewer at any graph file via `?graph=path/to/file.json`.

### describe

Map an existing project's folder structure and overlay logical data flow.

- **When to use**: The project already exists and you want to document its workflow
- **What you provide**: Filesystem path + optional `--focus`, `--depth`, `--title`
- **What it produces**: Graph JSON reflecting current folder structure and data flow
- **How it works**: SKILL.md Phase 1 (Discovery) — scans CLAUDE.md, README.md, scripts, folder structure, I/O patterns, Makefiles, CI configs
- **Status**: Implemented
- **Examples**:
  - `/visualize-project` — scan current directory
  - `/visualize-project . --focus scripts/` — scan only a subdirectory

### initialize

Design a new folder structure from a natural language objective.

- **When to use**: The project does not yet exist, or you want to design the workflow from a clean slate
- **What you provide**: `--objective "..."` + optional `--constraints`, `--domain`, `--scaffold`
- **What it produces**: Graph JSON with all folders at `status: "planned"`, optional scaffolding
- **How it works**: SKILL.md Phase 1B (Design from Objective) — decomposes the objective into stages, defines data flow, assesses confidence, recommends human checkpoints
- **Status**: Implemented
- **Examples**:
  - `/visualize-project --objective "Build ETL pipeline for CSV to PostgreSQL"`
  - `/visualize-project --objective "Estimate causal effect via diff-in-diff" --scaffold`

### refactor

Restructure existing folders toward a stated objective, ensuring each folder has a clear purpose and contract.

- **When to use**: The project exists but its folder structure doesn't match the logical data flow, or folders lack clear objectives, inputs/outputs, or specs
- **What you provide**: Filesystem path + objective describing desired structure
- **What it produces**: Graph JSON with proposed restructured layout + diff overlay against current. Each proposed folder includes a clear objective, named I/O interfaces, and a SPEC.md stub with acceptance criteria.
- **How it works**: Combines scan (Phase 1) with design (Phase 1B) — scans current state, redesigns toward objective, ensures every proposed folder follows the Folder Premise (CLAUDE.md with objective and I/O, SPEC.md with acceptance criteria). The diff is the refactoring plan.
- **Status**: Implemented
- **Examples**:
  - `/visualize-project . --refactor --objective "Separate acquisition from processing"`

### plan

Propose new files and folders from updated SPEC.md requirements.

- **When to use**: You updated a folder's SPEC.md with new requirements and want to know what to build
- **What you provide**: Filesystem path + pointer to changed specs (or auto-detected via incremental mode)
- **What it produces**: Updated graph with new folders at `status: "planned"` + plan overlay annotations
- **How it works**: Scans existing project, detects SPEC.md changes, proposes new folders/files to satisfy the updated specs
- **Status**: Planned — not yet implemented in SKILL.md
- **Examples**:
  - `/visualize-project . --plan`
  - `/visualize-project . --plan --focus scripts/estimation/`

## Outputs

### Primary output: Interactive interface map

The main output is a browser-based visualization where the default (collapsed) view shows:

- **Folder boxes** with labels and descriptions
- **Interface ports** — named input and output nodes visible outside each folder box, showing what data crosses each boundary
- **Edges between ports** — showing how folders connect, with labels describing the transformation
- **Confidence/checkpoint flags** (when available) — visual indicators of which folders the AI is confident about and which need human review

This interface map is the equivalent of a car's dashboard. A user unfamiliar with the project should be able to understand the overall data flow from this view alone, without expanding any folder.

Expanding a folder reveals its internal workflow. Clicking nodes and edges reveals file paths, scripts, and detailed descriptions.

### Secondary output: Graph JSON file

The structured data behind the visualization, written to `.graphs/{name}.json`. This file:

- Conforms to `schema.json`
- Is version-controlled and diffable (the viewer supports `?compare=` for diff overlay)
- Can be edited by hand or regenerated incrementally (preserving manual refinements)
- Serves as the single source of truth — the viewer is a read-only renderer

### Future output: Human checkpoint report

A structured summary of which folder interfaces the AI recommends for human review, including:

- The interface name and what to check
- Why the AI flagged it (uncertainty reason, error propagation risk)
- The AI's confidence level at that boundary
- Suggested inspection criteria

This does not exist yet. Currently, checkpoint information would be encoded in the graph JSON (trust levels, descriptions) and visible in the viewer, but there is no standalone report format.

## The Core Problem

When workflows are increasingly AI-automated, the human operator faces a new challenge: they cannot manually verify every step, but they need to know **which steps to trust and which to check**. A visualization tool for AI-driven workflows must answer:

- Which components has the AI iterated on and tested thoroughly?
- Which components does the AI flag as uncertain or hard to get right?
- Which components does the AI believe it can handle but where the human may still want to verify?
- What are the interpretable inputs and outputs at each boundary — the checkpoints where a human can inspect intermediate results without understanding every internal detail?

The visualization is not just documentation. It is a **quality assurance interface** for human-AI collaboration.

## Ideal Workflow

The following describes the end-state workflow this tool is designed to support. Steps 1–3 correspond to the `initialize` action. Step D uses `describe`. The `refactor` and `plan` actions serve as iterative refinement loops between implementation steps.

### 1. Declare the Objective

The user specifies what they want to accomplish. Examples:

> "Estimate the causal effect of a policy intervention on employment outcomes using difference-in-differences with administrative claims data."

> "Build a developer tool that scans a codebase and generates an interactive workflow diagram, highlighting components that need human review."

### 2. AI Proposes a Workflow

The AI brainstorms the structure and components of the project. For a research project, this might be:

- Data acquisition
- Data cleaning and standardization
- Variable construction
- Exploratory analysis
- Statistical modeling
- Robustness checks
- Output and reporting

It organizes these into folders, defines the interfaces between them (what data flows in, what comes out), and proposes a complete workflow — an initial draft that is entirely AI-driven.

### 3. Visualization Highlights What Matters

Before any execution, the proposed workflow is rendered as an interface map. The visualization makes the following immediately visible based on the AI's initial assessment:

- **Folder interfaces**: Each folder's interpretable inputs and interpretable outputs — the data a human can inspect at each boundary without understanding the internals.
- **Critical paths**: Inputs and outputs that are upstream of the outcomes the user cares about — where errors would propagate to final results.
- **Recommended human checkpoints**: The specific interfaces where the AI believes human review will be most valuable — shown prominently, not buried in metadata. These are the AI's best guess before any execution, based on domain knowledge about which steps typically require human judgment.

The human operator reviews this interface map to understand the proposed workflow, assess whether the folder boundaries make sense, and agree on which checkpoints they want to monitor.

### 4. AI Executes, Tests, and Iterates

The AI begins executing the workflow. For each edge (procedure connecting two components), it:

- Generates test cases for the transformation
- Runs them and examines whether the outputs are correct
- Iterates to improve accuracy
- Records its confidence in each step

### 5. AI Flags What It Cannot Solve

As the AI iterates, some steps prove harder than others. When it cannot reliably improve a component further, it flags that step for human review. The reasons may include:

- Ambiguous domain judgment (e.g., which diagnoses count as "comorbidities")
- Data quality issues that require expert interpretation
- Modeling choices where multiple valid approaches exist
- Steps where small errors propagate to critical downstream outcomes
- Steps the AI initially believed it could handle but discovered are harder than expected

The visualization updates to reflect this: confidence levels change, new human checkpoints appear, and the critical path may shift based on what the AI learned during execution.

### 6. Human Reviews at Checkpoints

The human operator inspects intermediate results at the flagged interfaces. They do not need to understand every internal step — they check the interpretable outputs against their domain expertise and either approve, request changes, or take over specific components.

The workflow map serves as the shared artifact through which human and AI coordinate: the AI marks what it needs help with, the human sees where to look, and the visualization tracks the state of each component.

## From Design to Implementation

After a design-mode graph is generated (steps 1–3 above), the following procedure bridges the gap between the proposed architecture and working code. It creates a closed loop: **design → scaffold → specify → implement → validate → update graph → review**.

### Step A: Scaffold the Folder Structure

From the design graph's folders and interfaces, create the directory tree with documentation stubs. (In the graph JSON, folders are represented as the `modules` array.)

- One directory per folder, named from the folder label (lowercase, underscores)
- Each directory contains a `CLAUDE.md` stating:
  - The folder's **objective** in 1–2 sentences (from the folder's `description`)
  - Its **inputs and outputs** (from the folder's `interface` field)
  - A reference to `SPEC.md` for detailed specifications
- Each directory also contains a `SPEC.md` stub with placeholders for acceptance criteria, edge cases, and validation checks

The generation skill's Step 3.5b produces a printable scaffolding suggestion. This step materializes it into actual files.

### Step B: Write Component Specs

For each folder, expand the `SPEC.md` stub with:

- **Acceptance criteria**: What must be true for this folder's output to be correct?
- **Edge cases**: What inputs might break this folder?
- **Validation checks**: How can the AI (or a test suite) verify its own output?

For folders with `needsHumanReview: true`, the spec should explicitly separate what requires domain expertise from what the AI can handle independently. The `checkpointReason` from the design graph is the starting point.

### Step C: Implement Module-by-Module

Work through folders in **topological order** (upstream folders first, following the graph's edge direction). For each folder:

1. Read the folder's `CLAUDE.md` for objective and interface contract
2. Read the folder's `SPEC.md` for acceptance criteria and edge cases
3. Implement the folder
4. **Run the validate-iterate loop** (see Workflow Process below):
   a. Run all validation checks from `SPEC.md` — acceptance criteria, edge cases, and any automated tests
   b. If all checks pass → status upgrades from `planned` to `ai-tested`. Done.
   c. If any check fails → diagnose the failure, fix the implementation, and re-run from (a).
   d. Repeat up to **3 attempts**. On each attempt, the AI should try a different approach — not the same fix twice.
   e. If still failing after 3 attempts → flag as `needs-review` with a clear description of what was tried, what failed, and what the AI believes the root cause is.
5. The AI must NOT silently skip failing checks or lower the bar. The `SPEC.md` criteria are the contract.

### Step D: Update the Graph

After implementing one or more folders, re-scan the project using the `describe` action (Input A):

```
/visualize-project .
```

Incremental mode detects the design-to-scan transition:

- Folders with corresponding directories and scripts upgrade from `planned` to `draft` or `ai-tested` based on scan evidence
- Folders still without code remain `planned` (ghost opacity in the viewer)
- The visualization gains opacity as folders are implemented — a natural progress indicator
- The `_generationMode` field updates from `"design"` to `"scan"` once any folder has code

### Step E: Human Review at Checkpoints

Folders flagged with `needsHumanReview: true` require domain expert sign-off before upgrading to `verified`. The checkpoint review focuses on:

- Does the implementation match the `SPEC.md` acceptance criteria?
- Are the domain-specific decisions (flagged in `checkpointReason`) correct?
- Are the intermediate outputs at folder boundaries interpretable and correct?

After review, the human marks the folder as `verified` (or requests changes), and a re-scan reflects the updated status in the graph.

### Why This Procedure Matters

Each folder's `CLAUDE.md` serves a dual purpose:

1. **Implementation contract** — the AI reads it before coding to understand what the folder should do
2. **Scanning target** — the generation skill reads it during `describe` (Input A) to infer folder boundaries and interfaces (Step 1.2)

Projects that follow this convention produce better graphs on re-scan, which produces better `CLAUDE.md` suggestions on the next design iteration — a virtuous cycle. This is the Folder Premise in action.

## What This Means for the Tool

> **Implementation status**: See `spec/features.md` for which principles are
> fully implemented, partially implemented, or still planned.

### The Folder Premise

The unit of organization is the **folder**. The graph's boxes are directories. Edges show the logical data flow between directories that the filesystem cannot express.

**For `describe` (scan, Input A):** Read the directory tree. Each directory with meaningful content becomes a box. Parent directories become containing boxes. Overlay edges showing data flow between them.

**For `initialize` (design, Input B):** Given an objective, design the folder structure — what directories should exist, what each contains, and how data flows between them. The output is a blueprint you can `mkdir`.

**For `refactor`:** Scan the existing directory tree, then redesign it toward a stated objective — ensuring every proposed folder has a clear objective, named inputs and outputs, and a SPEC.md stub defining acceptance criteria. The output is a diff between current and proposed structures plus scaffolding guidance for each new or restructured folder.

**For `plan`:** Scan the existing project and its SPEC.md files, detect what changed, and propose new directories and files to satisfy the updated specs. The output is the current graph plus planned additions.

What follows from this premise:

- **Complexity lives inside folders, not between them.** Cross-folder connections should be simple. If two folders need multiple edges between them, the folder boundaries are wrong.
- **Each non-trivial folder has a CLAUDE.md** stating its objective, inputs, and outputs. This is how the scan knows what a folder does, and how the design tells you what to build in each folder.
- **One canonical graph per project** stored at `.graphs/{project-name}.json`, with `.prev.json` for diff support.

### Graph Output Constraints

These are concrete, verifiable rules about the graph JSON:

**1. Every folder has named interfaces.**
Each folder in the graph has named inputs and outputs — the data contracts crossing its boundary. Without these, the graph is just `tree` with arrows. With them, a newcomer can understand the data flow without opening a single file.

**2. One edge per folder pair at every hierarchy level.**
At most one edge between any two folders at every level of the hierarchy. This is what keeps graphs readable at scale. Enforced via collector nodes, router nodes, or sub-folder wrapping when multiple connections exist.

| Level | Rule |
|-------|------|
| Parent folder → Parent folder | At most 1 forward + 1 backward edge per pair |
| Folder → Folder (same parent) | At most 1 edge per pair |
| Node → Node (same folder) | Unconstrained (internal complexity) |

### Viewer Behavior

These govern how the viewer renders the graph (see `plugins/visual-project-map/viewer/` for details):

- **Default view is the interface map** — collapsed folders with named I/O ports. The collapsed view is the main view, not a simplified fallback.
- **Confidence and review flags are visually encoded** — AI confidence and human-review recommendations visible without expanding any folder.
- **Progressive disclosure** — three zoom levels: folders → internal nodes → node detail panel.

### Skill Requirements

These govern how the generation skill produces graph JSON (see `SKILL.md` for details):

- **The skill generates interfaces by default** — every folder gets named inputs, named outputs, and a one-sentence description.
- **Critical path identification is automatic** — given the user's objective, trace which folder interfaces are upstream of the final outcome.

### Workflow Process

See "From Design to Implementation" above. Key rule:

- **AI validates against SPEC.md and iterates before escalating** — for each folder it implements, the AI runs all checks from the folder's SPEC.md, iterates up to 3 times on failure, and escalates to human review if still failing. (Full detail in Steps C–D above.)

### Action applicability

Not all rules apply equally to all actions:

| Rule | describe | initialize | refactor | plan | Notes |
|------|:--------:|:----------:|:--------:|:----:|-------|
| Folder premise | Yes | Yes (proposed) | Yes | Yes | |
| CLAUDE.md per folder | Yes | Scaffolding | Scaffolding | Scaffolding | |
| Constraint 1: Named interfaces | Yes | Yes | Yes | Yes | |
| Constraint 2: 1-edge-per-folder | Yes | Yes | Yes | Yes | |
| Viewer: default collapsed | Yes | Yes | Yes | Yes | |
| Viewer: confidence encoding | Yes | Yes | Yes | Yes | |
| Viewer: progressive disclosure | Yes | Yes | Yes | Yes | |
| Skill: generate interfaces | Yes | Yes | Yes | Partial | plan updates affected folders only |
| Skill: critical path | Partial | Yes | Yes | Partial | |
| Workflow: validate + iterate | Yes | N/A | Partial | N/A | |

`plan` is a planned action — its skill phase does not exist yet.

**`initialize` gets a pass on the workflow process** because the folder's SPEC.md doesn't exist yet when designing from an objective. As the user implements folders and re-scans with `describe`, the validation loop activates naturally.
