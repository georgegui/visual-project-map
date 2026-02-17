# Graph Viewer JSON Schema — Quick Reference

## Required Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Graph title displayed in the viewer |
| `modules` | array | Module (group) definitions |
| `nodes` | array | Child node definitions |
| `edges` | array | Edge definitions between nodes |

## Optional Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | One-paragraph overview of the graph's purpose and scope |
| `legend` | object | Contains `trustLevels` definitions |
| `plan` | object | Plan overlay annotations (see visualize-plan skill) |
| `criticalPath` | array of strings | Pre-computed critical path as an ordered array of node IDs (entry → terminal). `P` key toggles highlighting in the viewer. |
| `_generationMode` | string | `"scan"` (from existing project), `"design"` (from objective), or `"refactor"` (scan + redesign) |
| `_objective` | string | Natural language objective used to generate graph (design mode only) |
| `_generatedAt` | string | ISO 8601 timestamp of when the graph was generated |

## Module Object

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `id` | yes | string | Unique module ID (prefix with `mod_` or `phase_`) |
| `label` | yes | string | Display label |
| `description` | no | string | What this module does and why it exists (1-2 sentences) |
| `color` | yes | string | Background hex color `#rrggbb` |
| `borderColor` | yes | string | Border hex color `#rrggbb` |
| `parent` | no | string | ID of parent phase module (for nesting) |
| `role` | no | string | `"process"` (default, round-rectangle) or `"data"` (hexagon). See inference-rules.md § Role Assignment |
| `status` | no | string | `"planned"`, `"draft"`, `"ai-tested"` (default), `"needs-review"`, `"verified"`. See inference-rules.md § Status Assignment |
| `confidence` | no | string | `"high"`, `"medium"`, `"low"`, `"unknown"`. How confident the generation is in this module's design. See inference-rules.md § Design-Mode Confidence Heuristics |
| `needsHumanReview` | no | boolean | `true` if this module requires domain expertise to validate |
| `checkpointReason` | no | string | Why this module needs human review or has low confidence |
| `docPath` | no | string | Path to the module's CLAUDE.md relative to project root (scan mode only, omit in design mode) |

## Node Object

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `id` | yes | string | Unique node ID (lowercase, underscores) |
| `module` | yes | string | Parent module ID |
| `label` | yes | string | Display label (use `module.state` dot notation) |
| `description` | no | string | What happens at this state or step (1-2 sentences) |
| `role` | no | string | `"process"` (default) or `"data"` (hexagon). Overrides `style.shape` to hexagon. See inference-rules.md § Role Assignment |
| `status` | no | string | `"planned"`, `"draft"`, `"ai-tested"` (default), `"needs-review"`, `"verified"`. See inference-rules.md § Status Assignment |
| `style` | no | object | Visual overrides (see below) |
| `io` | no | object | Rich I/O descriptions with `inputs` and `outputs` arrays (same structure as `module.interface`). Shown in the node detail side panel. |
| `docs` | no | string | Link to documentation (markdown file path or URL). Shown in the node detail side panel. |

### Node Style

| Field | Type | Values |
|-------|------|--------|
| `trust` | string | Key from `legend.trustLevels` |
| `shape` | string | `round-rectangle` (default), `diamond`, `ellipse`, `rectangle`, `hexagon` |
| `color` | string | Override background color |
| `borderColor` | string | Override border color |

### Node Files (optional)

| Field | Type | Description |
|-------|------|-------------|
| `files` | object | File I/O annotations for the node |
| `files.reads` | string[] | Files this node reads from |
| `files.writes` | string[] | Files this node writes to |

Shown on hover (tooltip), double-click (detail panel), and in Files view mode.

### Interface Port Nodes (optional)

| Field | Type | Description |
|-------|------|-------------|
| `_isInterfacePort` | boolean | True if this node represents a module boundary |
| `_portDirection` | string | `"input"` or `"output"` |
| `interfaceContract` | object | `{ name, description, format, example }` |

Interface port nodes sit outside their module's compound node and connect
to the adjacent module's port, visualizing the data contract between modules.

## Edge Object

| Field | Required | Type | Values |
|-------|----------|------|--------|
| `id` | no | string | Optional edge ID (auto-generated as e1, e2, ... if omitted) |
| `source` | yes | string | Source node ID |
| `target` | yes | string | Target node ID |
| `label` | no | string | Transition description |
| `description` | no | string | What this transition does and why it exists (1-2 sentences) |
| `style` | no | string | `"solid"` (default) or `"dashed"` |
| `actor` | no | string | `"human"`, `"ai"`, `"script"`, `"mixed"` |
| `details` | no | object | Script/IO metadata (see below) |
| `confidence` | no | string | `"high"`, `"medium"`, `"low"`, `"unknown"`. How confident the generation is in this edge's correctness |

### Edge Details

| Field | Type | Description |
|-------|------|-------------|
| `script` | string | Script file path |
| `input` | string[] | Input file paths |
| `output` | string[] | Output file paths |
| `updates` | string[] | Fields/files updated |
| `docs` | string | Documentation path |

## Trust Levels (legend.trustLevels)

Trust levels drive the **Provenance view mode** color scheme, not borders
(P2.2).

Each key maps to:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Human-readable name |
| `borderStyle` | string | Legacy field, retained for backward compatibility |
| `borderWidth` | number | Legacy field, retained for backward compatibility |
| `color` | string | Background color for provenance view |
| `borderColor` | string | Border color for provenance view |
| `tag` | object | Optional `{ text, bg, color }` for badge display |

## Role Visual Encoding

Role is encoded via shape only (see P2.3 for the full rule).

| Role | Module (collapsed) | Module (expanded) | Child Node |
|------|-------------------|-------------------|------------|
| `process` (default) | Round-rectangle | Normal compound | Round-rectangle |
| `data` | Hexagon | Normal compound | Hexagon |

Diamond-shaped nodes and interface ports keep their shape regardless of role.

## Status Visual Encoding

| Status | Opacity | Border | Meaning |
|--------|---------|--------|---------|
| `verified` | 100% | Solid, 3px, green (#16a34a) | Human reviewed and approved |
| `ai-tested` (default) | 85% | Normal (no change) | AI iterated and tests pass |
| `needs-review` | 100% | Dashed, 2.5px, orange (#f59e0b) | AI flags for human attention |
| `draft` | 45% | Solid, 1px | AI wrote first pass, untested |
| `planned` | 20% | Dotted, 1px, gray label (#94a3b8) | Described but no code yet |

When `status` is omitted, `ai-tested` is the visual default (no special styling applied).

## Confidence Visual Encoding

Confidence is encoded via the **Confidence view mode** (toggled via toolbar
or `V` key), which colors modules by confidence level (not borders, P2.2).

| Confidence | View Mode Color | Meaning |
|-----------|-----------------|---------|
| `high` | Green (#d1fae5 / #16a34a) | Standard pattern, high certainty |
| `medium` | Yellow (#fef3c7 / #f59e0b) | Reasonable guess, may need refinement |
| `low` | Red (#fee2e2 / #ef4444) | Needs domain input to validate |
| `unknown` | Gray (#f3f4f6 / #9ca3af) | Insufficient information to assess |

Modules with `needsHumanReview: true` show an amber badge (⚠) on the
collapsed label. `checkpointReason` text appears in the module's tooltip
when present.
