# Implementation Plan: "Instantly" Features (PF-1 through PF-4)

Detailed plan for the four features that reduce time-to-understanding.

---

## PF-1: Runtime Input Validation

**Goal**: When a user loads bad JSON, show a clear error message in the UI
instead of crashing silently.

### Prerequisites

- PF-13 (schema sync) should be done first, otherwise validation rejects valid
  graphs. However, we can implement the validation machinery now and fix the
  schema separately.

### Design

Validate in `viewer.js → loadGraph()`, after `fetch` returns but before
`buildElements` runs. Validation is two-tiered:

1. **Structural checks** (fast, no schema dependency):
   - Required top-level fields exist: `title`, `modules`, `nodes`, `edges`
   - `modules` is a non-empty array
   - Every node has `id`, `module`, `label`
   - Every edge has `source`, `target`
   - Every node's `module` references a valid module ID
   - Every edge's `source`/`target` references a valid node ID
   - Every module `parent` (if present) references a valid module ID
   - No duplicate IDs across modules + nodes
   - No circular module parent chains (cycle detection)

2. **Semantic warnings** (non-blocking, displayed in status bar):
   - Nodes with no incoming AND no outgoing edges (orphans)
   - Module pairs with 2+ edges (violates 1-edge rule)
   - Edges referencing trust levels not in `legend.trustLevels`
   - Empty graph (0 nodes or 0 edges)

### Implementation Steps

#### 1.1: Add `validateGraph(data)` function to `viewer.js`

Returns `{ valid: boolean, errors: string[], warnings: string[] }`.

```js
function validateGraph(data) {
  var errors = [];
  var warnings = [];

  // Required fields
  ['title', 'modules', 'nodes', 'edges'].forEach(function(f) {
    if (!data[f]) errors.push('Missing required field: ' + f);
  });
  if (errors.length) return { valid: false, errors: errors, warnings: warnings };

  // Build ID sets
  var moduleIds = new Set();
  data.modules.forEach(function(m) {
    if (moduleIds.has(m.id)) errors.push('Duplicate module ID: ' + m.id);
    moduleIds.add(m.id);
  });
  var nodeIds = new Set();
  data.nodes.forEach(function(n) {
    if (nodeIds.has(n.id) || moduleIds.has(n.id)) errors.push('Duplicate ID: ' + n.id);
    nodeIds.add(n.id);
  });

  // Node → module references
  data.nodes.forEach(function(n) {
    if (!n.id) errors.push('Node missing id');
    if (!n.module) errors.push('Node "' + (n.id || '?') + '" missing module');
    else if (!moduleIds.has(n.module)) errors.push('Node "' + n.id + '" references unknown module "' + n.module + '"');
  });

  // Edge → node references
  data.edges.forEach(function(e, i) {
    if (!e.source) errors.push('Edge ' + i + ' missing source');
    if (!e.target) errors.push('Edge ' + i + ' missing target');
    if (e.source && !nodeIds.has(e.source)) errors.push('Edge source "' + e.source + '" is not a valid node ID');
    if (e.target && !nodeIds.has(e.target)) errors.push('Edge target "' + e.target + '" is not a valid node ID');
  });

  // Module parent references + cycle detection
  var parentMap = {};
  data.modules.forEach(function(m) {
    if (m.parent) {
      if (!moduleIds.has(m.parent)) errors.push('Module "' + m.id + '" parent "' + m.parent + '" not found');
      parentMap[m.id] = m.parent;
    }
  });
  // Cycle check
  data.modules.forEach(function(m) {
    var visited = new Set();
    var cur = m.id;
    while (parentMap[cur]) {
      if (visited.has(cur)) { errors.push('Circular parent chain involving "' + cur + '"'); break; }
      visited.add(cur);
      cur = parentMap[cur];
    }
  });

  // --- Warnings (non-blocking) ---

  // Orphan nodes
  var connected = new Set();
  data.edges.forEach(function(e) { connected.add(e.source); connected.add(e.target); });
  data.nodes.forEach(function(n) {
    if (!connected.has(n.id)) warnings.push('Orphan node (no edges): ' + n.id);
  });

  // Multi-edge module pairs
  // ... (count edges per module pair after resolving node→module)

  return { valid: errors.length === 0, errors: errors, warnings: warnings };
}
```

#### 1.2: Add error display UI

Add an `#error-panel` div to `index.html`, styled as a centered overlay with
red border. Shows validation errors as a bulleted list with a "Close" button.

