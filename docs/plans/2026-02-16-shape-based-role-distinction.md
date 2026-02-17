# Shape-Based Role Distinction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `role` field to the schema so data artifact modules/nodes render as hexagons, visually distinguishing them from process modules/nodes (round-rectangles).

**Architecture:** Add `role` to schema.json for both modules and nodes. In viewer.js, pass `role` through buildElements() and add Cytoscape style selectors that override shape to hexagon for `role="data"`. Collapsed modules with `role="data"` also get hexagon shape. Expanded data modules get a dotted border as a subtle cue.

**Tech Stack:** Vanilla JS, Cytoscape.js (shapes via style selectors), JSON schema

---

### Task 1: Add `role` to schema.json

**Files:**
- Modify: `plugins/visual-project-map/schema.json:19` (module properties)
- Modify: `plugins/visual-project-map/schema.json:65` (node properties)

**Step 1: Add role to module properties**

In `schema.json`, add after the `"description"` property inside module items (after line 19):

```json
"role": {
  "type": "string",
  "enum": ["process", "data"],
  "description": "Visual role: process (does work, round-rectangle) or data (artifact, hexagon)"
},
```

**Step 2: Add role to node properties**

In `schema.json`, add after the `"description"` property inside node items (after line 65):

```json
"role": {
  "type": "string",
  "enum": ["process", "data"],
  "description": "Visual role: process (does work, round-rectangle) or data (artifact, hexagon). Overrides style.shape."
},
```

**Step 3: Verify JSON is valid**

Run: `python3 -c "import json; json.load(open('plugins/visual-project-map/schema.json'))"`
Expected: No output (valid JSON)

---

### Task 2: Pass `role` through in viewer.js buildElements()

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:115-128` (module loop in buildElements)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:135-174` (node loop in buildElements)

**Step 1: Pass module role through**

In the `data.modules.forEach` loop in `buildElements()`, after `if (m.description) nodeData.description = m.description;` (line 127), add:

```javascript
if (m.role) nodeData.role = m.role;
```

**Step 2: Pass node role through and override shape**

In the `data.nodes.forEach` loop, after `if (n.docs) nodeData.docs = n.docs;` (line 163), add:

```javascript
if (n.role) nodeData.role = n.role;
```

**Step 3: Verify by refreshing viewer**

Hard-refresh browser. No visual change yet (no styles target role).

---

### Task 3: Add Cytoscape styles for data role

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:218-267` (buildStyles collapsed-module/collapsed-phase/nodeShape selectors)

**Step 1: Add collapsed data module style**

After the `.collapsed-module` selector block (line 226-227), add a new selector:

```javascript
{ selector: '.collapsed-module[role="data"]',
  style: {
    'shape': 'hexagon',
    'width': 180, 'height': 65
  }
},
```

**Step 2: Add collapsed data phase style**

After the `.collapsed-phase` selector block (line 236-237), add:

```javascript
{ selector: '.collapsed-phase[role="data"]',
  style: {
    'shape': 'hexagon',
    'width': 220, 'height': 70
  }
},
```

**Step 3: Add expanded data module (parent) style — dotted border**

After the `node[_isPhase]` selector block (line 216-217), add:

```javascript
{ selector: ':parent[role="data"]',
  style: {
    'border-style': 'dotted'
  }
},
```

**Step 4: Add child node data role style — hexagon shape**

After the `node[nodeShape]` selector block (line 246-247), add. This must come after `node[nodeShape]` so it overrides the default shape, but before `node[_isInterfacePort]` so ports keep their ellipse:

```javascript
{ selector: 'node[role="data"]',
  style: {
    'shape': 'hexagon',
    'height': 32
  }
},
```

**Step 5: Verify no JS errors**

Hard-refresh browser. No visual change yet (no data has `role` field).

---

### Task 4: Update example graph with role fields

**Files:**
- Modify: `plugins/visual-project-map/examples/visual-project-map.json`

**Step 1: Add `"role": "data"` to 4 data artifact modules**

Add `"role": "data"` to these module objects:
- `mod_inventory` (Project Inventory)
- `mod_blueprint` (Module Blueprint)
- `mod_json` (Graph JSON)
- `mod_rendered` (Interactive Graph)

**Step 2: Add `"role": "data"` to child nodes of data artifact modules**

Add `"role": "data"` to these nodes:
- `inv_docs`, `inv_scripts`, `inv_io`, `inv_hints` (mod_inventory children)
- `bp_modules`, `bp_contracts`, `bp_rules` (mod_blueprint children)
- `json_structure`, `json_example`, `json_file` (mod_json children)
- `rendered_collapsed`, `rendered_expanded`, `rendered_keys` (mod_rendered children)

Note: `bp_rules` is a diamond decision node — the `node[role="data"]` style will set hexagon, but the existing `node[nodeShape="diamond"]` selector must take priority. Verify this in Step 3 and fix if needed.

**Step 3: Verify visual result**

Hard-refresh browser at `http://localhost:8080/viewer/?graph=../examples/visual-project-map.json`.

Expected collapsed view: Discover (rectangle) → Project Inventory (hexagon) → Design (rectangle) → Module Blueprint (hexagon) → Assemble (rectangle) → Graph JSON (hexagon) → Render (rectangle) → Interactive Graph (hexagon) → Interact (rectangle).

Expected expanded data module: Dotted border container. Child nodes are hexagons except diamonds and interface ports which keep their shape.

**Step 4: Fix style priority if needed**

If diamond nodes inside data modules are incorrectly hexagons, move the `node[nodeShape="diamond"]` selector after `node[role="data"]` so it wins. If interface ports are affected, the existing `node[_isInterfacePort]` selector should already be after `node[role="data"]`.

---

### Task 5: Add F74 to features.md

**Files:**
- Modify: `spec/features.md`

**Step 1: Add F74 entry**

Add under a "Visual Roles" section or alongside existing sections:

```markdown
### F74: Shape-based role distinction (process vs data)
- **Status**: `implemented`
- **Files**: `schema.json`, `src/viewer.js` (buildElements, buildStyles)
- **Properties**: P2.2
- Modules and nodes with `role: "data"` render as hexagons. Process modules (default) remain round-rectangles. Collapsed data modules are hexagons; expanded data modules have dotted borders. Decision diamonds and interface ports keep their shapes regardless of role.
```

---

### Task 6: Sync to plugin cache

**Files:**
- Copy: `plugins/visual-project-map/schema.json` → `~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/schema.json`
- Copy: `plugins/visual-project-map/viewer/src/viewer.js` → `~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/viewer/src/viewer.js`
- Copy: `plugins/visual-project-map/examples/visual-project-map.json` → `~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/examples/visual-project-map.json`

**Step 1: Copy files**

```bash
cp plugins/visual-project-map/schema.json ~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/schema.json
cp plugins/visual-project-map/viewer/src/viewer.js ~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/viewer/src/viewer.js
cp plugins/visual-project-map/examples/visual-project-map.json ~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/examples/visual-project-map.json
```

**Step 2: Verify cached files match**

```bash
diff plugins/visual-project-map/schema.json ~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/schema.json
diff plugins/visual-project-map/viewer/src/viewer.js ~/.claude/plugins/cache/visual-project-map/visual-project-map/1.2.0/viewer/src/viewer.js
```
Expected: No output (files match)
