var GraphViewer = (function() {
  var cy = null;
  var manager = null;
  var graphData = null;
  var moduleIds = [];
  var currentView = 'module';

  function loadGraph(url) {
    return fetch(url).then(function(r) { return r.json(); }).then(function(data) {
      graphData = data;
      return data;
    });
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
        parent: n.module,
        label: n.label,
        bg: s.color || mod.color,
        bc: s.borderColor || mod.borderColor,
        trust: trustKey,
        trustColor: td.color || '#f1f5f9',
        trustBorderColor: td.borderColor || '#94a3b8',
        nodeShape: s.shape || 'round-rectangle'
      };
      if (n.files) {
        nodeData.files = n.files;
        var parts = [];
        if (n.files.reads && n.files.reads.length) parts.push('\u{1F4D6} ' + n.files.reads.map(function(f) { return f.split('/').pop(); }).join(', '));
        if (n.files.writes && n.files.writes.length) parts.push('\u{1F4DD} ' + n.files.writes.map(function(f) { return f.split('/').pop(); }).join(', '));
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
        style: { 'line-color': '#6366f1', 'target-arrow-color': '#6366f1' }
      },
      { selector: 'edge[actor="ai"]',
        style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' }
      },
      { selector: 'edge[actor="mixed"]',
        style: { 'line-color': '#8b5cf6', 'target-arrow-color': '#8b5cf6' }
      },
      { selector: '.view-provenance',
        style: { 'background-color': 'data(trustColor)', 'border-color': 'data(trustBorderColor)' }
      },
      { selector: '.view-actor-human',
        style: { 'background-color': '#e0e7ff', 'border-color': '#6366f1' }
      },
      { selector: '.view-actor-ai',
        style: { 'background-color': '#fef3c7', 'border-color': '#f59e0b' }
      },
      { selector: '.view-actor-script',
        style: { 'background-color': '#f1f5f9', 'border-color': '#94a3b8' }
      },
      { selector: '.view-actor-mixed',
        style: { 'background-color': '#ede9fe', 'border-color': '#8b5cf6' }
      },
      { selector: '.view-files',
        style: { 'label': 'data(fileLabel)', 'text-wrap': 'wrap', 'text-max-width': 160, 'font-size': 9, 'text-valign': 'center', 'width': 180, 'height': 48 }
      },
      { selector: '.highlighted',
        style: { 'opacity': 1, 'z-index': 10 }
      },
      { selector: '.dimmed',
        style: { 'opacity': 0.15 }
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
      }
    );

    return styles;
  }

  function buildLegend(container, data) {
    var html = '<strong>Modules:</strong> ';
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

  function setView(mode) {
    currentView = mode;
    var leafNodes = cy.nodes().filter(function(n) { return !n.data('_isModule'); });
    leafNodes.removeClass('view-provenance view-files view-actor-human view-actor-ai view-actor-script view-actor-mixed');

    if (mode === 'provenance') {
      leafNodes.addClass('view-provenance');
    } else if (mode === 'files') {
      leafNodes.addClass('view-files');
    } else if (mode === 'actor') {
      leafNodes.forEach(function(n) {
        var edges = n.connectedEdges();
        var actors = {};
        edges.forEach(function(e) {
          var a = e.data('actor') || 'script';
          actors[a] = (actors[a] || 0) + 1;
        });
        var keys = Object.keys(actors);
        var dominant = 'script';
        if (keys.length === 1) { dominant = keys[0]; }
        else if (keys.length > 1) {
          var hasHuman = !!actors.human;
          var hasAi = !!actors.ai;
          if (hasHuman && !hasAi) dominant = 'human';
          else if (hasAi && !hasHuman) dominant = 'ai';
          else dominant = 'mixed';
        }
        n.addClass('view-actor-' + dominant);
      });
    }

    rebuildLegendForView(mode);
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
        { label: 'Human', color: '#e0e7ff', bc: '#6366f1' },
        { label: 'AI', color: '#fef3c7', bc: '#f59e0b' },
        { label: 'Script', color: '#f1f5f9', bc: '#94a3b8' },
        { label: 'Mixed', color: '#ede9fe', bc: '#8b5cf6' }
      ];
      actors.forEach(function(a) {
        html += '<span><span class="swatch" style="background:' + a.color + ';border-color:' + a.bc + '"></span>' + a.label + '</span> ';
      });
    }
    legendEl.innerHTML = html;
  }

  return {
    init: init,
    loadGraph: loadGraph,
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
    getView: function() { return currentView; },
    getGraphData: function() { return graphData; },
    getCy: function() { return cy; },
    getManager: function() { return manager; },
    getModuleIds: function() { return moduleIds; }
  };
})();
