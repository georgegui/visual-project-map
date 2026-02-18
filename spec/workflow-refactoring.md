# Workflow Refactoring Requirements

Requirements for organizing any project — data science, engineering, research,
or software — so that its folder structure is legible as a workflow.

Standard refactoring makes code easier to read line by line. These additional
requirements make a project's **workflow topology** match its **directory
topology** — so that the folder structure itself tells the story of how the
project works.

These requirements apply regardless of language or domain. They are the
ideal properties a project should satisfy before (or as part of) running
`/visualize-project`, and the objectives that refactoring should achieve.

---

## Part 1: Standard principles at the folder level

The following are well-known software engineering principles applied to
directories. They need no lengthy justification — the AI agent should already
know them. They are listed here as a checklist, not a tutorial.

### S1. Low coupling between folders

Between any two folders, there should be a small number of named handoffs
— ideally one, at most a handful. If two folders have many cross-dependencies,
they are entangled. Remedies: merge them, redraw the boundary so tightly
coupled pieces are together, or bundle multiple connections through a single
intermediate artifact.

Rule of thumb: more than three distinct handoffs between two folders is a
signal to reconsider the boundary.

### S2. High cohesion within folders

A folder's contents should be more related to each other than to contents
of other folders. If a folder has more cross-folder edges than internal
edges, its boundaries are wrong.

### S3. Clear interfaces

