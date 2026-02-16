# Roadmap

## Objective

Visual Project Map solves two related needs:

1. **Map what exists.** Given an existing project, generate a clear visualization of its workflow — the components, how they connect, and what data flows between them.

2. **Design what should exist.** Given an objective, generate a proposed workflow that achieves it — before any code is written. The objective could be a research question ("Estimate the causal effect of X on Y using administrative claims data") or an engineering goal ("Build a tool that visualizes project workflows and highlights where human review is needed").

In both cases, the visualization must support two modes of understanding:

- **Big picture**: What are the major components and how do they connect? A newcomer should grasp the overall flow in seconds.
- **Zoom to detail**: What exactly happens inside a component? What are its inputs, outputs, and internal steps?

## Inputs

The tool accepts three types of input, corresponding to different use cases:

### Input A: Existing project directory

The user points the tool at a codebase. The AI scans its structure, documentation, and scripts to infer the workflow.

- **Concrete form**: Filesystem path + optional flags
- **Examples**:
  - `/Users/me/research-project` — scan entire project
  - `. --focus scripts/analysis` — scan only a subdirectory
  - `. --depth 1` — flat modules, no phase grouping
- **What the AI reads**: CLAUDE.md, README.md, folder structure, script I/O patterns, Makefiles, CI configs
- **When to use**: The project already exists and you want to understand or document its workflow

### Input B: Natural language objective

The user describes what they want to achieve. The AI designs a workflow from scratch — modules, interfaces, and recommended human checkpoints — before any code is written.

- **Concrete form**: A text description of the goal
- **Examples**:
  - "Estimate the causal effect of a policy intervention on employment using diff-in-diff with administrative claims data"
  - "Build a CLI tool that scans a codebase and generates an interactive workflow diagram"
  - "Set up a data pipeline that ingests from 3 APIs, deduplicates, enriches with LLM, and loads to Postgres"
- **What the AI uses**: Domain knowledge, common project patterns, the user's stated constraints
- **When to use**: The project does not yet exist, or you want to redesign the workflow from a clean slate

### Input C: Existing graph JSON

The user provides a previously generated (or hand-authored) graph JSON file. The viewer renders it directly.

- **Concrete form**: Path to a `.json` file conforming to `schema.json`
- **Examples**:
  - `.graphs/my-research-project.json` — previously generated
  - `examples/data-pipeline.json` — example graph
- **When to use**: Reviewing, editing, or presenting a graph that was already generated

## Outputs

### Primary output: Interactive interface map

The main output is a browser-based visualization where the default (collapsed) view shows:

- **Module boxes** with labels and descriptions
- **Interface ports** — named input and output nodes visible outside each module box, showing what data crosses each boundary
- **Edges between ports** — showing how modules connect, with labels describing the transformation
- **Confidence/checkpoint flags** (when available) — visual indicators of which modules the AI is confident about and which need human review

This interface map is the equivalent of a car's dashboard. A user unfamiliar with the project should be able to understand the overall data flow from this view alone, without expanding any module.

Expanding a module reveals its internal workflow. Clicking nodes and edges reveals file paths, scripts, and detailed descriptions.

### Secondary output: Graph JSON file

The structured data behind the visualization, written to `.graphs/{name}.json`. This file:

- Conforms to `schema.json`
- Is version-controlled and diffable (the viewer supports `?compare=` for diff overlay)
- Can be edited by hand or regenerated incrementally (preserving manual refinements)
- Serves as the single source of truth — the viewer is a read-only renderer

### Future output: Human checkpoint report

A structured summary of which module interfaces the AI recommends for human review, including:

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

The following describes the end-state workflow this tool is designed to support.

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

It organizes these into modules, defines the interfaces between them (what data flows in, what comes out), and proposes a complete workflow — an initial draft that is entirely AI-driven.

### 3. Visualization Highlights What Matters

Before any execution, the proposed workflow is rendered as an interface map. The visualization makes the following immediately visible based on the AI's initial assessment:

