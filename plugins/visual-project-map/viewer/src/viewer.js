var GraphViewer = (function() {
  var cy = null;
  var manager = null;
  var graphData = null;
  var moduleIds = [];
  var currentView = 'module';

  function loadGraph(url) {
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error('Failed to load ' + url + ' (' + r.status + ')');
      return r.json();
    }).then(function(data) {
      graphData = data;
      return data;
    });
  }

  function validateGraph(data) {
    var errors = [];
    var warnings = [];

    // Required top-level fields
    ['title', 'modules', 'nodes', 'edges'].forEach(function(f) {
      if (!data[f]) errors.push('Missing required field: "' + f + '"');
    });
    if (errors.length) return { valid: false, errors: errors, warnings: warnings };

    if (!Array.isArray(data.modules)) { errors.push('"modules" must be an array'); return { valid: false, errors: errors, warnings: warnings }; }
    if (!Array.isArray(data.nodes)) { errors.push('"nodes" must be an array'); return { valid: false, errors: errors, warnings: warnings }; }
    if (!Array.isArray(data.edges)) { errors.push('"edges" must be an array'); return { valid: false, errors: errors, warnings: warnings }; }

    // Build ID sets, check duplicates
    var modIds = new Set();
    data.modules.forEach(function(m) {
      if (!m.id) { errors.push('Module missing "id"'); return; }
      if (modIds.has(m.id)) errors.push('Duplicate module ID: "' + m.id + '"');
      modIds.add(m.id);
    });

    var nodeIds = new Set();
    data.nodes.forEach(function(n) {
      if (!n.id) { errors.push('Node missing "id"'); return; }
      if (nodeIds.has(n.id) || modIds.has(n.id)) errors.push('Duplicate ID: "' + n.id + '"');
      nodeIds.add(n.id);
    });

    // Node -> module references
    data.nodes.forEach(function(n) {
      if (!n.id || !n.module) return;
      if (!modIds.has(n.module)) errors.push('Node "' + n.id + '" references unknown module "' + n.module + '"');
    });

    // Edge -> node references
    data.edges.forEach(function(e, i) {
      var eid = e.id || ('edge ' + i);
      if (!e.source) errors.push(eid + ': missing "source"');
      if (!e.target) errors.push(eid + ': missing "target"');
      if (e.source && !nodeIds.has(e.source)) errors.push(eid + ': source "' + e.source + '" is not a known node');
      if (e.target && !nodeIds.has(e.target)) errors.push(eid + ': target "' + e.target + '" is not a known node');
    });

    // Module parent references + cycle detection
    var parentMap = {};
    data.modules.forEach(function(m) {
      if (m.parent) {
        if (!modIds.has(m.parent)) errors.push('Module "' + m.id + '" parent "' + m.parent + '" not found');
        parentMap[m.id] = m.parent;
      }
    });
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
    var connected = new Set();
    data.edges.forEach(function(e) { connected.add(e.source); connected.add(e.target); });
    data.nodes.forEach(function(n) {
      if (n.id && !n._isInterfacePort && !connected.has(n.id)) warnings.push('Orphan node (no edges): "' + n.id + '"');
    });

    if (data.nodes.length === 0) warnings.push('Graph has no nodes');
    if (data.edges.length === 0) warnings.push('Graph has no edges');

    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  function showErrorPanel(errors) {
    var panel = document.getElementById('error-panel');
    var list = document.getElementById('error-list');
    if (!panel || !list) return;
    list.innerHTML = '';
    errors.forEach(function(msg) {
      var li = document.createElement('li');
      li.textContent = msg;
      list.appendChild(li);
    });
    panel.style.display = 'block';
  }

  function buildElements(data) {
    var elements = [];
    var moduleMap = {};

    var phaseIds = new Set();
    data.modules.forEach(function(m) {
      if (m.parent) phaseIds.add(m.parent);
    });

    data.modules.forEach(function(m) {
      moduleMap[m.id] = m;
      var nodeData = {
        id: m.id,
        label: m.label,
        bg: m.color,
        bc: m.borderColor,
        _isModule: true
      };
      if (m.parent) nodeData.parent = m.parent;
      if (phaseIds.has(m.id)) nodeData._isPhase = true;
      if (m.interface) nodeData.interface = m.interface;
      elements.push({ group: 'nodes', data: nodeData });
    });

    moduleIds = data.modules.map(function(m) { return m.id; });

    var trustDefs = (data.legend && data.legend.trustLevels) || {};

    data.nodes.forEach(function(n) {
      var mod = moduleMap[n.module];
      var s = n.style || {};
      var trustKey = s.trust || 'normal';
      var td = trustDefs[trustKey] || {};
      var nodeData = {
        id: n.id,
        label: n.label,
        bg: s.color || mod.color,
        bc: s.borderColor || mod.borderColor,
        trust: trustKey,
        trustColor: td.color || '#f1f5f9',
        trustBorderColor: td.borderColor || '#94a3b8',
        nodeShape: s.shape || 'round-rectangle'
      };

      if (n._isInterfacePort) {
        nodeData._isInterfacePort = true;
        nodeData._portDirection = n._portDirection || 'input';
        nodeData._moduleRef = n.module;
        if (n.interfaceContract) nodeData.interfaceContract = n.interfaceContract;
        nodeData.nodeShape = 'round-rectangle';
      } else {
        nodeData.parent = n.module;
      }

      if (n.files) {
        nodeData.files = n.files;
        var parts = [];
        if (n.files.reads && n.files.reads.length) parts.push('\u{1F4D6} ' + n.files.reads.map(function(f) { return f.replace(/\/+$/, '').split('/').pop() || f; }).join(', '));
        if (n.files.writes && n.files.writes.length) parts.push('\u{1F4DD} ' + n.files.writes.map(function(f) { return f.replace(/\/+$/, '').split('/').pop() || f; }).join(', '));
        nodeData.fileLabel = parts.join('\n') || n.label;
      } else {
        nodeData.fileLabel = n.label;
      }
      elements.push({ group: 'nodes', data: nodeData });
    });

    data.edges.forEach(function(e, i) {
      var edgeData = {
        id: e.id || ('e' + (i + 1)),
        source: e.source,
        target: e.target,
        label: e.label || '',
        lineStyle: e.style || 'solid'
      };
      if (e.actor) edgeData.actor = e.actor;
      if (e.details) edgeData.details = e.details;
      elements.push({ group: 'edges', data: edgeData });
    });

    return elements;
  }

  function buildStyles(data) {
    var trust = (data.legend && data.legend.trustLevels) || {};
    var styles = [
      { selector: ':parent',
        style: {
          'background-color': 'data(bg)', 'background-opacity': 0.25,
          'border-color': 'data(bc)', 'border-width': 2, 'border-opacity': 0.7,
          'shape': 'round-rectangle',
          'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center',
          'font-size': 14, 'font-weight': 700, 'color': '#334155',
          'padding': 25, 'text-margin-y': -4
        }
      },
      { selector: 'node[_isModule]',
        style: {
          'background-color': 'data(bg)', 'border-color': 'data(bc)'
        }
      },
      { selector: 'node[_isPhase]',
        style: {
          'background-opacity': 0.12, 'border-width': 2.5, 'border-style': 'solid',
          'font-size': 16, 'font-weight': 700, 'padding': 35
        }
      },
      { selector: '.collapsed-module',
        style: {
          'background-color': 'data(bg)', 'background-opacity': 0.85,
          'border-color': 'data(bc)', 'border-width': 2.5,
          'shape': 'round-rectangle',
          'width': 180, 'height': 55,
          'label': 'data(label)', 'text-valign': 'center', 'text-halign': 'center',
          'font-size': 13, 'font-weight': 600, 'color': '#1e293b'
        }
      },
      { selector: '.collapsed-phase',
        style: {
          'background-color': 'data(bg)', 'background-opacity': 0.85,
          'border-color': 'data(bc)', 'border-width': 3,
          'shape': 'round-rectangle',
          'width': 220, 'height': 60,
          'label': 'data(label)', 'text-valign': 'center', 'text-halign': 'center',
          'font-size': 14, 'font-weight': 700, 'color': '#1e293b'
        }
      },
      { selector: 'node[nodeShape]',
        style: {
          'background-color': 'data(bg)', 'border-color': 'data(bc)',
          'border-width': 1.5, 'border-style': 'solid',
          'shape': 'data(nodeShape)', 'height': 28,
          'padding-left': 10, 'padding-right': 10,
          'label': 'data(label)', 'text-valign': 'center', 'text-halign': 'center',
          'font-size': 11, 'color': '#1e293b', 'text-wrap': 'none'
        }
      },
      { selector: 'node[_isInterfacePort]',
        style: {
          'width': 130, 'height': 24,
          'font-size': 9, 'font-weight': 600,
          'border-width': 2, 'border-style': 'solid',
          'shape': 'round-rectangle',
          'text-valign': 'center', 'text-halign': 'center',
          'color': '#475569'
        }
      },
      { selector: 'node[_portDirection="input"]',
        style: {
          'background-color': '#eff6ff', 'border-color': '#60a5fa'
        }
      },
      { selector: 'node[_portDirection="output"]',
        style: {
          'background-color': '#f0fdf4', 'border-color': '#4ade80'
        }
      }
    ];

    if (trust.ai) {
      styles.push({ selector: 'node[trust="ai"]',
        style: { 'border-style': trust.ai.borderStyle || 'dashed', 'border-width': trust.ai.borderWidth || 1.5 }
      });
    }
    if (trust.verified) {
      styles.push({ selector: 'node[trust="verified"]',
        style: { 'border-width': trust.verified.borderWidth || 3.5 }
      });
    }

    styles.push(
      { selector: 'node[nodeShape="diamond"]',
        style: { 'shape': 'diamond', 'width': 110, 'height': 60, 'border-width': 3, 'font-size': 10, 'font-weight': 700 }
      },
      { selector: 'edge',
        style: {
          'width': 1.5, 'curve-style': 'bezier',
          'target-arrow-shape': 'triangle', 'target-arrow-color': '#94a3b8',
          'line-color': '#94a3b8', 'arrow-scale': 0.8, 'opacity': 0.7,
          'label': 'data(label)', 'font-size': 9, 'color': '#64748b',
          'text-rotation': 'autorotate',
          'text-background-color': '#f5f6fa', 'text-background-opacity': 0.9,
          'text-background-padding': 2
        }
      },
      { selector: 'edge[lineStyle="dashed"]',
        style: { 'line-style': 'dashed', 'line-dash-pattern': [6, 4] }
      },
      { selector: 'edge[_metaEdge]',
        style: {
          'width': 2, 'line-color': '#64748b', 'target-arrow-color': '#64748b',
          'opacity': 0.8, 'font-size': 10, 'color': '#475569',
          'text-background-color': '#f8fafc', 'text-background-opacity': 0.85,
          'text-background-padding': 2, 'text-rotation': 0
        }
      },
      { selector: 'edge[actor="human"]',
        style: { 'line-color': '#3b82f6', 'target-arrow-color': '#3b82f6' }
      },
      { selector: 'edge[actor="ai"]',
        style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' }
      },
      { selector: 'edge[actor="mixed"]',
        style: { 'line-color': '#14b8a6', 'target-arrow-color': '#14b8a6' }
      },
      { selector: '.view-provenance',
        style: { 'background-color': 'data(trustColor)', 'border-color': 'data(trustBorderColor)' }
      },
      { selector: '.view-actor-human',
        style: { 'background-color': '#dbeafe', 'border-color': '#3b82f6' }
      },
      { selector: '.view-actor-ai',
        style: { 'background-color': '#fef3c7', 'border-color': '#f59e0b' }
      },
      { selector: '.view-actor-script',
        style: { 'background-color': '#f3f4f6', 'border-color': '#6b7280' }
      },
      { selector: '.view-actor-mixed',
        style: { 'background-color': '#ccfbf1', 'border-color': '#14b8a6' }
      },
      { selector: '.view-files',
        style: { 'label': 'data(fileLabel)', 'text-wrap': 'wrap', 'text-max-width': 160, 'font-size': 9, 'text-valign': 'center', 'width': 180, 'height': 48 }
      },
      { selector: '.highlighted',
        style: { 'opacity': 1, 'z-index': 10 }
      },
      { selector: '.dimmed',
        style: { 'opacity': 0.35 }
      },
      { selector: '.path-source',
        style: { 'border-width': 4, 'border-color': '#3b82f6', 'z-index': 20 }
      },
      { selector: 'edge.eh',
        style: { 'width': 3, 'line-color': '#3b82f6', 'target-arrow-color': '#3b82f6', 'opacity': 1, 'z-index': 20 }
      },
      { selector: 'edge.path-edge',
        style: { 'width': 2.5, 'line-color': '#3b82f6', 'target-arrow-color': '#3b82f6', 'opacity': 0.9, 'z-index': 15 }
      },
      { selector: 'edge.labels-hidden',
        style: { 'label': '', 'text-opacity': 0 }
      },
      { selector: 'edge.labels-hidden.path-edge',
        style: { 'label': 'data(label)', 'text-opacity': 1 }
      },
      { selector: 'edge.labels-hidden.eh',
        style: { 'label': 'data(label)', 'text-opacity': 1 }
      },
      { selector: '.plan-add',
        style: {
          'border-color': '#16a34a', 'border-width': 2.5, 'border-style': 'dashed',
          'overlay-color': '#22c55e', 'overlay-opacity': 0.12, 'overlay-padding': 6,
          'opacity': 1, 'z-index': 10
        }
      },
      { selector: '.plan-modify',
        style: {
          'border-color': '#d97706', 'border-width': 3, 'border-style': 'solid',
          'overlay-color': '#f59e0b', 'overlay-opacity': 0.12, 'overlay-padding': 6,
          'opacity': 1, 'z-index': 10
        }
      },
      { selector: '.plan-remove',
        style: {
          'border-color': '#dc2626', 'border-width': 2.5, 'border-style': 'dashed',
          'overlay-color': '#ef4444', 'overlay-opacity': 0.10, 'overlay-padding': 6,
          'opacity': 0.5, 'text-decoration': 'line-through', 'z-index': 10
        }
      },
      { selector: '.plan-unchanged',
        style: { 'opacity': 0.3 }
      },
      { selector: 'edge.plan-add',
        style: {
          'line-color': '#16a34a', 'target-arrow-color': '#16a34a',
          'line-style': 'dashed', 'width': 2.5, 'opacity': 1, 'z-index': 10
        }
      },
      { selector: 'edge.plan-modify',
        style: {
          'line-color': '#d97706', 'target-arrow-color': '#d97706',
          'width': 3, 'opacity': 1, 'z-index': 10
        }
      },
      { selector: 'edge.plan-remove',
        style: {
          'line-color': '#dc2626', 'target-arrow-color': '#dc2626',
          'line-style': 'dashed', 'width': 2, 'opacity': 0.5, 'z-index': 10
        }
      },
      { selector: 'edge.plan-unchanged',
        style: { 'opacity': 0.15 }
      },
      { selector: '.plan-task-highlight',
        style: {
          'border-width': 4, 'border-color': '#3b82f6',
          'overlay-color': '#3b82f6', 'overlay-opacity': 0.15, 'overlay-padding': 8,
          'opacity': 1, 'z-index': 20
        }
      },
      { selector: '.plan-task-dim',
        style: { 'opacity': 0.2 }
      },
      // Diff overlay styles
      { selector: '.diff-added',
        style: {
          'border-color': '#16a34a', 'border-width': 3, 'border-style': 'dashed',
          'overlay-color': '#22c55e', 'overlay-opacity': 0.15, 'overlay-padding': 6,
          'opacity': 1, 'z-index': 10
        }
      },
      { selector: '.diff-modified',
        style: {
          'border-color': '#d97706', 'border-width': 3, 'border-style': 'solid',
          'overlay-color': '#f59e0b', 'overlay-opacity': 0.15, 'overlay-padding': 6,
          'opacity': 1, 'z-index': 10
        }
      },
      { selector: '.diff-removed',
        style: {
          'border-color': '#dc2626', 'border-width': 2.5, 'border-style': 'dashed',
          'overlay-color': '#ef4444', 'overlay-opacity': 0.10, 'overlay-padding': 6,
          'opacity': 0.5, 'z-index': 10
        }
      },
      { selector: '.diff-unchanged',
        style: { 'opacity': 0.3 }
      },
      { selector: 'edge.diff-added',
        style: {
          'line-color': '#16a34a', 'target-arrow-color': '#16a34a',
          'line-style': 'dashed', 'width': 2.5, 'opacity': 1, 'z-index': 10
        }
      },
      { selector: 'edge.diff-modified',
        style: {
          'line-color': '#d97706', 'target-arrow-color': '#d97706',
          'width': 3, 'opacity': 1, 'z-index': 10
        }
      },
      { selector: 'edge.diff-removed',
        style: {
          'line-color': '#dc2626', 'target-arrow-color': '#dc2626',
          'line-style': 'dashed', 'width': 2, 'opacity': 0.5, 'z-index': 10
        }
      },
      { selector: 'edge.diff-unchanged',
        style: { 'opacity': 0.15 }
      }
    );

    return styles;
  }

  function buildLegend(container, data) {
    var html = '';
    var trust = (data.legend && data.legend.trustLevels) || {};
    var hasTrust = Object.keys(trust).length > 0;

    if (hasTrust) {
      html += '<strong>Trust:</strong> ';
      Object.keys(trust).forEach(function(key) {
        var t = trust[key];
        if (t.tag) {
          html += '<span><span class="trust-tag" style="background:' + t.tag.bg + ';color:' + t.tag.color + '">[' + t.tag.text + ']</span> ' + t.label + '</span> ';
        } else {
          html += '<span>' + t.label + '</span> ';
        }
      });
      html += '<span style="margin-left:8px">|</span> ';
    }

    var hasActors = data.edges.some(function(e) { return !!e.actor; });
    if (hasActors) {
      html += '<strong>Actor:</strong> ';
      var actors = [
        { key: 'human', label: 'Human', color: '#3b82f6' },
        { key: 'ai',    label: 'AI',    color: '#f59e0b' },
        { key: 'script', label: 'Script', color: '#6b7280' },
        { key: 'mixed', label: 'Mixed', color: '#14b8a6' }
      ];
      actors.forEach(function(a) {
        html += '<span><span class="actor-line" style="background:' + a.color + '"></span>' + a.label + '</span> ';
      });
      html += '<span style="margin-left:8px">|</span> ';
    }

    var nodeModules = new Set();
    data.nodes.forEach(function(n) { nodeModules.add(n.module); });

    data.modules.forEach(function(m) {
      if (!nodeModules.has(m.id)) return;
      html += '<span><span class="swatch" style="background:' + m.color + '"></span>' + m.label + '</span> ';
    });

    container.innerHTML = html;
  }

  function initCytoscape(containerId, elements, styles) {
    cy = cytoscape({
      container: document.getElementById(containerId),
      elements: elements,
      style: styles,
      layout: { name: 'preset' },
      minZoom: 0.15,
      maxZoom: 4,
      wheelSensitivity: 0.3
    });

    manager = new CollapseManager(cy);
    return cy;
  }

  function applyCollapsedStyle(moduleId) {
    var node = cy.getElementById(moduleId);
    if (!node.length) return;
    if (node.data('_isPhase')) {
      node.addClass('collapsed-phase');
    } else {
      node.addClass('collapsed-module');
    }
  }

  function removeCollapsedStyle(moduleId) {
    var node = cy.getElementById(moduleId);
    if (node.length) node.removeClass('collapsed-module collapsed-phase');
  }

  function runLayout(opts) {
    var defaults = {
      name: 'dagre', rankDir: 'TB',
      nodeSep: 35, rankSep: 55, edgeSep: 15,
      animate: true, animationDuration: 400,
      fit: false, padding: 40,
      nodeDimensionsIncludeLabels: true,
      edgeWeight: function(edge) {
        return edge.data('lineStyle') === 'dashed' ? 0.1 : 1;
      },
      ranker: 'longest-path'
    };
    var merged = Object.assign({}, defaults, opts || {});
    try {
      cy.layout(merged).run();
    } catch (e) {
      merged.ranker = 'network-simplex';
      cy.layout(merged).run();
    }
  }

  function arrangeChildren(moduleId) {
    var parent = cy.getElementById(moduleId);
    var children = parent.children();
    if (children.length === 0) return;
    var hasModuleChildren = children.some(function(c) { return c.data('_isModule'); });
    if (hasModuleChildren) {
      runLayout({ fit: false });
      return;
    }
    var pos = parent.position();
    var n = children.length;
    var spacing = 52;
    var startY = pos.y - (n - 1) * spacing / 2;
    children.forEach(function(child, i) {
      child.animate({ position: { x: pos.x, y: startY + i * spacing } }, { duration: 300 });
    });
  }

  function fit(padding) {
    cy.fit(null, padding || 40);
  }

  function init(containerId, legendId, graphUrl) {
    return loadGraph(graphUrl).then(function(data) {
      var result = validateGraph(data);
      if (!result.valid) {
        showErrorPanel(result.errors);
        throw new Error('Graph validation failed: ' + result.errors[0]);
      }
      if (result.warnings.length) {
        result.warnings.forEach(function(w) { console.warn('[graph]', w); });
        document.getElementById('status').textContent = result.warnings.length + ' warning(s) \u2014 see console';
      }

      var elements = buildElements(data);
      var styles = buildStyles(data);

      buildLegend(document.getElementById(legendId), data);
      document.querySelector('#toolbar h1').textContent = data.title;

      initCytoscape(containerId, elements, styles);

      manager.collapseAll(moduleIds);
      moduleIds.forEach(function(id) { applyCollapsedStyle(id); });

      runLayout({ animate: false, fit: true, padding: 50 });

      var termNode = cy.getElementById('mod_term');
      if (termNode.length && termNode.visible()) {
        var maxY = -Infinity;
        cy.nodes().forEach(function(n) {
          if (n.id() !== 'mod_term' && n.position('y') > maxY) maxY = n.position('y');
        });
        termNode.position('y', maxY + 90);
      }

      fit(50);

      return { cy: cy, manager: manager, data: data, moduleIds: moduleIds };
    });
  }

  // --- PF-2: Watch mode ---
  var watchTimer = null;
  var lastModified = null;
  var graphUrl = null;

  function watchGraph(url, callback) {
    graphUrl = url;
    fetch(url, { method: 'HEAD' }).then(function(r) {
      lastModified = r.headers.get('Last-Modified') || r.headers.get('ETag');
    }).catch(function() {});

    watchTimer = setInterval(function() {
      fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function(r) {
        var current = r.headers.get('Last-Modified') || r.headers.get('ETag');
        if (current && current !== lastModified) {
          lastModified = current;
          callback();
        }
      }).catch(function() {});
    }, 2000);
  }

  function stopWatch() {
    if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
  }

  function reloadGraph(containerId, legendId, url) {
    var prevView = currentView;
    return loadGraph(url).then(function(data) {
      var result = validateGraph(data);
      if (!result.valid) {
        console.warn('[watch] Reload skipped: validation errors', result.errors);
        return null;
      }

      var elements = buildElements(data);
      var styles = buildStyles(data);

      buildLegend(document.getElementById(legendId), data);
      document.querySelector('#toolbar h1').textContent = data.title;

      // Destroy old instance and create fresh
      if (cy) cy.destroy();
      initCytoscape(containerId, elements, styles);

      manager.collapseAll(moduleIds);
      moduleIds.forEach(function(id) { applyCollapsedStyle(id); });
      runLayout({ animate: false, fit: true, padding: 50 });

      var termNode = cy.getElementById('mod_term');
      if (termNode.length && termNode.visible()) {
        var maxY = -Infinity;
        cy.nodes().forEach(function(n) {
          if (n.id() !== 'mod_term' && n.position('y') > maxY) maxY = n.position('y');
        });
        termNode.position('y', maxY + 90);
      }
      fit(50);
      setView(prevView);

      var status = document.getElementById('status');
      status.textContent = 'Graph reloaded';

      return { cy: cy, manager: manager, data: data, moduleIds: moduleIds };
    });
  }

  function computeDominantActor(actors) {
    var keys = Object.keys(actors);
    if (keys.length === 0) return 'script';
    if (keys.length === 1) return keys[0];
    var hasHuman = !!actors.human;
    var hasAi = !!actors.ai;
    if (hasHuman && !hasAi) return 'human';
    if (hasAi && !hasHuman) return 'ai';
    return 'mixed';
  }

  function getModuleDominantActor(moduleId) {
    if (!graphData) return 'script';
    var nodeIds = new Set();
    graphData.nodes.forEach(function(n) {
      if (n.module === moduleId) nodeIds.add(n.id);
    });
    graphData.modules.forEach(function(m) {
      if (m.parent === moduleId) {
        graphData.nodes.forEach(function(n) {
          if (n.module === m.id) nodeIds.add(n.id);
        });
      }
    });
    var actors = {};
    graphData.edges.forEach(function(e) {
      if (nodeIds.has(e.source) || nodeIds.has(e.target)) {
        var a = e.actor || 'script';
        actors[a] = (actors[a] || 0) + 1;
      }
    });
    return computeDominantActor(actors);
  }

  function setView(mode) {
    currentView = mode;
    var allNodes = cy.nodes();
    var viewClasses = 'view-provenance view-files view-actor-human view-actor-ai view-actor-script view-actor-mixed';
    allNodes.removeClass(viewClasses);
    PlanOverlay.clear(cy);
    if (typeof GraphDiff !== 'undefined') GraphDiff.clearOverlay(cy);

    if (mode === 'diff' && graphData._diff) {
      GraphDiff.applyOverlay(cy, graphData._diff);
    } else if (mode === 'plan') {
      PlanOverlay.apply(cy, graphData);
    } else if (mode === 'provenance') {
      allNodes.filter(function(n) { return !n.data('_isModule'); }).addClass('view-provenance');
    } else if (mode === 'files') {
      allNodes.filter(function(n) { return !n.data('_isModule'); }).addClass('view-files');
    } else if (mode === 'actor') {
      allNodes.filter(function(n) { return !n.data('_isModule'); }).forEach(function(n) {
        var edges = n.connectedEdges();
        var actors = {};
        edges.forEach(function(e) {
          var a = e.data('actor') || 'script';
          actors[a] = (actors[a] || 0) + 1;
        });
        n.addClass('view-actor-' + computeDominantActor(actors));
      });
      allNodes.filter(function(n) { return !!n.data('_isModule'); }).forEach(function(mod) {
        mod.addClass('view-actor-' + getModuleDominantActor(mod.id()));
      });
    }

    rebuildLegendForView(mode);
  }

  function refreshView() {
    setView(currentView);
  }

  function rebuildLegendForView(mode) {
    var legendEl = document.getElementById('legend');
    if (!legendEl || !graphData) return;
    if (mode === 'module') {
      buildLegend(legendEl, graphData);
      return;
    }
    var html = '';
    if (mode === 'provenance') {
      var trust = (graphData.legend && graphData.legend.trustLevels) || {};
      html += '<strong>Provenance:</strong> ';
      Object.keys(trust).forEach(function(key) {
        var t = trust[key];
        var bg = t.color || '#f1f5f9';
        var bc = t.borderColor || '#94a3b8';
        html += '<span><span class="swatch" style="background:' + bg + ';border-color:' + bc + '"></span>' + t.label + '</span> ';
      });
    } else if (mode === 'files') {
      html += '<strong>Files:</strong> \u{1F4D6} reads &nbsp; \u{1F4DD} writes';
    } else if (mode === 'actor') {
      html += '<strong>Actor View:</strong> ';
      var actors = [
        { label: 'Human', color: '#dbeafe', bc: '#3b82f6' },
        { label: 'AI', color: '#fef3c7', bc: '#f59e0b' },
        { label: 'Script', color: '#f3f4f6', bc: '#6b7280' },
        { label: 'Mixed', color: '#ccfbf1', bc: '#14b8a6' }
      ];
      actors.forEach(function(a) {
        html += '<span><span class="swatch" style="background:' + a.color + ';border-color:' + a.bc + '"></span>' + a.label + '</span> ';
      });
    } else if (mode === 'plan') {
      html += '<strong>Plan:</strong> ';
      var statuses = [
        { label: 'Add', color: '#dcfce7', bc: '#16a34a' },
        { label: 'Modify', color: '#fef3c7', bc: '#d97706' },
        { label: 'Remove', color: '#fee2e2', bc: '#dc2626' },
        { label: 'Unchanged', color: '#f1f5f9', bc: '#cbd5e1' }
      ];
      statuses.forEach(function(s) {
        html += '<span><span class="swatch" style="background:' + s.color + ';border-color:' + s.bc + '"></span>' + s.label + '</span> ';
      });
    } else if (mode === 'diff') {
      html += '<strong>Diff:</strong> ';
      var diffStatuses = [
        { label: 'Added', color: '#dcfce7', bc: '#16a34a' },
        { label: 'Modified', color: '#fef3c7', bc: '#d97706' },
        { label: 'Removed', color: '#fee2e2', bc: '#dc2626' },
        { label: 'Unchanged', color: '#f1f5f9', bc: '#cbd5e1' }
      ];
      diffStatuses.forEach(function(s) {
        html += '<span><span class="swatch" style="background:' + s.color + ';border-color:' + s.bc + '"></span>' + s.label + '</span> ';
      });
      if (graphData._diff) {
        var d = graphData._diff.summary;
        html += '<span style="margin-left:12px;color:#64748b">+' + d.added + ' ~' + d.modified + ' -' + d.removed + '</span>';
      }
    }
    legendEl.innerHTML = html;
  }

  return {
    init: init,
    loadGraph: loadGraph,
    validateGraph: validateGraph,
    buildElements: buildElements,
    buildStyles: buildStyles,
    buildLegend: buildLegend,
    initCytoscape: initCytoscape,
    runLayout: runLayout,
    arrangeChildren: arrangeChildren,
    applyCollapsedStyle: applyCollapsedStyle,
    removeCollapsedStyle: removeCollapsedStyle,
    fit: fit,
    setView: setView,
    refreshView: refreshView,
    watchGraph: watchGraph,
    stopWatch: stopWatch,
    reloadGraph: reloadGraph,
    getView: function() { return currentView; },
    getGraphData: function() { return graphData; },
    getCy: function() { return cy; },
    getManager: function() { return manager; },
    getModuleIds: function() { return moduleIds; }
  };
})();
