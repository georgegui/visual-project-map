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

## W1. Organize by stage, not by file type

Each folder should represent one logical stage of the workflow, not one
language or one file type.

**The problem.** A typical project organizes by file type: `scripts/`, `data/`,
`notebooks/`, `configs/`. That structure tells you nothing about the workflow.
To understand how data moves through the project, you have to open individual
scripts and trace which files they read and write. The folder names don't help.

**The requirement.** Organize folders by what they accomplish: `acquisition/`,
`cleaning/`, `estimation/`, `reporting/`. Each folder is a stage that takes
something in and produces something out. A newcomer reading the top-level
directory listing can immediately see the project's pipeline without opening
a single file.

**Example.** A research project with this structure:

```
project/
├── scripts/
│   ├── download.py
│   ├── clean.py
│   ├── estimate.py
│   └── tables.py
├── data/
│   ├── raw.csv
│   └── cleaned.csv
└── output/
    └── table1.tex
```

becomes harder to understand than:

```
project/
├── acquisition/
│   ├── download.py
│   └── raw.csv
├── cleaning/
│   ├── clean.py
│   └── cleaned.csv
├── estimation/
│   └── estimate.py
└── reporting/
    ├── tables.py
    └── table1.tex
```

In the first structure, you have to read `clean.py` to discover it reads
from `data/raw.csv` and writes to `data/cleaned.csv`. In the second, the
folder names alone tell you: acquisition feeds cleaning feeds estimation
feeds reporting.

---

## W2. Every folder has an explicit input-output contract

Each non-trivial folder should be describable as: "this folder takes X and
produces Y."

**The problem.** Standard refactoring says functions should have clear
interfaces. But at the folder level, most projects have no equivalent — a
folder is just a bag of files, and you have to read the code inside to
understand what it consumes and what it emits. A collaborator joining the
project, or an AI agent working in one folder, cannot know what upstream
data to expect or what downstream folders depend on without reading
unrelated code.

**The requirement.** Every non-trivial folder gets two files as part of
the refactoring:

1. **`CLAUDE.md`** — a precise, short declaration of the folder's purpose,
   inputs, and outputs. This is the folder's public interface: what a
   collaborator or tool needs to know without looking inside.
2. **`SPEC.md`** (or a `spec/` subdirectory) — detailed specifications:
   full input/output schemas, acceptance criteria, edge cases, and other
   requirements that govern the folder's implementation.

The CLAUDE.md is the summary you read to understand the folder from outside.
The SPEC.md is the detailed documentation you consult when working inside it.

**Example.** A `cleaning/` folder:

`cleaning/CLAUDE.md`:
```markdown
# cleaning

Standardize and validate raw survey data.

## Inputs
- `../acquisition/survey_raw.csv` — raw survey responses

## Outputs
- `cleaned.csv` — deduplicated, type-cast, missing values flagged
```