- **Module interfaces**: Each module's interpretable inputs and interpretable outputs — the data a human can inspect at each boundary without understanding the internals.
- **Critical paths**: Inputs and outputs that are upstream of the outcomes the user cares about — where errors would propagate to final results.
- **Recommended human checkpoints**: The specific interfaces where the AI believes human review will be most valuable — shown prominently, not buried in metadata. These are the AI's best guess before any execution, based on domain knowledge about which steps typically require human judgment.

The human operator reviews this interface map to understand the proposed workflow, assess whether the module boundaries make sense, and agree on which checkpoints they want to monitor.

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

## What This Means for the Tool

### Principle 1: Interfaces are the primary content

Module inputs and outputs are not annotations or tooltips. They are the primary content of the collapsed (big-picture) view. When modules are collapsed, the user should see named, typed data contracts flowing between boxes — not just edges with verb labels.

**Current gap**: Interface port nodes (`_isInterfacePort`) exist in the schema and are used in the self-referential example (`visual-project-map-workflow.json`), but are absent from most graphs. The generation skill should produce them by default, and the viewer should render them prominently.

### Principle 2: The default view is the interface map

The collapsed view is not a simplified fallback. It is the main view — the equivalent of a car's dashboard. It should be self-sufficient: a user should be able to understand the overall data flow, identify the critical paths, and locate the human checkpoints without expanding a single module.

**Current gap**: The viewer's auto-zoom on collapse fits too aggressively, and collapsed modules show only their label — no visible I/O ports. The default zoom level should show all modules with readable interface labels. Interface port nodes should remain visible outside the collapsed module box, showing what goes in and what comes out.

### Principle 3: Complexity lives inside modules, not between them

Cross-module connections should be simple: one edge per module pair. If two modules need multiple connections, the module boundaries are wrong — just as a car component that requires dozens of custom connectors is poorly designed.

**Current state**: The 1-edge-per-module-pair rule is already enforced in the generation skill and graph properties spec. This principle is well-served.

### Principle 4: Confidence and human-review flags must be visually encoded

The current trust-level system (border styles, tags) encodes data provenance at the node level. But the ideal workflow requires encoding AI confidence and human-review recommendations at the module and edge level — so they are visible in the collapsed interface map without expanding anything.

**Current gap**: Trust levels apply only to individual nodes. There is no schema field for module-level confidence, edge-level confidence, or a "recommended human checkpoint" flag. These need to be added so the interface map can show at a glance: "This module is AI-confident. This one needs your attention."

### Principle 5: Progressive disclosure follows the interface hierarchy

Each level of detail adds information without overwhelming:

- **Level 0 (default)**: Modules as boxes with visible I/O ports, edges as data flow between ports, confidence/checkpoint flags on modules
- **Level 1 (expand module)**: Internal nodes and edges within a module, showing the mechanism, trust levels on individual nodes
- **Level 2 (node detail)**: File paths, scripts, test results, confidence scores for individual steps

**Current gap**: The viewer supports expand/collapse and node detail panels, but Level 0 does not yet show I/O ports or module-level flags. The progressive disclosure concept is implemented for structure but not yet for confidence information.

### Principle 6: The generation skill must produce interpretable interfaces by default

Every module the skill generates should have:

- At least one named input and one named output in its `interface` field
- Interface port nodes generated automatically from the `interface` field
- A one-sentence description explaining what the module does

This is not optional enrichment — it is the minimum viable output. A graph without interpretable interfaces fails the tool's core objective.

**Current gap**: The skill's Phase 2.1 documents `interface` fields but treats them as optional ("Only include interfaces you have evidence for"). For the "design what should exist" use case, the AI always has evidence because it is proposing the workflow. The skill should always generate interfaces, using its own proposed design as evidence.

### Principle 7: Critical path identification should be automatic

Given the user's declared objective, the tool should be able to trace which module interfaces are upstream of the final outcome and mark them as critical. An error at a critical interface propagates to the result the user cares about; an error at a non-critical interface may be recoverable or irrelevant.

**Current state**: Not implemented. Path tracing exists as an interactive feature (click a node to highlight upstream/downstream), but there is no concept of a pre-computed critical path encoded in the graph data.

