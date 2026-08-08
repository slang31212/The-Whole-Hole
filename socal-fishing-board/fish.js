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

  /* Staggered arcs read as scales at tile size without turning to noise.
     Paired with scaleMask() so the field is densest on the mid-flank and dies
     out at the head, belly and peduncle — a flat tiled grid reads as wallpaper. */
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

  function eye(x, y, r, p, blurId) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.5) + '" fill="' + p.line +
        '" opacity=".5" filter="url(#' + blurId + ')"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.iris + '"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.58) + '" fill="' + p.pupil + '"/>' +
      '<circle cx="' + (x - r * 0.28) + '" cy="' + (y - r * 0.3) + '" r="' + (r * 0.3) +
        '" fill="#ffffff" opacity=".22" filter="url(#' + blurId + ')"/>';
  }

  /* A fin is a membrane carried on rays that fan from its base. Median fins sit
     over the tile, not over the body, so translucency there just composites them
     into the background — they stay near-opaque. Only the near pectoral, which
     lies across the flank, passes a low `op`. */
  function fin(f, p) {
    var s = '<path d="' + f.d + '" fill="' + (f.fill || p.fin) + '" fill-opacity="' +
      (f.op || 0.94) + '"/>';
    if (f.base && f.tips) {
      for (var i = 0; i < f.tips.length; i++) {
        s += '<line x1="' + f.base[0] + '" y1="' + f.base[1] + '" x2="' + f.tips[i][0] +
          '" y2="' + f.tips[i][1] + '" stroke="' + p.line +
          '" stroke-width=".4" opacity=".2" stroke-linecap="round"/>';
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
        ' Z" fill="' + p.finlet + '" fill-opacity=".82"/>';
    }
    return s;
  }

  /* The shared assembly. Everything species-specific arrives in `o`. */
  function plate(o) {
    var id = o.id, p = o.pal;
    var G = id + "g", S = id + "s", C = id + "c", F = id + "f";
    var M = id + "m", T = id + "t", I = id + "i", E = id + "e";
    var sh = o.shading || {};

    var defs = "<defs>" +
      grad(G, p) +
      scales(S, p.line, o.scale || 5, o.scaleOp || 0.4) +
      '<clipPath id="' + C + '"><path d="' + o.body + '"/></clipPath>' +
      /* scale field is masked to the mid-flank so it fades out at the extremities */
      '<radialGradient id="' + M + '" cx="' + ((sh.sx != null ? sh.sx : 84) / 200) +
        '" cy="0.5" r="0.62">' +
        '<stop offset="0" stop-color="#fff" stop-opacity="1"/>' +
        '<stop offset="0.55" stop-color="#fff" stop-opacity=".75"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<mask id="' + T + '"><rect x="-10" y="-10" width="220" height="120" fill="url(#' + M + ')"/></mask>' +
      /* faint iridescence — what keeps a gradient from reading as plastic */
      '<linearGradient id="' + I + '" x1="0" y1="0" x2="0.15" y2="1">' +
        '<stop offset="0" stop-color="#5ad7ff" stop-opacity=".10"/>' +
        '<stop offset="0.45" stop-color="#b98cff" stop-opacity=".05"/>' +
        '<stop offset="0.75" stop-color="#ffd88a" stop-opacity=".07"/>' +
        '<stop offset="1" stop-color="#ffb27a" stop-opacity=".04"/></linearGradient>' +
      '<filter id="' + F + '" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feGaussianBlur stdDeviation="' + (o.blur || 4.5) + '"/>' +
      "</filter>" +
      '<filter id="' + E + '" x="-70%" y="-70%" width="240%" height="240%">' +
        '<feGaussianBlur stdDeviation="1.1"/>' +
      "</filter>" +
      "</defs>";

    var behind = (o.finsBehind || []).map(function (f) { return fin(f, p); }).join("");
    var front = (o.finsFront || []).map(function (f) { return fin(f, p); }).join("");

    /* Volume: a dark wash along the dorsal, a specular band on the flank, a
       bounce along the belly, ambient occlusion where fins insert, and a soft
       inner rim standing in for the outline — all blurred, all clipped. */
    var ao = (o.ao || []).map(function (a) {
      return '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="' + (a[2] || 9) +
        '" ry="' + (a[3] || 6) + '" fill="' + p.line + '" opacity="' + (a[4] || 0.3) +
        '" filter="url(#' + F + ')"/>';
    }).join("");

    var volume =
      '<rect x="-10" y="-10" width="220" height="120" fill="url(#' + S + ')" mask="url(#' + T + ')"/>' +
      (o.marks || "") +
      '<rect x="-10" y="-10" width="220" height="120" fill="url(#' + I + ')"/>' +
      '<ellipse cx="' + (sh.dx != null ? sh.dx : 92) + '" cy="' + (sh.dy != null ? sh.dy : 14) +
        '" rx="' + (sh.drx || 92) + '" ry="' + (sh.dry || 20) + '" fill="' + p.back +
        '" opacity="' + (sh.dop || 0.7) + '" filter="url(#' + F + ')"/>' +
      '<ellipse cx="' + (sh.sx != null ? sh.sx : 84) + '" cy="' + (sh.sy != null ? sh.sy : 45) +
        '" rx="' + (sh.srx || 58) + '" ry="' + (sh.sry || 6) + '" fill="' + p.sheen +
        '" opacity="' + (sh.sop || 0.5) + '" filter="url(#' + F + ')"/>' +
      '<ellipse cx="' + (sh.bx != null ? sh.bx : 84) + '" cy="' + (sh.by != null ? sh.by : 92) +
        '" rx="' + (sh.brx || 74) + '" ry="' + (sh.bry || 15) + '" fill="' + p.bellyShade +
        '" opacity="' + (sh.bop || 0.4) + '" filter="url(#' + F + ')"/>' +
      ao +
      /* rim light catching the dorsal contour */
      (o.rim ? '<path d="' + o.rim + '" fill="none" stroke="' + p.sheen +
        '" stroke-width="3.5" opacity=".3" filter="url(#' + F + ')"/>' : "") +
      /* the inner rim shadow that replaces the keyline: a wide dark stroke on the
         silhouette, blurred, clipped — the body falling away from the light */
      '<path d="' + o.body + '" fill="none" stroke="' + p.line + '" stroke-width="8" ' +
        'opacity="' + (o.rimOp || 0.42) + '" filter="url(#' + F + ')"/>';

    return defs + behind +
      '<path d="' + o.body + '" fill="url(#' + G + ')"/>' +
      '<g clip-path="url(#' + C + ')">' + volume + "</g>" +
      front + (o.details || "") +
      eye(o.eye[0], o.eye[1], o.eye[2], p, E);
  }

  /* ---------------- silhouette families ----------------
     Anatomy first. The tell that made the earlier pass read as clip art was
     the body meeting the tail at full depth: a real fish narrows hard to a
     thin caudal peduncle before the fan opens. Snouts come to a point, the
     dorsal and ventral profiles differ, and fins have curved leading edges
     with concave trailing edges rather than straight sides. */

  function tuna(o) {
    var p = o.pal;
    /* torpedo: pointed snout, greatest depth a third back, wrist at x=156 */
    var B = "M 8 53 C 15 40, 31 25, 56 21 C 87 17, 117 26, 139 38 " +
            "C 147 42, 152 45, 156 48 C 152 55, 147 58, 139 62 " +
            "C 117 74, 87 82, 56 77 C 31 73, 15 66, 8 53 Z";
    return plate({
      id: o.id, pal: p, scale: 3.4, scaleOp: 0.3, blur: 5,
      body: B,
      rim: "M 18 44 C 28 32, 46 24, 70 21 C 100 18, 128 26, 150 39",
      ao: [[60, 27, 12, 5, .3], [116, 31, 10, 5, .26], [116, 68, 10, 5, .22], [56, 58, 13, 6, .26]],
      shading: { dx: 78, dy: 15, drx: 82, dry: 20, sx: 74, sy: 44, srx: 54, by: 92, brx: 66, bry: 18 },
      finsBehind: [
        /* first dorsal — curved leading edge, concave trailing */
        { d: "M 54 22 C 61 11, 71 4, 83 1 C 78 10, 74 18, 72 27 Z",
          base: [58, 23], tips: [[80, 4], [76, 11], [73, 20]] },
        o.sickle
          ? { d: "M 108 29 C 121 15, 134 7, 143 4 C 134 17, 126 29, 122 36 Z",
              fill: p.finlet, base: [110, 30], tips: [[140, 7], [132, 16], [126, 26]] }
          : { d: "M 108 29 C 115 22, 124 17, 132 15 C 126 21, 121 27, 119 34 Z",
              base: [110, 30], tips: [[129, 17], [124, 23]] },
        o.sickle
          ? { d: "M 108 70 C 121 85, 134 93, 143 96 C 134 83, 126 71, 122 64 Z",
              fill: p.finlet, base: [110, 69], tips: [[140, 93], [132, 84], [126, 74]] }
          : { d: "M 108 70 C 115 77, 124 82, 132 84 C 126 78, 121 72, 119 66 Z",
              base: [110, 69], tips: [[129, 82], [124, 76]] },
        /* lunate caudal, opening from the wrist */
        { d: "M 154 44 C 166 38, 180 24, 193 9 C 187 26, 184 39, 183 51 " +
             "C 184 62, 187 75, 193 91 C 180 76, 166 62, 154 56 C 158 52, 158 48, 154 44 Z",
          base: [156, 50], tips: [[189, 15], [186, 28], [184, 40], [184, 62], [187, 78], [190, 86]] }
      ],
      marks: o.marks || "",
      finsFront: [
        /* pectoral — long and swept, the way a tuna carries it */
        { d: "M 50 56 C 61 62, 77 72, 95 81 C 82 76, 65 68, 48 60 Z", op: 0.6,
          base: [50, 57], tips: [[92, 79], [84, 73], [72, 66]] }
      ],
      details:
        finlets(134, 152, function (x) { return 32 + (x - 134) * 0.5; }, 4, true, p) +
        finlets(134, 152, function (x) { return 68 - (x - 134) * 0.5; }, 4, false, p) +
        /* the lateral keel on the wrist */
        '<path d="M 146 48 L 156 49 L 146 51 Z" fill="' + p.finlet + '" opacity=".8"/>' +
        '<path d="M 146 55 L 156 53 L 146 58 Z" fill="' + p.finlet + '" opacity=".8"/>' +
        '<path d="M 34 41 C 70 45, 110 50, 152 51" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".24"/>' +
        '<path d="M 33 26 C 42 40, 42 58, 32 71" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".32"/>' +
        '<path d="M 8 53 C 15 58, 23 60, 31 60" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>',
      eye: [24, 46, 3.3]
    });
  }

  function jack(o) {   /* yellowtail — leaner than a tuna, forked not lunate */
    var p = o.pal;
    var B = "M 6 52 C 14 42, 30 30, 56 27 C 90 24, 124 32, 148 44 " +
            "C 155 47, 159 49, 162 51 C 159 54, 155 56, 148 59 " +
            "C 124 70, 90 77, 56 74 C 30 71, 14 62, 6 52 Z";
    return plate({
      id: o.id, pal: p, scale: 3.2, scaleOp: 0.28, blur: 4.5,
      body: B,
      rim: "M 16 46 C 28 37, 48 31, 74 28 C 106 26, 134 33, 156 45",
      ao: [[62, 31, 11, 5, .26], [56, 57, 12, 5, .22]],
      shading: { dx: 80, dy: 20, drx: 86, dry: 18, sx: 76, sy: 46, srx: 58, sry: 5, by: 88, brx: 70, bry: 14 },
      finsBehind: [
        { d: "M 56 28 C 63 20, 72 15, 80 13 C 74 19, 69 25, 67 32 Z",
          base: [59, 29], tips: [[77, 15], [72, 21]] },
        { d: "M 84 26 C 106 24, 132 32, 152 44 L 150 48 C 132 37, 108 30, 84 30 Z" },
        { d: "M 92 68 C 114 71, 134 77, 148 85 L 146 79 C 132 71, 114 66, 92 64 Z" },
        { d: "M 160 47 L 192 27 C 187 38, 185 48, 185 52 C 185 57, 187 68, 192 80 " +
             "L 160 57 C 164 54, 164 50, 160 47 Z",
          fill: p.finlet, base: [162, 52], tips: [[189, 31], [186, 42], [186, 64], [189, 74]] }
      ],
      marks: '<path d="M 14 51 C 42 44, 74 41, 104 42 C 132 43, 154 47, 164 50 C 154 53, 132 50, 104 49 C 74 48, 42 52, 14 54 Z" fill="' + p.band + '" opacity=".78"/>',
      finsFront: [
        { d: "M 50 54 C 60 60, 74 68, 88 75 C 76 71, 61 64, 48 58 Z", op: 0.58,
          base: [50, 55], tips: [[85, 73], [78, 68], [68, 62]] }
      ],
      details:
        '<path d="M 30 31 C 38 43, 38 58, 29 69" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".3"/>' +
        '<path d="M 6 52 C 13 57, 20 59, 27 59" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>',
      eye: [21, 46, 3]
    });
  }

  function mahi(o) {   /* dorado — vertical forehead, dorsal from crest to wrist */
    var p = o.pal;
    var B = "M 10 54 C 11 36, 22 20, 44 15 C 84 8, 130 26, 158 47 " +
            "C 161 49, 163 50, 164 51 C 161 54, 157 57, 150 61 " +
            "C 122 76, 76 82, 46 76 C 24 71, 10 65, 10 54 Z";
    return plate({
      id: o.id, pal: p, scale: 3.2, scaleOp: 0.24, blur: 5,
      body: B,
      rim: "M 14 47 C 16 33, 26 22, 46 18 C 84 12, 128 29, 153 46",
      ao: [[70, 20, 22, 6, .24], [52, 61, 11, 5, .22]],
      shading: { dx: 80, dy: 16, drx: 80, dry: 20, sx: 66, sy: 42, srx: 46, by: 86, brx: 62, bry: 16, bop: 0.3 },
      finsBehind: [],
      marks:
        '<g fill="' + p.spot + '" opacity=".32">' +
        '<circle cx="58" cy="34" r="2"/><circle cx="76" cy="28" r="1.7"/><circle cx="96" cy="33" r="1.9"/>' +
        '<circle cx="68" cy="50" r="1.7"/><circle cx="90" cy="48" r="2"/><circle cx="112" cy="44" r="1.7"/>' +
        '<circle cx="112" cy="60" r="1.8"/><circle cx="130" cy="55" r="1.6"/><circle cx="50" cy="55" r="1.5"/></g>',
      finsFront: [
        { d: "M 38 20 C 52 4, 88 0, 124 16 C 146 26, 160 40, 166 49 L 160 51 " +
             "C 150 40, 130 27, 108 19 C 82 10, 52 12, 43 26 Z",
          op: 0.88, base: [62, 16], tips: [[52, 6], [72, 2], [96, 7], [122, 20], [146, 36], [160, 46]] },
        { d: "M 84 72 C 104 76, 122 82, 134 90 C 122 79, 106 72, 84 68 Z" },
        { d: "M 162 47 L 193 24 C 188 35, 186 47, 186 52 C 186 58, 188 70, 193 84 " +
             "L 162 56 C 166 53, 166 50, 162 47 Z",
          base: [164, 51], tips: [[190, 28], [187, 40], [187, 66], [190, 78]] },
        { d: "M 46 60 C 56 67, 68 73, 78 78 C 66 75, 52 69, 44 63 Z", op: 0.58,
          base: [46, 61], tips: [[75, 76], [68, 72], [60, 67]] }
      ],
      details:
        '<path d="M 28 30 C 35 44, 35 58, 27 68" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".3"/>' +
        '<path d="M 11 58 C 17 62, 23 63, 29 63" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>',
      eye: [24, 48, 3.3]
    });
  }

  function cuda(o) {   /* barracuda — pike-like, jaw past the eye, forked tail */
    var p = o.pal;
    var B = "M 2 51 C 18 45, 36 41, 62 39 C 106 36, 150 41, 172 48 " +
            "C 175 49, 177 50, 178 51 C 175 53, 172 55, 166 57 " +
            "C 140 62, 100 65, 62 63 C 36 61, 18 57, 2 51 Z";
    return plate({
      id: o.id, pal: p, scale: 2.8, scaleOp: 0.28, blur: 3.4,
      body: B,
      rim: "M 12 47 C 30 42, 50 39, 76 38 C 116 37, 150 41, 170 47",
      ao: [[76, 39, 10, 4, .22], [134, 42, 9, 4, .2]],
      shading: { dx: 92, dy: 30, drx: 96, dry: 12, sx: 88, sy: 46, srx: 76, sry: 4, by: 72, brx: 82, bry: 9, bop: 0.28 },
      finsBehind: [
        { d: "M 70 38 C 77 30, 85 26, 92 25 C 87 30, 82 35, 80 40 Z",
          base: [72, 39], tips: [[89, 27], [84, 32]] },
        { d: "M 128 41 C 135 34, 143 30, 149 29 C 144 34, 140 39, 138 44 Z" },
        { d: "M 128 61 C 135 68, 143 72, 149 73 C 144 68, 140 63, 138 58 Z" },
        { d: "M 176 47 L 195 33 C 192 40, 191 48, 191 51 C 191 55, 192 63, 195 70 " +
             "L 176 56 C 179 53, 179 50, 176 47 Z",
          base: [178, 51], tips: [[192, 36], [191, 43], [191, 60], [192, 66]] }
      ],
      marks:
        '<g fill="' + p.spot + '" opacity=".36">' +
        '<path d="M 54 42 l 4 0 l -2 8 l -4 0 Z"/><path d="M 70 41 l 4 0 l -2 9 l -4 0 Z"/>' +
        '<path d="M 86 41 l 4 0 l -2 9 l -4 0 Z"/><path d="M 102 42 l 4 0 l -2 9 l -4 0 Z"/>' +
        '<path d="M 118 43 l 4 0 l -2 8 l -4 0 Z"/><path d="M 134 44 l 3 0 l -2 7 l -3 0 Z"/></g>',
      finsFront: [
        { d: "M 44 54 C 52 59, 62 64, 72 68 C 61 66, 50 61, 42 57 Z", op: 0.55,
          base: [44, 55], tips: [[69, 67], [62, 63]] }
      ],
      details:
        /* the jaw runs well past the eye — the fish's signature */
        '<path d="M 3 53 C 14 57, 26 58, 38 58" fill="none" stroke="' + p.line + '" stroke-width=".85" opacity=".55"/>' +
        '<path d="M 26 43 C 33 49, 33 53, 25 59" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".32"/>' +
        '<path d="M 34 48 C 76 50, 128 52, 174 51" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".24"/>',
      eye: [20, 47, 2.7]
    });
  }

  function bass(o) {   /* calico, sand bass, whitefish — deep body, thick wrist */
    var p = o.pal, spines = "";
    var B = "M 8 51 C 13 34, 33 20, 62 18 C 96 16, 128 30, 148 46 " +
            "C 151 48, 153 49, 154 50 C 151 53, 148 56, 142 60 " +
            "C 120 74, 92 81, 62 79 C 33 77, 13 66, 8 51 Z";
    for (var i = 0; i < 9; i++) {
      var x = 50 + i * 7.4, h = 10 + Math.abs(i - 4) * 0.8;
      spines += '<path d="M ' + x + " 23 L " + (x + 3.4) + " " + (23 - h) + " L " + (x + 7) +
        ' 24 Z" fill="' + p.fin + '" fill-opacity=".72"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 6, scaleOp: 0.32, blur: 5,
      body: B,
      rim: "M 14 44 C 20 31, 38 21, 64 19 C 94 18, 124 30, 144 45",
      ao: [[84, 24, 30, 6, .26], [48, 55, 12, 5, .22], [106, 70, 10, 4, .2]],
      shading: { dx: 74, dy: 14, drx: 80, dry: 20, sx: 66, sy: 42, srx: 48, by: 90, brx: 64, bry: 17, bop: 0.34 },
      finsBehind: [
        { d: "M 114 24 C 130 26, 142 34, 150 46 L 147 50 C 138 39, 126 31, 113 29 Z" },
        { d: "M 152 45 L 184 31 C 180 39, 179 48, 179 51 C 179 55, 180 63, 184 71 " +
             "L 152 57 C 156 54, 156 49, 152 45 Z",
          base: [154, 51], tips: [[181, 34], [180, 42], [180, 61], [181, 67]] }
      ],
      marks: o.marks || "",
      finsFront: [
        { d: "M 100 72 C 114 75, 124 80, 131 87 C 122 77, 112 72, 100 69 Z" },
        { d: "M 44 53 C 54 61, 65 68, 74 73 C 61 70, 49 64, 41 57 Z", op: 0.56,
          base: [44, 54], tips: [[72, 72], [66, 68], [58, 63]] }
      ],
      details: spines +
        '<path d="M 32 28 C 41 43, 41 58, 31 71" fill="none" stroke="' + p.line + '" stroke-width=".85" opacity=".34"/>' +
        '<path d="M 34 39 C 68 42, 110 46, 148 49" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".24"/>' +
        '<path d="M 9 54 C 16 59, 24 61, 31 61" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>',
      eye: [24, 41, 3.5]
    });
  }

  function rock(o) {   /* rockfish — heavy head, huge eye, hard spines */
    var p = o.pal, spines = "";
    var B = "M 6 47 C 12 28, 33 15, 62 14 C 95 13, 126 27, 146 45 " +
            "C 149 47, 151 48, 152 49 C 149 52, 146 55, 140 59 " +
            "C 118 73, 90 81, 62 80 C 33 79, 12 65, 6 47 Z";
    for (var i = 0; i < 10; i++) {
      var x = 44 + i * 7, h = 11 + Math.abs(i - 4.5) * 1.1;
      spines += '<path d="M ' + x + " 21 L " + (x + 3) + " " + (21 - h) + " L " + (x + 6.6) +
        ' 22 Z" fill="' + p.fin + '" fill-opacity=".75"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 6.4, scaleOp: 0.3, blur: 5,
      body: B,
      rim: "M 12 41 C 18 27, 38 17, 64 15 C 94 14, 122 27, 142 44",
      ao: [[80, 22, 32, 6, .26], [44, 53, 12, 5, .22], [102, 72, 10, 4, .2]],
      shading: { dx: 70, dy: 10, drx: 78, dry: 20, sx: 62, sy: 38, srx: 44, by: 90, brx: 62, bry: 18, bop: 0.34 },
      marks: o.marks || "",
      finsBehind: [
        { d: "M 112 22 C 128 24, 140 33, 148 46 L 145 50 C 136 38, 124 29, 111 27 Z" },
        { d: "M 150 43 L 183 29 C 179 38, 178 47, 178 51 C 178 55, 179 63, 183 70 " +
             "L 150 55 C 154 52, 154 47, 150 43 Z",
          base: [152, 49], tips: [[180, 32], [179, 41], [179, 60], [180, 66]] }
      ],
      finsFront: [
        { d: "M 96 74 C 110 77, 120 82, 127 89 C 118 79, 108 74, 96 71 Z" },
        { d: "M 40 51 C 50 60, 61 67, 70 72 C 57 69, 45 63, 37 55 Z", op: 0.56,
          base: [40, 52], tips: [[68, 71], [62, 67], [54, 62]] }
      ],
      details: spines +
        '<path d="M 34 25 C 43 41, 43 58, 32 73" fill="none" stroke="' + p.line + '" stroke-width=".95" opacity=".36"/>' +
        '<path d="M 32 42 L 43 38 L 41 46 Z" fill="' + p.fin + '" fill-opacity=".8"/>' +
        '<path d="M 32 37 C 66 40, 108 44, 146 47" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".22"/>' +
        '<path d="M 7 50 C 14 56, 22 58, 29 58" fill="none" stroke="' + p.line + '" stroke-width=".8" opacity=".5"/>',
      eye: [23, 38, 4.6]
    });
  }

  function flat(o) {   /* halibut — eyed side up, fins fringing the whole disc */
    var p = o.pal, fringe = "", i, t, cx = 100, cy = 51, rx = 78, ry = 36;
    var EB = o.id + "e";   /* same blur filter plate() defines, for the second eye */
    for (i = 0; i < 66; i++) {
      t = (i / 66) * Math.PI * 2;
      fringe += '<line x1="' + (cx + Math.cos(t) * rx * 0.96).toFixed(1) + '" y1="' + (cy + Math.sin(t) * ry * 0.96).toFixed(1) +
        '" x2="' + (cx + Math.cos(t) * (rx + 6)).toFixed(1) + '" y2="' + (cy + Math.sin(t) * (ry + 6)).toFixed(1) +
        '" stroke="' + p.line + '" stroke-width=".55" opacity=".3"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 5, scaleOp: 0.24, blur: 6,
      rim: "M 32 44 C 44 26, 78 17, 112 21 C 142 25, 162 37, 172 49",
      ao: [[100, 18, 34, 6, .2], [100, 84, 32, 6, .18]],
      /* the disc narrows to a real wrist before the tail, like any other fish */
      body: "M 24 52 C 34 24, 70 12, 108 16 C 142 20, 164 34, 172 48 " +
            "C 174 50, 175 51, 176 51 C 174 53, 171 55, 166 57 " +
            "C 150 71, 112 84, 78 84 C 44 84, 28 72, 24 52 Z",
      shading: { dx: 96, dy: 20, drx: 76, dry: 24, dop: 0.4, sx: 88, sy: 42, srx: 44, sry: 9, sop: 0.34, by: 92, brx: 66, bry: 18, bop: 0.3 },
      finsBehind: [
        { d: "M 19 52 C 30 19, 68 6, 110 11 C 148 16, 170 32, 179 49 " +
             "C 172 66, 150 78, 110 89 C 66 92, 24 78, 19 52 Z", op: 0.5 }
      ],
      marks:
        '<g fill="' + p.spot + '" opacity=".3">' +
        '<circle cx="70" cy="37" r="2.6"/><circle cx="98" cy="31" r="2.2"/><circle cx="126" cy="41" r="2.4"/>' +
        '<circle cx="84" cy="58" r="2.2"/><circle cx="114" cy="62" r="2.6"/><circle cx="144" cy="50" r="2"/>' +
        '<circle cx="58" cy="60" r="1.9"/><circle cx="92" cy="46" r="1.8"/></g>',
      finsFront: [
        { d: "M 174 46 L 195 31 C 191 40, 190 49, 190 52 C 190 56, 191 64, 195 72 " +
             "L 174 57 C 178 54, 178 49, 174 46 Z",
          base: [176, 51], tips: [[192, 34], [191, 43], [191, 61], [192, 68]] }
      ],
      details: fringe +
        '<path d="M 29 46 C 37 40, 43 38, 49 38" fill="none" stroke="' + p.line + '" stroke-width=".75" opacity=".42"/>' +
        eye(43, 49, 3.1, p, EB),
      eye: [45, 34, 3.3]
    });
  }

  function shark(o) {   /* mako — conical snout, tall dorsal, longer upper lobe */
    var p = o.pal, gills = "";
    var B = "M 4 51 C 18 42, 44 33, 78 32 C 112 32, 142 38, 158 45 " +
            "C 161 46, 163 47, 164 48 C 161 51, 157 54, 150 57 " +
            "C 126 64, 96 68, 70 67 C 40 65, 16 58, 4 51 Z";
    for (var i = 0; i < 5; i++) {
      gills += '<path d="M ' + (34 + i * 4.4) + " 41 C " + (32 + i * 4.4) + " 47, " + (32 + i * 4.4) +
        " 53, " + (35 + i * 4.4) + ' 58" fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".36"/>';
    }
    return plate({
      id: o.id, pal: p, scale: 2.6, scaleOp: 0.18, blur: 5,
      body: B,
      rim: "M 12 47 C 28 39, 52 34, 82 33 C 112 33, 140 38, 158 45",
      ao: [[88, 34, 14, 5, .26], [58, 58, 13, 5, .24]],
      shading: { dx: 86, dy: 26, drx: 90, dry: 15, sx: 80, sy: 44, srx: 62, sry: 5, by: 74, brx: 74, bry: 11, bop: 0.28 },
      finsBehind: [
        { d: "M 72 34 C 80 18, 90 8, 98 5 C 100 17, 103 28, 108 37 Z",
          base: [76, 34], tips: [[96, 8], [99, 17], [104, 28]] },
        { d: "M 120 62 C 128 70, 135 74, 140 75 C 135 69, 131 63, 130 59 Z" },
        { d: "M 126 39 C 133 33, 139 30, 143 30 C 139 34, 136 38, 135 42 Z" },
        { d: "M 162 43 L 190 6 C 187 22, 186 38, 191 50 C 184 55, 176 63, 171 74 " +
             "L 162 55 C 166 52, 166 47, 162 43 Z",
          base: [164, 49], tips: [[188, 12], [187, 28], [178, 62], [173, 70]] }
      ],
      marks: "",
      finsFront: [
        { d: "M 56 57 C 70 66, 88 76, 104 83 C 86 78, 66 69, 54 60 Z", op: 0.66,
          base: [56, 58], tips: [[101, 82], [93, 77], [82, 71]] }
      ],
      details: gills +
        '<path d="M 6 52 C 14 59, 24 62, 34 61" fill="none" stroke="' + p.line + '" stroke-width=".85" opacity=".5"/>' +
        '<path d="M 36 49 C 76 52, 122 54, 158 51" fill="none" stroke="' + p.line + '" stroke-width=".5" opacity=".22"/>',
      eye: [21, 45, 2.6]
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
      return tuna({ id: id, pal: P("#132434", "#8ea3b4", "#f4f6f6", "#33587c", "#a8913f", "#0c1520",
        { bellyShade: "#9aa4a8" }) });
    },
    "Yellowfin Tuna": function (id) {
      return tuna({ id: id, sickle: true,
        pal: P("#16304a", "#8fa4b4", "#f2f4f4", "#36638a", "#d9ad2a", "#0d1c2b",
          { bellyShade: "#9da7ab" }),
        marks: '<path d="M 22 52 C 64 46, 114 48, 159 53 C 114 58, 64 59, 22 57 Z" fill="#c9a63f" opacity=".5"/>' });
    },
    "Bonito": function (id) {
      var s = "";
      for (var i = 0; i < 6; i++) {
        s += '<path d="M ' + (44 + i * 19) + " 25 C " + (55 + i * 19) + " 30, " + (63 + i * 19) +
          " 34, " + (72 + i * 19) + ' 36" fill="none" stroke="#152430" stroke-width="1.6" opacity=".4"/>';
      }
      return tuna({ id: id, pal: P("#173347", "#93a7b6", "#f2f4f4", "#356187", "#356187", "#0d1c29",
        { bellyShade: "#9ea8ac" }), marks: s });
    },
    "Yellowtail": function (id) {
      return jack({ id: id, pal: P("#2b3f35", "#94a49c", "#f0f1ee", "#a3831f", "#b08c22", "#141d18",
        { band: "#b08c22", bellyShade: "#a2a69f" }) });
    },
    "Dorado": function (id) {
      return mahi({ id: id, pal: P("#186626", "#79a82f", "#e8ce3c", "#12706b", "#158079", "#0d3a15",
        { spot: "#2a5f95", bellyShade: "#c2a72e", sheen: "#f7f0c2" }) });
    },
    "Barracuda": function (id) {
      return cuda({ id: id, pal: P("#38434e", "#a4aeb7", "#f2f3f3", "#5c6b79", "#5c6b79", "#1a222b",
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
    "Sculpin": function (id) {
      var m = '<g fill="#4a2a1c" opacity=".3">' +
        '<ellipse cx="56" cy="34" rx="7" ry="5"/><ellipse cx="80" cy="28" rx="8" ry="5"/>' +
        '<ellipse cx="104" cy="34" rx="7" ry="5"/><ellipse cx="70" cy="52" rx="8" ry="5"/>' +
        '<ellipse cx="98" cy="56" rx="7" ry="5"/><ellipse cx="124" cy="46" rx="6" ry="4"/></g>';
      return rock({ id: id, pal: P("#5e3222", "#a2704b", "#dcb289", "#6d3b26", "#6d3b26", "#33180f",
        { bellyShade: "#bf9068", sheen: "#ffe0c4" }), marks: m });
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
      return shark({ id: id, pal: P("#173a56", "#869cae", "#f4f5f5", "#34618a", "#34618a", "#0b1a26",
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
