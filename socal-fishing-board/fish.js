/* =========================================================
   Fish illustrations — inline SVG, no external assets.

   Drawn in the manner of a field-guide plate rather than a
   cartoon: muted naturalistic colour, countershaded bodies
   (dark dorsal grading to pale belly), fins carried on visible
   rays, fine darker outlines, and eyes at true scale.

   Each species is side-on facing left in a 200x100 viewBox,
   built from one of eight silhouette families.

   These colours are ILLUSTRATION, not data encoding — they
   depict the fish. Chart series colours come from the
   validated categorical palette and are kept separate.
   ========================================================= */
window.FISH = (function () {
  "use strict";

  /* Countershading: dark back, a defined flank break, pale belly. */
  function grad(id, p) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + p.back + '"/>' +
      '<stop offset="0.34" stop-color="' + p.back + '"/>' +
      '<stop offset="0.52" stop-color="' + p.mid + '"/>' +
      '<stop offset="0.78" stop-color="' + p.belly + '"/>' +
      '<stop offset="1" stop-color="' + p.belly + '"/></linearGradient>';
  }

  /* A real eye is small and matte — no highlight bead. */
  function eye(x, y, r, p) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.iris +
      '" stroke="' + p.line + '" stroke-width=".6"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.52) + '" fill="' + p.line + '"/>';
  }

  /* Fin rays radiating from the fin's base — what stops a fin reading as a wedge. */
  function rays(ox, oy, tips, color, w, op) {
    var s = "";
    for (var i = 0; i < tips.length; i++) {
      s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + tips[i][0] + '" y2="' + tips[i][1] +
        '" stroke="' + color + '" stroke-width="' + (w || 0.65) + '" opacity="' + (op || 0.42) + '"/>';
    }
    return s;
  }

  function fin(d, p, opacity) {
    return '<path d="' + d + '" fill="' + p.fin + '" fill-opacity="' + (opacity || 0.92) +
      '" stroke="' + p.line + '" stroke-width=".7" stroke-linejoin="round"/>';
  }

  function body(d, id, p) {
    return '<path d="' + d + '" fill="url(#' + id + ')" stroke="' + p.line +
      '" stroke-width=".9" stroke-linejoin="round"/>';
  }

  function finlets(x0, x1, yFn, n, up, p) {
    var s = "", step = (x1 - x0) / n;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * step, y = yFn(x), h = up ? -4.6 : 4.6;
      s += '<path d="M ' + x.toFixed(1) + " " + y.toFixed(1) + " L " + (x + step * 0.6).toFixed(1) +
        " " + (y + h).toFixed(1) + " L " + (x + step * 0.72).toFixed(1) + " " + y.toFixed(1) +
        ' Z" fill="' + p.finlet + '" stroke="' + p.line + '" stroke-width=".5"/>';
    }
    return s;
  }

  /* ---------------- silhouette families ---------------- */

  function tuna(o) {
    var id = o.id, p = o.pal;
    var B = "M 13 55 C 25 36, 50 23, 80 22 C 114 22, 146 34, 162 50 C 146 66, 114 77, 80 77 C 50 76, 25 71, 13 55 Z";
    return grad(id, p) +
      /* second dorsal + anal — sickle on yellowfin, short elsewhere */
      (o.sickle
        ? fin("M 116 28 C 128 12, 139 5, 147 3 C 139 15, 132 27, 130 34 Z", p) +
          rays(118, 30, [[144, 5], [138, 12], [132, 21]], p.line, 0.6) +
          fin("M 116 72 C 128 88, 139 95, 147 97 C 139 85, 132 73, 130 66 Z", p) +
          rays(118, 70, [[144, 95], [138, 88], [132, 79]], p.line, 0.6)
        : fin("M 116 29 L 132 17 L 136 33 Z", p) + fin("M 116 71 L 132 83 L 136 67 Z", p)) +
      /* first dorsal */
      fin("M 75 26 L 97 6 L 105 29 Z", p) +
      rays(78, 27, [[95, 8], [99, 13], [102, 20]], p.line, 0.6) +
      body(B, id, p) +
      (o.marks || "") +
      /* lateral line and gill cover */
      '<path d="M 38 42 C 70 46, 110 50, 160 52" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".3"/>' +
      '<path d="M 36 28 C 44 44, 44 57, 35 72" fill="none" stroke="' + p.line + '" stroke-width=".9" opacity=".38"/>' +
      finlets(136, 158, function (x) { return 33 + (x - 136) * 0.4; }, 4, true, p) +
      finlets(136, 158, function (x) { return 67 - (x - 136) * 0.4; }, 4, false, p) +
      /* caudal */
      fin("M 158 45 L 195 20 C 186 35, 186 60, 195 79 L 158 55 C 166 51, 166 49, 158 45 Z", p) +
      rays(160, 50, [[192, 24], [188, 34], [188, 62], [192, 74]], p.line, 0.6) +
      /* near pectoral, laid over the flank */
      fin("M 57 57 C 70 63, 85 70, 97 75 C 82 73, 66 68, 54 61 Z", p, 0.72) +
      eye(28, 47, 3.1, p);
  }

  function jack(o) {   /* yellowtail — longer and shallower than a tuna */
    var id = o.id, p = o.pal;
    var B = "M 11 54 C 25 41, 52 30, 84 29 C 118 29, 148 38, 165 52 C 148 66, 118 75, 84 74 C 52 73, 25 68, 11 54 Z";
    return grad(id, p) +
      fin("M 71 31 L 88 18 L 95 33 Z", p) +
      fin("M 99 31 C 121 27, 145 35, 159 45 L 157 50 C 141 41, 119 34, 99 35 Z", p) +
      fin("M 103 69 C 123 73, 141 79, 151 85 L 149 79 C 137 71, 121 67, 103 65 Z", p) +
      body(B, id, p) +
      /* the brass lateral band that names the fish — muted, not neon */
      '<path d="M 17 53 C 42 46, 71 43, 100 44 C 128 45, 150 49, 163 52 C 150 55, 128 51, 100 50 C 71 49, 42 53, 17 55 Z" fill="' + p.band + '" opacity=".8"/>' +
      '<path d="M 34 32 C 42 45, 42 57, 33 70" fill="none" stroke="' + p.line + '" stroke-width=".9" opacity=".35"/>' +
      fin("M 161 46 L 194 27 C 187 40, 187 61, 194 78 L 161 57 C 168 53, 168 51, 161 46 Z", p) +
      rays(163, 51, [[191, 31], [188, 39], [188, 64], [191, 73]], p.line, 0.6) +
      fin("M 55 56 C 66 62, 79 68, 91 73 C 77 71, 62 66, 52 60 Z", p, 0.7) +
      eye(25, 47, 2.9, p);
  }

  function mahi(o) {   /* dorado — blunt crest, dorsal running the length of the back */
    var id = o.id, p = o.pal;
    var B = "M 15 54 C 18 34, 31 20, 51 17 C 92 15, 139 31, 164 51 C 138 70, 96 79, 58 76 C 33 72, 16 65, 15 54 Z";
    return grad(id, p) +
      body(B, id, p) +
      /* the crest-to-tail dorsal — deep at the shoulder, tapering to the peduncle */
      fin("M 43 24 C 55 5, 90 -1, 122 11 C 145 21, 160 37, 167 49 L 162 52 C 151 40, 133 26, 111 18 C 87 9, 59 13, 48 28 Z", p) +
      rays(66, 20, [[58, 10], [76, 4], [96, 4], [118, 12], [140, 27], [156, 40]], p.line, 0.55, 0.32) +
      fin("M 92 72 C 110 76, 126 82, 137 89 C 124 78, 108 72, 92 68 Z", p) +
      /* speckling, kept faint */
      '<g fill="' + p.spot + '" opacity=".38">' +
      '<circle cx="62" cy="37" r="2.1"/><circle cx="80" cy="31" r="1.8"/><circle cx="98" cy="35" r="2"/>' +
      '<circle cx="72" cy="52" r="1.8"/><circle cx="94" cy="50" r="2.1"/><circle cx="114" cy="45" r="1.8"/>' +
      '<circle cx="114" cy="60" r="1.9"/><circle cx="132" cy="55" r="1.7"/><circle cx="54" cy="56" r="1.6"/></g>' +
      '<path d="M 34 32 C 41 46, 41 58, 33 70" fill="none" stroke="' + p.line + '" stroke-width=".9" opacity=".33"/>' +
      fin("M 162 47 L 195 22 C 187 37, 187 61, 195 81 L 162 56 C 169 52, 169 50, 162 47 Z", p) +
      rays(164, 51, [[192, 26], [189, 36], [189, 64], [192, 76]], p.line, 0.6) +
      fin("M 53 60 C 63 67, 75 73, 85 77 C 72 75, 58 69, 50 62 Z", p, 0.7) +
      eye(29, 49, 3.2, p);
  }

  function cuda(o) {   /* barracuda — long, pointed, underslung jaw */
    var id = o.id, p = o.pal;
    var B = "M 5 50 C 25 43, 45 39, 70 38 C 112 37, 151 42, 173 50 C 151 59, 112 64, 70 63 C 45 62, 25 58, 5 50 Z";
    return grad(id, p) +
      fin("M 79 36 L 92 24 L 97 38 Z", p) +
      fin("M 132 38 L 145 28 L 149 40 Z", p) +
      fin("M 132 64 L 145 75 L 149 62 Z", p) +
      body(B, id, p) +
      '<path d="M 7 52 C 19 55, 31 56, 43 56" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>' +
      '<path d="M 30 42 C 38 50, 38 53, 29 60" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".35"/>' +
      '<path d="M 40 48 C 80 50, 130 52, 170 51" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".3"/>' +
      /* the dark chevrons along the upper flank */
      '<g fill="' + p.spot + '" opacity=".42">' +
      '<path d="M 58 41 l 4 0 l -2 8 l -4 0 Z"/><path d="M 74 40 l 4 0 l -2 9 l -4 0 Z"/>' +
      '<path d="M 90 40 l 4 0 l -2 9 l -4 0 Z"/><path d="M 106 41 l 4 0 l -2 9 l -4 0 Z"/>' +
      '<path d="M 122 42 l 4 0 l -2 8 l -4 0 Z"/><path d="M 138 43 l 3 0 l -2 7 l -3 0 Z"/></g>' +
      fin("M 171 46 L 194 30 C 189 41, 189 59, 194 70 L 171 55 C 176 52, 176 49, 171 46 Z", p) +
      rays(173, 50, [[191, 33], [189, 40], [189, 61], [191, 67]], p.line, 0.55) +
      eye(27, 46, 2.7, p);
  }

  function bass(o) {   /* calico, sand bass, whitefish — spiny dorsal, deeper body */
    var id = o.id, p = o.pal, spines = "";
    var B = "M 13 52 C 21 34, 43 22, 72 21 C 105 20, 136 33, 156 50 C 136 69, 105 79, 72 78 C 43 77, 21 68, 13 52 Z";
    for (var i = 0; i < 8; i++) {
      var x = 58 + i * 7.6, h = 11 + Math.abs(i - 3.5) * 0.9;
      spines += '<path d="M ' + x + " 25 L " + (x + 3.6) + " " + (25 - h) + " L " + (x + 7.2) +
        ' 26 Z" fill="' + p.fin + '" fill-opacity=".9" stroke="' + p.line + '" stroke-width=".55"/>';
    }
    return grad(id, p) +
      spines +
      fin("M 120 25 C 136 25, 149 34, 157 46 L 155 51 C 145 39, 133 31, 120 30 Z", p) +
      body(B, id, p) +
      (o.marks || "") +
      fin("M 108 71 C 122 74, 132 79, 139 86 C 130 76, 120 71, 108 68 Z", p) +
      '<path d="M 38 30 C 47 45, 47 57, 37 72" fill="none" stroke="' + p.line + '" stroke-width=".9" opacity=".38"/>' +
      '<path d="M 40 40 C 74 43, 116 47, 154 50" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".3"/>' +
      fin("M 155 45 L 187 32 C 182 43, 182 58, 187 70 L 155 56 C 160 52, 160 49, 155 45 Z", p) +
      rays(157, 50, [[184, 35], [182, 42], [182, 60], [184, 66]], p.line, 0.6) +
      fin("M 52 54 C 62 62, 73 69, 82 74 C 69 71, 56 65, 49 58 Z", p, 0.7) +
      eye(29, 43, 3.3, p);
  }

  function rock(o) {   /* rockfish — heavy head, large eye, hard spines */
    var id = o.id, p = o.pal, spines = "";
    var B = "M 11 48 C 19 29, 41 17, 70 16 C 103 15, 134 29, 154 48 C 134 69, 103 80, 70 79 C 41 78, 19 65, 11 48 Z";
    for (var i = 0; i < 9; i++) {
      var x = 52 + i * 7.2, h = 12 + Math.abs(i - 4) * 1.2;
      spines += '<path d="M ' + x + " 23 L " + (x + 3.2) + " " + (23 - h) + " L " + (x + 6.8) +
        ' 24 Z" fill="' + p.fin + '" fill-opacity=".92" stroke="' + p.line + '" stroke-width=".55"/>';
    }
    return grad(id, p) +
      spines +
      fin("M 118 23 C 134 25, 146 34, 153 47 L 151 51 C 141 39, 129 30, 117 28 Z", p) +
      body(B, id, p) +
      fin("M 104 73 C 118 76, 129 81, 136 88 C 127 78, 116 73, 104 70 Z", p) +
      '<path d="M 40 27 C 49 43, 49 58, 38 74" fill="none" stroke="' + p.line + '" stroke-width="1" opacity=".4"/>' +
      '<path d="M 38 43 L 49 39 L 47 47 Z" fill="' + p.fin + '" stroke="' + p.line + '" stroke-width=".5"/>' +
      '<path d="M 38 38 C 72 41, 114 45, 152 48" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".28"/>' +
      fin("M 153 43 L 187 30 C 182 42, 182 56, 187 69 L 153 55 C 158 51, 158 47, 153 43 Z", p) +
      rays(155, 49, [[184, 33], [182, 41], [182, 58], [184, 65]], p.line, 0.6) +
      fin("M 48 52 C 58 61, 69 68, 78 73 C 65 70, 53 64, 45 56 Z", p, 0.7) +
      eye(28, 40, 4.4, p);
  }

  function flat(o) {   /* halibut — eyed side up, fins fringing the whole disc */
    var id = o.id, p = o.pal, fringe = "", i, t;
    var cx = 104, cy = 51, rx = 79, ry = 37;
    for (i = 0; i < 54; i++) {
      t = (i / 54) * Math.PI * 2;
      fringe += '<line x1="' + (cx + Math.cos(t) * rx * 0.93).toFixed(1) + '" y1="' + (cy + Math.sin(t) * ry * 0.93).toFixed(1) +
        '" x2="' + (cx + Math.cos(t) * (rx + 7)).toFixed(1) + '" y2="' + (cy + Math.sin(t) * (ry + 7)).toFixed(1) +
        '" stroke="' + p.line + '" stroke-width=".7" opacity=".38"/>';
    }
    return grad(id, p) +
      '<path d="M 22 51 C 34 19, 76 8, 117 13 C 156 18, 182 35, 188 52 C 180 72, 147 88, 108 90 C 65 92, 32 78, 22 51 Z" fill="' + p.fin + '" fill-opacity=".55"/>' +
      fringe +
      body("M 27 51 C 39 24, 77 13, 114 18 C 148 23, 172 38, 178 52 C 170 70, 142 82, 106 84 C 68 86, 36 74, 27 51 Z", id, p) +
      '<g fill="' + p.spot + '" opacity=".32">' +
      '<circle cx="74" cy="37" r="2.8"/><circle cx="102" cy="31" r="2.4"/><circle cx="130" cy="41" r="2.6"/>' +
      '<circle cx="88" cy="58" r="2.4"/><circle cx="118" cy="62" r="2.8"/><circle cx="148" cy="52" r="2.2"/>' +
      '<circle cx="62" cy="60" r="2.1"/><circle cx="96" cy="46" r="2"/></g>' +
      fin("M 178 45 L 196 32 C 192 42, 192 60, 196 71 L 178 58 Z", p) +
      '<path d="M 32 46 C 40 40, 46 38, 52 38" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".45"/>' +
      eye(48, 35, 3.2, p) + eye(46, 49, 3, p);
  }

  function shark(o) {   /* mako — conical snout, tall first dorsal, uneven crescent */
    var id = o.id, p = o.pal, gills = "";
    var B = "M 6 52 C 24 41, 50 32, 82 31 C 115 31, 145 37, 163 46 C 149 57, 119 65, 84 66 C 50 65, 22 60, 6 52 Z";
    for (var i = 0; i < 5; i++) {
      gills += '<path d="M ' + (38 + i * 4.6) + " 42 C " + (36 + i * 4.6) + " 49, " + (36 + i * 4.6) +
        " 55, " + (39 + i * 4.6) + ' 60" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".4"/>';
    }
    return grad(id, p) +
      fin("M 79 34 L 97 8 L 110 37 Z", p) +
      rays(83, 34, [[95, 11], [100, 18], [105, 27]], p.line, 0.6) +
      fin("M 128 61 L 138 72 L 142 59 Z", p) +
      fin("M 132 37 L 142 30 L 145 40 Z", p) +
      body(B, id, p) +
      gills +
      '<path d="M 9 53 C 17 60, 27 63, 37 62" fill="none" stroke="' + p.line + '" stroke-width=".9" opacity=".5"/>' +
      '<path d="M 40 50 C 80 53, 125 55, 160 52" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".28"/>' +
      fin("M 161 43 L 189 11 C 185 28, 185 45, 192 55 C 183 60, 175 68, 171 77 L 161 56 C 167 52, 167 47, 161 43 Z", p) +
      rays(163, 49, [[186, 17], [184, 30], [176, 70]], p.line, 0.6) +
      fin("M 60 58 C 74 67, 91 76, 106 82 C 88 77, 69 69, 58 61 Z", p, 0.75) +
      eye(25, 46, 2.6, p);
  }

  /* ---------------- palettes ----------------
     Muted and naturalistic. back / mid / belly countershade the body;
     fin and finlet are the membranes; line is the outline ink. */
  function P(back, mid, belly, finC, finletC, line, extra) {
    var p = { back: back, mid: mid, belly: belly, fin: finC, finlet: finletC, line: line,
              iris: "#c9c4b4", spot: line, band: finletC };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  var SPECIES = {
    "Bluefin Tuna": function (id) {
      return tuna({ id: id, pal: P("#2c4257", "#8b9aa6", "#dfe3e4", "#3a5468", "#3f5c72", "#1b2a36"),
        marks: '<path d="M 22 51 C 62 45, 112 47, 158 52 C 112 56, 62 57, 22 55 Z" fill="#a9b6bf" opacity=".3"/>' });
    },
    "Yellowfin Tuna": function (id) {
      return tuna({ id: id, sickle: true,
        pal: P("#31465c", "#8d9ba7", "#dee2e3", "#3d566c", "#b08f36", "#1c2b38"),
        marks: '<path d="M 22 53 C 64 47, 114 49, 159 54 C 114 58, 64 59, 22 57 Z" fill="#bb9a3f" opacity=".55"/>' });
    },
    "Bonito": function (id) {
      var s = "";
      for (var i = 0; i < 6; i++) {
        s += '<path d="M ' + (44 + i * 19) + " 26 C " + (55 + i * 19) + " 31, " + (63 + i * 19) +
          " 35, " + (72 + i * 19) + ' 37" fill="none" stroke="#1e2d3a" stroke-width="1.8" opacity=".38"/>';
      }
      return tuna({ id: id, pal: P("#37495c", "#93a1ac", "#e0e3e4", "#41586c", "#466075", "#1e2d3a"), marks: s });
    },
    "Yellowtail": function (id) {
      return jack({ id: id, pal: P("#4b584d", "#98a29d", "#dcdedb", "#8e7534", "#9c8038", "#2a332e",
        { band: "#a08334" }) });
    },
    "Dorado": function (id) {
      return mahi({ id: id, pal: P("#46683c", "#8d9a48", "#c6b358", "#4f7342", "#5d7f4a", "#2b4426",
        { spot: "#3d5f7a" }) });
    },
    "Barracuda": function (id) {
      return cuda({ id: id, pal: P("#59636d", "#a6aeb5", "#dfe1e2", "#5f6a74", "#5f6a74", "#2f3841",
        { spot: "#2f3841" }) });
    },
    "Calico Bass": function (id) {
      var m = '<g fill="#cdc4a4" opacity=".42">' +
        '<rect x="46" y="31" width="10" height="12" rx="4"/><rect x="66" y="27" width="11" height="13" rx="4"/>' +
        '<rect x="88" y="31" width="11" height="13" rx="4"/><rect x="110" y="35" width="10" height="12" rx="4"/>' +
        '<rect x="56" y="52" width="10" height="11" rx="4"/><rect x="80" y="54" width="11" height="11" rx="4"/>' +
        '<rect x="104" y="54" width="10" height="11" rx="4"/><rect x="124" y="46" width="9" height="11" rx="4"/></g>';
      return bass({ id: id, pal: P("#3f3f2c", "#7c7659", "#bab08f", "#45452f", "#45452f", "#222417"), marks: m });
    },
    "Sand Bass": function (id) {
      var m = "";
      for (var i = 0; i < 5; i++) {
        m += '<rect x="' + (48 + i * 20) + '" y="27" width="8" height="38" rx="3" fill="#4e4734" opacity=".33"/>';
      }
      return bass({ id: id, pal: P("#6a6250", "#a3987b", "#d5cbaf", "#6e6650", "#6e6650", "#3a3527"), marks: m });
    },
    "Ocean Whitefish": function (id) {
      return bass({ id: id, pal: P("#7d7259", "#ab9f80", "#d8cfb4", "#8b7f5f", "#a8934f", "#494230") });
    },
    "Rockfish": function (id) {
      return rock({ id: id, pal: P("#8b3527", "#b8543c", "#dda583", "#93392a", "#93392a", "#54211a") });
    },
    "California Halibut": function (id) {
      return flat({ id: id, pal: P("#453f33", "#6d6553", "#948a72", "#3a352b", "#3a352b", "#221f19",
        { spot: "#241f18" }) });
    },
    "Mako Shark": function (id) {
      return shark({ id: id, pal: P("#375368", "#8496a5", "#e2e5e6", "#3d5b71", "#3d5b71", "#1d2e3c") });
    }
  };

  var ALIAS = { "Dorado (Mahi)": "Dorado", "Shortfin Mako": "Mako Shark", "Kelp Bass": "Calico Bass" };

  return {
    has: function (name) { return !!(SPECIES[name] || SPECIES[ALIAS[name]]); },
    svg: function (name, uid) {
      var fn = SPECIES[name] || SPECIES[ALIAS[name]];
      if (!fn) return "";
      return '<svg class="fish" viewBox="0 0 200 100" role="img" aria-label="' + name +
        '" preserveAspectRatio="xMidYMid meet">' + fn(uid) + "</svg>";
    }
  };
})();
