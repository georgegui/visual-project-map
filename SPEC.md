# Roadmap

## Objective

Visual Project Map solves two related needs:

1. **Map what exists.** Given an existing project, generate a clear visualization of its workflow — the components, how they connect, and what data flows between them.

2. **Design what should exist.** Given an objective, generate a proposed workflow that achieves it. The objective could be a research question ("Estimate the causal effect of X on Y using administrative claims data") or an engineering goal ("Build a tool that visualizes project workflows and highlights where human review is needed").

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

## From Design to Implementation

After a design-mode graph is generated (steps 1–3 above), the following procedure bridges the gap between the proposed architecture and working code. It creates a closed loop: **design → scaffold → specify → implement → validate → update graph → review**.

### Step A: Scaffold the Folder Structure

From the design graph's modules and interfaces, create the directory tree with documentation stubs:

- One directory per module, named from the module label (lowercase, underscores)
- Each directory contains a `CLAUDE.md` stating:
  - The module's **objective** in 1–2 sentences (from the module's `description`)
  - Its **inputs and outputs** (from the module's `interface` field)
  - A reference to `SPEC.md` for detailed specifications
- Each directory also contains a `SPEC.md` stub with placeholders for acceptance criteria, edge cases, and validation checks

The generation skill's Step 3.5b produces a printable scaffolding suggestion. This step materializes it into actual files.

### Step B: Write Component Specs

For each module directory, expand the `SPEC.md` stub with:

- **Acceptance criteria**: What must be true for this module's output to be correct?
- **Edge cases**: What inputs might break this module?
- **Validation checks**: How can the AI (or a test suite) verify its own output?

For modules with `needsHumanReview: true`, the spec should explicitly separate what requires domain expertise from what the AI can handle independently. The `checkpointReason` from the design graph is the starting point.

### Step C: Implement Module-by-Module

Work through modules in **topological order** (upstream modules first, following the graph's edge direction). For each module:

1. Read the module's `CLAUDE.md` for objective and interface contract
2. Read the module's `SPEC.md` for acceptance criteria and edge cases
3. Implement the module
4. **Run the validate-iterate loop** (see Principle 9):
   a. Run all validation checks from `SPEC.md` — acceptance criteria, edge cases, and any automated tests
   b. If all checks pass → status upgrades from `planned` to `ai-tested`. Done.
   c. If any check fails → diagnose the failure, fix the implementation, and re-run from (a).
   d. Repeat up to **3 attempts**. On each attempt, the AI should try a different approach — not the same fix twice.
   e. If still failing after 3 attempts → flag as `needs-review` with a clear description of what was tried, what failed, and what the AI believes the root cause is.
5. The AI must NOT silently skip failing checks or lower the bar. The `SPEC.md` criteria are the contract.

### Step D: Update the Graph

After implementing one or more modules, re-scan the project with Input A:

```
/visualize-project .
```

Incremental mode detects the design-to-scan transition:

- Modules with corresponding directories and scripts upgrade from `planned` to `draft` or `ai-tested` based on scan evidence
- Modules still without code remain `planned` (ghost opacity in the viewer)
- The visualization gains opacity as components are implemented — a natural progress indicator
- The `_generationMode` field updates from `"design"` to `"scan"` once any module has code

### Step E: Human Review at Checkpoints

Modules flagged with `needsHumanReview: true` require domain expert sign-off before upgrading to `verified`. The checkpoint review focuses on:

- Does the implementation match the `SPEC.md` acceptance criteria?
- Are the domain-specific decisions (flagged in `checkpointReason`) correct?
- Are the intermediate outputs at module boundaries interpretable and correct?

After review, the human marks the module as `verified` (or requests changes), and a re-scan reflects the updated status in the graph.

### Why This Procedure Matters

Each module's `CLAUDE.md` serves a dual purpose:

1. **Implementation contract** — the AI reads it before coding to understand what the module should do
2. **Scanning target** — the generation skill reads it during Input A to infer module boundaries and interfaces (Step 1.2)

Projects that follow this convention produce better graphs on re-scan, which produces better `CLAUDE.md` suggestions on the next design iteration — a virtuous cycle. This is the operational form of Principle 8.

## What This Means for the Tool

> **Implementation status**: See `spec/features.md` for which principles are
> fully implemented, partially implemented, or still planned.

### Principle 1: Interfaces are the primary content

Module inputs and outputs are not annotations or tooltips. They are the primary content of the collapsed (big-picture) view. When modules are collapsed, the user should see named, typed data contracts flowing between boxes — not just edges with verb labels.

### Principle 2: The default view is the interface map

The collapsed view is not a simplified fallback. It is the main view — the equivalent of a car's dashboard. It should be self-sufficient: a user should be able to understand the overall data flow, identify the critical paths, and locate the human checkpoints without expanding a single module.

### Principle 3: Complexity lives inside modules, not between them

Cross-module connections should be simple: one edge per module pair. If two modules need multiple connections, the module boundaries are wrong — just as a car component that requires dozens of custom connectors is poorly designed.

### Principle 4: Confidence and human-review flags must be visually encoded

The current trust-level system (border styles, tags) encodes data provenance at the node level. But the ideal workflow requires encoding AI confidence and human-review recommendations at the module and edge level — so they are visible in the collapsed interface map without expanding anything.

### Principle 5: Progressive disclosure follows the interface hierarchy

Each level of detail adds information without overwhelming:

- **Level 0 (default)**: Modules as boxes with visible I/O ports, edges as data flow between ports, confidence/checkpoint flags on modules
- **Level 1 (expand module)**: Internal nodes and edges within a module, showing the mechanism, trust levels on individual nodes
- **Level 2 (node detail)**: File paths, scripts, test results, confidence scores for individual steps

### Principle 6: The generation skill must produce interpretable interfaces by default

Every module the skill generates should have:

- At least one named input and one named output in its `interface` field
- Interface port nodes generated automatically from the `interface` field
- A one-sentence description explaining what the module does

This is not optional enrichment — it is the minimum viable output. A graph without interpretable interfaces fails the tool's core objective.

### Principle 7: Critical path identification should be automatic

Given the user's declared objective, the tool should be able to trace which module interfaces are upstream of the final outcome and mark them as critical. An error at a critical interface propagates to the result the user cares about; an error at a non-critical interface may be recoverable or irrelevant.

### Principle 8: Complex modules should be self-documenting via CLAUDE.md

Each component/module subfolder that has non-trivial logic should contain a `CLAUDE.md` file that:
- States the module's **high-level objective** in 1-2 sentences
- Lists its **inputs and outputs** (what crosses the boundary)
- References a `SPEC.md` or `spec/` folder for detailed specifications (schemas, acceptance criteria, edge cases)

The CLAUDE.md stays concise — it is the module's "interface label", not its implementation docs. Detailed specs live in the referenced SPEC.md. This convention:
- Makes Input A scanning more reliable (the skill already prioritizes CLAUDE.md in Step 1.2)
- Gives Input B a scaffolding suggestion (design-mode can propose CLAUDE.md files alongside folders)
- Creates a natural checkpoint document for human review at each module boundary

### Principle 9: AI must validate against SPEC.md and iterate before escalating

The AI does not get to say "done" without evidence. For every module it implements, the AI must:

1. **Run the checks** — execute every testable acceptance criterion in the module's `SPEC.md`. This includes unit tests, integration checks, format validation, and any automated verification the spec defines. If `SPEC.md` says "output conforms to X", the AI must actually verify that it does.

2. **Iterate on failure** — if any check fails, the AI diagnoses the failure, fixes the implementation, and re-runs. Each attempt should try a **different approach**, not repeat the same fix. The AI records what it tried and why it failed.

3. **Escalate after 3 attempts** — if the module still fails after 3 genuine attempts, the AI must stop and escalate to the human. The escalation includes:
   - Which specific `SPEC.md` criteria are still failing
   - What was tried on each of the 3 attempts
   - The AI's best hypothesis for the root cause
   - Whether the spec itself might be wrong (specs are not sacred — they can have bugs too)

4. **Never silently skip** — the AI must not lower the bar, skip a failing test, or mark a module as `ai-tested` when checks are still red. If the spec is wrong, escalate that observation — don't just ignore the criterion.

**Why 3 attempts?** One attempt catches simple bugs. Two attempts catches the "I misunderstood the spec" case. Three attempts is enough to exhaust the obvious approaches. Beyond three, the AI is likely stuck in a loop and a human perspective will be more productive than a fourth attempt at the same problem.

**What counts as an attempt?** A genuine implementation change followed by a full re-run of the failing checks. Tweaking a comment or reformatting code is not an attempt. The AI must change something substantive about the approach.

**Status implications:**
- All checks pass on attempt 1-3 → `ai-tested`
- Escalated after 3 attempts → `needs-review` with the attempt log
- Human resolves the issue → `verified` (human was in the loop)
