/**
 * GraphDiff — Compare two graph JSONs and produce diff annotations.
 *
 * Usage:
 *   var diff = GraphDiff.compare(oldGraph, newGraph);
 *   // diff = { modules: {id: status}, nodes: {id: status}, edges: {key: status}, summary: {...} }
 *
 *   GraphDiff.applyOverlay(cy, diff);   // color nodes/edges by diff status
 *   GraphDiff.clearOverlay(cy);         // remove diff styling
 */
var GraphDiff = (function() {

  /**
   * Compare two graph JSON objects.
   * Returns a diff object with added/removed/modified/unchanged for each element type.
   */
  function compare(oldGraph, newGraph) {
    var result = {
      modules: {},
      nodes: {},
      edges: {},
      summary: { added: 0, removed: 0, modified: 0, unchanged: 0 }
    };

    // --- Modules ---
    var oldMods = indexById(oldGraph.modules || []);
    var newMods = indexById(newGraph.modules || []);

    Object.keys(newMods).forEach(function(id) {
      if (!oldMods[id]) {
        result.modules[id] = { status: 'added', description: 'New module' };
        result.summary.added++;
      } else if (moduleChanged(oldMods[id], newMods[id])) {
        result.modules[id] = { status: 'modified', description: describeModuleChange(oldMods[id], newMods[id]) };
        result.summary.modified++;
      } else {
        result.modules[id] = { status: 'unchanged' };
        result.summary.unchanged++;
      }
    });
    Object.keys(oldMods).forEach(function(id) {
      if (!newMods[id]) {
        result.modules[id] = { status: 'removed', description: 'Module removed' };
        result.summary.removed++;
      }
    });

    // --- Nodes ---
    var oldNodes = indexById(oldGraph.nodes || []);
    var newNodes = indexById(newGraph.nodes || []);

    Object.keys(newNodes).forEach(function(id) {
      if (!oldNodes[id]) {
        result.nodes[id] = { status: 'added', description: 'New node' };
        result.summary.added++;
      } else if (nodeChanged(oldNodes[id], newNodes[id])) {
        result.nodes[id] = { status: 'modified', description: describeNodeChange(oldNodes[id], newNodes[id]) };
        result.summary.modified++;
      } else {
        result.nodes[id] = { status: 'unchanged' };
        result.summary.unchanged++;
      }
    });
    Object.keys(oldNodes).forEach(function(id) {
      if (!newNodes[id]) {
        result.nodes[id] = { status: 'removed', description: 'Node removed' };
        result.summary.removed++;
      }
    });

    // --- Edges ---
    var oldEdges = indexEdges(oldGraph.edges || []);
    var newEdges = indexEdges(newGraph.edges || []);

    Object.keys(newEdges).forEach(function(key) {
      if (!oldEdges[key]) {
        result.edges[key] = { status: 'added', description: 'New edge' };
        result.summary.added++;
      } else if (edgeChanged(oldEdges[key], newEdges[key])) {
        result.edges[key] = { status: 'modified', description: describeEdgeChange(oldEdges[key], newEdges[key]) };
        result.summary.modified++;
      } else {
        result.edges[key] = { status: 'unchanged' };
        result.summary.unchanged++;
      }
    });
    Object.keys(oldEdges).forEach(function(key) {
      if (!newEdges[key]) {
        result.edges[key] = { status: 'removed', description: 'Edge removed' };
        result.summary.removed++;
      }
    });

    return result;
  }

  /**
   * Apply diff overlay styling to the Cytoscape instance.
   * Uses the same CSS classes as the plan overlay for visual consistency:
   * added=green glow, modified=amber, removed=red+dashed, unchanged=dimmed
   */
  function applyOverlay(cy, diff) {
    clearOverlay(cy);

    // Nodes (including modules)
    cy.nodes().forEach(function(n) {
      var id = n.id();
      var entry = diff.nodes[id] || diff.modules[id];
      if (!entry) { n.addClass('diff-unchanged'); return; }

      switch (entry.status) {
        case 'added':    n.addClass('diff-added'); break;
        case 'modified': n.addClass('diff-modified'); break;
        case 'removed':  n.addClass('diff-removed'); break;
        default:         n.addClass('diff-unchanged');
      }
    });

    // Edges
    cy.edges().forEach(function(e) {
      var key = e.data('source') + '->' + e.data('target');
      var entry = diff.edges[key];
      if (!entry) { e.addClass('diff-unchanged'); return; }

      switch (entry.status) {
        case 'added':    e.addClass('diff-added'); break;
        case 'modified': e.addClass('diff-modified'); break;
        case 'removed':  e.addClass('diff-removed'); break;
        default:         e.addClass('diff-unchanged');
      }
    });
  }

  function clearOverlay(cy) {
    cy.elements().removeClass('diff-added diff-modified diff-removed diff-unchanged');
  }

  // --- Helpers ---

  function indexById(arr) {
    var map = {};
    arr.forEach(function(item) { if (item.id) map[item.id] = item; });
    return map;
  }

  function indexEdges(arr) {
    var map = {};
    arr.forEach(function(e) {
      var key = e.source + '->' + e.target;
      map[key] = e;
    });
    return map;
  }

  function moduleChanged(a, b) {
    return a.label !== b.label || a.color !== b.color || a.borderColor !== b.borderColor || a.parent !== b.parent;
  }

  function nodeChanged(a, b) {
    if (a.label !== b.label || a.module !== b.module) return true;
    var as = a.style || {}, bs = b.style || {};
    return as.shape !== bs.shape || as.trust !== bs.trust || as.color !== bs.color || as.borderColor !== bs.borderColor;
  }

  function edgeChanged(a, b) {
    return a.label !== b.label || a.style !== b.style || a.actor !== b.actor;
  }

  function describeModuleChange(a, b) {
    var changes = [];
    if (a.label !== b.label) changes.push('label: "' + a.label + '" \u2192 "' + b.label + '"');
    if (a.color !== b.color) changes.push('color changed');
    if (a.parent !== b.parent) changes.push('parent: "' + (a.parent || 'none') + '" \u2192 "' + (b.parent || 'none') + '"');
    return changes.join(', ') || 'changed';
  }

  function describeNodeChange(a, b) {
    var changes = [];
    if (a.label !== b.label) changes.push('label: "' + a.label + '" \u2192 "' + b.label + '"');
    if (a.module !== b.module) changes.push('moved to module "' + b.module + '"');
    var as = a.style || {}, bs = b.style || {};
    if (as.shape !== bs.shape) changes.push('shape changed');
    if (as.trust !== bs.trust) changes.push('trust changed');
    return changes.join(', ') || 'changed';
  }

  function describeEdgeChange(a, b) {
    var changes = [];
    if (a.label !== b.label) changes.push('label: "' + (a.label || '') + '" \u2192 "' + (b.label || '') + '"');
    if (a.style !== b.style) changes.push('style: ' + (a.style || 'solid') + ' \u2192 ' + (b.style || 'solid'));
    if (a.actor !== b.actor) changes.push('actor: ' + (a.actor || 'none') + ' \u2192 ' + (b.actor || 'none'));
    return changes.join(', ') || 'changed';
  }

  return {
    compare: compare,
    applyOverlay: applyOverlay,
    clearOverlay: clearOverlay
  };
})();
