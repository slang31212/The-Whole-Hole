/* =========================================================
   SoCal Fishing — Private Boat Operations
   Chartplotter dashboard. Pure vanilla JS + Canvas.
   No external tiles or libraries: the marine chart, SST /
   chlorophyll fields, contours and overlays are all rendered
   from the dataset so the page works fully offline.
   ========================================================= */
(function () {
  "use strict";

  var D = window.SF_DATA;
  var B = D.BOUNDS;

  /* ---------------- app state ---------------- */
  var state = {
    base: "sst", // chart | satellite | sst | chlorophyll
    overlays: { currents: false, wind: false, baitlogs: false, catches: true },
    view: {
      cx: (B.lonMin + B.lonMax) / 2,
      cy: (B.latMin + B.latMax) / 2,
      zoom: 1
    },
    boatIdx: 2,
    speed: 24,
    hrs: 6,
    fuelPrice: 4.15
  };

  /* ---------------- tiny helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Great-circle distance in nautical miles.
  function distNm(lon1, lat1, lon2, lat2) {
    var R = 3440.065; // nm
    var p = Math.PI / 180;
    var dlat = (lat2 - lat1) * p, dlon = (lon2 - lon1) * p;
    var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  // Initial bearing lon1/lat1 -> lon2/lat2, compass degrees.
  function bearing(lon1, lat1, lon2, lat2) {
    var p = Math.PI / 180;
    var y = Math.sin((lon2 - lon1) * p) * Math.cos(lat2 * p);
    var x = Math.cos(lat1 * p) * Math.sin(lat2 * p) -
      Math.sin(lat1 * p) * Math.cos(lat2 * p) * Math.cos((lon2 - lon1) * p);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function compass(deg) {
    var dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  /* ============================================================
     SST / CHLOROPHYLL FIELD
     A smooth analytic field so contours + fill always agree.
     ============================================================ */
  function sstAt(lon, lat) {
    var nx = (lon - B.lonMin) / (B.lonMax - B.lonMin); // 0 west .. 1 east
    var ny = (lat - B.latMin) / (B.latMax - B.latMin); // 0 south .. 1 north
    // Warmer to the south-east (offshore), cooler NW / inshore upwelling.
    var t = 62 + (0.52 * nx + 0.48 * (1 - ny)) * 12;
    // Warm productive eddy centred on the recommended zone.
    var z = D.recommendedZone;
    var dz = Math.hypot((lon - z.lon) * 0.9, (lat - z.lat));
    t += 1.9 * Math.exp(-(dz * dz) / (2 * 0.10 * 0.10));
    // Cool upwelling pocket off Catalina's east end.
    var dc = Math.hypot((lon + 118.33) * 0.9, (lat - 33.36));
    t -= 1.6 * Math.exp(-(dc * dc) / (2 * 0.13 * 0.13));
    // Gentle organic ripple.
    t += 0.6 * Math.sin(lon * 26 + lat * 7) * Math.cos(lat * 22 - lon * 5);
    return t;
  }
  // Chlorophyll: high near the cool upwelling / inshore, low in the warm blue offshore.
  function chlAt(lon, lat) {
    var t = sstAt(lon, lat);
    var ny = (lat - B.latMin) / (B.latMax - B.latMin);
    var v = clamp((70.5 - t) / 8, 0, 1) * 0.7 + ny * 0.3;
    // inshore boost near the coast line
    return clamp(v, 0, 1);
  }

  /* ---------------- colour ramps ---------------- */
  function rampColor(stops, t) {
    t = clamp(t, 0, 1);
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i];
        var f = (t - a[0]) / (b[0] - a[0] || 1);
        return [
          Math.round(lerp(a[1][0], b[1][0], f)),
          Math.round(lerp(a[1][1], b[1][1], f)),
          Math.round(lerp(a[1][2], b[1][2], f))
        ];
      }
    }
    return stops[stops.length - 1][1];
  }
  var SST_STOPS = [
    [0.00, [31, 74, 150]], [0.18, [40, 108, 200]], [0.36, [24, 168, 196]],
    [0.52, [58, 190, 110]], [0.66, [200, 214, 70]], [0.80, [240, 150, 45]],
    [1.00, [214, 55, 40]]
  ];
  var CHL_STOPS = [
    [0.00, [14, 42, 92]], [0.30, [20, 92, 150]], [0.55, [22, 150, 150]],
    [0.78, [70, 180, 70]], [1.00, [190, 220, 40]]
  ];
  function sstColor(t) { return rampColor(SST_STOPS, (t - 62) / 12); }

  /* ============================================================
     PROJECTION
     Equirectangular fit of BOUNDS into the canvas, scaled by zoom
     and centred on the current view.
     ============================================================ */
  var Tx = null;
  function computeTx(W, H) {
    var midLat = (B.latMin + B.latMax) / 2;
    var kx = Math.cos(midLat * Math.PI / 180);
    var spanX = (B.lonMax - B.lonMin) * kx;
    var spanY = (B.latMax - B.latMin);
    var base = Math.min(W / spanX, H / spanY);
    var scale = base * state.view.zoom;
    Tx = {
      kx: kx, scale: scale, W: W, H: H,
      cux: state.view.cx * kx, cuy: -state.view.cy
    };
  }
  function project(lon, lat) {
    return {
      x: Tx.W / 2 + (lon * Tx.kx - Tx.cux) * Tx.scale,
      y: Tx.H / 2 + (-lat - Tx.cuy) * Tx.scale
    };
  }
  function unproject(x, y) {
    return {
      lon: (Tx.cux + (x - Tx.W / 2) / Tx.scale) / Tx.kx,
      lat: -(Tx.cuy + (y - Tx.H / 2) / Tx.scale)
    };
  }

  /* ============================================================
     MAP RENDERING
     ============================================================ */
  var canvas, ctx, dpr = 1, cssW = 0, cssH = 0;
  var fieldCache = { key: "", canvas: null };

  function landPolys() {
    var coast = D.mainlandCoast.slice();
    var main = coast.concat([
      { lon: B.lonMax, lat: B.latMin },
      { lon: B.lonMax, lat: B.latMax },
      { lon: B.lonMin, lat: B.latMax }
    ]);
    return { main: main, island: D.catalina };
  }

  function pathPoly(c, pts) {
    c.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = project(pts[i].lon, pts[i].lat);
      if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    c.closePath();
  }

  // Render base water field into an offscreen canvas (cached by view/base/size).
  function renderField() {
    var key = [state.base, state.view.zoom.toFixed(3),
      state.view.cx.toFixed(4), state.view.cy.toFixed(4),
      Math.round(cssW), Math.round(cssH)].join("|");
    if (fieldCache.key === key && fieldCache.canvas) return fieldCache.canvas;

    var off = fieldCache.canvas || document.createElement("canvas");
    off.width = Math.round(cssW * dpr);
    off.height = Math.round(cssH * dpr);
    var c = off.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    var isSat = state.base === "satellite";
    var isChart = state.base === "chart";
    var isChl = state.base === "chlorophyll";

    // ocean base
    c.fillStyle = isChart ? "#dcecf6" : isSat ? "#06182c" : "#0a2036";
    c.fillRect(0, 0, cssW, cssH);

    var step = 4;
    for (var y = 0; y < cssH; y += step) {
      for (var x = 0; x < cssW; x += step) {
        var g = unproject(x + step / 2, y + step / 2);
        var col, alpha = 1;
        if (isChl) {
          col = rampColor(CHL_STOPS, chlAt(g.lon, g.lat));
        } else if (isSat) {
          // subtle SST-tinted dark satellite water
          var s = sstColor(sstAt(g.lon, g.lat));
          col = [Math.round(s[0] * 0.32 + 6), Math.round(s[1] * 0.34 + 14), Math.round(s[2] * 0.36 + 24)];
        } else if (isChart) {
          // pale depth shading from the field
          var d = clamp((sstAt(g.lon, g.lat) - 62) / 12, 0, 1);
          col = [Math.round(lerp(196, 236, 1 - d)), Math.round(lerp(222, 244, 1 - d)), Math.round(lerp(240, 252, 1 - d))];
        } else {
          col = sstColor(sstAt(g.lon, g.lat));
        }
        c.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + alpha + ")";
        c.fillRect(x, y, step + 1, step + 1);
      }
    }

    // contour iso-lines
    drawContours(c, isChart);

    // land
    var L = landPolys();
    c.lineJoin = "round";
    [L.main, L.island].forEach(function (poly) {
      pathPoly(c, poly);
      if (isChart) {
        c.fillStyle = "#e9e4d3";
        c.fill();
        c.strokeStyle = "#b9b08c"; c.lineWidth = 1; c.stroke();
      } else {
        c.fillStyle = "#141f0f"; c.fill();
        c.strokeStyle = "rgba(150,180,120,.30)"; c.lineWidth = 1; c.stroke();
      }
    });
    // satellite land texture (terrain + urban patches near the coast)
    if (!isChart) {
      c.save();
      pathPoly(c, L.main); c.clip();
      for (var i = 0; i < 900; i++) {
        var rx = Math.random() * cssW, ry = Math.random() * cssH;
        var r = Math.random();
        c.globalAlpha = 0.05 + Math.random() * 0.10;
        c.fillStyle = r > 0.72 ? "#5b5238" /*urban tan*/ : r > 0.4 ? "#2e3b1e" /*brush*/ : "#1d2a13" /*dark*/;
        var s = 2 + Math.random() * 4;
        c.fillRect(rx, ry, s, s);
      }
      c.restore();
      c.globalAlpha = 1;
    }

    fieldCache.key = key;
    fieldCache.canvas = off;
    return off;
  }

  // Marching squares contours over the current field.
  function drawContours(c, isChart) {
    var fn = state.base === "chlorophyll"
      ? function (lo, la) { return chlAt(lo, la) * 12 + 60; }
      : sstAt;
    var step = 12;
    var cols = Math.ceil(cssW / step) + 1, rows = Math.ceil(cssH / step) + 1;
    var grid = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var g = unproject(i * step, j * step);
        grid[j * cols + i] = fn(g.lon, g.lat);
      }
    }
    // Half-degree iso-lines; whole degrees drawn a touch stronger.
    for (var iso = 62.5; iso <= 73.5; iso += 0.5) {
      var whole = Math.abs(iso - Math.round(iso)) < 0.01;
      c.lineWidth = isChart ? (whole ? 0.9 : 0.55) : (whole ? 1.0 : 0.6);
      c.strokeStyle = isChart
        ? (whole ? "rgba(80,110,140,.60)" : "rgba(90,120,150,.30)")
        : (whole ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.16)");
      c.beginPath();
      for (var jj = 0; jj < rows - 1; jj++) {
        for (var ii = 0; ii < cols - 1; ii++) {
          var x0 = ii * step, y0 = jj * step;
          var tl = grid[jj * cols + ii], tr = grid[jj * cols + ii + 1];
          var bl = grid[(jj + 1) * cols + ii], br = grid[(jj + 1) * cols + ii + 1];
          var cse = (tl > iso ? 8 : 0) | (tr > iso ? 4 : 0) | (br > iso ? 2 : 0) | (bl > iso ? 1 : 0);
          if (cse === 0 || cse === 15) continue;
          var a = (iso - tl) / (tr - tl), b = (iso - tr) / (br - tr);
          var d = (iso - bl) / (br - bl), e = (iso - tl) / (bl - tl);
          var T = { x: x0 + step * a, y: y0 };
          var R = { x: x0 + step, y: y0 + step * b };
          var Bt = { x: x0 + step * d, y: y0 + step };
          var Lt = { x: x0, y: y0 + step * e };
          var seg = [];
          switch (cse) {
            case 1: case 14: seg = [Lt, Bt]; break;
            case 2: case 13: seg = [Bt, R]; break;
            case 3: case 12: seg = [Lt, R]; break;
            case 4: case 11: seg = [T, R]; break;
            case 5: seg = [Lt, T, Bt, R]; break;
            case 6: case 9: seg = [T, Bt]; break;
            case 7: case 8: seg = [Lt, T]; break;
            case 10: seg = [T, R, Lt, Bt]; break;
          }
          for (var s = 0; s < seg.length; s += 2) {
            c.moveTo(seg[s].x, seg[s].y); c.lineTo(seg[s + 1].x, seg[s + 1].y);
          }
        }
      }
      c.stroke();
    }
  }

  /* ---------------- overlay drawing (on the live canvas) ---------------- */
  function drawLabels() {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    // place-name labels
    ctx.font = "700 12px Inter, system-ui, sans-serif";
    var places = D.harbors.map(function (h) { return { lon: h.lon, lat: h.lat, txt: h.label }; });
    places.push({ lon: -118.42, lat: 33.37, txt: "CATALINA ISLAND" });
    places.forEach(function (p) {
      var q = project(p.lon, p.lat);
      if (q.x < -40 || q.x > cssW + 40) return;
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillText(p.txt, q.x + 9, q.y + 1);
      ctx.fillStyle = "#fff";
      ctx.fillText(p.txt, q.x + 8, q.y);
    });
    // temperature labels sampled from the field (SST base only)
    if (state.base === "sst") {
      var pts = [
        [-118.36, 33.82], [-118.20, 33.86], [-118.02, 33.80],
        [-118.50, 33.62], [-118.30, 33.55], [-118.12, 33.55],
        [-118.36, 33.44], [-118.14, 33.40], [-117.86, 33.42],
        [-118.40, 33.24], [-118.02, 33.24], [-117.72, 33.28]
      ];
      ctx.font = "700 12px Inter, system-ui, sans-serif";
      var z = D.recommendedZone;
      pts.forEach(function (p) {
        var q = project(p[0], p[1]);
        if (q.x < 10 || q.x > cssW - 10 || q.y < 10 || q.y > cssH - 10) return;
        // keep clear of the recommended-zone label/circle
        if (Math.hypot(p[0] - z.lon, p[1] - z.lat) < 0.17) return;
        var v = Math.round(sstAt(p[0], p[1]));
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillText(v + "°", q.x + 1, q.y + 1);
        ctx.fillStyle = "rgba(255,255,255,.92)";
        ctx.fillText(v + "°", q.x, q.y);
      });
    }
  }

  function drawZone() {
    var z = D.recommendedZone;
    var q = project(z.lon, z.lat);
    var rpx = z.radiusNm * (Tx.scale / 60);
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.beginPath();
    ctx.arc(q.x, q.y, rpx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // crosshair
    ctx.beginPath();
    ctx.moveTo(q.x - 10, q.y); ctx.lineTo(q.x + 10, q.y);
    ctx.moveTo(q.x, q.y - 10); ctx.lineTo(q.x, q.y + 10);
    ctx.stroke();
    // labels (lifted clear of the circle + markers, with a dark halo)
    var off = Math.max(rpx, 14);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(3,12,22,.95)";
    ctx.shadowBlur = 6;
    ctx.font = "800 15px Inter, system-ui, sans-serif";
    ctx.fillText(z.tempLabel, q.x, q.y - off - 22);
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    ctx.fillText(z.subLabel, q.x, q.y - off - 7);
    ctx.restore();
    ctx.textAlign = "left";
  }

  function drawCatches() {
    if (!state.overlays.catches) return;
    D.catches.forEach(function (m) {
      var q = project(m.lon, m.lat);
      drawFish(q.x, q.y, "#3aa0ff");
    });
  }
  function drawFish(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3.4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, 0); ctx.lineTo(12, -3.5); ctx.lineTo(12, 3.5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-4, -0.6, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = "#04223d"; ctx.fill();
    ctx.restore();
  }

  function drawHarbors() {
    D.harbors.forEach(function (h) {
      var q = project(h.lon, h.lat);
      ctx.save();
      ctx.fillStyle = "#1e78d6";
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "800 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⚓", q.x, q.y + 0.5);
      ctx.restore();
      ctx.textAlign = "left";
    });
  }

  function drawBaitLogs() {
    if (!state.overlays.baitlogs) return;
    D.bait.forEach(function (b) {
      var q = project(b.lon, b.lat);
      ctx.save();
      ctx.strokeStyle = b.status === "GOOD" ? "#39d353" : "#e8c33a";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "rgba(6,30,50,.7)";
      ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "700 10px Inter, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("B", q.x, q.y + 0.5);
      ctx.restore();
      ctx.textAlign = "left";
    });
  }

  function drawCurrents() {
    if (!state.overlays.currents) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1.4;
    var stepPx = 58;
    for (var y = 40; y < cssH - 20; y += stepPx) {
      for (var x = 40; x < cssW - 20; x += stepPx) {
        var g = unproject(x, y);
        // skip over land (rough: NE of coast)
        if (overLand(g.lon, g.lat)) continue;
        var t = sstAt(g.lon, g.lat);
        // flow roughly along iso-temp toward warm eddy (counter-clockwise-ish)
        var ang = Math.atan2(g.lat - D.recommendedZone.lat, (g.lon - D.recommendedZone.lon)) + Math.PI / 2;
        var len = 14;
        var dx = Math.cos(ang) * len, dy = -Math.sin(ang) * len;
        arrow(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2);
      }
    }
    ctx.restore();
  }
  function drawWind() {
    if (!state.overlays.wind) return;
    ctx.save();
    ctx.strokeStyle = "rgba(120,220,255,.7)";
    ctx.fillStyle = "rgba(120,220,255,.7)";
    ctx.lineWidth = 1.6;
    var stepPx = 66;
    // wind from NW (dir the mock shows)
    var ang = Math.atan2(-1, 1); // toward SE
    for (var y = 26; y < cssH - 14; y += stepPx) {
      for (var x = 26; x < cssW - 14; x += stepPx) {
        var g = unproject(x, y);
        if (overLand(g.lon, g.lat)) continue;
        var dx = Math.cos(ang) * 16, dy = Math.sin(ang) * 16;
        arrow(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2);
      }
    }
    ctx.restore();
  }
  function arrow(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.lineTo(x2 - 5 * Math.cos(a - 0.4), y2 - 5 * Math.sin(a - 0.4));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 5 * Math.cos(a + 0.4), y2 - 5 * Math.sin(a + 0.4));
    ctx.stroke();
  }
  // rough land test: point is NE of the coastline chain
  function overLand(lon, lat) {
    var c = D.mainlandCoast;
    for (var i = 0; i < c.length - 1; i++) {
      if (lon >= c[i].lon && lon <= c[i + 1].lon) {
        var f = (lon - c[i].lon) / ((c[i + 1].lon - c[i].lon) || 1);
        var coastLat = lerp(c[i].lat, c[i + 1].lat, f);
        return lat > coastLat;
      }
    }
    return false;
  }

  function drawScaleBar() {
    var pxPerNm = Tx.scale / 60;
    // choose a nice max nm near 130px
    var targets = [2, 5, 10, 15, 20, 30, 50];
    var maxNm = 15;
    for (var i = targets.length - 1; i >= 0; i--) {
      if (targets[i] * pxPerNm <= 150) { maxNm = targets[i]; break; }
    }
    var w = maxNm * pxPerNm;
    var x0 = cssW - w - 26, y0 = cssH - 30;
    ctx.save();
    ctx.fillStyle = "rgba(6,22,40,.78)";
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1;
    var ticks = 3;
    ctx.fillRect(x0 - 8, y0 - 6, w + 46, 26);
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 6); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + 6);
    for (var k = 1; k < ticks; k++) {
      var xx = x0 + (w * k / ticks);
      ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + 4);
    }
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 9px Inter, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var k2 = 0; k2 <= ticks; k2++) {
      var lbl = Math.round(maxNm * k2 / ticks);
      ctx.fillText(String(lbl), x0 + (w * k2 / ticks), y0 + 8);
    }
    ctx.textAlign = "left";
    ctx.fillText("NM", x0 + w + 6, y0 - 2);
    ctx.restore();
  }

  function render() {
    if (!ctx) return;
    computeTx(cssW, cssH);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    var field = renderField();
    ctx.drawImage(field, 0, 0, cssW, cssH);
    // overlays
    drawCurrents();
    drawWind();
    drawCatches();
    drawBaitLogs();
    drawHarbors();
    drawLabels();
    drawZone();       // draw the recommended zone last so its label sits on top
    drawScaleBar();
  }

  function resize() {
    var wrap = $("map-wrap");
    if (!wrap) return;
    cssW = wrap.clientWidth;
    cssH = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    fieldCache.key = "";
    render();
  }

  /* ============================================================
     MAP INTERACTION
     ============================================================ */
  function setupMapInteraction() {
    var dragging = false, lastX = 0, lastY = 0, moved = false;
    canvas.addEventListener("mousedown", function (e) {
      dragging = true; moved = false;
      lastX = e.offsetX; lastY = e.offsetY;
    });
    window.addEventListener("mouseup", function () { dragging = false; });
    canvas.addEventListener("mousemove", function (e) {
      // hover readout
      var g = unproject(e.offsetX, e.offsetY);
      if (g.lat > B.latMin - 0.5 && g.lat < B.latMax + 0.5) {
        var t = sstAt(g.lon, g.lat);
        $("map-readout").textContent =
          Math.abs(g.lat).toFixed(3) + "°N  " + Math.abs(g.lon).toFixed(3) + "°W  ·  " + t.toFixed(1) + "°F";
        $("map-readout").classList.add("show");
      }
      if (dragging) {
        var dx = e.offsetX - lastX, dy = e.offsetY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        state.view.cx -= (dx / Tx.scale) / Tx.kx;
        state.view.cy += (dy / Tx.scale);
        lastX = e.offsetX; lastY = e.offsetY;
        render();
      }
    });
    canvas.addEventListener("mouseleave", function () {
      $("map-readout").classList.remove("show");
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });
  }
  function zoomBy(f) {
    state.view.zoom = clamp(state.view.zoom * f, 0.8, 8);
    fieldCache.key = "";
    render();
  }
  function flyTo(lon, lat, zoom) {
    state.view.cx = lon; state.view.cy = lat;
    if (zoom) state.view.zoom = zoom;
    fieldCache.key = "";
    render();
  }

  /* ============================================================
     SHOULD I GO? SCORE
     ============================================================ */
  function computeScore() {
    var s = D.scoreInputs;
    var wind = clamp((22 - s.windKt) / 17, 0, 1);          // calmer better
    var gust = clamp((26 - s.gustKt) / 20, 0, 1);
    var swell = clamp((6 - s.swellFt) / 4.5, 0, 1);         // smaller better
    var vis = clamp(s.visNm / 10, 0, 1);
    // water temp: ideal 66-70
    var temp = 1 - clamp(Math.abs(s.waterTemp - 68) / 8, 0, 1);
    var bite = clamp(s.biteMomentum, 0, 1);
    var press = 1 - clamp(Math.abs(s.pressureMb - 1016) / 20, 0, 1);
    var score = wind * 0.20 + gust * 0.08 + swell * 0.22 + vis * 0.08 +
      temp * 0.18 + bite * 0.18 + press * 0.06;
    return Math.round(score * 100);
  }
  function verdictFor(score) {
    if (score >= 80) return { word: "GO TODAY", cls: "v-go", desc: "Great conditions, productive water temperatures, and recent catches." };
    if (score >= 62) return { word: "WORTH A LOOK", cls: "v-ok", desc: "Fishable window with a few compromises — pick your hours." };
    if (score >= 42) return { word: "MARGINAL", cls: "v-mid", desc: "Mixed conditions. Stay close and keep an eye on the wind." };
    return { word: "STAY IN", cls: "v-no", desc: "Conditions or the bite are working against you today." };
  }
  function renderScore() {
    var score = computeScore();
    var v = verdictFor(score);
    $("go-score").textContent = score;
    var word = $("go-word");
    word.textContent = v.word;
    word.className = "go-word " + v.cls;
    $("go-desc").textContent = v.desc;
    // stars
    var starsEl = $("go-stars");
    starsEl.innerHTML = "";
    var filled = score / 20;
    for (var i = 1; i <= 5; i++) {
      var span = el("span", "star");
      if (filled >= i) span.classList.add("full");
      else if (filled >= i - 0.5) span.classList.add("half");
      span.textContent = "★";
      starsEl.appendChild(span);
    }
    // gauge
    var circ = 2 * Math.PI * 50;
    var fill = $("gauge-fill");
    fill.style.strokeDasharray = circ;
    fill.style.strokeDashoffset = circ * (1 - score / 100);
    fill.style.stroke = score >= 80 ? "#7fd23a" : score >= 62 ? "#d8c23a" : score >= 42 ? "#e89b3a" : "#e2553a";
  }

  /* ============================================================
     BEST PLAY / TRIP PLANNER
     ============================================================ */
  function homeHarbor() { return D.harbors[2]; } // Newport
  function renderPlay() {
    var h = homeHarbor(), z = D.recommendedZone;
    var d = distNm(h.lon, h.lat, z.lon, z.lat);
    var brg = bearing(h.lon, h.lat, z.lon, z.lat);
    var conf = Math.round((D.scoreInputs.biteMomentum * 0.6 + 0.3) * 100);
    var meta = $("play-meta");
    meta.innerHTML = "";
    [["DISTANCE", d.toFixed(1) + " NM"],
    ["BEARING", Math.round(brg) + "° " + compass(brg)],
    ["CONFIDENCE", conf + "%"]].forEach(function (p) {
      var box = el("div", "pm");
      box.appendChild(el("span", "pm-l", p[0]));
      box.appendChild(el("span", "pm-v", p[1]));
      meta.appendChild(box);
    });
  }

  function currentBoat() { return D.boats[state.boatIdx]; }
  function tripNumbers() {
    var boat = currentBoat();
    var h = homeHarbor(), z = D.recommendedZone;
    var oneWay = distNm(h.lon, h.lat, z.lon, z.lat);
    var roundTrip = oneWay * 2;
    var transitHrs = roundTrip / state.speed;
    var fishFuel = state.hrs * boat.gph * 0.35;   // trolling / drifting burn
    var fuelNeeded = transitHrs * boat.gph + fishFuel;
    var fuelCost = fuelNeeded * state.fuelPrice;
    var range = (boat.tank * 0.75) / boat.gph * state.speed; // 25% reserve
    return {
      oneWay: oneWay, roundTrip: roundTrip, fuelNeeded: fuelNeeded,
      fuelCost: fuelCost, range: range, boat: boat
    };
  }
  function renderTrip() {
    var t = tripNumbers();
    var stats = $("trip-stats");
    stats.innerHTML = "";
    var tiles = [
      ["EST. RANGE", Math.round(t.range), "NM"],
      ["ROUND TRIP", Math.round(t.roundTrip), "NM"],
      ["FUEL NEEDED", Math.round(t.fuelNeeded), "GAL"],
      ["FUEL COST", "$" + Math.round(t.fuelCost), "@ $" + state.fuelPrice.toFixed(2) + "/gal"]
    ];
    tiles.forEach(function (ti) {
      var box = el("div", "tstat");
      box.appendChild(el("span", "ts-l", ti[0]));
      box.appendChild(el("span", "ts-v", ti[1] + " <i>" + ti[2] + "</i>"));
      stats.appendChild(box);
    });
  }

  /* ============================================================
     PANELS (right / bottom)
     ============================================================ */
  function renderConditions() {
    var wrap = $("conditions");
    wrap.innerHTML = "";
    D.conditions.forEach(function (c) {
      var box = el("div", "cond");
      box.innerHTML = '<span class="cond-ic">' + c.ico + '</span>' +
        '<div class="cond-tx"><span class="cond-l">' + c.label + '</span>' +
        '<span class="cond-v">' + c.val + ' <i>' + c.unit + '</i></span></div>';
      wrap.appendChild(box);
    });
  }
  function fishIcon() {
    return '<svg viewBox="0 0 40 18" class="mini-fish"><ellipse cx="16" cy="9" rx="14" ry="6" fill="#4a7fb0"/>' +
      '<path d="M28 9 L40 2 L40 16 Z" fill="#4a7fb0"/><circle cx="8" cy="7" r="1.3" fill="#04223d"/></svg>';
  }
  function renderBite() {
    var ul = $("bite-list");
    ul.innerHTML = "";
    D.bite.forEach(function (b) {
      var li = el("li", "bite-row");
      var trendCls = b.trend >= 0 ? "up" : "down";
      var arrow = b.trend >= 0 ? "▲" : "▼";
      li.innerHTML = '<span class="bite-sp">' + b.species + '</span>' +
        fishIcon() +
        '<span class="bite-ct">' + b.count + '</span>' +
        '<span class="bite-tr ' + trendCls + '">' + arrow + ' ' + Math.abs(b.trend) + '%</span>';
      ul.appendChild(li);
    });
  }
  function renderBait() {
    var ul = $("bait-list");
    ul.innerHTML = "";
    D.bait.forEach(function (b) {
      var li = el("li", "bait-row");
      var st = b.status === "GOOD" ? "good" : "fair";
      li.innerHTML = '<div class="bait-main"><span class="bait-nm">' + b.name + '</span>' +
        '<span class="bait-status ' + st + '">' + b.status + '</span></div>' +
        '<div class="bait-sub"><span>' + b.stock + '</span><span class="bait-upd">Updated ' + b.updated + '</span></div>';
      ul.appendChild(li);
    });
  }
  function renderFuel() {
    var body = $("fuel-body");
    body.innerHTML = "";
    D.fuel.slice(0, 3).forEach(function (f) {
      var tr = el("tr");
      tr.innerHTML = '<td>' + f.station + '</td><td class="fuel-price">$' + f.price.toFixed(2) +
        '</td><td class="fuel-dist">' + f.dist.toFixed(1) + ' mi</td>';
      body.appendChild(tr);
    });
  }
  function renderTempStations() {
    var ul = $("temp-list");
    ul.innerHTML = "";
    D.tempStations.slice(0, 4).forEach(function (s) {
      var li = el("li", "temp-row");
      li.innerHTML = '<span class="temp-nm">' + s.name + '</span>' +
        '<span class="temp-v">' + s.temp.toFixed(1) + '°F</span>' +
        '<span class="temp-age">' + s.updated + '</span>';
      ul.appendChild(li);
    });
  }
  function windBarb(ktn, dir) {
    return '<svg viewBox="0 0 24 24" class="wbarb"><g stroke="currentColor" stroke-width="1.6" fill="none">' +
      '<line x1="12" y1="4" x2="12" y2="20"/><line x1="12" y1="4" x2="17" y2="7"/>' +
      '<line x1="12" y1="8" x2="16" y2="10"/></g></svg>';
  }
  function renderForecast() {
    var row = $("wind-row");
    row.innerHTML = "";
    D.forecast.forEach(function (f) {
      var col = el("div", "wf");
      col.innerHTML = '<span class="wf-hr">' + f.hr + '</span>' +
        windBarb(f.ktn, f.dir) +
        '<span class="wf-kt">' + f.ktn + ' <i>KT</i></span>' +
        '<span class="wf-dir">' + f.dir + '</span>' +
        '<span class="wf-ft">' + f.ft.toFixed(1) + ' FT</span>';
      row.appendChild(col);
    });
  }
  function renderHotspots() {
    var ol = $("hot-list");
    ol.innerHTML = "";
    D.hotspots.forEach(function (h) {
      var li = el("li", "hot-row");
      li.innerHTML = '<span class="hot-rank">' + h.rank + '</span>' +
        '<div class="hot-tx"><span class="hot-area">' + h.area + '</span>' +
        '<span class="hot-sp">' + h.species + '</span></div>' +
        '<span class="hot-age">' + h.age + '</span>';
      li.addEventListener("click", function () { flyTo(h.lon, h.lat, 2.4); });
      ol.appendChild(li);
    });
  }
  function renderQuickLinks() {
    var ul = $("quick-links");
    ul.innerHTML = "";
    D.quickLinks.forEach(function (q) {
      var li = el("li");
      li.innerHTML = '<a href="' + q.url + '" target="_blank" rel="noopener">' + q.label + ' <span>›</span></a>';
      ul.appendChild(li);
    });
  }

  /* ============================================================
     LAYER CONTROLS
     ============================================================ */
  var RAIL = [
    { id: "sst", type: "base", ico: "🌡", label: "SST" },
    { id: "chlorophyll", type: "base", ico: "🌿", label: "CHLOROPHYLL" },
    { id: "currents", type: "overlay", ico: "🌀", label: "CURRENTS" },
    { id: "wind", type: "overlay", ico: "🜁", label: "WIND" },
    { id: "baitlogs", type: "overlay", ico: "🐟", label: "BAIT LOGS" }
  ];
  var BASES = [
    { id: "chart", label: "Chart" },
    { id: "satellite", label: "Satellite" },
    { id: "sst", label: "SST" },
    { id: "chlorophyll", label: "Chlorophyll" }
  ];
  function renderRail() {
    var rail = $("layer-rail");
    rail.innerHTML = "";
    RAIL.forEach(function (r) {
      var b = el("button", "rail-btn");
      b.innerHTML = '<span class="rb-ic">' + r.ico + '</span><span class="rb-lb">' + r.label + '</span>';
      var active = r.type === "base" ? state.base === r.id : state.overlays[r.id];
      if (active) b.classList.add("on");
      b.addEventListener("click", function () {
        if (r.type === "base") { state.base = r.id; fieldCache.key = ""; }
        else state.overlays[r.id] = !state.overlays[r.id];
        syncLayers();
      });
      rail.appendChild(b);
    });
  }
  function renderBaseSwitch() {
    var sw = $("base-switch");
    sw.innerHTML = "";
    BASES.forEach(function (b) {
      var btn = el("button", "bs-btn" + (state.base === b.id ? " on" : ""), b.label);
      btn.addEventListener("click", function () {
        state.base = b.id; fieldCache.key = ""; syncLayers();
      });
      sw.appendChild(btn);
    });
  }
  function syncLayers() {
    renderRail();
    renderBaseSwitch();
    updateLegend();
    render();
  }
  function updateLegend() {
    var title = $("lt-title"), ic = $("lt-ic"), ramp = $("lt-ramp");
    var min = $("lt-min"), max = $("lt-max"), source = $("lt-source"), updated = $("lt-updated");
    updated.textContent = "Updated " + D.almanac.updatedSST;
    if (state.base === "chlorophyll") {
      ic.textContent = "🌿"; title.textContent = "CHLOROPHYLL-a";
      ramp.style.background = rampCss(CHL_STOPS);
      min.textContent = "0.1"; max.textContent = "8 mg/m³";
      source.textContent = "SATELLITE CHLOROPHYLL";
    } else if (state.base === "chart") {
      ic.textContent = "▤"; title.textContent = "NAUTICAL CHART";
      ramp.style.background = "linear-gradient(90deg,#dcecf6,#9fc4e0)";
      min.textContent = "SHALLOW"; max.textContent = "DEEP";
      source.textContent = "DEPTH SHADING + CONTOURS";
    } else if (state.base === "satellite") {
      ic.textContent = "🛰"; title.textContent = "SATELLITE";
      ramp.style.background = "linear-gradient(90deg,#06182c,#123a26,#3a5a2a)";
      min.textContent = "WATER"; max.textContent = "LAND";
      source.textContent = "TRUE-COLOR COMPOSITE";
    } else {
      ic.textContent = "🌡"; title.textContent = "WATER TEMPERATURE (SST)";
      ramp.style.background = rampCss(SST_STOPS);
      min.textContent = "62°F"; max.textContent = "74°F";
      source.textContent = "SATELLITE SST";
    }
  }
  function rampCss(stops) {
    return "linear-gradient(90deg," + stops.map(function (s) {
      return "rgb(" + s[1][0] + "," + s[1][1] + "," + s[1][2] + ") " + Math.round(s[0] * 100) + "%";
    }).join(",") + ")";
  }

  /* ============================================================
     GPX / COPY / NAV / MODALS
     ============================================================ */
  function buildGpx() {
    var wpts = [];
    D.harbors.forEach(function (h) { wpts.push({ lon: h.lon, lat: h.lat, name: h.name + " (Harbor)", sym: "Anchor" }); });
    D.bait.forEach(function (b) { wpts.push({ lon: b.lon, lat: b.lat, name: b.name + " (Bait)", sym: "Fishing Area" }); });
    D.catches.forEach(function (m, i) { wpts.push({ lon: m.lon, lat: m.lat, name: "Catch: " + m.species, sym: "Fish" }); });
    D.hotspots.forEach(function (h) { wpts.push({ lon: h.lon, lat: h.lat, name: "Hotspot " + h.rank + ": " + h.area, sym: "Fishing Hot Spot Facility" }); });
    var z = D.recommendedZone;
    wpts.push({ lon: z.lon, lat: z.lat, name: "Best Play — " + z.tempLabel + " " + z.subLabel, sym: "Waypoint" });

    var head = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="SoCal Fishing — Private Boat Operations" ' +
      'xmlns="http://www.topografix.com/GPX/1/1">\n' +
      '<metadata><name>SoCal Fishing Waypoints</name><desc>Harbors, bait, catch zones and best play. Search areas, not exact fishing spots.</desc></metadata>\n';
    var body = wpts.map(function (w) {
      return '  <wpt lat="' + w.lat.toFixed(5) + '" lon="' + w.lon.toFixed(5) + '">' +
        '<name>' + esc(w.name) + '</name><sym>' + esc(w.sym) + '</sym></wpt>';
    }).join("\n");
    return head + body + "\n</gpx>\n";
  }
  function esc(s) {
    return String(s).replace(/[<>&'"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c];
    });
  }
  function downloadGpx() {
    var blob = new Blob([buildGpx()], { type: "application/gpx+xml" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "socal-fishing-waypoints.gpx";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("GPX exported · " + (D.harbors.length + D.bait.length + D.catches.length + D.hotspots.length + 1) + " waypoints");
  }
  function ddToDdm(v, isLat) {
    var hemi = isLat ? (v >= 0 ? "N" : "S") : (v >= 0 ? "E" : "W");
    v = Math.abs(v);
    var d = Math.floor(v);
    var m = (v - d) * 60;
    return d + "°" + m.toFixed(3) + "'" + hemi;
  }
  function copyCoords() {
    var z = D.recommendedZone;
    var txt = "Best Play (" + z.subLabel + "): " +
      ddToDdm(z.lat, true) + " " + ddToDdm(z.lon, false) +
      "  (" + z.lat.toFixed(4) + ", " + z.lon.toFixed(4) + ")";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast("Coordinates copied"); },
        function () { fallbackCopy(txt); });
    } else fallbackCopy(txt);
  }
  function fallbackCopy(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Coordinates copied"); }
    catch (e) { toast("Copy: " + txt); }
    document.body.removeChild(ta);
  }

  function navTo(kind) {
    if (kind === "harbor") flyTo(homeHarbor().lon, homeHarbor().lat, 3);
    else if (kind === "play") flyTo(D.recommendedZone.lon, D.recommendedZone.lat, 2.6);
    else if (kind === "bait") flyTo(D.bait[0].lon, D.bait[0].lat, 3.2);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.hidden = true; }, 300);
    }, 2400);
  }

  function openModal(title, html) {
    $("modal-title").textContent = title;
    $("modal-body").innerHTML = html;
    $("modal-back").hidden = false;
  }
  function closeModal() { $("modal-back").hidden = true; }

  function modalTable(headers, rows) {
    var h = "<table class='m-table'><thead><tr>" +
      headers.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) {
        return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
    return h;
  }

  function wireModals() {
    $("bite-all").addEventListener("click", function () {
      openModal("Today's Bite — Regional (from landing reports)",
        modalTable(["Species", "Fish Counted", "7-day Trend"],
          D.bite.map(function (b) {
            return [b.species, b.count, (b.trend >= 0 ? "▲ +" : "▼ ") + b.trend + "%"];
          })) +
        "<p class='m-note'>Counts aggregate public landing reports across the regional fleet. They indicate what is biting, not where your boat will find them.</p>");
    });
    $("bait-all").addEventListener("click", function () {
      openModal("Bait Sources",
        modalTable(["Source", "Stock", "Status", "Updated"],
          D.bait.map(function (b) { return [b.name, b.stock, b.status, b.updated]; })));
    });
    $("fuel-all").addEventListener("click", function () {
      openModal("Fuel Prices Near Harbors",
        modalTable(["Station", "Price / gal", "Distance"],
          D.fuel.map(function (f) { return [f.station, "$" + f.price.toFixed(2), f.dist.toFixed(1) + " mi"]; })) +
        "<p class='m-note'>Dock fuel runs a premium over roadside stations — factor the detour against the price gap.</p>");
    });
    $("temp-all").addEventListener("click", function () {
      openModal("Water Temperature Stations",
        modalTable(["Station", "Water Temp", "Updated"],
          D.tempStations.map(function (s) { return [s.name, s.temp.toFixed(1) + "°F", s.updated]; })));
    });
    $("wind-all").addEventListener("click", function () {
      openModal("Wind & Swell Forecast",
        modalTable(["Time", "Wind", "Direction", "Swell"],
          D.forecast.map(function (f) { return [f.hr, f.ktn + " kt", f.dir, f.ft.toFixed(1) + " ft"]; })));
    });
    $("bite-all"); // no-op guard
    $("go-info").addEventListener("click", function () {
      var s = D.scoreInputs;
      openModal("How the Good Day Score works",
        "<p class='m-note'>A weighted blend of the conditions that actually decide a private-boat trip:</p>" +
        modalTable(["Factor", "Reading", "Weight"], [
          ["Swell", s.swellFt + " ft", "22%"],
          ["Wind", s.windKt + " kt", "20%"],
          ["Water temp vs. ideal", s.waterTemp + "°F", "18%"],
          ["Bite momentum", Math.round(s.biteMomentum * 100) + "%", "18%"],
          ["Wind gusts", s.gustKt + " kt", "8%"],
          ["Visibility", s.visNm + "+ NM", "8%"],
          ["Barometric pressure", s.pressureMb + " mb", "6%"]
        ]) +
        "<p class='m-note'>Score today: <b>" + computeScore() + "/100</b>. This is decision support, not a guarantee — always check the marine forecast before leaving the dock.</p>");
    });
    $("trip-summary").addEventListener("click", function () {
      var t = tripNumbers(), h = homeHarbor(), z = D.recommendedZone;
      var brg = bearing(h.lon, h.lat, z.lon, z.lat);
      openModal("Trip Summary — " + t.boat.name,
        modalTable(["Leg", "Value"], [
          ["Launch harbor", h.name],
          ["Target", z.tempLabel + " " + z.subLabel + " (search area)"],
          ["One-way distance", t.oneWay.toFixed(1) + " NM"],
          ["Round trip", t.roundTrip.toFixed(1) + " NM"],
          ["Bearing to play", Math.round(brg) + "° " + compass(brg)],
          ["Cruise speed", state.speed + " kt"],
          ["Fishing time", state.hrs + " hrs"],
          ["Fuel burn (cruise)", t.boat.gph + " gph"],
          ["Fuel needed", Math.round(t.fuelNeeded) + " gal of " + t.boat.tank + " gal tank"],
          ["Fuel cost", "$" + t.fuelCost.toFixed(0) + " @ $" + state.fuelPrice.toFixed(2) + "/gal"],
          ["Est. usable range", Math.round(t.range) + " NM (25% reserve)"]
        ]) +
        "<p class='m-note'>Distances are to a search area derived from landing reports and water temperature — not exact fishing coordinates. Carry a 25% fuel reserve.</p>");
    });
    $("modal-x").addEventListener("click", closeModal);
    $("modal-back").addEventListener("click", function (e) {
      if (e.target === $("modal-back")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ============================================================
     ALMANAC / CLOCK
     ============================================================ */
  function renderAlmanac() {
    var a = D.almanac;
    $("sunrise").textContent = a.sunrise;
    $("sunset").textContent = a.sunset;
    $("high-tide").innerHTML = a.highTide.time + ' <em class="up">' + a.highTide.ft + '</em>';
    $("low-tide").innerHTML = a.lowTide.time + ' <em class="down">' + a.lowTide.ft + '</em>';
  }
  function tickClock() {
    var now = new Date();
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", hour12: true
    }).formatToParts(now);
    var time = parts.map(function (p) { return p.value; }).join("").replace(/\s?(AM|PM)/, " $1");
    $("clock-time").textContent = time + " PT";
    var dstr = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", year: "numeric"
    }).format(now).toUpperCase();
    $("clock-date").textContent = dstr;
  }

  /* ============================================================
     FORM WIRING
     ============================================================ */
  function wireForm() {
    var boatSel = $("boat-select");
    D.boats.forEach(function (b, i) {
      var o = el("option", null, b.name); o.value = i;
      boatSel.appendChild(o);
    });
    boatSel.value = state.boatIdx;
    boatSel.addEventListener("change", function () {
      state.boatIdx = +boatSel.value;
      state.speed = currentBoat().cruise;
      $("speed-select").value = state.speed;
      renderTrip();
    });

    var speedSel = $("speed-select");
    D.speeds.forEach(function (s) {
      var o = el("option", null, s + " KTS"); o.value = s;
      speedSel.appendChild(o);
    });
    state.speed = currentBoat().cruise;
    speedSel.value = state.speed;
    speedSel.addEventListener("change", function () {
      state.speed = +speedSel.value; renderTrip();
    });

    $("fuel-price").addEventListener("input", function () {
      var v = parseFloat(this.value);
      state.fuelPrice = isNaN(v) || v < 0 ? 0 : v;
      renderTrip();
    });

    $("hrs-up").addEventListener("click", function () {
      state.hrs = clamp(state.hrs + 1, 1, 16); $("fish-hrs").textContent = state.hrs; renderTrip();
    });
    $("hrs-down").addEventListener("click", function () {
      state.hrs = clamp(state.hrs - 1, 1, 16); $("fish-hrs").textContent = state.hrs; renderTrip();
    });

    // buttons
    $("view-play").addEventListener("click", function () { navTo("play"); });
    $("hot-viewmap").addEventListener("click", function () { flyTo(D.hotspots[0].lon, D.hotspots[0].lat, 2.4); });
    $("zoom-in").addEventListener("click", function () { zoomBy(1.3); });
    $("zoom-out").addEventListener("click", function () { zoomBy(1 / 1.3); });
    $("dl-gpx").addEventListener("click", downloadGpx);
    $("copy-coords").addEventListener("click", copyCoords);
    document.querySelectorAll(".nav-btn[data-nav]").forEach(function (b) {
      b.addEventListener("click", function () { navTo(b.getAttribute("data-nav")); });
    });
    var saved = false;
    $("save-play").addEventListener("click", function () {
      saved = !saved;
      this.textContent = saved ? "★" : "☆";
      this.classList.toggle("saved", saved);
      toast(saved ? "Best play saved" : "Removed from saved");
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    canvas = $("chart");
    ctx = canvas.getContext("2d");

    renderConditions();
    renderAlmanac();
    renderScore();
    renderPlay();
    renderBite();
    renderBait();
    renderFuel();
    renderTempStations();
    renderForecast();
    renderHotspots();
    renderQuickLinks();
    renderRail();
    renderBaseSwitch();
    updateLegend();
    wireForm();
    renderTrip();
    wireModals();

    setupMapInteraction();
    resize();
    window.addEventListener("resize", debounce(resize, 120));

    tickClock();
    setInterval(tickClock, 1000 * 15);
  }
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
