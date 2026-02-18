---
name: visualize-plan
description: >
  Overlay an implementation plan onto an existing workflow graph. Reads the
  plan document and existing graph JSON, matches plan tasks to graph nodes
  and edges, and emits a `plan` field that gets merged into the graph.
  Opens the graph viewer in Plan view mode.
argument-hint: "[plan-file] [--graph path/to/graph.json]"
---

# visualize-plan

Overlay an implementation plan onto an existing workflow graph, showing which
nodes/edges will be added, modified, or removed.

## When to Use

- After creating an implementation plan (via brainstorming or writing-plans)
- User wants to see how a plan affects the existing workflow
- User asks to "overlay", "annotate", or "show plan on graph"

## Arguments

Parse `$ARGUMENTS` as follows:

| Argument | Default | Description |
|----------|---------|-------------|
| First positional | (required) | Path to the plan document (markdown) |
| `--graph path` | Most recent graph JSON | Path to existing graph JSON to annotate |

Examples:
- `/visualize-plan docs/plan.md` — overlay plan onto default graph
- `/visualize-plan docs/plan.md --graph examples/my-workflow.json`

---

## Phase 1 — Load Inputs

### Step 1.1: Read the existing graph JSON

Read the graph JSON file specified by `--graph`, or find the most recent
`.json` file in the `.graphs/` directory (falling back to `examples/`).

Validate it has the required top-level fields: `title`, `modules`, `nodes`,
`edges`.

Build a lookup of all existing node IDs and edge keys (`source->target`).

### Step 1.2: Read the plan document

Read the plan markdown file. Extract:

1. **Goal**: The first heading or summary paragraph
2. **Tasks**: Each numbered step, task, or section heading
3. **Affected components**: For each task, identify which parts of the
   workflow are created, changed, or removed

---

## Phase 2 — Match Plan to Graph

### Step 2.1: Classify each task's impact

For each task in the plan, determine:

- **Nodes to add**: New workflow steps not in the current graph
- **Nodes to modify**: Existing nodes whose behavior/implementation changes
- **Nodes to remove**: Existing nodes that will be deleted or deprecated
- **Edges to add**: New connections between steps
- **Edges to modify**: Existing connections whose semantics change
- **Edges to remove**: Connections that will be severed
- **Modules affected**: Which modules contain the affected nodes

### Step 2.2: Build the plan field

Construct the `plan` object with this structure:

```json
{
  "plan": {
    "summary": {
      "goal": "One-sentence description of what the plan achieves",
      "tasks": [
        {
          "id": "T1",
          "title": "Short task description",
          "nodeIds": ["node1", "node2"]
        }
      ]
    },
    "annotations": {
      "nodes": {
        "existing_node_id": {
          "status": "modify",
          "description": "What changes about this node"
        },
        "new_node_id": {
          "status": "add",
          "description": "What this new node does"
        }
      },
      "edges": {
        "source->target": {
          "status": "add",
          "description": "Why this connection is added"
        }
      },
      "modules": {
        "mod_id": {
          "status": "modify",
          "description": "How this module is affected"
        }
      }
    }
  }
}
```

### Matching rules

1. **Exact ID match**: If the plan mentions a node by its exact ID, use it
2. **Label match**: If the plan describes a step by name, find the node
   whose label best matches (case-insensitive substring)
3. **Module match**: If the plan says "changes to the X module", annotate
   the module
4. **New nodes**: If the plan describes a step that doesn't exist in the
   graph, create an `add` annotation. The node ID should follow the
   existing naming convention (lowercase, underscores)
5. **Edge inference**: If a new node is added between two existing nodes,
   infer the edges that need to be added/removed

### Annotation guidelines

- **`add`**: Node/edge does not currently exist and will be created
- **`modify`**: Node/edge exists but its behavior, implementation, or
  semantics will change
- **`remove`**: Node/edge currently exists but will be deleted
- **description**: 1-2 sentences explaining what the plan says about this
  element. Use the plan's own language where possible.
- Only annotate elements that the plan explicitly mentions or clearly
  implies. Don't annotate everything.

---

## Phase 3 — Emit and Serve

### Step 3.1: Merge plan into graph

Read the existing graph JSON. Add the `plan` field to the top level.
Write the result to a new file:
`.graphs/{original-name}-with-plan.json`

Do NOT modify the original graph file.

### Step 3.2: Serve and open

```bash
python3 scripts/serve.py &
sleep 1
open "http://localhost:8080/viewer/?graph=../../.graphs/{name}-with-plan.json"
```

Tell the user:
- Click the **Plan** button in the toolbar to activate Plan view
- Green glow = new nodes/edges, amber = modified, red = removed
- Click **Summary** to see the plan task list
- Click individual tasks to highlight their associated nodes
- Press `V` to cycle through all view modes

---

## Validation Checklist

Before emitting, verify:

- [ ] Every annotated node ID exists in either the graph's nodes or is
      marked as `add`
- [ ] Every annotated edge key uses `source->target` format with valid
      node IDs
- [ ] Every annotation has a `status` field (`add`, `modify`, or `remove`)
- [ ] The `summary.goal` is a single clear sentence
- [ ] Each task in `summary.tasks` has an `id` and `title`
- [ ] `nodeIds` in tasks reference valid node IDs
- [ ] The output JSON is valid (parse it before writing)