```html
<div id="error-panel">
  <div class="ep-header">
    <strong>Graph Validation Errors</strong>
    <button class="ep-close">&times;</button>
  </div>
  <ul id="error-list"></ul>
</div>
```

#### 1.3: Wire validation into `init()`

In `viewer.js → init()`, after `loadGraph` resolves:

```js
var result = validateGraph(data);
if (!result.valid) {
  showErrorPanel(result.errors);
  return Promise.reject(new Error('Validation failed'));
}
if (result.warnings.length) {
  document.getElementById('status').textContent =
    result.warnings.length + ' warning(s) — see console';
  result.warnings.forEach(function(w) { console.warn('[graph]', w); });
}
```

#### 1.4: Fix fetch error handling

Wrap the existing `loadGraph` to check `response.ok`:

```js
function loadGraph(url) {
  return fetch(url).then(function(r) {
    if (!r.ok) throw new Error('Failed to load ' + url + ' (' + r.status + ')');
    return r.json();
  }).then(function(data) {
    graphData = data;
    return data;
  });
}
```

### Files Changed

| File | Change |
|------|--------|
| `viewer/src/viewer.js` | Add `validateGraph()`, fix `loadGraph()`, wire into `init()` |
| `viewer/index.html` | Add `#error-panel` div and CSS |

### Testing

- Load a valid graph → no errors, renders normally
- Load JSON missing `modules` → error panel shows "Missing required field: modules"
- Load JSON with a node referencing `module: "nonexistent"` → error
- Load JSON with circular parent (`A.parent = B`, `B.parent = A`) → error
- Load JSON from a 404 URL → error panel shows "Failed to load (404)"
- Load valid graph with orphan node → warning in console, status bar note

---

## PF-2: Auto-Refresh / Watch Mode

**Goal**: When the graph JSON file changes on disk, the viewer reloads
automatically without the user refreshing the browser.

### Design

Two complementary mechanisms:

**Option A: Server-side file watching (primary)**

Enhance `serve.py` with a lightweight WebSocket or Server-Sent Events (SSE)
endpoint. When the served JSON file changes, push a reload signal to the
browser. SSE is simpler (no extra dependencies, works with `http.server`).

**Option B: Client-side polling (fallback)**

The viewer polls the JSON file with `HEAD` requests every 2 seconds, comparing
`Last-Modified` or `ETag` headers. If changed, reload the graph in-place
(without full page reload).

We implement **Option B** as the primary approach because it requires no server
changes, works with any static file server, and is simpler. Option A can be
added later as an enhancement.

### Implementation Steps

#### 2.1: Add `watchGraph()` function to `viewer.js`

```js
var watchTimer = null;
var lastModified = null;

function watchGraph(url, callback) {
  // Initial timestamp
  fetch(url, { method: 'HEAD' }).then(function(r) {
    lastModified = r.headers.get('Last-Modified') || r.headers.get('ETag');
  });

  watchTimer = setInterval(function() {
    fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function(r) {
      var current = r.headers.get('Last-Modified') || r.headers.get('ETag');
      if (current && current !== lastModified) {
        lastModified = current;
        callback();
      }
    }).catch(function() { /* ignore network hiccups */ });
  }, 2000);
}

function stopWatch() {
  if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
}
```

#### 2.2: Add `reloadGraph()` function to `viewer.js`

Reloads the JSON, rebuilds elements/styles, reinitializes Cytoscape, and
preserves the current view mode and expand/collapse state where possible.

```js
function reloadGraph(url) {
  var prevState = manager ? manager.getState() : null;
  var prevView = currentView;

  return loadGraph(url).then(function(data) {
    var result = validateGraph(data);
    if (!result.valid) {
      console.warn('Reload skipped: validation errors', result.errors);
      return;
    }

    var elements = buildElements(data);
    var styles = buildStyles(data);

    cy.json({ elements: elements, style: styles });
    manager = new CollapseManager(cy);

    // Re-collapse
    manager.collapseAll(moduleIds);
    moduleIds.forEach(function(id) { applyCollapsedStyle(id); });

    runLayout({ animate: false, fit: true, padding: 50 });
    setView(prevView);

    // Flash status to confirm reload
    var status = document.getElementById('status');
    status.textContent = 'Graph reloaded';
    setTimeout(function() { Interactions.updateStatus(); }, 2000);
  });
}
```