`cleaning/SPEC.md`:
```markdown
# cleaning — Specification

## Input schema
- `survey_raw.csv`: 12 columns, UTF-8, pipe-delimited. See acquisition/SPEC.md
  for column definitions.

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

---

## W3. Separate forward flow from feedback loops

The primary flow between folders should read in one direction. Feedback
loops should be explicit, named, and few.

**The problem.** When two folders depend on each other — estimation reads
from cleaning, but cleaning also reads from estimation to handle outlier
thresholds — the project's structure becomes hard to follow. This isn't
because cycles are forbidden; real workflows have feedback loops. The
problem is when cycles are *accidental*: the code in folder A happens to
read a file from folder B while folder B also reads from folder A, and
nobody made that loop deliberate.

**The requirement.** Distinguish the forward path from the feedback path:

- **Forward dependencies** are the primary pipeline: acquisition →
  cleaning → estimation → reporting. These should be obvious from the
  folder structure and naming.
- **Feedback dependencies** are intentional loops: estimation results
  feeding back into cleaning thresholds, model diagnostics triggering a
  re-acquisition step, human review sending a stage back for revision.
  These should be explicitly documented in the relevant CLAUDE.md files
  so that a reader knows the loop exists and why.

The refactoring discipline is not "eliminate all cycles" but "make every
cycle intentional." If a folder both sends to and receives from another
folder, the backward dependency should exist because someone decided the
feedback loop is part of the workflow, not because the code quietly grew
a circular dependency.

**Example.** An estimation stage discovers that certain outlier thresholds
in cleaning need adjustment:

```
cleaning → estimation        (forward: cleaned data)
estimation → cleaning        (feedback: revised outlier thresholds)
```

The forward dependency carries data. The feedback dependency carries
parameters. Both are documented in the respective CLAUDE.md files. A reader
immediately understands: "this pipeline mostly flows forward, with one
deliberate feedback loop between these two stages."

**When to split instead.** If a feedback loop is complex — multiple
signals flowing back, or the loop involves more than two folders — consider
splitting the stage into an initial pass and a refinement pass:

```
cleaning-v1/ → estimation/ → cleaning-v2/
```

This unrolls the cycle into a linear sequence, which is easier to follow.
Use this when the feedback represents distinct phases of work rather than
a tight iterative loop.

---

## W4. Keep cross-folder dependencies sparse

The number of dependencies between any two folders should be small —
ideally one well-named handoff, at most a handful.

**The problem.** When a folder has a dozen scripts that each read from a
different file in another folder, the two folders are entangled. To
understand either one, you have to understand both. This defeats the
purpose of separating them into stages — the folder boundary isn't
providing any simplification.

**The requirement.** Between any two folders, there should be a small
number of named handoffs. If the real dependency count is high, refactor
to reduce it:

- **Merge.** If two folders have many dependencies between them, they may
  be doing the same job. Merge them into one stage.
- **Split differently.** If merging makes the folder too large, the
  boundary is drawn in the wrong place. Redraw it so that the tightly
  coupled pieces land on the same side.
- **Bundle through an interface.** If the many connections are
  legitimate, introduce a single intermediate artifact — a combined
  dataset, a config file, a shared output directory — that serves as
  the handoff point. Multiple internal paths converge on this artifact
  inside the source folder, and the target folder reads only from it.

**Example.** An `estimation/` folder with three scripts that each read a
different file from `cleaning/`:

```
cleaning/cleaned_demographics.csv  →  estimation/model_a.py
cleaning/cleaned_income.csv        →  estimation/model_b.py
cleaning/cleaned_education.csv     →  estimation/model_c.py
```

This means anyone working in `estimation/` needs to understand three
separate outputs from `cleaning/`. Refactor by having `cleaning/` produce
a single combined output:

```
cleaning/analysis_ready.csv  →  estimation/
```

Or, if the separate files are genuinely needed, bundle them under one
named interface in `cleaning/CLAUDE.md`: "analysis-ready dataset (3 files)."

**Rule of thumb.** If two folders have more than three distinct handoffs,
treat it as a signal to reconsider the folder boundary.

---

## W5. Each stage produces an observable intermediate output

Every folder in the workflow should write a tangible artifact that a human
can inspect independently of the code that produced it.

**The problem.** In many projects, especially research and data science,
a single long script downloads data, cleans it, runs a model, and produces
a final table. The entire workflow lives inside one execution — there are
no intermediate checkpoints. If something goes wrong at the end, you have
to re-run the whole thing and add print statements to figure out where.
Worse, the project's structure gives no hint of what the internal stages
are, because nothing is written between start and finish.

**The requirement.** Break work into stages at the points where data
changes form, and have each stage write its output to disk. These
intermediate artifacts — a cleaned CSV, a fitted model object, a summary
table, a set of parameter estimates — are what make the workflow
*inspectable*. You can:

- Verify that a stage produced correct output before the next stage runs
- Re-run a downstream stage without re-running everything upstream
- Hand off a stage's output to a collaborator who doesn't need your code
- Compare outputs across runs (did the cleaning step change anything?)

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

Each folder's output is a file you can open and inspect. If `cleaned.csv`
looks wrong, you know the problem is in `cleaning/`, not downstream. If
`model.pkl` looks right but `table1.tex` is wrong, the bug is in
`reporting/`.

**Relationship to W2.** The outputs listed in a folder's CLAUDE.md (W2)
should correspond to real files that the stage actually writes. If the
CLAUDE.md says "outputs: cleaned.csv" but the code only passes a dataframe
in memory to the next function, the contract is fiction. The artifact
makes the contract real.

**Version control.** Commit code and contracts. Ignore generated artifacts.
If a file can be reproduced by running the code in its folder against its
declared inputs, it is generated and should be gitignored. If it cannot be
reproduced — raw data from an external source, hand-coded lookup tables,
configuration — it should be tracked.

| Commit | Ignore |
|---|---|
| Scripts, code | Cleaned/transformed data |
| CLAUDE.md, SPEC.md | Model objects (.pkl, .rds) |
| Raw data (if small and stable) | Generated tables, figures |
| Config files, parameters | Logs, diagnostics |
| Schema definitions | Anything large or volatile |

For raw data that is too large to commit, commit a download script or a
manifest (checksums + URLs) instead.

The easiest pattern is to give each folder a conventional output
subdirectory — `output/` — and ignore it globally with one gitignore rule:

```gitignore
**/output/
```

The folder structure becomes:

```
cleaning/
    CLAUDE.md
    SPEC.md
    clean.py            ← committed
    output/
        cleaned.csv     ← ignored, regenerated by clean.py
