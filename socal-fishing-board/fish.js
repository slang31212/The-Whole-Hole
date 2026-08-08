/* =========================================================
   Fish illustrations — inline SVG, no external assets.

   Rendered as layered plates rather than flat shapes:

     defs      countershade gradient, scale pattern, body clip, blur
     behind    far-side and median fins (translucent membrane + rays)
     base      body filled with the countershade gradient
     clipped   scale field, species markings, dorsal shadow,
               specular flank band, belly bounce — all blurred and
               clipped to the body so shading reads as volume
     outline   fine ink edge
     front     near pectoral, head details, gill, mouth, eye

   Colours are ILLUSTRATION, not data encoding. Chart series
   colours come from the validated categorical palette and are
   kept separate so a fish never reads as a data series.
   ========================================================= */
window.FISH = (function () {
  "use strict";

  /* ---------------- primitives ---------------- */

  function grad(id, p) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + p.back + '"/>' +
      '<stop offset="0.21" stop-color="' + p.back + '"/>' +
      '<stop offset="0.31" stop-color="' + p.flank + '"/>' +
      '<stop offset="0.56" stop-color="' + p.flank + '"/>' +
      '<stop offset="0.69" stop-color="' + p.belly + '"/>' +
      '<stop offset="0.95" stop-color="' + p.belly + '"/>' +
      '<stop offset="1" stop-color="' + p.bellyShade + '"/></linearGradient>';
  }

  /* Staggered arcs read as scales at tile size without turning to noise. */
  function scales(id, color, s, op) {
    var r = (s * 0.62).toFixed(2), h = (s / 2).toFixed(2);
    return '<pattern id="' + id + '" width="' + s + '" height="' + s +
      '" patternUnits="userSpaceOnUse">' +
      '<path d="M 0 ' + s + " A " + r + " " + r + " 0 0 0 " + s + " " + s +
      " M " + (-s / 2) + " " + h + " A " + r + " " + r + " 0 0 0 " + h + " " + h +
      " M " + h + " " + h + " A " + r + " " + r + " 0 0 0 " + (s * 1.5) + " " + h +
      '" fill="none" stroke="' + color + '" stroke-width="' + (s * 0.09).toFixed(2) +
      '" opacity="' + (op || 0.5) + '"/></pattern>';
  }

  function eye(x, y, r, p) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.iris + '"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.92) + '" fill="none" stroke="' +
        p.line + '" stroke-width="' + (r * 0.16).toFixed(2) + '" opacity=".8"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.5) + '" fill="' + p.pupil + '"/>' +
      '<circle cx="' + (x - r * 0.3) + '" cy="' + (y - r * 0.32) + '" r="' + (r * 0.16) +
        '" fill="#ffffff" opacity=".5"/>';
  }

  /* A fin is a translucent membrane carried on rays that fan from its base. */
  function fin(f, p) {
    var s = '<path d="' + f.d + '" fill="' + (f.fill || p.fin) + '" fill-opacity="' +
      (f.op || 0.82) + '" stroke="' + p.line + '" stroke-width=".55" stroke-linejoin="round"/>';
    if (f.base && f.tips) {
      for (var i = 0; i < f.tips.length; i++) {
        s += '<line x1="' + f.base[0] + '" y1="' + f.base[1] + '" x2="' + f.tips[i][0] +
          '" y2="' + f.tips[i][1] + '" stroke="' + p.line +
          '" stroke-width=".45" opacity=".38" stroke-linecap="round"/>';
      }
    }
    return s;
  }

  function finlets(x0, x1, yFn, n, up, p) {
    var s = "", step = (x1 - x0) / n;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * step, y = yFn(x), h = up ? -4.2 : 4.2;
      s += '<path d="M ' + x.toFixed(1) + " " + y.toFixed(1) + " L " + (x + step * 0.58).toFixed(1) +
        " " + (y + h).toFixed(1) + " L " + (x + step * 0.7).toFixed(1) + " " + y.toFixed(1) +
        ' Z" fill="' + p.finlet + '" fill-opacity=".9" stroke="' + p.line + '" stroke-width=".4"/>';
    }
    return s;
  }

  /* The shared assembly. Everything species-specific arrives in `o`. */
  function plate(o) {
    var id = o.id, p = o.pal;
    var G = id + "g", S = id + "s", C = id + "c", F = id + "f";

    var defs = "<defs>" +
      grad(G, p) +
      scales(S, p.line, o.scale || 5, o.scaleOp || 0.4) +
      '<clipPath id="' + C + '"><path d="' + o.body + '"/></clipPath>' +
      '<filter id="' + F + '" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feGaussianBlur stdDeviation="' + (o.blur || 4.5) + '"/>' +
      "</filter>" +
      "</defs>";

    var behind = (o.finsBehind || []).map(function (f) { return fin(f, p); }).join("");
    var front = (o.finsFront || []).map(function (f) { return fin(f, p); }).join("");

    /* Volume: a dark wash along the dorsal, a specular band on the flank, a
       bounce along the belly — all blurred, all clipped to the silhouette. */
    var sh = o.shading || {};
    var volume =
      '<rect x="-10" y="-10" width="220" height="120" fill="url(#' + S + ')"/>' +
      (o.marks || "") +
      '<ellipse cx="' + (sh.dx != null ? sh.dx : 92) + '" cy="' + (sh.dy != null ? sh.dy : 14) +
        '" rx="' + (sh.drx || 92) + '" ry="' + (sh.dry || 20) + '" fill="' + p.back +
        '" opacity="' + (sh.dop || 0.7) + '" filter="url(#' + F + ')"/>' +
      '<ellipse cx="' + (sh.sx != null ? sh.sx : 84) + '" cy="' + (sh.sy != null ? sh.sy : 45) +
        '" rx="' + (sh.srx || 58) + '" ry="' + (sh.sry || 6) + '" fill="' + p.sheen +
        '" opacity="' + (sh.sop || 0.5) + '" filter="url(#' + F + ')"/>' +
      '<ellipse cx="' + (sh.bx != null ? sh.bx : 84) + '" cy="' + (sh.by != null ? sh.by : 92) +
        '" rx="' + (sh.brx || 74) + '" ry="' + (sh.bry || 15) + '" fill="' + p.bellyShade +
        '" opacity="' + (sh.bop || 0.4) + '" filter="url(#' + F + ')"/>';

    return defs + behind +
      '<path d="' + o.body + '" fill="url(#' + G + ')"/>' +
      '<g clip-path="url(#' + C + ')">' + volume + "</g>" +
      '<path d="' + o.body + '" fill="none" stroke="' + p.line +
        '" stroke-width="1" stroke-linejoin="round"/>' +
      front + (o.details || "") +
      eye(o.eye[0], o.eye[1], o.eye[2], p);
  }

  /* ---------------- silhouette families ---------------- */

  function tuna(o) {
    var p = o.pal;
    return plate({
      id: o.id, pal: p, scale: 3.6, scaleOp: 0.32, blur: 5,
      body: "M 13 55 C 25 36, 50 23, 80 22 C 114 22, 146 34, 162 50 C 146 66, 114 77, 80 77 C 50 76, 25 71, 13 55 Z",
      shading: { dy: 16, dry: 21, sy: 46, srx: 56, by: 90, bry: 16 },
      finsBehind: [
        { d: "M 75 26 L 97 6 L 105 29 Z", base: [79, 27], tips: [[95, 8], [99, 13], [102, 20]] },
        o.sickle
          ? { d: "M 116 28 C 128 12, 139 5, 147 3 C 139 15, 132 27, 130 34 Z", fill: p.finlet,
              base: [118, 30], tips: [[144, 5], [138, 12], [132, 21]] }
          : { d: "M 116 29 L 132 17 L 136 33 Z" },
        o.sickle
          ? { d: "M 116 72 C 128 88, 139 95, 147 97 C 139 85, 132 73, 130 66 Z", fill: p.finlet,
              base: [118, 70], tips: [[144, 95], [138, 88], [132, 79]] }
          : { d: "M 116 71 L 132 83 L 136 67 Z" },
        { d: "M 158 45 L 195 20 C 189 30, 186 45, 195 79 L 158 55 C 166 51, 166 49, 158 45 Z",
          base: [160, 50], tips: [[192, 24], [189, 31], [187, 41], [188, 62], [191, 71], [193, 76]] }
      ],
      marks: o.marks || "",
      finsFront: [
        { d: "M 57 57 C 70 63, 85 70, 97 75 C 82 73, 66 68, 54 61 Z", op: 0.62,
          base: [57, 58], tips: [[94, 74], [88, 71], [80, 67]] }
      ],
      details:
        finlets(136, 158, function (x) { return 33 + (x - 136) * 0.4; }, 4, true, p) +
        finlets(136, 158, function (x) { return 67 - (x - 136) * 0.4; }, 4, false, p) +
        '<path d="M 38 42 C 70 46, 110 50, 158 52" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".26"/>' +
        '<path d="M 36 28 C 44 44, 44 57, 35 72" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".36"/>' +
        '<path d="M 14 57 C 21 60, 27 61, 32 61" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".45"/>',
      eye: [28, 47, 3.4]
    });
  }

  function jack(o) {
    var p = o.pal;
    return plate({
      id: o.id, pal: p, scale: 3.4, scaleOp: 0.3, blur: 4.5,
      body: "M 11 54 C 25 41, 52 30, 84 29 C 118 29, 148 38, 165 52 C 148 66, 118 75, 84 74 C 52 73, 25 68, 11 54 Z",
      shading: { dy: 24, dry: 18, sy: 48, srx: 60, by: 86, bry: 13 },
      finsBehind: [
        { d: "M 71 31 L 88 18 L 95 33 Z", base: [74, 32], tips: [[87, 20], [91, 25]] },
        { d: "M 99 31 C 121 27, 145 35, 159 45 L 157 50 C 141 41, 119 34, 99 35 Z" },
        { d: "M 103 69 C 123 73, 141 79, 151 85 L 149 79 C 137 71, 121 67, 103 65 Z" },
        { d: "M 161 46 L 194 27 C 189 37, 187 50, 194 78 L 161 57 C 168 53, 168 51, 161 46 Z",
          fill: p.finlet, base: [163, 51], tips: [[191, 31], [189, 38], [188, 64], [191, 73]] }
      ],
      marks: '<path d="M 17 53 C 42 46, 71 43, 100 44 C 128 45, 150 49, 163 52 C 150 55, 128 51, 100 50 C 71 49, 42 53, 17 55 Z" fill="' + p.band + '" opacity=".75"/>',
      finsFront: [
        { d: "M 55 56 C 66 62, 79 68, 91 73 C 77 71, 62 66, 52 60 Z", op: 0.6,
          base: [55, 57], tips: [[88, 71], [82, 68], [74, 64]] }
      ],
      details:
        '<path d="M 34 32 C 42 45, 42 57, 33 70" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".34"/>' +
        '<path d="M 12 56 C 19 59, 25 60, 30 60" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".45"/>',
      eye: [25, 47, 3.1]
    });
  }

  function mahi(o) {
    var p = o.pal;
    return plate({
      id: o.id, pal: p, scale: 3.4, scaleOp: 0.26, blur: 5,
      body: "M 15 54 C 18 34, 31 20, 51 17 C 92 15, 139 31, 164 51 C 138 70, 96 79, 58 76 C 33 72, 16 65, 15 54 Z",
      shading: { dy: 18, drx: 84, dry: 20, sy: 44, srx: 52, by: 88, bry: 15, bop: 0.3 },
      finsBehind: [],
      marks:
        '<g fill="' + p.spot + '" opacity=".34">' +
        '<circle cx="62" cy="37" r="2"/><circle cx="80" cy="31" r="1.7"/><circle cx="98" cy="35" r="1.9"/>' +
        '<circle cx="72" cy="52" r="1.7"/><circle cx="94" cy="50" r="2"/><circle cx="114" cy="45" r="1.7"/>' +
        '<circle cx="114" cy="60" r="1.8"/><circle cx="132" cy="55" r="1.6"/><circle cx="54" cy="56" r="1.5"/></g>',
      finsFront: [
        { d: "M 43 24 C 55 5, 90 -1, 122 11 C 145 21, 160 37, 167 49 L 162 52 C 151 40, 133 26, 111 18 C 87 9, 59 13, 48 28 Z",
          op: 0.9, base: [66, 20], tips: [[58, 10], [76, 4], [96, 4], [118, 12], [140, 27], [156, 40]] },
        { d: "M 92 72 C 110 76, 126 82, 137 89 C 124 78, 108 72, 92 68 Z" },
        { d: "M 162 47 L 195 22 C 189 34, 187 50, 195 81 L 162 56 C 169 52, 169 50, 162 47 Z",
          base: [164, 51], tips: [[192, 26], [189, 35], [188, 66], [192, 76]] },
        { d: "M 53 60 C 63 67, 75 73, 85 77 C 72 75, 58 69, 50 62 Z", op: 0.6,
          base: [53, 61], tips: [[82, 76], [76, 72], [68, 68]] }
      ],
      details:
        '<path d="M 34 32 C 41 46, 41 58, 33 70" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".32"/>' +
        '<path d="M 16 58 C 22 61, 28 62, 33 62" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".45"/>',
      eye: [29, 49, 3.5]
    });
  }

  function cuda(o) {
    var p = o.pal;
    return plate({
      id: o.id, pal: p, scale: 3, scaleOp: 0.3, blur: 3.4,
      body: "M 5 50 C 25 43, 45 39, 70 38 C 112 37, 151 42, 173 50 C 151 59, 112 64, 70 63 C 45 62, 25 58, 5 50 Z",
      shading: { dy: 30, drx: 96, dry: 13, sy: 47, srx: 74, sry: 4, by: 72, bry: 9, bop: 0.3 },
      finsBehind: [
        { d: "M 79 36 L 92 24 L 97 38 Z", base: [81, 37], tips: [[91, 26], [94, 31]] },
        { d: "M 132 38 L 145 28 L 149 40 Z" },
        { d: "M 132 64 L 145 75 L 149 62 Z" },
        { d: "M 171 46 L 194 30 C 190 38, 189 52, 194 70 L 171 55 C 176 52, 176 49, 171 46 Z",
          base: [173, 50], tips: [[191, 33], [190, 40], [190, 61], [192, 66]] }
      ],
      marks:
        '<g fill="' + p.spot + '" opacity=".38">' +
        '<path d="M 58 41 l 4 0 l -2 8 l -4 0 Z"/><path d="M 74 40 l 4 0 l -2 9 l -4 0 Z"/>' +
        '<path d="M 90 40 l 4 0 l -2 9 l -4 0 Z"/><path d="M 106 41 l 4 0 l -2 9 l -4 0 Z"/>' +
        '<path d="M 122 42 l 4 0 l -2 8 l -4 0 Z"/><path d="M 138 43 l 3 0 l -2 7 l -3 0 Z"/></g>',
      finsFront: [],
      details:
        '<path d="M 7 52 C 19 55, 31 56, 43 56" fill="none" stroke="' + p.line + '" stroke-width=".75" opacity=".5"/>' +
        '<path d="M 30 42 C 38 50, 38 53, 29 60" fill="none" stroke="' + p.line + '" stroke-width=".75" opacity=".34"/>' +
        '<path d="M 40 48 C 80 50, 130 52, 170 51" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".26"/>',
      eye: [27, 46, 2.9]
    });
  }

  function bass(o) {
    var p = o.pal, spines = "";
    for (var i = 0; i < 8; i++) {
      var x = 58 + i * 7.6, h = 11 + Math.abs(i - 3.5) * 0.9;
      spines += '<path d="M ' + x + " 25 L " + (x + 3.6) + " " + (25 - h) + " L " + (x + 7.2) +
        ' 26 Z" fill="' + p.fin + '" fill-opacity=".85" stroke="' + p.line + '" stroke-width=".45"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 6.4, scaleOp: 0.34, blur: 5,
      body: "M 13 52 C 21 34, 43 22, 72 21 C 105 20, 136 33, 156 50 C 136 69, 105 79, 72 78 C 43 77, 21 68, 13 52 Z",
      shading: { dy: 16, drx: 84, dry: 20, sy: 44, srx: 52, by: 90, bry: 16, bop: 0.35 },
      finsBehind: [
        { d: "M 120 25 C 136 25, 149 34, 157 46 L 155 51 C 145 39, 133 31, 120 30 Z" },
        { d: "M 155 45 L 187 32 C 183 40, 182 50, 187 70 L 155 56 C 160 52, 160 49, 155 45 Z",
          base: [157, 50], tips: [[184, 35], [183, 42], [183, 60], [185, 66]] }
      ],
      marks: o.marks || "",
      finsFront: [
        { d: "M 108 71 C 122 74, 132 79, 139 86 C 130 76, 120 71, 108 68 Z" },
        { d: "M 52 54 C 62 62, 73 69, 82 74 C 69 71, 56 65, 49 58 Z", op: 0.58,
          base: [52, 55], tips: [[80, 73], [74, 69], [66, 64]] }
      ],
      details: spines +
        '<path d="M 38 30 C 47 45, 47 57, 37 72" fill="none" stroke="' + p.line + '" stroke-width=".85" opacity=".36"/>' +
        '<path d="M 40 40 C 74 43, 116 47, 154 50" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".26"/>' +
        '<path d="M 14 54 C 21 58, 28 59, 34 59" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".45"/>',
      eye: [29, 43, 3.6]
    });
  }

  function rock(o) {
    var p = o.pal, spines = "";
    for (var i = 0; i < 9; i++) {
      var x = 52 + i * 7.2, h = 12 + Math.abs(i - 4) * 1.2;
      spines += '<path d="M ' + x + " 23 L " + (x + 3.2) + " " + (23 - h) + " L " + (x + 6.8) +
        ' 24 Z" fill="' + p.fin + '" fill-opacity=".88" stroke="' + p.line + '" stroke-width=".45"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 6.8, scaleOp: 0.32, blur: 5,
      body: "M 11 48 C 19 29, 41 17, 70 16 C 103 15, 134 29, 154 48 C 134 69, 103 80, 70 79 C 41 78, 19 65, 11 48 Z",
      shading: { dy: 12, drx: 82, dry: 20, sy: 40, srx: 48, by: 90, bry: 17, bop: 0.35 },
      finsBehind: [
        { d: "M 118 23 C 134 25, 146 34, 153 47 L 151 51 C 141 39, 129 30, 117 28 Z" },
        { d: "M 153 43 L 187 30 C 183 39, 182 49, 187 69 L 153 55 C 158 51, 158 47, 153 43 Z",
          base: [155, 49], tips: [[184, 33], [183, 41], [183, 58], [185, 65]] }
      ],
      marks: "",
      finsFront: [
        { d: "M 104 73 C 118 76, 129 81, 136 88 C 127 78, 116 73, 104 70 Z" },
        { d: "M 48 52 C 58 61, 69 68, 78 73 C 65 70, 53 64, 45 56 Z", op: 0.58,
          base: [48, 53], tips: [[76, 72], [70, 68], [62, 63]] }
      ],
      details: spines +
        '<path d="M 40 27 C 49 43, 49 58, 38 74" fill="none" stroke="' + p.line + '" stroke-width=".95" opacity=".38"/>' +
        '<path d="M 38 43 L 49 39 L 47 47 Z" fill="' + p.fin + '" stroke="' + p.line + '" stroke-width=".4"/>' +
        '<path d="M 38 38 C 72 41, 114 45, 152 48" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".24"/>' +
        '<path d="M 12 51 C 19 56, 26 58, 32 58" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".45"/>',
      eye: [28, 40, 4.6]
    });
  }

  function flat(o) {
    var p = o.pal, fringe = "", i, t, cx = 104, cy = 51, rx = 79, ry = 37;
    for (i = 0; i < 62; i++) {
      t = (i / 62) * Math.PI * 2;
      fringe += '<line x1="' + (cx + Math.cos(t) * rx * 0.96).toFixed(1) + '" y1="' + (cy + Math.sin(t) * ry * 0.96).toFixed(1) +
        '" x2="' + (cx + Math.cos(t) * (rx + 6)).toFixed(1) + '" y2="' + (cy + Math.sin(t) * (ry + 6)).toFixed(1) +
        '" stroke="' + p.line + '" stroke-width=".55" opacity=".3"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 5.4, scaleOp: 0.26, blur: 6,
      body: "M 27 51 C 39 24, 77 13, 114 18 C 148 23, 172 38, 178 52 C 170 70, 142 82, 106 84 C 68 86, 36 74, 27 51 Z",
      shading: { dy: 20, drx: 80, dry: 24, dop: 0.4, sx: 92, sy: 44, srx: 46, sry: 9, sop: 0.35, by: 92, bry: 18, bop: 0.3 },
      finsBehind: [
        { d: "M 22 51 C 34 19, 76 8, 117 13 C 156 18, 182 35, 188 52 C 180 72, 147 88, 108 90 C 65 92, 32 78, 22 51 Z",
          op: 0.5 }
      ],
      marks:
        '<g fill="' + p.spot + '" opacity=".3">' +
        '<circle cx="74" cy="37" r="2.6"/><circle cx="102" cy="31" r="2.2"/><circle cx="130" cy="41" r="2.4"/>' +
        '<circle cx="88" cy="58" r="2.2"/><circle cx="118" cy="62" r="2.6"/><circle cx="148" cy="52" r="2"/>' +
        '<circle cx="62" cy="60" r="1.9"/><circle cx="96" cy="46" r="1.8"/></g>',
      finsFront: [
        { d: "M 178 45 L 196 32 C 193 40, 192 54, 196 71 L 178 58 Z",
          base: [179, 51], tips: [[194, 35], [193, 43], [193, 62], [194, 68]] }
      ],
      details: fringe +
        '<path d="M 32 46 C 40 40, 46 38, 52 38" fill="none" stroke="' + p.line + '" stroke-width=".75" opacity=".42"/>' +
        eye(46, 49, 3.2, p),
      eye: [48, 34, 3.4]
    });
  }

  function shark(o) {
    var p = o.pal, gills = "";
    for (var i = 0; i < 5; i++) {
      gills += '<path d="M ' + (38 + i * 4.6) + " 42 C " + (36 + i * 4.6) + " 49, " + (36 + i * 4.6) +
        " 55, " + (39 + i * 4.6) + ' 60" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".38"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 2.8, scaleOp: 0.2, blur: 5,
      body: "M 6 52 C 24 41, 50 32, 82 31 C 115 31, 145 37, 163 46 C 149 57, 119 65, 84 66 C 50 65, 22 60, 6 52 Z",
      shading: { dy: 26, drx: 92, dry: 16, sy: 46, srx: 62, sry: 5, by: 76, bry: 11, bop: 0.3 },
      finsBehind: [
        { d: "M 79 34 L 97 8 L 110 37 Z", base: [83, 34], tips: [[95, 11], [100, 18], [105, 27]] },
        { d: "M 128 61 L 138 72 L 142 59 Z" },
        { d: "M 132 37 L 142 30 L 145 40 Z" },
        { d: "M 161 43 L 189 11 C 186 26, 185 43, 192 55 C 183 60, 175 68, 171 77 L 161 56 C 167 52, 167 47, 161 43 Z",
          base: [163, 49], tips: [[186, 17], [185, 30], [178, 66]] }
      ],
      marks: "",
      finsFront: [
        { d: "M 60 58 C 74 67, 91 76, 106 82 C 88 77, 69 69, 58 61 Z", op: 0.68,
          base: [60, 59], tips: [[103, 81], [96, 77], [86, 72]] }
      ],
      details: gills +
        '<path d="M 9 53 C 17 60, 27 63, 37 62" fill="none" stroke="' + p.line + '" stroke-width=".85" opacity=".5"/>' +
        '<path d="M 40 50 C 80 53, 125 55, 160 52" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".24"/>',
      eye: [25, 46, 2.8]
    });
  }

  /* ---------------- palettes ----------------
     back / flank / belly countershade the body; sheen is the specular band,
     bellyShade the underside bounce, fin and finlet the membranes,
     line the ink, iris and pupil the eye. */
  function P(back, flank, belly, finC, finletC, line, extra) {
    var p = { back: back, flank: flank, belly: belly, bellyShade: "#6a6a63",
              fin: finC, finlet: finletC, line: line, sheen: "#ffffff",
              iris: "#cbc4ad", pupil: "#141414", spot: line, band: finletC };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  var SPECIES = {
    "Bluefin Tuna": function (id) {
      return tuna({ id: id, pal: P("#132434", "#8ea3b4", "#f4f6f6", "#1e3a54", "#a8913f", "#0c1520",
        { bellyShade: "#9aa4a8" }) });
    },
    "Yellowfin Tuna": function (id) {
      return tuna({ id: id, sickle: true,
        pal: P("#16304a", "#8fa4b4", "#f2f4f4", "#20455f", "#d9ad2a", "#0d1c2b",
          { bellyShade: "#9da7ab" }),
        marks: '<path d="M 22 52 C 64 46, 114 48, 159 53 C 114 58, 64 59, 22 57 Z" fill="#c9a63f" opacity=".5"/>' });
    },
    "Bonito": function (id) {
      var s = "";
      for (var i = 0; i < 6; i++) {
        s += '<path d="M ' + (44 + i * 19) + " 25 C " + (55 + i * 19) + " 30, " + (63 + i * 19) +
          " 34, " + (72 + i * 19) + ' 36" fill="none" stroke="#152430" stroke-width="1.6" opacity=".4"/>';
      }
      return tuna({ id: id, pal: P("#173347", "#93a7b6", "#f2f4f4", "#20415c", "#20415c", "#0d1c29",
        { bellyShade: "#9ea8ac" }), marks: s });
    },
    "Yellowtail": function (id) {
      return jack({ id: id, pal: P("#2b3f35", "#94a49c", "#f0f1ee", "#a3831f", "#b08c22", "#141d18",
        { band: "#b08c22", bellyShade: "#a2a69f" }) });
    },
    "Dorado": function (id) {
      return mahi({ id: id, pal: P("#186626", "#79a82f", "#e8ce3c", "#237a2c", "#2b8a33", "#0d3a15",
        { spot: "#2a5f95", bellyShade: "#c2a72e", sheen: "#f7f0c2" }) });
    },
    "Barracuda": function (id) {
      return cuda({ id: id, pal: P("#38434e", "#a4aeb7", "#f2f3f3", "#414c57", "#414c57", "#1a222b",
        { spot: "#1a222b", bellyShade: "#a0a6a9" }) });
    },
    "Calico Bass": function (id) {
      var m = '<g fill="#d5ccab" opacity=".4">' +
        '<rect x="46" y="31" width="10" height="12" rx="4"/><rect x="66" y="27" width="11" height="13" rx="4"/>' +
        '<rect x="88" y="31" width="11" height="13" rx="4"/><rect x="110" y="35" width="10" height="12" rx="4"/>' +
        '<rect x="56" y="52" width="10" height="11" rx="4"/><rect x="80" y="54" width="11" height="11" rx="4"/>' +
        '<rect x="104" y="54" width="10" height="11" rx="4"/><rect x="124" y="46" width="9" height="11" rx="4"/></g>';
      return bass({ id: id, pal: P("#1e2011", "#6d6742", "#d3caa4", "#26280f", "#26280f", "#0d0f07",
        { bellyShade: "#a09c7c", sheen: "#ece6cb" }), marks: m });
    },
    "Sand Bass": function (id) {
      var m = "";
      for (var i = 0; i < 5; i++) {
        m += '<rect x="' + (48 + i * 20) + '" y="27" width="8" height="38" rx="3" fill="#463f2c" opacity=".3"/>';
      }
      return bass({ id: id, pal: P("#453f2c", "#9a8e6c", "#e7ddbe", "#4a4431", "#4a4431", "#211e14",
        { bellyShade: "#aaa085", sheen: "#f4eed9" }), marks: m });
    },
    "Ocean Whitefish": function (id) {
      return bass({ id: id, pal: P("#574d36", "#a3966f", "#eae0bf", "#63583e", "#b09739", "#2b2619",
        { bellyShade: "#b2a88c", sheen: "#f6f0dc" }) });
    },
    "Rockfish": function (id) {
      return rock({ id: id, pal: P("#63160d", "#c4462a", "#f2bd93", "#761c10", "#761c10", "#320d07",
        { bellyShade: "#c88a63", sheen: "#ffe8d4" }) });
    },
    "California Halibut": function (id) {
      return flat({ id: id, pal: P("#282318", "#635a45", "#a89c7f", "#221e15", "#221e15", "#100e0a",
        { spot: "#14120d", bellyShade: "#857b63", sheen: "#d8cfb4" }) });
    },
    "Mako Shark": function (id) {
      return shark({ id: id, pal: P("#173a56", "#869cae", "#f4f5f5", "#1f4665", "#1f4665", "#0b1a26",
        { bellyShade: "#9fa7aa" }) });
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
