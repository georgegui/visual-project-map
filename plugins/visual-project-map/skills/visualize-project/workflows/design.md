# Phase 1B — Design from Objective

> Extracted from SKILL.md. Used when `--objective` or `--objective-file` is provided without `--refactor` (Input B).

**Skip this phase entirely if using Input A (directory scan).** This phase replaces
Phase 1 when `--objective` or `--objective-file` is provided.

## Table of Contents
- Step 1B.1: Parse the Objective
- Step 1B.2: Identify Workflow Stages
- Step 1B.3: Define Data Flow
- Step 1B.4: Assess Confidence and Review Needs
- Step 1B.5: Synthesize

---

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

> For a complete worked example, see `examples/design-example.md`.

---

## Design-Mode Defaults

Apply these throughout Phase 2 (graph generation) when using `--objective`:

> - All `status`: `"planned"` — no code exists yet
> - **Omit**: `node.files`, `node.style.trust`, `edge.details`, `legend.trustLevels`
> - **Always generate**: `module.interface` with inputs and outputs
> - **Always generate**: `edge.description` on all cross-module edges
> - **Assign per module**: `confidence` and `needsHumanReview` per inference rules
> - **Assign per edge**: `confidence` per inference rules
