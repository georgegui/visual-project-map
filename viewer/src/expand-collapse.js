class CollapseManager {
  constructor(cy) {
    this.cy = cy;
    this.collapsed = new Set();
    this.storedNodes = new Map();
    this.nodeParent = {};
    this.originalEdges = [];

    var self = this;
    cy.nodes().forEach(function(n) {
      var parent = n.data('parent');
      if (parent) self.nodeParent[n.id()] = parent;
    });

    cy.edges().forEach(function(e) {
      var entry = {
        id: e.id(),
        source: e.source().id(),
        target: e.target().id(),
        label: e.data('label') || '',
        lineStyle: e.data('lineStyle') || 'solid'
      };
      if (e.data('actor')) entry.actor = e.data('actor');
      if (e.data('details')) entry.details = e.data('details');
      self.originalEdges.push(entry);
    });
  }

  _resolveNode(nodeId) {
    var current = nodeId;
    var resolved = nodeId;
    while (true) {
      var parent = this.nodeParent[current];
      if (!parent) break;
      if (this.collapsed.has(parent)) resolved = parent;
      current = parent;
    }
    return resolved;
  }

  _depth(nodeId) {
    var d = 0;
    var current = nodeId;
    while (this.nodeParent[current]) {
      d++;
      current = this.nodeParent[current];
    }
    return d;
  }

  _rebuildEdges() {
    var cy = this.cy;
    cy.edges().remove();

    var metaMap = {};
    var realEdges = [];
    var self = this;

    this.originalEdges.forEach(function(e) {
      var src = self._resolveNode(e.source);
      var tgt = self._resolveNode(e.target);
      if (src === tgt) return;

      if (src !== e.source || tgt !== e.target) {
        var key = src + '|' + tgt;
        if (!metaMap[key]) metaMap[key] = { source: src, target: tgt, labels: [], lineStyle: 'solid', actors: [] };
        if (e.label && metaMap[key].labels.indexOf(e.label) === -1) metaMap[key].labels.push(e.label);
        if (e.lineStyle === 'dashed') metaMap[key].lineStyle = 'dashed';
        if (e.actor && metaMap[key].actors.indexOf(e.actor) === -1) metaMap[key].actors.push(e.actor);
      } else {
        var d = { id: e.id, source: e.source, target: e.target, label: e.label, lineStyle: e.lineStyle };
        if (e.actor) d.actor = e.actor;
        if (e.details) d.details = e.details;
        realEdges.push({ group: 'edges', data: d });
      }
    });

    var metaEdges = [];
    Object.keys(metaMap).forEach(function(key) {
      var g = metaMap[key];
      var labels = g.labels;
      var combined = labels.length === 0 ? '' :
                     labels.length <= 2 ? labels.join(' / ') :
                     labels[0] + ' +' + (labels.length - 1);
      var d = {
        id: '_meta_' + key.replace('|', '_'),
        source: g.source, target: g.target,
        label: combined, lineStyle: g.lineStyle, _metaEdge: true
      };
      if (g.actors.length === 1) d.actor = g.actors[0];
      else if (g.actors.length > 1) d.actor = 'mixed';
      metaEdges.push({ group: 'edges', data: d });
    });

    cy.add(realEdges.concat(metaEdges));
  }

  collapse(moduleId) {
    if (this.collapsed.has(moduleId)) return;
    var module = this.cy.getElementById(moduleId);
    if (!module.length) return;
    var descendants = module.descendants();
    if (descendants.length === 0) return;
    this.storedNodes.set(moduleId, descendants.remove());
    this.collapsed.add(moduleId);
    this._rebuildEdges();
  }

  expand(moduleId) {
    if (!this.collapsed.has(moduleId)) return;
    var stored = this.storedNodes.get(moduleId);
    if (!stored) return;
    this.cy.add(stored.filter('node'));
    this.storedNodes.delete(moduleId);
    this.collapsed.delete(moduleId);
    this._rebuildEdges();
  }

  toggle(moduleId) {
    if (this.collapsed.has(moduleId)) this.expand(moduleId);
    else this.collapse(moduleId);
  }

  collapseAll(moduleIds) {
    var cy = this.cy;
    var self = this;
    var sorted = moduleIds.slice().sort(function(a, b) {
      return self._depth(b) - self._depth(a);
    });
    sorted.forEach(function(id) {
      if (self.collapsed.has(id)) return;
      var module = cy.getElementById(id);
      if (!module.length) return;
      var descendants = module.descendants();
      if (descendants.length === 0) return;
      self.storedNodes.set(id, descendants.remove());
      self.collapsed.add(id);
    });
    this._rebuildEdges();
  }

  expandAll() {
    var cy = this.cy;
    var self = this;
    var sortedIds = Array.from(this.storedNodes.keys()).sort(function(a, b) {
      return self._depth(a) - self._depth(b);
    });
    sortedIds.forEach(function(id) {
      var stored = self.storedNodes.get(id);
      if (stored) cy.add(stored.filter('node'));
    });
    this.storedNodes.clear();
    this.collapsed.clear();
    this._rebuildEdges();
  }

  isCollapsed(moduleId) {
    return this.collapsed.has(moduleId);
  }

  getState() {
    return {
      collapsed: Array.from(this.collapsed),
      expandedCount: this.cy.nodes('[_isModule]').length - this.collapsed.size,
      collapsedCount: this.collapsed.size
    };
  }
}
