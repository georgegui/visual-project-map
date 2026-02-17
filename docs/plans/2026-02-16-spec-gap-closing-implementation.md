# SPEC Gap Closing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the gap between SPEC.md principles (1, 2, 4) and the viewer by making interface ports survive collapse, adding confidence/review visual encoding, and enriching the collapsed interface map view.

**Architecture:** Six features (F58-F64) implemented across four files in the vanilla JS viewer. No build step — all changes are plain JS and CSS in `<script>` tags. Port nodes already float outside modules (no Cytoscape `parent`), so F59 is a positioning pass, not a survival fix.

**Tech Stack:** Cytoscape.js 3.30, dagre layout, vanilla JS (IIFE modules + one class), no npm/bundler.

---

## Task 1: Pass confidence fields through buildElements (viewer.js)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:115-131`

**Step 1: Add confidence/review fields to module element data**

In `buildElements()`, after the existing `if (m.status)` line (line 129), add three new fields:

```js
      if (m.confidence) nodeData.confidence = m.confidence;
      if (m.needsHumanReview) nodeData.needsHumanReview = true;
      if (m.checkpointReason) nodeData.checkpointReason = m.checkpointReason;
```

These fields are already in `schema.json` but were not being passed into Cytoscape element data. Without this, the viewer cannot read confidence/review flags.

**Step 2: Verify no regressions**

Run: `python3 plugins/visual-project-map/scripts/serve.py`
Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map.json`
Expected: Graph renders identically to before (new fields are unused so far).

**Step 3: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js
git commit -m "feat(viewer): pass confidence/review fields through buildElements (F62 data plumbing)"
```

---

## Task 2: F58 — Enhance interface port styling (viewer.js)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:275-294`

**Step 1: Update port style selectors**

Replace the three port style blocks (lines 275-294) with enhanced versions:

```js
      { selector: 'node[_isInterfacePort]',
        style: {
          'width': 180, 'height': 34,
          'font-size': 10, 'font-weight': 600, 'font-style': 'italic',
          'border-width': 3, 'border-style': 'dashed',
          'shape': 'round-rectangle',
          'text-valign': 'center', 'text-halign': 'center',
          'color': '#475569', 'background-opacity': 0.85
        }
      },
      { selector: 'node[_portDirection="input"]',
        style: {
          'background-color': '#dbeafe', 'border-color': '#3b82f6'
        }
      },
      { selector: 'node[_portDirection="output"]',
        style: {
          'background-color': '#dcfce7', 'border-color': '#16a34a',
          'shape': 'tag'
        }
      }
```

Key changes from current: `round-rectangle` base shape (more readable), `tag` shape for output ports (directional arrow), slightly larger (180x34), italic font for visual distinction from child nodes.

**Step 2: Verify port rendering**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map.json`
Expected: Three interface port nodes visible when graph is expanded — input ports have rounded-rectangle shape with blue border, output port has tag/arrow shape with green border. All have italic labels.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js
git commit -m "feat(viewer): enhance interface port styling with directional shapes (F58)"
```

---

## Task 3: F59 — Port positioning after collapse (viewer.js)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:623-626` (fit function)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:651-666` (init sequence)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:874-897` (module return)

Port nodes already survive collapse (they have `_moduleRef` instead of Cytoscape `parent`, so `module.descendants()` never includes them). The issue is positioning: after dagre layout, ports may not be near their module.

**Step 1: Add positionPorts function**

Add this function after the existing `arrangeChildren()` function (after line 621):

```js
  function positionPorts() {
    if (!manager) return;
    var portNodes = cy.nodes('[_isInterfacePort]');
    if (portNodes.length === 0) return;

    var portsByModule = {};
    portNodes.forEach(function(port) {
      var modId = port.data('_moduleRef');
      if (!modId) return;
      if (!portsByModule[modId]) portsByModule[modId] = { inputs: [], outputs: [] };
      var dir = port.data('_portDirection') === 'output' ? 'outputs' : 'inputs';
      portsByModule[modId][dir].push(port);
    });

    Object.keys(portsByModule).forEach(function(modId) {
      if (!manager.isCollapsed(modId)) return;
      var mod = cy.getElementById(modId);
      if (!mod.length) return;

      var pos = mod.position();
      var h = mod.outerHeight() || 55;
      var inputPorts = portsByModule[modId].inputs;
      var outputPorts = portsByModule[modId].outputs;
      var spacing = 50;

      inputPorts.forEach(function(port, i) {
        var offsetX = (i - (inputPorts.length - 1) / 2) * spacing;
        port.position({ x: pos.x + offsetX, y: pos.y - h / 2 - 30 });
      });

      outputPorts.forEach(function(port, i) {
        var offsetX = (i - (outputPorts.length - 1) / 2) * spacing;
        port.position({ x: pos.x + offsetX, y: pos.y + h / 2 + 30 });
      });
    });
  }
```

