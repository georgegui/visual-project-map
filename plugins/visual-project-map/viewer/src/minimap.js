var Minimap = (function() {
  var canvas, ctx, cy;
  var PADDING = 10;
  var visible = true;

  function init(canvasId, cyInstance) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    cy = cyInstance;

    cy.on('viewport', debounce(draw, 80));
    cy.on('layoutstop', draw);
    cy.on('add remove', debounce(draw, 200));

    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      navigateTo(e.clientX - rect.left, e.clientY - rect.top);
    });

    draw();
  }

  function draw() {
    if (!cy || !ctx || !visible) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var visibleEles = cy.elements(':visible');
    if (visibleEles.length === 0) return;
    var bb = visibleEles.boundingBox();
    if (bb.w === 0 || bb.h === 0) return;

    var scaleX = (w - 2 * PADDING) / bb.w;
    var scaleY = (h - 2 * PADDING) / bb.h;
    var scale = Math.min(scaleX, scaleY);
    var offsetX = PADDING + ((w - 2 * PADDING) - bb.w * scale) / 2;
    var offsetY = PADDING + ((h - 2 * PADDING) - bb.h * scale) / 2;

    // Draw edges
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

    // Draw nodes
    cy.nodes(':visible').forEach(function(n) {
      var pos = n.position();
      var x = (pos.x - bb.x1) * scale + offsetX;
      var y = (pos.y - bb.y1) * scale + offsetY;
      var isMod = n.data('_isModule');
      var nw = isMod ? 8 : 4;
      var nh = isMod ? 6 : 3;
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
    var visibleEles = cy.elements(':visible');
    if (visibleEles.length === 0) return;
    var bb = visibleEles.boundingBox();
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

  function toggle() {
    visible = !visible;
    if (canvas) canvas.style.display = visible ? 'block' : 'none';
    if (visible) draw();
    return visible;
  }

  function isVisible() { return visible; }

  function setCy(cyInstance) {
    cy = cyInstance;
    if (cy) {
      cy.on('viewport', debounce(draw, 80));
      cy.on('layoutstop', draw);
      cy.on('add remove', debounce(draw, 200));
    }
    draw();
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  return { init: init, draw: draw, toggle: toggle, isVisible: isVisible, setCy: setCy };
})();