```

Every stage writes to its own `output/`. One rule covers them all. The
CLAUDE.md still declares `output/cleaned.csv` as the folder's output —
the contract is documented even though the artifact is not tracked.

An alternative is a project-wide build directory (`build/cleaning/`,
`build/estimation/`, etc.) with a single top-level ignore on `build/`.
This keeps all artifacts in one place, which is simpler for cleanup
(`rm -rf build/`) but separates the output from the code that produced it.

---

## W6. Make the executor of each step explicit

For every transition between folders, it should be clear *who or what*
performs the work: a script, a human, an AI, or some combination.

**The problem.** In a software project, the executor is almost always
code — a script runs, it reads input, it writes output. But in research,
data science, and engineering projects, many transitions involve a human
making a judgment call, an AI generating a draft, or a manual copy-paste
between systems. These steps are invisible in the folder structure. The
project looks like a clean pipeline, but in reality it stalls at step 3
because someone has to manually classify 200 records, and nobody documented
that.

**The requirement.** Each folder's CLAUDE.md should state not just *what*
the folder does, but *how it gets done*:

- **Script** — fully automated, deterministic. A command runs and produces
  the output without human involvement.
- **AI** — an LLM or model performs the work: classification, summarization,
  draft generation, code writing. Output may need review.
- **Human** — requires a person to perform the work: manual data entry,
  expert coding, visual inspection, editorial judgment.
- **Mixed** — a combination: an AI generates a draft, a human reviews and
  edits; or a script runs but requires a human to provide a parameter.

**The default assumption.** Most steps are executed by AI and scripts. The
human role is primarily quality control — reviewing outputs, approving
results, and making judgment calls at key checkpoints. When a folder's
CLAUDE.md does not specify an executor, assume it is AI- or script-driven
with human review at the output. Only mark a step as human-executed when
the human is doing the *primary work*, not just checking it.

**Why this matters for project organization.** The executor determines:

- **Reproducibility.** Script steps can be re-run automatically. Human
  and AI steps cannot — their outputs should be committed or archived,
  not regenerated.
- **Bottlenecks.** Human steps are where the workflow stalls. Making them
  visible lets you plan around them, parallelize them, or decide which
  ones to automate.
- **Trust.** A cleaning step done by a script is deterministic. The same
  step done by an AI may need a human review checkpoint afterward. Knowing
  the executor tells you where to place quality gates.

**Example.** A `coding/` folder where a research assistant manually codes
survey responses:

`coding/CLAUDE.md`:
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

A reader immediately knows: this step requires a person, its output can't
be regenerated by running a script, and the project will wait here until
someone does the work.

**Relationship to W5.** Human and AI steps are where the version control
guidance from W5 matters most. Script outputs can be regenerated — ignoring
them is safe. Human outputs often *cannot* be regenerated and should be
committed or stored outside the repo with a manifest.

---

## W7. Mark maturity and confidence explicitly

Every folder should declare how established it is — whether it's a plan,
a working draft, a tested implementation, or a human-verified deliverable
— and *who* performed each stage.

**The problem.** In a living project, not all stages are equally real. The
data acquisition pipeline might be battle-tested and running daily, while
the estimation strategy is a sketch someone wrote last week. But the
folder structure treats them identically — both are just directories with
files inside. A collaborator looking at the project has no way to tell
which parts are solid and which are still taking shape, unless they read
the code and judge for themselves.

### Status = stage + actor

Each folder's CLAUDE.md declares a compound status: a **stage** (where it
is in the lifecycle) and an **actor suffix** (who performed it). The
format is `stage.actor`:

| Stage | `.ai` | `.human` |
|---|---|---|
| `planned` | AI generated the plan/spec | Human wrote the plan/spec |
| `implemented` | AI wrote the code | Human wrote the code |
| `tested` | AI ran it, checked output, believes it works | Human ran it and checked output |
| `needs-review` | AI requests routine human review | Human flags for another human to review |
| `needs-immediate-review` | AI escalation — iterated and failed, needs human now | — |
| `verified` | AI verified output (weaker — no human checked) | Human reviewed and approved (gold standard) |

The actor suffix answers: "who did this work?" This matters because
`tested.ai` and `tested.human` represent very different levels of
assurance. A human who tested something has exercised judgment; an AI that
tested something has checked what it was told to check.

### Default transition path

By default, AI does the work and humans review and verify. The
recommended transition path for most folders is:

```
planned.ai → implemented.ai → tested.ai → needs-review.ai → verified.human
     │              │               │                              │
     │              │               └── if AI can't fix ──────────┘
     │              │                   needs-immediate-review.ai
     │              │                          │
     │              └──────────────────────────┘
     │                (AI iterates: implement → test → implement → ...)
     │
     └── human may author the plan instead: planned.human