**Step 2: Call positionPorts after layout in init()**

In the `init()` function, after `fit(50)` (line 666), add:

```js
      positionPorts();
      fit(50);
```

So the sequence becomes: `runLayout` → `positionPorts` → `fit`. The second `fit` ensures the viewport includes the repositioned ports.

**Step 3: Expose positionPorts in the module return**

Add `positionPorts: positionPorts` to the return object (after `fit: fit`).

**Step 4: Call positionPorts from interactions.js after expand/collapse**

In `interactions.js`, after `GraphViewer.runLayout({ animate: false, fit: false })` (line 95), add:

```js
      GraphViewer.positionPorts();
```

In the `collapseAll()` helper (after `GraphViewer.runLayout(...)` at line 588), add:

```js
    GraphViewer.positionPorts();
```

**Step 5: Verify port positioning**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map.json`
Expected: When modules are collapsed, input ports appear above their module, output ports below. Ports should be connected to their module via meta-edges. Click a module to expand — ports should integrate back into the expanded layout.

**Step 6: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js plugins/visual-project-map/viewer/src/interactions.js
git commit -m "feat(viewer): position interface ports adjacent to collapsed modules (F59)"
```

---

## Task 4: F60 — Zoom cap on collapsed view (viewer.js)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:623-625` (fit function)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:655` (init call)

**Step 1: Add maxZoom parameter to fit()**

Modify the `fit()` function:

```js
  function fit(padding, maxZoom) {
    cy.fit(null, padding || 40);
    if (maxZoom && cy.zoom() > maxZoom) {
      cy.zoom(maxZoom);
      cy.center();
    }
  }
```

**Step 2: Apply zoom cap in init()**

Change `fit(50)` in init to `fit(50, 1.2)` so the initial collapsed view doesn't zoom in too aggressively on small graphs.

**Step 3: Verify zoom cap**