#### 2.3: Add watch toggle to toolbar

Add a toolbar button:

```html
<button id="btn-watch" class="toggle-off">Watch</button>
```

Keyboard shortcut: `W` key.

#### 2.4: Wire into `interactions.js`

```js
var watching = false;
document.getElementById('btn-watch').addEventListener('click', function() {
  watching = !watching;
  this.className = watching ? 'toggle-on' : 'toggle-off';
  if (watching) {
    GraphViewer.watchGraph(graphUrl, function() {
      GraphViewer.reloadGraph(graphUrl);
    });
  } else {
    GraphViewer.stopWatch();
  }
});
```

### Files Changed

| File | Change |
|------|--------|
| `viewer/src/viewer.js` | Add `watchGraph()`, `stopWatch()`, `reloadGraph()`, expose in return object |
| `viewer/src/interactions.js` | Add watch button handler and `W` keyboard shortcut |
| `viewer/index.html` | Add `#btn-watch` button to toolbar |

### Testing

- Toggle watch on → modify the JSON file → viewer reloads within 2-3 seconds
- Toggle watch off → modify JSON → no reload
- Corrupt the JSON while watching → reload skipped, console warning
- Verify expand/collapse state is reset cleanly on reload
- Verify view mode is preserved across reloads

---

## PF-3: Minimap

**Goal**: Show a small overview inset so users don't lose spatial context when
zoomed into a large graph.

### Design

Cytoscape.js has no built-in minimap. Two approaches:

**Option A: Second Cytoscape instance (headless)**

Create a tiny read-only Cytoscape instance that mirrors the main graph, drawn
in a small `<div>` in the bottom-right corner. Sync zoom/pan from the main
instance. Expensive — doubles the rendering cost.

**Option B: Canvas thumbnail (chosen)**

After each layout/zoom/pan, render a scaled-down snapshot of the graph to a
small `<canvas>` element. Draw a rectangle representing the current viewport.
Click-to-navigate by translating click position to graph coordinates and
panning the main view.

Option B is lighter and sufficient for orientation purposes.

### Implementation Steps

#### 3.1: Add minimap container to `index.html`

```html
<canvas id="minimap" width="200" height="150"></canvas>
```

CSS:

```css
#minimap {
  position: fixed; bottom: 40px; right: 12px; z-index: 90;
  width: 200px; height: 150px;
  background: rgba(255,255,255,0.95); border: 1px solid #e2e8f0;
  border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
}
```

#### 3.2: Add `Minimap` module as a new file `viewer/src/minimap.js`

```js
var Minimap = (function() {
  var canvas, ctx, cy;
  var PADDING = 10;

  function init(canvasId, cyInstance) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    cy = cyInstance;

    // Redraw on relevant events
    cy.on('viewport', debounce(draw, 100));
    cy.on('layoutstop', draw);
    cy.on('add remove', debounce(draw, 200));

    // Click-to-navigate
    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var clickX = e.clientX - rect.left;
      var clickY = e.clientY - rect.top;
      navigateTo(clickX, clickY);
    });

    draw();
  }

  function draw() {
    if (!cy || !ctx) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var bb = cy.elements().boundingBox();
    if (bb.w === 0 || bb.h === 0) return;

    // Scale to fit canvas with padding
    var scaleX = (w - 2 * PADDING) / bb.w;
    var scaleY = (h - 2 * PADDING) / bb.h;
    var scale = Math.min(scaleX, scaleY);

    var offsetX = PADDING + ((w - 2 * PADDING) - bb.w * scale) / 2;
    var offsetY = PADDING + ((h - 2 * PADDING) - bb.h * scale) / 2;

    // Draw edges as thin gray lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.5;
    cy.edges(':visible').forEach(function(e) {
      var sp = e.source().position();
      var tp = e.target().position();
      ctx.beginPath();
      ctx.moveTo((sp.x - bb.x1) * scale + offsetX, (sp.y - bb.y1) * scale + offsetY);
      ctx.lineTo((tp.x - bb.x1) * scale + offsetX, (tp.y - bb.y1) * scale + offsetY);
      ctx.stroke();
    });

    // Draw nodes as small colored rectangles
    cy.nodes(':visible').forEach(function(n) {
      var pos = n.position();
      var x = (pos.x - bb.x1) * scale + offsetX;
      var y = (pos.y - bb.y1) * scale + offsetY;
      var nw = n.data('_isModule') ? 8 : 4;
      var nh = n.data('_isModule') ? 6 : 3;
      ctx.fillStyle = n.data('bg') || '#94a3b8';
      ctx.fillRect(x - nw / 2, y - nh / 2, nw, nh);
    });

    // Draw viewport rectangle
    var ext = cy.extent();
    var vx = (ext.x1 - bb.x1) * scale + offsetX;
    var vy = (ext.y1 - bb.y1) * scale + offsetY;
    var vw = ext.w * scale;
    var vh = ext.h * scale;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.fillRect(vx, vy, vw, vh);
  }

  function navigateTo(clickX, clickY) {
    var w = canvas.width;
    var h = canvas.height;
    var bb = cy.elements().boundingBox();
    if (bb.w === 0) return;

    var scaleX = (w - 2 * PADDING) / bb.w;
    var scaleY = (h - 2 * PADDING) / bb.h;
    var scale = Math.min(scaleX, scaleY);
    var offsetX = PADDING + ((w - 2 * PADDING) - bb.w * scale) / 2;
    var offsetY = PADDING + ((h - 2 * PADDING) - bb.h * scale) / 2;

    var graphX = (clickX - offsetX) / scale + bb.x1;
    var graphY = (clickY - offsetY) / scale + bb.y1;

    cy.animate({ center: { x: graphX, y: graphY } }, { duration: 200 });
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  return { init: init, draw: draw };
})();
```

