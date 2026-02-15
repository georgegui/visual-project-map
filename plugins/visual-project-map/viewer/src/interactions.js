var Interactions = (function() {
  var tooltipEl;
  var statusEl;
  var detailPanel;
  var detailBackdrop;
  var mouseX = 0, mouseY = 0;
  var pathTraceActive = false;
  var labelsHidden = true;
  var autofocusMode = false;
  var watching = false;
  var breadcrumbPath = [];
  var _cy, _manager, _moduleIds, _graphUrl;

  function init(cy, manager, moduleIds, graphUrl) {
    _cy = cy;
    _manager = manager;
    _moduleIds = moduleIds;
    _graphUrl = graphUrl;
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
      var wasCollapsed = manager.isCollapsed(id);

      // If collapsed and has interface, show interface panel instead of expanding
      if (wasCollapsed && node.data('interface')) {
        clearPathTrace(cy);
        showModuleInterfacePanel(node, cy, manager, moduleIds);
        return;
      }

      var parentPos = { x: node.position('x'), y: node.position('y') };
      clearPathTrace(cy);

      // Snapshot current positions + viewport
      var posBefore = {};
      cy.nodes().forEach(function(n) {
        posBefore[n.id()] = { x: n.position('x'), y: n.position('y') };
      });
      var vpBefore = { zoom: cy.zoom(), pan: { x: cy.pan().x, y: cy.pan().y } };

      if (wasCollapsed) {
        if (autofocusMode) {
          var ancestors = getAncestorModules(id);
          moduleIds.forEach(function(mid) {
            if (mid !== id && !ancestors.has(mid) && !manager.isCollapsed(mid)) {
              manager.collapse(mid);
              GraphViewer.applyCollapsedStyle(mid);
            }
          });
        }
        manager.expand(id);
        GraphViewer.removeCollapsedStyle(id);
        node.children().forEach(function(child) {
          if (child.data('_isModule') && manager.isCollapsed(child.id())) {
            GraphViewer.applyCollapsedStyle(child.id());
          }
        });
        updateBreadcrumbForExpand(id, cy);
      } else if (node.isParent()) {
        manager.collapse(id);
        GraphViewer.applyCollapsedStyle(id);
        updateBreadcrumbForCollapse(id);
      }

      // Run layout silently to compute final state
      GraphViewer.runLayout({ animate: false, fit: false });
      GraphViewer.refreshView();
      updateStatus(manager, moduleIds);

      // Snapshot final node positions
      var posAfter = {};
      cy.nodes().forEach(function(n) {
        posAfter[n.id()] = { x: n.position('x'), y: n.position('y') };
      });

      // Use Cytoscape's own fit to compute the correct target viewport
      var fitPad = autofocusMode ? 60 : 40;
      if (autofocusMode) {
        var target = cy.getElementById(id);
        var parent = target.parent();
        var fitEles;
        if (parent.length) {
          fitEles = parent.add(parent.descendants());
        } else if (wasCollapsed) {
          fitEles = target.add(target.descendants());
        } else {
          fitEles = cy.elements();
        }
        cy.fit(fitEles, fitPad);
      } else {
        cy.fit(null, fitPad);
      }
      var vpAfter = { zoom: cy.zoom(), pan: { x: cy.pan().x, y: cy.pan().y } };

      // Restore everything to pre-state: positions + viewport
      cy.batch(function() {
        cy.nodes().forEach(function(n) {
          n.position(posBefore[n.id()] || parentPos);
        });
      });
      cy.viewport({ zoom: vpBefore.zoom, pan: vpBefore.pan });

      // Animate nodes to final positions + viewport to final state
      var dur = 500;
      var ease = 'ease-in-out-cubic';
      cy.nodes().forEach(function(n) {
        var dest = posAfter[n.id()];
        if (dest) n.animate({ position: dest }, { duration: dur, easing: ease });
      });
      cy.animate({ zoom: vpAfter.zoom, pan: vpAfter.pan, duration: dur, easing: ease });
    });

    cy.on('tap', 'node[_isInterfacePort]', function(e) {
      var node = e.target;
      clearPathTrace(cy);
      showPortContractPanel(node);
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
      if (GraphViewer.getView() === 'plan') {
        var edgeKey = edge.data('source') + '->' + edge.data('target');
        var pa = PlanOverlay.getAnnotation(GraphViewer.getGraphData(), 'edges', edgeKey);
        if (pa && pa.description) {
          tipText = (tipText ? tipText + ' \u2014 ' : '') + pa.description;
        }
      }
      if (tipText) {
        tooltipEl.innerHTML = escapeHtml(tipText);
        tooltipEl.style.display = 'block';
        tooltipEl.style.whiteSpace = 'normal';
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

    cy.on('dbltap', 'node:child', function(e) {
      var node = e.target;
      if (node.data('_isModule')) return;
      var files = node.data('files');
      if (!files) return;
      showNodeDetailPanel(node);
    });

    detailBackdrop.addEventListener('click', hideDetailPanel);

    cy.on('mouseover', 'node:child', function(e) {
      if (pathTraceActive) return;
      var node = e.target;
      if (node.data('_isModule')) return;
      var isPlanView = GraphViewer.getView() === 'plan';
      if (!isPlanView) {
        var connected = node.closedNeighborhood();
        cy.elements().not(connected).addClass('dimmed');
        connected.addClass('highlighted');
      }

      var tipLines = [];
      var files = node.data('files');

      if (isPlanView) {
        var pa = PlanOverlay.getAnnotation(GraphViewer.getGraphData(), 'nodes', node.id());
        if (pa) {
          var statusLabel = pa.status === 'add' ? '[ADD]' : pa.status === 'modify' ? '[MODIFY]' : '[REMOVE]';
          tipLines.push(statusLabel + ' ' + (node.data('_origLabel') || node.data('label')));
          if (pa.description) tipLines.push(pa.description);
        } else {
          tipLines.push(node.data('_origLabel') || node.data('label'));
        }
      } else if (files) {
        tipLines.push(node.data('label'));
        if (files.reads && files.reads.length) tipLines.push('\u{1F4D6} ' + files.reads.map(function(f) { return f.replace(/\/+$/, '').split('/').pop() || f; }).join(', '));
        if (files.writes && files.writes.length) tipLines.push('\u{1F4DD} ' + files.writes.map(function(f) { return f.replace(/\/+$/, '').split('/').pop() || f; }).join(', '));
      }

      if (tipLines.length) {
        tooltipEl.innerHTML = tipLines.map(function(l) { return escapeHtml(l); }).join('<br>');
        tooltipEl.style.display = 'block';
        tooltipEl.style.whiteSpace = 'normal';
        tooltipEl.style.left = (mouseX + 14) + 'px';
        tooltipEl.style.top = (mouseY - 10) + 'px';
      }
    });

    cy.on('mouseout', 'node:child', function() {
      if (pathTraceActive) return;
      cy.elements().removeClass('dimmed').removeClass('highlighted');
      tooltipEl.style.display = 'none';
      tooltipEl.style.whiteSpace = 'nowrap';
    });

    cy.on('mouseover', 'node[_isInterfacePort]', function(e) {
      var node = e.target;
      var contract = node.data('interfaceContract');
      if (!contract) return;
      var dir = node.data('_portDirection') === 'output' ? 'OUTPUT' : 'INPUT';
      var tipLines = ['<strong>' + dir + ': ' + escapeHtml(contract.name) + '</strong>'];
      if (contract.description) tipLines.push(escapeHtml(contract.description.substring(0, 100)) + (contract.description.length > 100 ? '...' : ''));
      tipLines.push('<span style="color:#94a3b8;font-size:10px">Click for template</span>');
      tooltipEl.innerHTML = tipLines.join('<br>');
      tooltipEl.style.display = 'block';
      tooltipEl.style.whiteSpace = 'normal';
      tooltipEl.style.left = (mouseX + 14) + 'px';
      tooltipEl.style.top = (mouseY - 10) + 'px';
    });

    cy.on('mouseout', 'node[_isInterfacePort]', function() {
      tooltipEl.style.display = 'none';
      tooltipEl.style.whiteSpace = 'nowrap';
    });

    cy.on('mouseover', 'node[_isModule]', function(e) {
      var node = e.target;
      var iface = node.data('interface');
      if (!iface || !manager.isCollapsed(node.id())) return;
      var tipLines = ['<strong>' + escapeHtml(node.data('label')) + '</strong>'];
      if (iface.inputs && iface.inputs.length) {
        tipLines.push('<span style="color:#93c5fd">IN:</span> ' + iface.inputs.map(function(i) { return escapeHtml(i.name); }).join(', '));
      }
      if (iface.outputs && iface.outputs.length) {
        tipLines.push('<span style="color:#86efac">OUT:</span> ' + iface.outputs.map(function(o) { return escapeHtml(o.name); }).join(', '));
      }
      tipLines.push('<span style="color:#94a3b8;font-size:10px">Click for details</span>');
      tooltipEl.innerHTML = tipLines.join('<br>');
      tooltipEl.style.display = 'block';
      tooltipEl.style.whiteSpace = 'normal';
      tooltipEl.style.left = (mouseX + 14) + 'px';
      tooltipEl.style.top = (mouseY - 10) + 'px';
    });

    cy.on('mouseout', 'node[_isModule]', function() {
      tooltipEl.style.display = 'none';
      tooltipEl.style.whiteSpace = 'nowrap';
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
    document.getElementById('btn-labels').addEventListener('click', function() {
      toggleLabels(cy);
    });
    document.getElementById('btn-autofocus').addEventListener('click', function() {
      toggleAutofocus();
    });

    var gd = GraphViewer.getGraphData();
    var planBtn = document.getElementById('btn-plan-view');
    var planSummaryBtn = document.getElementById('btn-plan-summary');
    var planSummaryPanel = document.getElementById('plan-summary-panel');
    if (PlanOverlay.hasPlan(gd)) {
      if (planBtn) planBtn.style.display = '';
      if (planSummaryBtn) planSummaryBtn.style.display = '';
      buildPlanSummaryPanel(gd, cy);
    }

    var viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = btn.getAttribute('data-view');
        viewBtns.forEach(function(b) { b.className = 'view-btn' + (b === btn ? ' view-active' : ''); });
        GraphViewer.setView(mode);
        updatePlanUI(mode);
      });
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
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); expandAll(cy, manager, moduleIds); }
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); collapseAll(cy, manager, moduleIds); }
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); toggleLabels(cy); }
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); toggleAutofocus(); }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        var views = ['module', 'provenance', 'actor', 'files'];
        if (PlanOverlay.hasPlan(GraphViewer.getGraphData())) views.push('plan');
        if (GraphViewer.getGraphData()._diff) views.push('diff');
        var cur = GraphViewer.getView();
        var next = views[(views.indexOf(cur) + 1) % views.length];
        var viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(function(b) { b.className = 'view-btn' + (b.getAttribute('data-view') === next ? ' view-active' : ''); });
        GraphViewer.setView(next);
        updatePlanUI(next);
      }
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMinimap(); }
      if (e.key === 'w' || e.key === 'W') { e.preventDefault(); toggleWatch(graphUrl); }
      if (e.key === 'Escape') { hideDetailPanel(); clearPathTrace(cy); updateStatus(manager, moduleIds); }
      if (e.key === '/' && searchInput) { e.preventDefault(); searchInput.focus(); }
    });

    // PF-2: Watch button
    var watchBtn = document.getElementById('btn-watch');
    if (watchBtn) {
      watchBtn.addEventListener('click', function() { toggleWatch(graphUrl); });
    }

    // PF-3: Minimap
    if (typeof Minimap !== 'undefined') {
      Minimap.init('minimap', cy);
    }
    var minimapBtn = document.getElementById('btn-minimap');
    if (minimapBtn) {
      minimapBtn.addEventListener('click', function() { toggleMinimap(); });
    }

    // PF-4: Breadcrumb click handler
    var bcEl = document.getElementById('breadcrumb');
    if (bcEl) {
      bcEl.addEventListener('click', function(e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;
        var action = target.getAttribute('data-action');
        if (action === 'collapse-all') {
          collapseAll(cy, manager, moduleIds);
          breadcrumbPath = [];
          renderBreadcrumb(cy);
        } else if (action === 'collapse-to') {
          var modId = target.getAttribute('data-module');
          var idx = breadcrumbPath.indexOf(modId);
          if (idx >= 0) {
            // Collapse everything deeper than this level
            var toCollapse = breadcrumbPath.slice(idx + 1);
            for (var i = toCollapse.length - 1; i >= 0; i--) {
              if (!manager.isCollapsed(toCollapse[i])) {
                manager.collapse(toCollapse[i]);
                GraphViewer.applyCollapsedStyle(toCollapse[i]);
              }
            }
            breadcrumbPath = breadcrumbPath.slice(0, idx + 1);
            renderBreadcrumb(cy);
            GraphViewer.runLayout({ animate: true, fit: true, padding: 50 });
            GraphViewer.refreshView();
            updateStatus(manager, moduleIds);
          }
        }
      });
    }

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

  function getAncestorModules(moduleId) {
    var ancestors = new Set();
    var gd = GraphViewer.getGraphData();
    if (!gd) return ancestors;
    var moduleMap = {};
    gd.modules.forEach(function(m) { moduleMap[m.id] = m; });
    var m = moduleMap[moduleId];
    while (m && m.parent) {
      ancestors.add(m.parent);
      m = moduleMap[m.parent];
    }
    return ancestors;
  }

  function toggleAutofocus() {
    var btn = document.getElementById('btn-autofocus');
    autofocusMode = !autofocusMode;
    if (btn) btn.className = autofocusMode ? 'toggle-on' : 'toggle-off';
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
    GraphViewer.refreshView();
    updateStatus(manager, moduleIds);
    breadcrumbPath = [];
    renderBreadcrumb(cy);
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
    GraphViewer.refreshView();
    updateStatus(manager, moduleIds);
    breadcrumbPath = [];
    renderBreadcrumb(cy);
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

  var actorColors = { human: '#3b82f6', ai: '#f59e0b', script: '#6b7280', mixed: '#14b8a6' };
  var actorLabels = { human: 'Human', ai: 'AI', script: 'Script', mixed: 'Mixed' };

  function showPortContractPanel(node) {
    var contract = node.data('interfaceContract');
    if (!contract) return;
    var direction = node.data('_portDirection') || 'input';
    var dirLabel = direction === 'input' ? 'Input' : 'Output';
    var dirColor = direction === 'input' ? '#3b82f6' : '#16a34a';
    var dirBg = direction === 'input' ? '#eff6ff' : '#f0fdf4';

    var html = '<div class="dp-header"><span class="dp-title">' + escapeHtml(contract.name) + '</span>';
    html += '<span class="dp-actor" style="background:' + dirBg + ';color:' + dirColor + '">' + dirLabel + '</span>';
    html += '<button class="dp-close" id="dp-close-btn">&times;</button></div>';

    if (contract.description) {
      html += '<div class="dp-iface-desc" style="margin-bottom:10px">' + escapeHtml(contract.description) + '</div>';
    }
    if (contract.format) {
      html += '<div class="dp-row"><div class="dp-label">Expected Format</div><div class="dp-value">' + escapeHtml(contract.format) + '</div></div>';
    }
    if (contract.example) {
      html += '<div class="dp-row"><div class="dp-label">Example</div><div class="dp-value dp-example">' + escapeHtml(String(contract.example)) + '</div></div>';
    }

    detailPanel.innerHTML = html;
    detailPanel.classList.add('dp-wide');
    detailPanel.style.display = 'block';
    detailBackdrop.style.display = 'block';
    document.getElementById('dp-close-btn').addEventListener('click', hideDetailPanel);
  }

  function showModuleInterfacePanel(node, cy, manager, moduleIds) {
    var label = node.data('label') || '(module)';
    var iface = node.data('interface') || {};
    var id = node.id();

    var html = '<div class="dp-header"><span class="dp-title">' + escapeHtml(label) + '</span>';
    html += '<span class="dp-actor" style="background:#dbeafe;color:#1e40af">Interface</span>';
    html += '<button class="dp-close" id="dp-close-btn">&times;</button></div>';

    if (iface.inputs && iface.inputs.length) {
      html += '<div class="dp-section-label">Inputs</div>';
      iface.inputs.forEach(function(inp) {
        html += '<div class="dp-iface-item">';
        html += '<div class="dp-iface-name">' + escapeHtml(inp.name) + '</div>';
        if (inp.description) html += '<div class="dp-iface-desc">' + escapeHtml(inp.description) + '</div>';
        if (inp.format) html += '<div class="dp-row"><div class="dp-label">Format</div><div class="dp-value">' + escapeHtml(inp.format) + '</div></div>';
        if (inp.example) html += '<div class="dp-row"><div class="dp-label">Example</div><div class="dp-value dp-example">' + escapeHtml(String(inp.example)) + '</div></div>';
        html += '</div>';
      });
    }

    if (iface.outputs && iface.outputs.length) {
      html += '<div class="dp-section-label">Outputs</div>';
      iface.outputs.forEach(function(out) {
        html += '<div class="dp-iface-item">';
        html += '<div class="dp-iface-name">' + escapeHtml(out.name) + '</div>';
        if (out.description) html += '<div class="dp-iface-desc">' + escapeHtml(out.description) + '</div>';
        if (out.format) html += '<div class="dp-row"><div class="dp-label">Format</div><div class="dp-value">' + escapeHtml(out.format) + '</div></div>';
        if (out.example) html += '<div class="dp-row"><div class="dp-label">Example</div><div class="dp-value dp-example">' + escapeHtml(String(out.example)) + '</div></div>';
        html += '</div>';
      });
    }

    html += '<button class="dp-expand-btn" id="dp-expand-module-btn">Expand Module</button>';

    detailPanel.innerHTML = html;
    detailPanel.classList.add('dp-wide');
    detailPanel.style.display = 'block';
    detailBackdrop.style.display = 'block';

    document.getElementById('dp-close-btn').addEventListener('click', function() {
      hideDetailPanel();
      detailPanel.classList.remove('dp-wide');
    });

    document.getElementById('dp-expand-module-btn').addEventListener('click', function() {
      hideDetailPanel();
      detailPanel.classList.remove('dp-wide');
      // Trigger the expand
      var wasCollapsed = manager.isCollapsed(id);
      if (!wasCollapsed) return;
      var parentPos = { x: node.position('x'), y: node.position('y') };
      var posBefore = {};
      cy.nodes().forEach(function(n) { posBefore[n.id()] = { x: n.position('x'), y: n.position('y') }; });
      var vpBefore = { zoom: cy.zoom(), pan: { x: cy.pan().x, y: cy.pan().y } };

      if (autofocusMode) {
        var ancestors = getAncestorModules(id);
        moduleIds.forEach(function(mid) {
          if (mid !== id && !ancestors.has(mid) && !manager.isCollapsed(mid)) {
            manager.collapse(mid);
            GraphViewer.applyCollapsedStyle(mid);
          }
        });
      }
      manager.expand(id);
      GraphViewer.removeCollapsedStyle(id);
      node.children().forEach(function(child) {
        if (child.data('_isModule') && manager.isCollapsed(child.id())) {
          GraphViewer.applyCollapsedStyle(child.id());
        }
      });

      GraphViewer.runLayout({ animate: false, fit: false });
      GraphViewer.refreshView();
      updateStatus(manager, moduleIds);

      var posAfter = {};
      cy.nodes().forEach(function(n) { posAfter[n.id()] = { x: n.position('x'), y: n.position('y') }; });
      cy.fit(null, 40);
      var vpAfter = { zoom: cy.zoom(), pan: { x: cy.pan().x, y: cy.pan().y } };

      cy.batch(function() {
        cy.nodes().forEach(function(n) { n.position(posBefore[n.id()] || parentPos); });
      });
      cy.viewport({ zoom: vpBefore.zoom, pan: vpBefore.pan });

      var dur = 500;
      var ease = 'ease-in-out-cubic';
      cy.nodes().forEach(function(n) {
        var dest = posAfter[n.id()];
        if (dest) n.animate({ position: dest }, { duration: dur, easing: ease });
      });
      cy.animate({ zoom: vpAfter.zoom, pan: vpAfter.pan, duration: dur, easing: ease });
    });
  }

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

    if (GraphViewer.getView() === 'plan') {
      var edgeKey = edge.data('source') + '->' + edge.data('target');
      var pa = PlanOverlay.getAnnotation(GraphViewer.getGraphData(), 'edges', edgeKey);
      if (pa) {
        html += '<div class="dp-row" style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px"><div class="dp-label">Plan: ' + escapeHtml(pa.status.toUpperCase()) + '</div>';
        if (pa.description) html += '<div class="dp-value">' + escapeHtml(pa.description) + '</div>';
        html += '</div>';
      }
    }

    detailPanel.innerHTML = html;
    detailPanel.style.display = 'block';
    detailBackdrop.style.display = 'block';

    document.getElementById('dp-close-btn').addEventListener('click', hideDetailPanel);
  }

  function showNodeDetailPanel(node) {
    var label = node.data('label') || '(node)';
    var trust = node.data('trust') || '';
    var files = node.data('files') || {};
    var gd = GraphViewer.getGraphData();
    var trustDefs = (gd && gd.legend && gd.legend.trustLevels) || {};
    var td = trustDefs[trust];

    var html = '<div class="dp-header"><span class="dp-title">' + escapeHtml(label) + '</span>';
    if (td && td.tag) {
      html += '<span class="dp-actor" style="background:' + td.tag.bg + ';color:' + td.tag.color + '">' + td.tag.text + '</span>';
    }
    html += '<button class="dp-close" id="dp-close-btn">&times;</button></div>';

    if (td) {
      html += '<div class="dp-row"><div class="dp-label">Trust</div><div class="dp-value">' + escapeHtml(td.label) + '</div></div>';
    }
    if (files.reads && files.reads.length) {
      html += '<div class="dp-row"><div class="dp-label">Reads</div><ul class="dp-list">';
      files.reads.forEach(function(f) { html += '<li class="dp-value">' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }
    if (files.writes && files.writes.length) {
      html += '<div class="dp-row"><div class="dp-label">Writes</div><ul class="dp-list">';
      files.writes.forEach(function(f) { html += '<li class="dp-value">' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }

    if (GraphViewer.getView() === 'plan') {
      var pa = PlanOverlay.getAnnotation(GraphViewer.getGraphData(), 'nodes', node.id());
      if (pa) {
        html += '<div class="dp-row" style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px"><div class="dp-label">Plan: ' + escapeHtml(pa.status.toUpperCase()) + '</div>';
        if (pa.description) html += '<div class="dp-value">' + escapeHtml(pa.description) + '</div>';
        html += '</div>';
      }
    }

    detailPanel.innerHTML = html;
    detailPanel.style.display = 'block';
    detailBackdrop.style.display = 'block';
    document.getElementById('dp-close-btn').addEventListener('click', hideDetailPanel);
  }

  function hideDetailPanel() {
    detailPanel.style.display = 'none';
    detailPanel.classList.remove('dp-wide');
    detailBackdrop.style.display = 'none';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updatePlanUI(mode) {
    var summaryBtn = document.getElementById('btn-plan-summary');
    var summaryPanel = document.getElementById('plan-summary-panel');
    if (mode === 'plan') {
      if (summaryBtn) summaryBtn.style.display = '';
    } else {
      if (summaryPanel) summaryPanel.classList.remove('open');
      PlanOverlay.clearTaskHighlight(GraphViewer.getCy());
    }
  }

  function buildPlanSummaryPanel(graphData, cy) {
    var panel = document.getElementById('plan-summary-panel');
    var summaryBtn = document.getElementById('btn-plan-summary');
    if (!panel || !graphData.plan) return;

    var plan = graphData.plan;
    var summary = plan.summary || {};
    var html = '<div class="ps-header"><span class="ps-title">Plan Summary</span>';
    html += '<button class="ps-close" id="ps-close-btn">&times;</button></div>';

    if (summary.goal) {
      html += '<div class="ps-goal">' + escapeHtml(summary.goal) + '</div>';
    }

    if (summary.tasks && summary.tasks.length) {
      html += '<div class="ps-tasks">';
      summary.tasks.forEach(function(t) {
        html += '<div class="ps-task" data-task-id="' + escapeHtml(t.id) + '"';
        if (t.nodeIds) html += ' data-node-ids="' + escapeHtml(JSON.stringify(t.nodeIds)) + '"';
        html += '>';
        html += '<span class="ps-task-id">' + escapeHtml(t.id) + '</span>';
        html += '<span class="ps-task-title">' + escapeHtml(t.title) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    panel.innerHTML = html;

    document.getElementById('ps-close-btn').addEventListener('click', function() {
      panel.classList.remove('open');
      PlanOverlay.clearTaskHighlight(cy);
    });

    panel.querySelectorAll('.ps-task').forEach(function(taskEl) {
      taskEl.addEventListener('click', function() {
        var nodeIdsStr = taskEl.getAttribute('data-node-ids');
        panel.querySelectorAll('.ps-task').forEach(function(t) { t.classList.remove('ps-task-active'); });

        if (nodeIdsStr) {
          var nodeIds = JSON.parse(nodeIdsStr);
          taskEl.classList.add('ps-task-active');
          PlanOverlay.highlightTaskNodes(cy, nodeIds);
        } else {
          PlanOverlay.clearTaskHighlight(cy);
        }
      });
    });

    if (summaryBtn) {
      summaryBtn.addEventListener('click', function() {
        if (panel.classList.contains('open')) {
          panel.classList.remove('open');
          PlanOverlay.clearTaskHighlight(cy);
        } else {
          panel.classList.add('open');
        }
      });
    }
  }

  // --- PF-4: Breadcrumb helpers ---
  function getModuleParentChain(moduleId, cy) {
    var chain = [moduleId];
    var node = cy.getElementById(moduleId);
    while (node.length && node.data('parent')) {
      var pid = node.data('parent');
      chain.unshift(pid);
      node = cy.getElementById(pid);
    }
    return chain;
  }

  function updateBreadcrumbForExpand(moduleId, cy) {
    breadcrumbPath = getModuleParentChain(moduleId, cy);
    renderBreadcrumb(cy);
  }

  function updateBreadcrumbForCollapse(moduleId) {
    var idx = breadcrumbPath.indexOf(moduleId);
    if (idx >= 0) {
      breadcrumbPath = breadcrumbPath.slice(0, idx);
    }
    renderBreadcrumb(_cy);
  }

  function renderBreadcrumb(cy) {
    var el = document.getElementById('breadcrumb');
    var cyEl = document.getElementById('cy');
    if (!el) return;

    if (breadcrumbPath.length === 0) {
      el.style.display = 'none';
      if (cyEl) cyEl.style.top = '80px';
      return;
    }

    el.style.display = 'block';
    if (cyEl) cyEl.style.top = '106px';

    var html = '<span data-action="collapse-all">Graph</span>';
    breadcrumbPath.forEach(function(id, i) {
      var node = cy.getElementById(id);
      var label = node.length ? node.data('label') : id;
      var isLast = (i === breadcrumbPath.length - 1);
      html += '<span class="bc-sep">&rsaquo;</span>';
      if (isLast) {
        html += '<span class="bc-current">' + escapeHtml(label) + '</span>';
      } else {
        html += '<span data-action="collapse-to" data-module="' + escapeHtml(id) + '">' + escapeHtml(label) + '</span>';
      }
    });
    el.innerHTML = html;
  }

  // --- PF-2: Watch toggle ---
  function toggleWatch(graphUrl) {
    watching = !watching;
    var btn = document.getElementById('btn-watch');
    if (btn) btn.className = watching ? 'toggle-on' : 'toggle-off';

    if (watching) {
      GraphViewer.watchGraph(graphUrl, function() {
        GraphViewer.reloadGraph('cy', 'legend', graphUrl).then(function(result) {
          if (result) {
            _cy = result.cy;
            _manager = result.manager;
            _moduleIds = result.moduleIds;
            if (typeof Minimap !== 'undefined') Minimap.setCy(_cy);
            breadcrumbPath = [];
            renderBreadcrumb(_cy);
            updateStatus(_manager, _moduleIds);
          }
        });
      });
    } else {
      GraphViewer.stopWatch();
    }
  }

  // --- PF-3: Minimap toggle ---
  function toggleMinimap() {
    if (typeof Minimap === 'undefined') return;
    var vis = Minimap.toggle();
    var btn = document.getElementById('btn-minimap');
    if (btn) btn.className = vis ? 'toggle-on' : 'toggle-off';
  }

  return { init: init, updateStatus: updateStatus };
})();