Load a graph with few modules. Expected: initial zoom does not exceed 120%.
Load a large graph. Expected: zoom fits naturally (below 120%, so cap doesn't trigger).

**Step 4: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js
git commit -m "feat(viewer): cap initial zoom at 1.2x for collapsed view readability (F60)"
```

---

## Task 5: F61 — Collapsed module I/O subtitle (viewer.js)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:569-582` (applyCollapsedStyle / removeCollapsedStyle)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:227-236` (collapsed-module style)

This is a fallback for modules with `interface` metadata but no port nodes. When port nodes exist, the ports themselves are the interface display.

**Step 1: Add text-wrap to collapsed-module style**

In the `.collapsed-module` style block (line 227-236), add:

```js
          'text-wrap': 'wrap', 'text-max-width': 170
```

This enables multi-line labels for collapsed modules.

**Step 2: Modify applyCollapsedStyle to append I/O subtitle**

Replace the `applyCollapsedStyle()` function (lines 569-577):

```js
  function applyCollapsedStyle(moduleId) {
    var node = cy.getElementById(moduleId);
    if (!node.length) return;

    // Store original label for restoration
    node.data('_origLabel', node.data('label'));
    var label = node.data('label');

    // F63: Human review badge
    if (node.data('needsHumanReview')) {
      label += ' \u26a0';
      node.addClass('needs-review');
    }

    // F61: I/O subtitle when no port nodes exist for this module
    var iface = node.data('interface');
    if (iface && manager) {
      var hasPortNodes = cy.nodes('[_isInterfacePort]').filter(function(p) {
        return p.data('_moduleRef') === moduleId;
      }).length > 0;
      if (!hasPortNodes) {
        var parts = [];
        if (iface.inputs && iface.inputs.length) {
          parts.push('\u2192 ' + iface.inputs.map(function(i) { return i.name; }).join(', '));
        }
        if (iface.outputs && iface.outputs.length) {
          parts.push(iface.outputs.map(function(o) { return o.name; }).join(', ') + ' \u2192');
        }
        if (parts.length) label += '\n' + parts.join(' | ');
      }
    }

    node.data('label', label);

    if (node.data('_isPhase')) {
      node.addClass('collapsed-phase');
    } else {
      node.addClass('collapsed-module');
    }
  }
```

**Step 3: Modify removeCollapsedStyle to restore original label**

Replace the `removeCollapsedStyle()` function (lines 579-582):

```js
  function removeCollapsedStyle(moduleId) {
    var node = cy.getElementById(moduleId);
    if (node.length) {
      node.removeClass('collapsed-module collapsed-phase needs-review');
      var origLabel = node.data('_origLabel');
      if (origLabel !== undefined) {
        node.data('label', origLabel);
        node.removeData('_origLabel');
      }
    }
  }
```

**Step 4: Verify I/O subtitle**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map-design.json`
Expected: Modules that have `interface` data but no `_isInterfacePort` nodes show their I/O names as a second line on the collapsed box. Expanding and re-collapsing restores the subtitle correctly.

**Step 5: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js
git commit -m "feat(viewer): show I/O subtitle on collapsed modules without port nodes (F61)"
```

---

## Task 6: F63 — Human review badge (viewer.js + index.html)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:322-323` (add needs-review style after status styles)

The label append (" ⚠") is already handled in Task 5's `applyCollapsedStyle()` rewrite. This task adds the visual style.

**Step 1: Add needs-review Cytoscape style**

After the status styles block (after line 322), add:

```js
      { selector: '.needs-review',
        style: {
          'border-color': '#f59e0b', 'border-width': 3.5, 'border-style': 'dashed',
          'overlay-color': '#f59e0b', 'overlay-opacity': 0.08, 'overlay-padding': 4
        }
      },
```

This gives modules needing human review an amber dashed border with a subtle amber glow — visible at any zoom level.

**Step 2: Verify review badge**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map-design.json`
Expected: Modules with `needsHumanReview: true` (like Generation Skill, Design Mode) show amber dashed border + "⚠" suffix on their label. Expanding the module removes both the badge and the border.

**Step 3: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js
git commit -m "feat(viewer): amber badge and border for needsHumanReview modules (F63)"
```

---

## Task 7: F64 — Confidence view mode (viewer.js + interactions.js + index.html)

**Files:**
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:505-508` (add confidence styles before closing bracket)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:776-808` (setView function)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:779` (viewClasses cleanup string)
- Modify: `plugins/visual-project-map/viewer/src/viewer.js:814-872` (rebuildLegendForView)
- Modify: `plugins/visual-project-map/viewer/src/interactions.js:411` (views array)
- Modify: `plugins/visual-project-map/viewer/index.html:363-364` (add confidence button)

**Step 1: Add confidence Cytoscape styles**

Before the closing `);` of `buildStyles()` (before line 505), add:

```js
      { selector: '.view-conf-high',
        style: { 'background-color': '#d1fae5', 'border-color': '#16a34a', 'background-opacity': 0.85 }
      },
      { selector: '.view-conf-medium',
        style: { 'background-color': '#fef3c7', 'border-color': '#f59e0b', 'background-opacity': 0.85 }
      },
      { selector: '.view-conf-low',
        style: { 'background-color': '#fee2e2', 'border-color': '#ef4444', 'background-opacity': 0.85 }
      },
      { selector: '.view-conf-unknown',
        style: { 'background-color': '#f3f4f6', 'border-color': '#9ca3af', 'background-opacity': 0.85 }
      },
      { selector: '.view-conf-dim',
        style: { 'opacity': 0.4 }
      }
```

**Step 2: Update viewClasses cleanup string**

In `setView()`, update the `viewClasses` string (line 779) to include confidence classes:

```js
    var viewClasses = 'view-provenance view-files view-actor-human view-actor-ai view-actor-script view-actor-mixed view-conf-high view-conf-medium view-conf-low view-conf-unknown view-conf-dim';