```

In this default path, **human involvement is limited to two stages**:

1. **Review** — human checks what AI produced (`needs-review.ai` →
   `verified.human`)
2. **Escalation** — human intervenes when AI is stuck
   (`needs-immediate-review.ai` → guidance → back to `implemented.ai`)

The human does not need to plan, implement, or test unless they choose to.
Any stage *can* be `.human` — the actor suffix simply records who did it.

### Alternative transitions

**Human plans, AI implements.** Common when the human knows the approach
but delegates execution:

```
planned.human → implemented.ai → tested.ai → needs-review.ai → verified.human
```

**Human does everything.** For stages that require domain expertise or
cannot be delegated:

```
planned.human → implemented.human → tested.human → verified.human
```

**AI verifies (no human in the loop).** For low-stakes or well-understood
stages where human review is not worth the time:

```
planned.ai → implemented.ai → tested.ai → verified.ai
```

Note: `verified.ai` is weaker than `verified.human`. It means "AI
believes this is correct and no human has checked." Acceptable for routine
stages, not for high-stakes outputs.

### Status modifiers

A project is a living thing — specs change, features get added, approaches
get discarded. The six stages assume a fixed target, but real projects
move the target. To handle this without adding more statuses, use an
optional **modifier** in parentheses that explains *why* the folder is in
its current state:

```markdown
## Status
implemented.ai (extending — base verified.human, adding feature X)
```

```markdown
## Status
planned.ai (pivot — previous approach discarded, new spec)
```

```markdown
## Status
needs-immediate-review.ai (iteration 4 — AI cannot resolve output mismatch)
```

The compound status tells you where the folder is and who did the work.
The modifier tells you the backstory.

### Common scenarios

**Adding a feature to a verified folder.** The SPEC.md is updated with
new requirements. The status resets to reflect the gap between current
implementation and current spec:

```
Status: implemented.ai (extending — base verified.human, adding outlier detection)
```

**Spec pivot.** The approach is wrong. The SPEC.md is rewritten:

```
Status: planned.ai (pivot — switching from OLS to IV estimation)
```

**AI iteration and escalation.** AI implements, tests, finds problems,
re-implements, tests again, still broken:

```
Status: needs-immediate-review.ai (iteration 3 — output variance too high,
tried log transform and winsorization, neither resolved)
```

**Partial verification.** Human reviews, approves the core logic, says
"fix this edge case":

```
Status: implemented.ai (partial verification — core verified.human,
edge case in SPEC.md §3.2 unresolved)
```

**Upstream dependency change.** An upstream folder changes its output
format. This folder's code no longer matches its inputs:

```
Status: tested.ai (stale — upstream cleaning/ changed output schema,
needs re-testing against new format)
```

### Confidence is distinct from status

Status describes how far along the implementation is and who did the work.
Confidence describes how certain you are about the *approach*. A folder
can be `verified.human` (the code works correctly) but low confidence
(you're not sure this is the right method). Or `implemented.ai` but high
confidence (you know what to build, AI just hasn't finished). Both are
worth recording:

```markdown
## Status
implemented.ai