#### 3.3: Add toggle with `M` key

Add a toolbar button and keyboard shortcut to show/hide the minimap. Default:
visible.

#### 3.4: Load order

`minimap.js` must load after `viewer.js` (needs Cytoscape instance). Add the
script tag after `viewer.js` in `index.html`. Initialize in the `init` chain
after `Interactions.init()`.

### Files Changed

| File | Change |
|------|--------|
| `viewer/src/minimap.js` | New file — `Minimap` IIFE module |
| `viewer/index.html` | Add `<canvas id="minimap">`, CSS, `<script>` tag, init call |
| `viewer/src/interactions.js` | Add `M` keyboard shortcut to toggle minimap visibility |

### Testing

- Load a graph → minimap shows in bottom-right with nodes and viewport rect
- Pan/zoom main view → viewport rectangle moves in minimap
- Click on minimap → main view pans to that location
- Expand/collapse modules → minimap redraws
- Press `M` → minimap hides/shows
- Very small graph (3 nodes) → minimap still renders sensibly

---

## PF-4: Breadcrumb Navigation

**Goal**: Show a clickable trail of the current drill-down path so users know
where they are in the phase/module hierarchy and can jump back.

### Design

A horizontal bar below the legend showing the current navigation context.
Updates when the user expands a module (drill-in) or collapses (drill-out).

Format: `Graph  >  Phase: Input Pipeline  >  mod_discovery`

Each segment is clickable:
- Clicking "Graph" → collapses all (top-level overview)
- Clicking a phase → collapses everything inside that phase
- Clicking a module → no-op (already viewing it)

The breadcrumb tracks the **most recently expanded path**, not all expanded
modules. If the user expands multiple unrelated modules, the breadcrumb shows
the last one expanded (most likely the current focus).

### Implementation Steps

#### 4.1: Add breadcrumb bar to `index.html`

```html
<div id="breadcrumb"></div>
```

CSS:

```css
#breadcrumb {
  position: fixed; top: 80px; left: 0; right: 0; z-index: 85;
  background: #ffffff; border-bottom: 1px solid #f1f5f9;
  padding: 4px 20px; font-size: 12px; color: #64748b;
  display: none;  /* hidden when all collapsed */
}
#breadcrumb span { cursor: pointer; }
#breadcrumb span:hover { color: #3b82f6; text-decoration: underline; }
#breadcrumb .bc-sep { margin: 0 6px; color: #cbd5e1; cursor: default; }
#breadcrumb .bc-sep:hover { color: #cbd5e1; text-decoration: none; }
#breadcrumb .bc-current { color: #1e293b; font-weight: 600; cursor: default; }
#breadcrumb .bc-current:hover { text-decoration: none; }
```

When the breadcrumb is visible, shift `#cy` top down by the breadcrumb height
(~28px). Use a class toggle on `#cy` to adjust.

#### 4.2: Add `Breadcrumb` module to `interactions.js`

Track the current drill-down path as an array of module IDs:

