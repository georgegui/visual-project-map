var PlanOverlay = (function() {

  var planClasses = ['plan-add', 'plan-modify', 'plan-remove', 'plan-unchanged'];
  var activeTaskNodeIds = null;

  function hasPlan(graphData) {
    return !!(graphData && graphData.plan && graphData.plan.annotations);
  }

  function apply(cy, graphData) {
    if (!hasPlan(graphData)) return;
    var ann = graphData.plan.annotations;
    var nodeAnn = ann.nodes || {};
    var edgeAnn = ann.edges || {};
    var modAnn = ann.modules || {};
    var moduleCounts = getModuleCounts(graphData);

    cy.nodes().forEach(function(n) {
      if (n.data('_isModule')) {
        var ma = modAnn[n.id()];
        var mc = moduleCounts[n.id()];
        var hasAnnotatedChildren = mc && (mc.add + mc.modify + mc.remove > 0);

        if (ma) {
          n.addClass('plan-' + ma.status);
        } else if (hasAnnotatedChildren) {
          n.addClass('plan-modify');
        } else {
          n.addClass('plan-unchanged');
        }

        if (hasAnnotatedChildren) {
          var badge = formatBadge(mc);
          n.data('_planBadge', badge);
          var mgr = GraphViewer.getManager();
          if (mgr && mgr.isCollapsed(n.id())) {
            n.data('_origLabel', n.data('_origLabel') || n.data('label'));
            n.data('label', n.data('_origLabel') + '\n' + badge);
          }
        }
      } else {
        var na = nodeAnn[n.id()];
        if (na) {
          n.addClass('plan-' + na.status);
        } else {
          n.addClass('plan-unchanged');
        }
      }
    });

    cy.edges().forEach(function(e) {
      var key = e.data('source') + '->' + e.data('target');
      var ea = edgeAnn[key];
      if (ea) {
        e.addClass('plan-' + ea.status);
      } else {
        e.addClass('plan-unchanged');
      }
    });
  }

  function clear(cy) {
    cy.elements().removeClass(planClasses.join(' ') + ' plan-task-highlight plan-task-dim');
    cy.nodes().forEach(function(n) {
      var orig = n.data('_origLabel');
      if (orig) {
        n.data('label', orig);
        n.removeData('_origLabel');
        n.removeData('_planBadge');
      }
    });
    activeTaskNodeIds = null;
  }

  function getModuleCounts(graphData) {
    if (!hasPlan(graphData)) return {};
    var nodeAnn = graphData.plan.annotations.nodes || {};
    var counts = {};

    graphData.nodes.forEach(function(n) {
      var ann = nodeAnn[n.id];
      if (!ann) return;
      var mod = n.module;
      if (!counts[mod]) counts[mod] = { add: 0, modify: 0, remove: 0 };
      counts[mod][ann.status]++;
    });

    // Propagate child module counts to parent phases
    graphData.modules.forEach(function(m) {
      if (m.parent && counts[m.id]) {
        if (!counts[m.parent]) counts[m.parent] = { add: 0, modify: 0, remove: 0 };
        counts[m.parent].add += counts[m.id].add;
        counts[m.parent].modify += counts[m.id].modify;
        counts[m.parent].remove += counts[m.id].remove;
      }
    });

    // Also count module-level annotations
    var modAnn = graphData.plan.annotations.modules || {};
    Object.keys(modAnn).forEach(function(modId) {
      if (!counts[modId]) counts[modId] = { add: 0, modify: 0, remove: 0 };
    });

    return counts;
  }

  function formatBadge(counts) {
    var parts = [];
    if (counts.add > 0) parts.push('+' + counts.add);
    if (counts.modify > 0) parts.push('~' + counts.modify);
    if (counts.remove > 0) parts.push('-' + counts.remove);
    return parts.join(' ');
  }

  function highlightTaskNodes(cy, nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return;
    activeTaskNodeIds = nodeIds;
    cy.elements().removeClass('plan-task-highlight plan-task-dim');
    var matchSet = new Set(nodeIds);
    cy.nodes().forEach(function(n) {
      if (n.data('_isModule')) return;
      if (matchSet.has(n.id())) {
        n.addClass('plan-task-highlight');
      } else {
        n.addClass('plan-task-dim');
      }
    });
  }

  function clearTaskHighlight(cy) {
    activeTaskNodeIds = null;
    cy.elements().removeClass('plan-task-highlight plan-task-dim');
  }

  function getAnnotation(graphData, type, id) {
    if (!hasPlan(graphData) || !graphData.plan.annotations) return null;
    var section = graphData.plan.annotations[type];
    if (!section) return null;
    return section[id] || null;
  }

  return {
    hasPlan: hasPlan,
    apply: apply,
    clear: clear,
    getModuleCounts: getModuleCounts,
    formatBadge: formatBadge,
    highlightTaskNodes: highlightTaskNodes,
    clearTaskHighlight: clearTaskHighlight,
    getAnnotation: getAnnotation
  };
})();
