# Inference Rules

Lookup tables for detecting modules, nodes, edges, and their properties
from project structure and documentation.

## Module Detection

A directory or section becomes a module when ANY signal matches:

| Signal | Source | Example |
|--------|--------|---------|
| Directory with CLAUDE.md | Glob | `scripts/review/CLAUDE.md` |
| Directory with 2+ scripts | Glob | `scripts/discovery/*.py` |
| Top-level workflow section in CLAUDE.md | Read | `### Workflow: Download` |
| Named pipeline stage | Read | `## Phase 1 — Discovery` |
| Package with `__init__.py` or `__main__.py` | Glob | `scripts/lib/` |
| Directory with Makefile target | Read | `build:`, `test:`, `deploy:` |

### Module ID Convention

- Prefix: `mod_` for regular modules, `phase_` for phase groupings
- Body: lowercase directory or section name, underscores for spaces
- Examples: `mod_discovery`, `mod_review`, `phase_input`

## Node Detection

### Shape Assignment

| Signal (in text) | Shape | Meaning |
|-------------------|-------|---------|
| Default / data state / step | `round-rectangle` | State or data point |
| "if", "check", "gate", "verify", "validate", "decide" | `diamond` | Decision/branch |
| "process", "run", "execute", "transform", "compute" | `ellipse` | Process/action |
| Terminal: "complete", "done", "included", "success" | `round-rectangle` | Terminal (green override) |
| Terminal: "fail", "error", "excluded", "rejected" | `round-rectangle` | Terminal (red override) |

### Trust Level Assignment

Only include trust levels when the project has clear provenance semantics.

| Signal | Trust | Border |
|--------|-------|--------|
| Raw input, unprocessed data | `normal` | solid, thin |
| Script output, automated result | `auto` | solid, thin + tag |
| AI/LLM-generated content | `ai` | dashed + tag |
| Human-reviewed, manually verified | `verified` | solid, thick + tag |

### Node ID Convention

- Format: `{module_prefix}_{short_name}` (lowercase, underscores)
- Keep short: 2-15 chars after prefix
- Examples: `disc_new`, `acq_downloaded`, `rev_pass`

### Node Label Convention

- Format: `module_name.state_name` (dot notation)
- Terminal labels: ALL CAPS (`INCLUDED`, `EXCLUDED`, `FAILED`, `COMPLETE`)
- Examples: `discovery.scored`, `review.ai_pass`, `INCLUDED`

## Edge Detection

### Style Assignment

| Signal | Style |
|--------|-------|
| Sequential steps (1 → 2 → 3) | `"solid"` |
| Script A output feeds Script B | `"solid"` |
| "retry", "loop", "re-run", "feedback" | `"dashed"` |
| "optional", "may", "if available" | `"dashed"` |
| Error recovery path | `"dashed"` |
| Default | `"solid"` |

### Actor Assignment

| Signal (in text or file type) | Actor |
|-------------------------------|-------|
| `.py`, `.sh`, `.ts` script invocation | `"script"` |
| `Makefile`, `CI/CD`, `cron`, automated | `"script"` |
| "review", "approve", "manually", "human" | `"human"` |
| "AI", "LLM", "Claude", "GPT", "model" | `"ai"` |
| "review + fix", human edits AI output | `"mixed"` |
| Default (no signal) | omit field |

### Edge Label Convention

- Short verb phrases: "validate", "clean", "review"
- Script names when specific: "clean_*.py", "build_registry.py"
- Conditions: "score >= 70", "all pass", "any fail"

## Edge Details Detection

Populate `details` when edges represent script invocations:

| Detail field | How to detect |
|-------------|---------------|
| `script` | Explicit script path in docs or backtick reference |
| `input` | `open(`, `read_csv(`, `json.load(`, CLI args, stdin |
| `output` | `to_csv(`, `json.dump(`, `write(`, stdout redirect |
| `updates` | In-place file modifications, database writes |
| `docs` | Referenced markdown files, README links |

## Scope Warnings

| Condition | Action |
|-----------|--------|
| >50 nodes | Warn user, suggest `--focus` |
| >80 nodes | Strongly recommend `--focus` |
| <3 nodes | Warn: graph may be too sparse to be useful |
| >12 modules | Wrap colors; suggest `--depth 1` for flat view |
| No CLAUDE.md found | Fall back to README.md, Makefile, package.json |
| No documentation at all | Use directory structure + script filenames only |