## Confidence
high — the diff-in-diff specification is well-established; implementation
is straightforward but incomplete.
```

**Example.** A project where the early stages are solid but the estimation
strategy is still exploratory:

```
acquisition/      status: verified.human      confidence: high
cleaning/         status: tested.ai           confidence: high
estimation/       status: implemented.ai      confidence: medium
reporting/        status: planned.ai          confidence: low
```

A collaborator sees immediately: acquisition is human-verified and solid,
cleaning is AI-tested and awaiting review, estimation is in progress, and
reporting is still a plan. They know where to offer help, what outputs to
trust, and who touched what.

---

## W8. Group stages into phases

Related folders should be grouped under a parent directory that represents
a conceptual phase of the project.

**The problem.** A project with ten folders at the top level is hard to
navigate. Even if each folder is well-named (W1) and has a clear contract
(W2), reading a flat list of ten stages requires holding the entire
pipeline in your head at once. You can't quickly answer "how far along is
the data preparation?" without scanning every folder and mentally grouping
them yourself.

**The requirement.** When a project has more than a handful of stages,
group them under parent directories that represent the project's natural
chapters. These parent directories are *phases* — they don't contain code
themselves, they organize the stages that do:

```
project/
├── data-preparation/
│   ├── acquisition/
│   ├── cleaning/
│   └── linkage/
├── analysis/
│   ├── estimation/
│   ├── robustness/
│   └── diagnostics/
└── output/
    ├── tables/
    └── figures/
```

A newcomer reads three phase names to understand the project's arc, then
drills into whichever phase they need. The phase directory serves as a
table of contents.

**Phases get CLAUDE.md too.** A phase directory should have its own
CLAUDE.md that describes the phase's purpose and lists its stages. This
is not a detailed contract — it's a summary that orients a reader:

`data-preparation/CLAUDE.md`:
```markdown
# data-preparation

Acquire, clean, and link raw data sources into an analysis-ready dataset.

## Stages
- `acquisition/` — download and store raw data
- `cleaning/` — standardize, validate, flag missing values
- `linkage/` — join survey data with administrative records
```

**When to group.** Not every project needs phases. A four-stage pipeline
is fine as a flat structure. Grouping helps when:

- The project has more than five or six stages at the same level
- There are natural chapter boundaries (data work vs. analysis vs.
  output) that a collaborator would recognize
- Different people or teams own different parts of the project, and
  the phases correspond to ownership boundaries

**When not to group.** Don't create phases for the sake of nesting. A
phase with one stage inside it adds a directory level without adding
understanding. The grouping should reflect a real conceptual boundary, not
an organizational habit.

**Two levels maximum.** Phases contain stages. Stages contain files and
`output/`. Don't nest phases inside phases. If a project feels like it
needs three levels of directory hierarchy, it's likely that the stages
are too fine-grained (merge some) or the phases are too broad (split
them). Two levels — phase and stage — is enough for most projects.