Each non-trivial folder should be describable as "takes X, produces Y."
This is design-by-contract at the directory level. See the
[documentation convention](#the-documentation-convention-claudemd--specmd)
below for the mechanism.

### S4. Acyclic by default

The primary dependency direction should be forward: A → B → C. This is the
standard acyclic-dependency principle. The novel workflow-specific nuance
is in [W3](#w3-make-feedback-loops-intentional) below.

### S5. Reasonable hierarchy

When a project has more than five or six stages at the same level, group
them under parent directories representing natural phases. Phases contain
stages; stages contain files. Two levels maximum — don't nest phases inside
phases. Don't create a phase for a single stage.

### S6. Organize by responsibility

Each folder should represent one logical concern. In software projects this
is "package by feature, not by layer." The workflow-specific version of this
principle — which breaks a strong convention in data science — is detailed
in [W1](#w1-organize-by-stage-not-by-file-type) below.

---

## Part 2: Workflow-specific requirements

These requirements have no standard refactoring equivalent. They address
concerns unique to data pipelines, research workflows, and human-AI
collaboration. Each is described in full because the agent cannot be
expected to infer them from general principles.

### W1. Organize by stage, not by file type

In software, "package by feature" is common practice. In data science and
research, the dominant convention is the opposite: `scripts/`, `data/`,
`notebooks/`, `configs/`. That structure tells you nothing about the
workflow. To understand how data moves, you have to open scripts and trace
file reads and writes.

**The requirement.** Organize folders by what they accomplish:
`acquisition/`, `cleaning/`, `estimation/`, `reporting/`. Each folder is a
stage that takes something in and produces something out.

```
BEFORE (by file type):          AFTER (by stage):

project/                        project/
├── scripts/                    ├── acquisition/
│   ├── download.py             │   ├── download.py
│   ├── clean.py                │   └── raw.csv
│   ├── estimate.py             ├── cleaning/
│   └── tables.py               │   ├── clean.py
├── data/                       │   └── cleaned.csv
│   ├── raw.csv                 ├── estimation/
│   └── cleaned.csv             │   └── estimate.py
└── output/                     └── reporting/
    └── table1.tex                  ├── tables.py
                                    └── table1.tex
```

In the first structure, you have to read `clean.py` to discover it reads
`data/raw.csv` and writes `data/cleaned.csv`. In the second, the folder
names alone tell you the pipeline.

---

### W2. Each stage produces an observable intermediate output

Every folder in the workflow should write a tangible artifact that a human
can inspect independently of the code that produced it.

**Why this isn't standard refactoring.** Standard refactoring cares about
code quality — function signatures, naming, duplication. It says nothing
about whether intermediate data artifacts are persisted to disk. But in a
data workflow, the intermediate artifacts *are* the interfaces. Without
them, there are no checkpoints, no way to re-run one stage without
re-running everything, and no way for a collaborator to verify a stage's
output without running the code.

**What counts as an observable artifact:**
- A file on disk (CSV, Parquet, JSON, pickle, RDS, image, LaTeX table)
- A database table or view with a known name
- A logged summary written to a known path

What does *not* count: a variable in memory, a return value, a print
statement. The artifact must survive the process that created it.

**Example.** A monolithic script:

```python
# do_everything.py
raw = download_data()
cleaned = clean(raw)
model = estimate(cleaned)
write_table(model)
```

Refactored into stages with intermediate outputs:

```
acquisition/
    download.py          → writes raw.csv
cleaning/
    clean.py             → reads raw.csv, writes cleaned.csv
estimation/
    estimate.py          → reads cleaned.csv, writes model.pkl
reporting/
    tables.py            → reads model.pkl, writes table1.tex
```

**Version control convention.** Commit code and contracts. Ignore generated
artifacts. The easiest pattern: each folder writes to its own `output/`
subdirectory, ignored globally:

```gitignore
**/output/
```

| Commit | Ignore |
|---|---|
| Scripts, code | Cleaned/transformed data |
| CLAUDE.md, SPEC.md | Model objects (.pkl, .rds) |
| Raw data (if small and stable) | Generated tables, figures |
| Config files, parameters | Logs, diagnostics |

For raw data too large to commit, commit a download script or a manifest
(checksums + URLs) instead.

---

### W3. Make feedback loops intentional

The standard principle is "avoid circular dependencies." The workflow-specific
nuance: real workflows *have* feedback loops, and the discipline is not to
eliminate them but to make every cycle deliberate.

If a folder both sends to and receives from another folder, the backward
dependency should exist because someone decided it is part of the workflow
— not because the code quietly grew a circular dependency. Forward
dependencies carry data. Feedback dependencies carry parameters,
corrections, or review signals. Both are documented in the relevant
CLAUDE.md files.

```
cleaning → estimation        (forward: cleaned data)
estimation → cleaning        (feedback: revised outlier thresholds)
```

**When to unroll instead.** If a feedback loop is complex — multiple signals
or more than two folders — split the stage into an initial pass and a
refinement pass:

```
cleaning-v1/ → estimation/ → cleaning-v2/
```

This converts the cycle into a linear sequence.

---

### W4. Make the executor of each step explicit

For every transition between folders, it should be clear *who or what*
performs the work: a script, a human, an AI, or some combination.

**Why this isn't standard refactoring.** In a software project, the executor
is always code. In research, data science, and AI-assisted projects, many
transitions involve a human making a judgment call, an AI generating a
draft, or a manual step between systems. These steps are invisible in the
folder structure — the project looks like a clean pipeline, but it stalls
at step 3 because someone has to manually classify 200 records.

**The four executors:**
- **Script** — fully automated, deterministic. Re-runnable.
- **AI** — an LLM or model performs the work. Output may need review.
- **Human** — requires a person: manual data entry, expert judgment,
  editorial decisions.
- **Mixed** — AI generates a draft, human reviews and edits; or a script
  runs but requires a human-provided parameter.

**Default assumption:** Most steps are AI- or script-driven with human
review at the output. Only mark a step as human-executed when the human is
doing the primary work, not just checking it.

**Why the executor matters:**
- **Reproducibility.** Script outputs can be regenerated. Human and AI
  outputs often cannot — they should be committed or archived.
- **Bottlenecks.** Human steps are where the workflow stalls. Making them
  visible lets you plan around them or decide which to automate.
- **Trust.** The executor determines where to place quality gates. A
  script step is deterministic; an AI step may need a review checkpoint.

**Example.** `coding/CLAUDE.md`:
```markdown
# coding

Classify open-ended survey responses into predefined categories.

## Executor
Human (research assistant) — requires domain judgment, not automatable.

## Inputs
- `../cleaning/output/cleaned.csv` — cleaned survey data

## Outputs
- `output/coded.csv` — responses with category labels added
```

---

### W5. Mark maturity and confidence explicitly

Every folder should declare how established it is and who performed the
work. In a living project, not all stages are equally real — the data
pipeline might be battle-tested while the estimation strategy is a sketch.
But the folder structure treats them identically.

**Status = stage + actor.** Each folder's CLAUDE.md declares a compound
status: a lifecycle stage and who performed it:

| Stage | `.ai` | `.human` | `.unknown` |
|---|---|---|---|
| `planned` | AI generated the plan | Human wrote the plan | Author unclear |
| `implemented` | AI wrote the code | Human wrote the code | Author unclear |
| `tested` | AI ran and checked output | Human ran and checked output | Tester unclear |
| `needs-review` | AI requests human review | Human flags for another review | — |
| `needs-immediate-review` | AI escalation — iterated and failed | — | — |
| `verified` | AI verified (weaker) | Human reviewed and approved (gold standard) | — |

**Default path:** `planned.ai → implemented.ai → tested.ai →
needs-review.ai → verified.human`. Human involvement is limited to review
and escalation unless they choose otherwise.

**Default actor when unknown.** For inherited codebases or projects where authorship isn't tracked, use `.unknown` as the actor suffix (e.g., `implemented.unknown`, `tested.unknown`). This is honest about provenance — better than guessing `.ai` or `.human`. When a human later reviews a `.unknown` folder, it upgrades to `verified.human`.

**Status modifiers.** When the target moves — specs change, features get
added — append a modifier in parentheses:

```
implemented.ai (extending — base verified.human, adding feature X)
planned.ai (pivot — previous approach discarded, new spec)
needs-immediate-review.ai (iteration 3 — tried X and Y, neither resolved)
```

**Confidence is distinct from status.** Status describes how far along the
implementation is. Confidence describes how certain you are about the
*approach*. A folder can be `verified.human` but low confidence (you're not
sure it's the right method), or `implemented.ai` but high confidence (the
approach is standard, just incomplete).

```
acquisition/      status: verified.human      confidence: high
cleaning/         status: tested.ai           confidence: high
estimation/       status: implemented.ai      confidence: medium
reporting/        status: planned.ai          confidence: low
```

---

## The documentation convention: CLAUDE.md + SPEC.md

The standard principles (S1–S6) and workflow requirements (W1–W5) are
realized through two files per non-trivial folder:

**`CLAUDE.md`** — the folder's public interface. A short declaration of
purpose, inputs, outputs, executor, and status. What a collaborator or
tool needs to know without looking inside.

**`SPEC.md`** — the folder's detailed specification. Full input/output
schemas, acceptance criteria, edge cases, and validation checks. What you
consult when working inside the folder.

**Example.** `cleaning/CLAUDE.md`:
```markdown
# cleaning

Standardize and validate raw survey data.

## Executor
Script (clean.py)

## Status
tested.ai

## Inputs
- `../acquisition/output/survey_raw.csv` — raw survey responses

## Outputs
- `output/cleaned.csv` — deduplicated, type-cast, missing values flagged
```

`cleaning/SPEC.md`:
```markdown
# cleaning — Specification

## Input schema
- `survey_raw.csv`: 12 columns, UTF-8, pipe-delimited.

## Cleaning rules
- Drop exact duplicate rows
- Cast `age` to integer; reject rows where age < 0 or age > 120
- Flag missing values in `income` column as `NaN` (do not impute)

## Output schema
- `cleaned.csv`: same 12 columns plus `_flag_missing_income` boolean

## Acceptance criteria
- Zero duplicate rows in output
- All type casts succeed or row is logged to `cleaning/rejected.log`
```

Phase directories get a CLAUDE.md too — a summary listing the contained
stages, not a detailed contract.

The outputs listed in CLAUDE.md (S3) should correspond to real files that
the stage writes (W2). If CLAUDE.md says "outputs: cleaned.csv" but the
code only passes a dataframe in memory, the contract is fiction.