```js
var breadcrumbPath = [];

function updateBreadcrumb() {
  var el = document.getElementById('breadcrumb');
  if (breadcrumbPath.length === 0) {
    el.style.display = 'none';
    document.getElementById('cy').style.top = '80px';
    return;
  }

  el.style.display = 'block';
  document.getElementById('cy').style.top = '108px';

  var html = '<span data-action="collapse-all">Graph</span>';
  breadcrumbPath.forEach(function(id, i) {
    var node = cy.getElementById(id);
    var label = node.length ? node.data('label') : id;
    var isLast = (i === breadcrumbPath.length - 1);
    html += '<span class="bc-sep">&rsaquo;</span>';
    if (isLast) {
      html += '<span class="bc-current">' + label + '</span>';
    } else {
      html += '<span data-action="collapse-to" data-module="' + id + '">' + label + '</span>';
    }
  });
  el.innerHTML = html;
}
```

#### 4.3: Track expand/collapse in breadcrumb path

When a module is expanded (in the click handler in `interactions.js`):

```js
// After expanding moduleId:
var chain = [moduleId];
var parent = cy.getElementById(moduleId).data('parent');
while (parent) {
  chain.unshift(parent);
  parent = cy.getElementById(parent).data('parent');
}
breadcrumbPath = chain;
updateBreadcrumb();
```

When collapsing or "Collapse All":

```js
// After collapsing:
// Remove moduleId and any children from breadcrumbPath
breadcrumbPath = breadcrumbPath.filter(function(id) {
  return id !== moduleId && !isDescendantOf(id, moduleId);
});
updateBreadcrumb();
```

#### 4.4: Wire click handlers on breadcrumb segments

```js
document.getElementById('breadcrumb').addEventListener('click', function(e) {
  var target = e.target;
  var action = target.getAttribute('data-action');
  if (action === 'collapse-all') {
    manager.collapseAll(moduleIds);
    moduleIds.forEach(function(id) { GraphViewer.applyCollapsedStyle(id); });
    GraphViewer.runLayout({ fit: true, padding: 50 });
    breadcrumbPath = [];
    updateBreadcrumb();
  } else if (action === 'collapse-to') {
    var modId = target.getAttribute('data-module');
    // Collapse everything deeper than modId
    // ... collapse children of modId, update styles, re-layout
    breadcrumbPath = breadcrumbPath.slice(0, breadcrumbPath.indexOf(modId) + 1);
    updateBreadcrumb();
  }
});
```

### Files Changed

| File | Change |
|------|--------|
| `viewer/index.html` | Add `#breadcrumb` div, CSS, adjust `#cy` top |
| `viewer/src/interactions.js` | Add breadcrumb state tracking, `updateBreadcrumb()`, click handlers on expand/collapse |

### Testing

- Load graph (all collapsed) → no breadcrumb visible
- Expand a phase → breadcrumb: `Graph > Phase Name`
- Expand a module inside that phase → breadcrumb: `Graph > Phase Name > Module Name`
- Click "Graph" in breadcrumb → all collapse, breadcrumb disappears
- Click phase name in breadcrumb → modules inside re-collapse, breadcrumb truncates
- Expand two unrelated modules → breadcrumb shows the last one expanded
- "Collapse All" button → breadcrumb disappears

---

## Implementation Order

```
PF-1 (Validation)  ──→  PF-2 (Auto-refresh)  ──→  PF-3 (Minimap)
                                                         │
                                                    PF-4 (Breadcrumb)
```

**PF-1 first**: validation is a prerequisite for PF-2 (reload skips invalid
JSON). Also the highest-impact fix — prevents silent crashes.

**PF-2 second**: builds on PF-1's validation. Enables the development loop
for testing PF-3 and PF-4 (edit JSON, see changes instantly).

**PF-3 and PF-4 in parallel**: independent features, no dependency between
them. Both improve spatial orientation in different ways (overview vs. trail).

### Estimated Scope

| Feature | New lines | Files touched |
|---------|-----------|---------------|
| PF-1 | ~120 JS + ~30 HTML/CSS | 2 (`viewer.js`, `index.html`) |
| PF-2 | ~80 JS + ~5 HTML | 3 (`viewer.js`, `interactions.js`, `index.html`) |
| PF-3 | ~120 JS + ~15 HTML/CSS | 3 (new `minimap.js`, `interactions.js`, `index.html`) |
| PF-4 | ~80 JS + ~20 HTML/CSS | 2 (`interactions.js`, `index.html`) |