```

**Step 3: Add confidence branch to setView()**

After the `} else if (mode === 'actor') {` block (after line 805), add:

```js
    } else if (mode === 'confidence') {
      allNodes.filter(function(n) { return !!n.data('_isModule'); }).forEach(function(mod) {
        var conf = mod.data('confidence') || 'unknown';
        mod.addClass('view-conf-' + conf);
      });
      allNodes.filter(function(n) { return !n.data('_isModule') && !n.data('_isInterfacePort'); }).addClass('view-conf-dim');
    }
```

**Step 4: Add confidence legend**

In `rebuildLegendForView()`, after the `} else if (mode === 'actor') {` block (before `} else if (mode === 'plan')`), add:

```js
    } else if (mode === 'confidence') {
      html += '<strong>Confidence:</strong> ';
      var levels = [
        { label: 'High', color: '#d1fae5', bc: '#16a34a' },
        { label: 'Medium', color: '#fef3c7', bc: '#f59e0b' },
        { label: 'Low', color: '#fee2e2', bc: '#ef4444' },
        { label: 'Unknown', color: '#f3f4f6', bc: '#9ca3af' }
      ];
      levels.forEach(function(l) {
        html += '<span><span class="swatch" style="background:' + l.color + ';border-color:' + l.bc + '"></span>' + l.label + '</span> ';
      });
```

**Step 5: Add 'confidence' to V-key cycle**

In `interactions.js`, update the views array (line 411):

```js
        var views = ['module', 'provenance', 'actor', 'files', 'confidence'];
```

**Step 6: Add Confidence button to toolbar**

In `index.html`, after the Files button (line 363), add:

```html
  <button class="view-btn" data-view="confidence">Confidence</button>
```

**Step 7: Verify confidence view**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map-design.json`
Press V to cycle to "Confidence" view. Expected: Modules colored by confidence level (green/yellow/red/gray), non-module nodes dimmed, legend shows confidence color key. Press V again to cycle to next view — confidence colors should clear.

**Step 8: Commit**

```bash
git add plugins/visual-project-map/viewer/src/viewer.js plugins/visual-project-map/viewer/src/interactions.js plugins/visual-project-map/viewer/index.html
git commit -m "feat(viewer): add confidence view mode with color encoding and legend (F64)"
```

---

## Task 8: Update feature statuses in spec/features.md

**Files:**
- Modify: `spec/features.md` — Update F58, F59, F60, F61, F63, F64 from `planned` to `implemented`

**Step 1: Update each feature status**

For each of F58, F59, F60, F61, F63, F64:
- Change `- **Status**: \`planned\`` to `- **Status**: \`implemented\``
- Add `- **Files**:` line listing the changed files

**Step 2: Add changelog entries**

Add entries to the changelog section.

**Step 3: Commit**

```bash
git add spec/features.md
git commit -m "docs: mark F58/F59/F60/F61/F63/F64 as implemented"
```

---

## Task 9: Integration test — full verification

**Step 1: Start the server**

```bash
python3 plugins/visual-project-map/scripts/serve.py
```

**Step 2: Test with the project's own graph (has ports)**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map.json`

Verify:
- [ ] Collapsed view shows modules as boxes with ⚠ on review-flagged modules
- [ ] Interface ports (blue input, green output) visible near their modules
- [ ] Input ports positioned above, output ports below their collapsed module
- [ ] Click module to expand — ports integrate into expanded layout
- [ ] Collapse again — ports reappear in position
- [ ] V key cycles through: module → provenance → actor → files → confidence → module
- [ ] Confidence view colors modules by confidence level
- [ ] Initial zoom does not exceed 120%

**Step 3: Test with the design graph (has confidence + review flags)**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map-design.json`

Verify:
- [ ] Modules with `needsHumanReview: true` have amber dashed border + ⚠ label
- [ ] Modules without port nodes show I/O subtitle (e.g., "→ inputs | outputs →")
- [ ] Confidence view: high=green, medium=yellow, low=red, unknown=gray
- [ ] Legend updates correctly for each view mode

**Step 4: Test with diff mode**

Load: `http://localhost:PORT/viewer/?graph=../../.graphs/visual-project-map.json&compare=../../.graphs/visual-project-map.prev.json`

Verify:
- [ ] Diff view still works correctly (no regressions)
- [ ] View cycling includes diff when compare param is present
