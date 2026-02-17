# Phase 1 — Discovery (Scan Mode)

> Extracted from SKILL.md. Used when scanning an existing project (Input A — no `--objective`, `--refactor`, or `--plan` flags).

> **SPEC principles**: P8 (CLAUDE.md per module), P10 (embed folder hierarchy)

Scan the project to build a mental model of its structure and workflows.
Do steps 1.1-1.4 in parallel where possible.

## Table of Contents
- Step 1.1: Find documentation files
- Step 1.1b: Detect test coverage and review evidence
- Step 1.2: Read documentation
- Step 1.3: Find scripts
- Step 1.4: Detect I/O patterns
- Step 1.5: Synthesize

---

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

### Step 1.1b: Detect test coverage and review evidence

Use Glob to find test files alongside the documentation scan:
```
**/test_*.py
**/*_test.py
**/*.test.ts
**/*.test.js
**/*.spec.ts
**/*.spec.js
**/tests/
**/__tests__/
```

For each test file found, note which module directory it corresponds to.
A module with test files gets a higher confidence and status assignment
than one without.

Use Grep on key scripts (the ~10 most important from Step 1.1) to detect
quality signals:

| Pattern | Signal | Effect |
|---------|--------|--------|
| `TODO`, `FIXME`, `HACK`, `XXX` | Unfinished work | Lowers confidence, flags `needsHumanReview` |
| `@pytest.mark`, `describe(`, `it(`, `test(` | Test presence in source | Confirms test coverage |
| `assert`, `expect(`, `assertEqual` | Assertions | Confirms meaningful tests |

**Do not run tests** — just detect the presence of test infrastructure.
These signals feed into status assignment (Step 2.1) and confidence
assignment (see `_foundations/inference-rules.md` § "Scan-Mode Confidence
Heuristics").

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

## Scan-Mode Defaults

These scan-mode-specific defaults apply during Phase 2 (Generation) when the
discovery was performed via Input A (directory scan).

### Module defaults

- **Always** include `confidence` per the heuristics in
  `_foundations/inference-rules.md` § "Scan-Mode Confidence Heuristics"
- **Always** include `needsHumanReview` when confidence is `low` or when
  `TODO`/`FIXME` signals were detected in Step 1.1b
- Include `checkpointReason` when `needsHumanReview` is true — explain what
  triggered the flag (e.g., "No test coverage", "Contains FIXME comments",
  "Complex logic without documentation")
- **Always** include `interface` with `inputs` and `outputs` — infer from
  I/O evidence (Step 1.4) or from the module's position in the data flow

### Edge defaults

- **Always** include `confidence` per the heuristics in
  `_foundations/inference-rules.md` § "Scan-Mode Confidence Heuristics"
  (based on evidence quality: documented = high, file I/O inferred = high,
  directory adjacency only = low)
