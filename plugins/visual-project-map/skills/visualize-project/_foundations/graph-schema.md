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
| `legend` | object | Contains `trustLevels` definitions |
| `plan` | object | Plan overlay annotations (see visualize-plan skill) |

## Module Object

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `id` | yes | string | Unique module ID (prefix with `mod_` or `phase_`) |
| `label` | yes | string | Display label |
| `color` | yes | string | Background hex color `#rrggbb` |
| `borderColor` | yes | string | Border hex color `#rrggbb` |
| `parent` | no | string | ID of parent phase module (for nesting) |

## Node Object

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `id` | yes | string | Unique node ID (lowercase, underscores) |
| `module` | yes | string | Parent module ID |
| `label` | yes | string | Display label (use `module.state` dot notation) |
| `style` | no | object | Visual overrides (see below) |

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
| `style` | no | string | `"solid"` (default) or `"dashed"` |
| `actor` | no | string | `"human"`, `"ai"`, `"script"`, `"mixed"` |
| `details` | no | object | Script/IO metadata (see below) |

### Edge Details

| Field | Type | Description |
|-------|------|-------------|
| `script` | string | Script file path |
| `input` | string[] | Input file paths |
| `output` | string[] | Output file paths |
| `updates` | string[] | Fields/files updated |
| `docs` | string | Documentation path |

## Trust Levels (legend.trustLevels)

Each key maps to:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Human-readable name |
| `borderStyle` | string | `"solid"` or `"dashed"` |
| `borderWidth` | number | Border thickness (1.5 normal, 3.5 thick) |
| `color` | string | Background color for provenance view |
| `borderColor` | string | Border color for provenance view |
| `tag` | object | Optional `{ text, bg, color }` for badge display |
