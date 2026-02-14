var Interactions = (function() {
  var tooltipEl;
  var statusEl;
  var detailPanel;
  var detailBackdrop;
  var mouseX = 0, mouseY = 0;
  var pathTraceActive = false;
  var labelsHidden = true;

  function init(cy, manager, moduleIds) {
    tooltipEl = document.getElementById('tooltip');
    statusEl = document.getElementById('status');
    detailPanel = document.getElementById('detail-panel');
    detailBackdrop = document.getElementById('detail-backdrop');
    var searchInput = document.getElementById('search-input');

    document.addEventListener('mousemove', function(e) {
      mouseX = e.pageX;
      mouseY = e.pageY;
      if (tooltipEl.style.display === 'block') {
        tooltipEl.style.left = (mouseX + 14) + 'px';
        tooltipEl.style.top = (mouseY - 10) + 'px';
      }
    });

    cy.on('tap', 'node[_isModule]', function(e) {
      var node = e.target;
      var id = node.id();
      clearPathTrace(cy);
      if (manager.isCollapsed(id)) {
        manager.expand(id);
        GraphViewer.removeCollapsedStyle(id);
        node.children().forEach(function(child) {
          if (child.data('_isModule') && manager.isCollapsed(child.id())) {
            GraphViewer.applyCollapsedStyle(child.id());
          }
        });
        GraphViewer.arrangeChildren(id);
      } else if (node.isParent()) {
        manager.collapse(id);
        GraphViewer.applyCollapsedStyle(id);
      }
      GraphViewer.runLayout({ animate: true, fit: false });
      updateStatus(manager, moduleIds);
    });

    cy.on('tap', 'node:child', function(e) {
      var node = e.target;
      if (node.data('_isModule')) return;
      clearPathTrace(cy);
      tracePath(cy, node);
    });

    cy.on('tap', function(e) {
      if (e.target === cy) clearPathTrace(cy);
    });

    cy.on('mouseover', 'edge', function(e) {
      var edge = e.target;
      var label = edge.data('label') || '';
      if (!label && edge.data('_metaEdge')) label = '(connection)';
      var details = edge.data('details');
      var tipText = label;
      if (details && details.script) tipText = (label ? label + '  \u2192  ' : '') + details.script;
      if (tipText) {
        tooltipEl.textContent = tipText;
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = (mouseX + 14) + 'px';
        tooltipEl.style.top = (mouseY - 10) + 'px';
      }
      if (!pathTraceActive) {
        edge.addClass('eh');
        edge.source().addClass('highlighted');
        edge.target().addClass('highlighted');
      }
    });

    cy.on('mouseout', 'edge', function(e) {
      tooltipEl.style.display = 'none';
      e.target.removeClass('eh');
      if (!pathTraceActive) {
        cy.elements().removeClass('highlighted');
      }
    });

    cy.on('tap', 'edge', function(e) {
      var edge = e.target;
      var details = edge.data('details');
      if (!details) return;
      showDetailPanel(edge);
    });

    detailBackdrop.addEventListener('click', hideDetailPanel);

    cy.on('mouseover', 'node:child', function(e) {
      if (pathTraceActive) return;
      var node = e.target;
      if (node.data('_isModule')) return;
      var connected = node.closedNeighborhood();
      cy.elements().not(connected).addClass('dimmed');
      connected.addClass('highlighted');
    });

    cy.on('mouseout', 'node:child', function() {
      if (pathTraceActive) return;
      cy.elements().removeClass('dimmed').removeClass('highlighted');
    });

    cy.on('zoom', function() {
      var zd = document.getElementById('zoom-display');
      if (zd) zd.textContent = Math.round(cy.zoom() * 100) + '%';
    });

    document.getElementById('btn-expand').addEventListener('click', function() {
      expandAll(cy, manager, moduleIds);
    });
    document.getElementById('btn-collapse').addEventListener('click', function() {
      collapseAll(cy, manager, moduleIds);
    });
    document.getElementById('btn-fit').addEventListener('click', function() {
      GraphViewer.fit(40);
    });
    document.getElementById('btn-labels').addEventListener('click', function() {
      toggleLabels(cy);
    });

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var query = searchInput.value.toLowerCase().trim();
        clearPathTrace(cy);
        if (!query) return;
        var matches = cy.nodes().filter(function(n) {
          return !n.data('_isModule') && n.data('label') && n.data('label').toLowerCase().indexOf(query) >= 0;
        });
        if (matches.length > 0) {
          cy.elements().addClass('dimmed');
          matches.removeClass('dimmed').addClass('highlighted');
          matches.parent().removeClass('dimmed');
          cy.animate({ center: { eles: matches.first() }, duration: 300 });
          statusEl.textContent = matches.length + ' match' + (matches.length > 1 ? 'es' : '');
        } else {
          statusEl.textContent = 'No matches';
        }
      });

      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          searchInput.value = '';
          clearPathTrace(cy);
          searchInput.blur();
          updateStatus(manager, moduleIds);
        }
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); GraphViewer.fit(40); }
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); expandAll(cy, manager, moduleIds); }
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); collapseAll(cy, manager, moduleIds); }
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); toggleLabels(cy); }
      if (e.key === 'Escape') { hideDetailPanel(); clearPathTrace(cy); updateStatus(manager, moduleIds); }
      if (e.key === '/' && searchInput) { e.preventDefault(); searchInput.focus(); }
    });

    cy.edges().addClass('labels-hidden');
    cy.on('add', 'edge', function(e) {
      if (labelsHidden) e.target.addClass('labels-hidden');
    });
    updateStatus(manager, moduleIds);
  }

  function toggleLabels(cy) {
    var btn = document.getElementById('btn-labels');
    if (labelsHidden) {
      cy.edges().removeClass('labels-hidden');
      labelsHidden = false;
      btn.className = 'toggle-on';
    } else {
      cy.edges().addClass('labels-hidden');
      labelsHidden = true;
      btn.className = 'toggle-off';
    }
  }

  function tracePath(cy, node) {
    var upstream = cy.collection();
    var downstream = cy.collection();

    var queue = node.incomers('node').toArray();
    while (queue.length > 0) {
      var n = queue.shift();
      if (upstream.has(n)) continue;
      upstream = upstream.union(n);
      n.incomers('node').forEach(function(pred) {
        if (!upstream.has(pred)) queue.push(pred);
      });
    }

    queue = node.outgoers('node').toArray();
    while (queue.length > 0) {
      var n = queue.shift();
      if (downstream.has(n)) continue;
      downstream = downstream.union(n);
      n.outgoers('node').forEach(function(succ) {
        if (!downstream.has(succ)) queue.push(succ);
      });
    }

    var pathNodes = upstream.union(downstream).union(node);
    var pathEdges = cy.edges().filter(function(edge) {
      return pathNodes.has(edge.source()) && pathNodes.has(edge.target());
    });
    var allPath = pathNodes.union(pathEdges);
    pathNodes.forEach(function(n) {
      var p = n.parent();
      if (p.length) allPath = allPath.union(p);
    });

    cy.elements().not(allPath).addClass('dimmed');
    allPath.addClass('highlighted');
    pathEdges.addClass('path-edge');
    node.addClass('path-source');
    pathTraceActive = true;
  }

  function clearPathTrace(cy) {
    if (!pathTraceActive) return;
    cy.elements().removeClass('dimmed highlighted path-source path-edge');
    pathTraceActive = false;
  }

  function expandAll(cy, manager, moduleIds) {
    clearPathTrace(cy);
    manager.expandAll();
    moduleIds.forEach(function(id) { GraphViewer.removeCollapsedStyle(id); });
    GraphViewer.runLayout({ fit: true });
    updateStatus(manager, moduleIds);
  }

  function collapseAll(cy, manager, moduleIds) {
    clearPathTrace(cy);
    manager.collapseAll(moduleIds);
    moduleIds.forEach(function(id) { GraphViewer.applyCollapsedStyle(id); });
    GraphViewer.runLayout({ animate: false, fit: true, padding: 50 });
    var termNode = cy.getElementById('mod_term');
    if (termNode.length && termNode.visible()) {
      var maxY = -Infinity;
      cy.nodes().forEach(function(n) {
        if (n.id() !== 'mod_term' && n.position('y') > maxY) maxY = n.position('y');
      });
      termNode.position('y', maxY + 90);
    }
    GraphViewer.fit(40);
    updateStatus(manager, moduleIds);
  }

  function updateStatus(manager, moduleIds) {
    var state = manager.getState();
    var total = moduleIds.length;
    var expanded = total - state.collapsedCount;
    if (state.collapsedCount === total) {
      statusEl.textContent = total + ' modules collapsed';
    } else if (expanded === total) {
      statusEl.textContent = total + ' modules expanded';
    } else {
      statusEl.textContent = expanded + ' expanded, ' + state.collapsedCount + ' collapsed';
    }
  }

  var actorColors = { human: '#6366f1', ai: '#f59e0b', script: '#94a3b8', mixed: '#8b5cf6' };
  var actorLabels = { human: 'Human', ai: 'AI', script: 'Script', mixed: 'Mixed' };

  function showDetailPanel(edge) {
    var label = edge.data('label') || '(edge)';
    var actor = edge.data('actor');
    var details = edge.data('details') || {};

    var html = '<div class="dp-header"><span class="dp-title">' + escapeHtml(label) + '</span>';
    if (actor) {
      var ac = actorColors[actor] || '#94a3b8';
      html += '<span class="dp-actor" style="background:' + ac + '20;color:' + ac + '">' + (actorLabels[actor] || actor) + '</span>';
    }
    html += '<button class="dp-close" id="dp-close-btn">&times;</button></div>';

    if (details.script) {
      html += '<div class="dp-row"><div class="dp-label">Script</div><div class="dp-value">' + escapeHtml(details.script) + '</div></div>';
    }
    if (details.input && details.input.length) {
      html += '<div class="dp-row"><div class="dp-label">Input</div><ul class="dp-list">';
      details.input.forEach(function(f) { html += '<li class="dp-value">' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }
    if (details.output && details.output.length) {
      html += '<div class="dp-row"><div class="dp-label">Output</div><ul class="dp-list">';
      details.output.forEach(function(f) { html += '<li class="dp-value">' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }
    if (details.updates && details.updates.length) {
      html += '<div class="dp-row"><div class="dp-label">Updates</div><ul class="dp-list">';
      details.updates.forEach(function(f) { html += '<li class="dp-value">' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }
    if (details.docs) {
      html += '<div class="dp-row"><div class="dp-label">Docs</div><div class="dp-value">' + escapeHtml(details.docs) + '</div></div>';
    }

    detailPanel.innerHTML = html;
    detailPanel.style.display = 'block';
    detailBackdrop.style.display = 'block';

    document.getElementById('dp-close-btn').addEventListener('click', hideDetailPanel);
  }

  function hideDetailPanel() {
    detailPanel.style.display = 'none';
    detailBackdrop.style.display = 'none';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { init: init };
})();
