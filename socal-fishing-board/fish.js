/* =========================================================
   Fish illustrations — inline SVG, no external assets.

   Each species is drawn side-on facing left in a 200x100
   viewBox, built from a small number of silhouette families
   (tuna, jack, mahi, barracuda, bass, rockfish, flatfish,
   shark) with per-species proportions, palette and markings.

   These are ILLUSTRATION, not data encoding — the colours
   depict the fish. Chart series colours come from the
   validated categorical palette and are kept separate.
   ========================================================= */
window.FISH = (function () {
  "use strict";

  function grad(id, top, mid, belly) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + top + '"/>' +
      '<stop offset="0.46" stop-color="' + mid + '"/>' +
      '<stop offset="1" stop-color="' + belly + '"/></linearGradient>';
  }

  function eye(x, y, r, dark) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#f7f4ec"/>' +
      '<circle cx="' + (x - r * 0.15) + '" cy="' + y + '" r="' + (r * 0.55) + '" fill="' + (dark || "#14181c") + '"/>' +
      '<circle cx="' + (x - r * 0.4) + '" cy="' + (y - r * 0.35) + '" r="' + (r * 0.18) + '" fill="#ffffff" opacity=".9"/>';
  }

  /* Row of finlets along the tail — the giveaway detail on tunas. */
  function finlets(x0, x1, yFn, n, up, fill) {
    var s = "", step = (x1 - x0) / n;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * step, y = yFn(x), h = up ? -6 : 6;
      s += '<path d="M ' + x + " " + y + " L " + (x + step * 0.62) + " " + (y + h * 0.9) +
        " L " + (x + step * 0.72) + " " + y + ' Z" fill="' + fill + '"/>';
    }
    return s;
  }

  /* ---------------- silhouette families ---------------- */

  function tuna(o) {
    var id = o.id, p = o.pal;
    return grad(id, p[0], p[1], p[2]) +
      /* first dorsal */
      '<path d="M 74 25 L 98 3 L 106 28 Z" fill="' + p[3] + '"/>' +
      /* second dorsal + anal, sickle on yellowfin */
      (o.sickle
        ? '<path d="M 116 27 C 128 10, 138 4, 146 2 C 138 14, 132 26, 130 33 Z" fill="' + p[4] + '"/>' +
          '<path d="M 116 73 C 128 90, 138 96, 146 98 C 138 86, 132 74, 130 67 Z" fill="' + p[4] + '"/>'
        : '<path d="M 116 28 L 133 15 L 137 33 Z" fill="' + p[3] + '"/>' +
          '<path d="M 116 72 L 133 85 L 137 67 Z" fill="' + p[3] + '"/>') +
      /* body */
      '<path d="M 12 55 C 24 35, 50 22, 80 21 C 114 21, 146 33, 163 50 C 146 67, 114 78, 80 78 C 50 77, 24 71, 12 55 Z" fill="url(#' + id + ')"/>' +
      (o.marks || "") +
      /* finlets */
      finlets(138, 160, function (x) { return 32 + (x - 138) * 0.42; }, 4, true, p[4]) +
      finlets(138, 160, function (x) { return 68 - (x - 138) * 0.42; }, 4, false, p[4]) +
      /* crescent tail */
      '<path d="M 159 44 L 197 18 C 187 34, 187 62, 197 82 L 159 56 C 168 52, 168 48, 159 44 Z" fill="' + p[4] + '"/>' +
      '<path d="M 40 29 C 47 45, 47 58, 39 73" fill="none" stroke="' + p[5] + '" stroke-width="1.6" opacity=".55"/>' +
      /* near-side pectoral, over the body */
      '<path d="M 58 56 C 72 62, 88 70, 100 76 C 84 74, 66 68, 55 60 Z" fill="' + p[5] + '" opacity=".55"/>' +
      eye(29, 48, 5);
  }

  function jack(o) {   /* yellowtail — longer, shallower than a tuna */
    var id = o.id, p = o.pal;
    return grad(id, p[0], p[1], p[2]) +
      '<path d="M 70 30 L 88 16 L 96 32 Z" fill="' + p[3] + '"/>' +
      '<path d="M 100 30 C 122 26, 146 34, 160 44 L 158 49 C 142 40, 120 33, 100 34 Z" fill="' + p[3] + '"/>' +
      '<path d="M 104 70 C 124 74, 142 80, 152 86 L 150 80 C 138 72, 122 68, 104 66 Z" fill="' + p[3] + '"/>' +
      '<path d="M 10 54 C 24 40, 52 29, 84 28 C 118 28, 148 37, 166 52 C 148 67, 118 76, 84 75 C 52 74, 24 68, 10 54 Z" fill="url(#' + id + ')"/>' +
      /* the yellow lateral stripe that names the fish */
      '<path d="M 16 54 C 40 47, 70 44, 100 45 C 128 46, 150 50, 164 53 C 150 56, 128 52, 100 51 C 70 50, 40 54, 16 56 Z" fill="' + p[4] + '" opacity=".92"/>' +
      '<path d="M 162 46 L 196 26 C 188 40, 188 62, 196 80 L 162 58 C 169 53, 169 51, 162 46 Z" fill="' + p[4] + '"/>' +
      '<path d="M 36 32 C 43 46, 43 58, 35 71" fill="none" stroke="' + p[5] + '" stroke-width="1.5" opacity=".5"/>' +
      '<path d="M 56 56 C 68 62, 82 69, 94 74 C 78 72, 62 66, 53 59 Z" fill="' + p[5] + '" opacity=".45"/>' +
      eye(26, 48, 4.6);
  }

  function mahi(o) {   /* dorado — blunt forehead, dorsal the length of the fish */
    var id = o.id, p = o.pal;
    return grad(id, p[0], p[1], p[2]) +
      '<path d="M 14 54 C 17 33, 30 19, 50 16 C 92 14, 140 30, 166 51 C 138 71, 96 81, 58 77 C 32 73, 15 66, 14 54 Z" fill="url(#' + id + ')"/>' +
      /* the crest-to-tail dorsal — the fish's signature, so it gets its own colour */
      '<path d="M 40 26 C 54 8, 84 3, 116 13 C 142 21, 162 37, 170 50 L 163 52 C 150 39, 130 25, 108 17 C 84 9, 56 14, 45 30 Z" fill="' + p[3] + '"/>' +
      '<path d="M 92 73 C 110 77, 126 83, 138 90 C 124 79, 108 73, 92 69 Z" fill="' + p[3] + '" opacity=".85"/>' +
      '<path d="M 54 60 C 64 68, 76 74, 86 78 C 72 76, 58 70, 51 62 Z" fill="' + p[5] + '" opacity=".4"/>' +
      /* the blue speckling */
      '<g fill="' + p[4] + '" opacity=".5">' +
      '<circle cx="60" cy="36" r="2.6"/><circle cx="78" cy="30" r="2.2"/><circle cx="96" cy="34" r="2.4"/>' +
      '<circle cx="70" cy="52" r="2.2"/><circle cx="92" cy="50" r="2.6"/><circle cx="112" cy="44" r="2.2"/>' +
      '<circle cx="112" cy="60" r="2.4"/><circle cx="130" cy="54" r="2.2"/><circle cx="52" cy="56" r="2"/></g>' +
      '<path d="M 164 46 L 197 20 C 189 36, 189 62, 197 84 L 164 56 C 171 52, 171 50, 164 46 Z" fill="' + p[4] + '"/>' +
      eye(30, 50, 5.2);
  }

  function cuda(o) {   /* barracuda — long, pointed, underslung jaw */
    var id = o.id, p = o.pal;
    return grad(id, p[0], p[1], p[2]) +
      '<path d="M 78 34 L 92 22 L 98 36 Z" fill="' + p[3] + '"/>' +
      '<path d="M 132 36 L 146 25 L 150 39 Z" fill="' + p[3] + '"/>' +
      '<path d="M 132 66 L 146 78 L 150 64 Z" fill="' + p[3] + '"/>' +
      '<path d="M 4 50 C 24 42, 44 38, 70 37 C 112 36, 152 41, 174 50 C 152 60, 112 66, 70 65 C 44 64, 24 59, 4 50 Z" fill="url(#' + id + ')"/>' +
      /* jaw line */
      '<path d="M 6 52 C 18 54, 30 55, 42 55" fill="none" stroke="' + p[5] + '" stroke-width="1.5" opacity=".6"/>' +
      '<g fill="' + p[4] + '" opacity=".5">' +
      '<rect x="60" y="42" width="3" height="8" rx="1.5"/><rect x="76" y="41" width="3" height="9" rx="1.5"/>' +
      '<rect x="92" y="41" width="3" height="9" rx="1.5"/><rect x="108" y="42" width="3" height="9" rx="1.5"/>' +
      '<rect x="124" y="43" width="3" height="8" rx="1.5"/><rect x="140" y="44" width="3" height="7" rx="1.5"/></g>' +
      '<path d="M 172 45 L 196 28 C 190 40, 190 60, 196 72 L 172 56 C 177 52, 177 49, 172 45 Z" fill="' + p[4] + '"/>' +
      eye(28, 46, 4.4);
  }

  function bass(o) {   /* calico, sand bass, whitefish — spiny dorsal, deeper body */
    var id = o.id, p = o.pal, spines = "";
    for (var i = 0; i < 8; i++) {
      var x = 58 + i * 8;
      spines += '<path d="M ' + x + " 24 L " + (x + 4) + " " + (10 + Math.abs(i - 3.5)) + " L " + (x + 8) + ' 25 Z" fill="' + p[3] + '"/>';
    }
    return grad(id, p[0], p[1], p[2]) +
      spines +
      '<path d="M 122 24 C 138 24, 152 33, 160 45 L 158 50 C 148 38, 136 30, 122 29 Z" fill="' + p[3] + '"/>' +
      '<path d="M 12 52 C 20 33, 42 21, 72 20 C 106 19, 138 32, 158 50 C 138 70, 106 80, 72 79 C 42 78, 20 68, 12 52 Z" fill="url(#' + id + ')"/>' +
      (o.marks || "") +
      '<path d="M 110 71 C 124 74, 134 79, 141 86 C 132 76, 122 71, 110 68 Z" fill="' + p[3] + '"/>' +
      /* truncate tail, only lightly forked */
      '<path d="M 157 44 L 190 30 C 184 42, 184 58, 190 72 L 157 57 C 163 53, 163 49, 157 44 Z" fill="' + p[4] + '"/>' +
      '<path d="M 40 28 C 48 44, 48 58, 39 74" fill="none" stroke="' + p[5] + '" stroke-width="1.6" opacity=".5"/>' +
      '<path d="M 54 54 C 64 63, 76 71, 86 76 C 72 73, 58 66, 51 58 Z" fill="' + p[5] + '" opacity=".5"/>' +
      eye(30, 44, 5.4);
  }

  function rock(o) {   /* rockfish — big head, big eye, heavy spines */
    var id = o.id, p = o.pal, spines = "";
    for (var i = 0; i < 9; i++) {
      var x = 52 + i * 7.5;
      spines += '<path d="M ' + x + " 22 L " + (x + 3.5) + " " + (6 + Math.abs(i - 4) * 1.6) + " L " + (x + 7.5) + ' 23 Z" fill="' + p[3] + '"/>';
    }
    return grad(id, p[0], p[1], p[2]) +
      spines +
      '<path d="M 120 22 C 136 24, 148 33, 156 46 L 154 51 C 144 38, 132 29, 119 27 Z" fill="' + p[3] + '"/>' +
      '<path d="M 10 48 C 18 28, 40 16, 70 15 C 104 14, 136 28, 156 48 C 136 70, 104 82, 70 81 C 40 80, 18 66, 10 48 Z" fill="url(#' + id + ')"/>' +
      '<path d="M 106 73 C 120 76, 131 81, 138 88 C 129 78, 118 73, 106 70 Z" fill="' + p[3] + '"/>' +
      '<path d="M 155 42 L 190 28 C 184 42, 184 56, 190 70 L 155 56 C 161 52, 161 47, 155 42 Z" fill="' + p[4] + '"/>' +
      /* gill-plate spine and the oversized eye */
      '<path d="M 42 26 C 50 42, 50 58, 40 76" fill="none" stroke="' + p[5] + '" stroke-width="1.8" opacity=".5"/>' +
      '<path d="M 40 44 L 50 40 L 48 48 Z" fill="' + p[5] + '" opacity=".6"/>' +
      '<path d="M 50 52 C 60 62, 72 70, 82 76 C 68 72, 55 65, 47 56 Z" fill="' + p[5] + '" opacity=".5"/>' +
      eye(28, 40, 7);
  }

  function flat(o) {   /* halibut — both eyes on one side, fins fringing the whole rim */
    var id = o.id, p = o.pal;
    return grad(id, p[0], p[1], p[2]) +
      /* fringing dorsal and anal fins, drawn as a rayed rim around the disc */
      '<path d="M 20 50 C 32 16, 76 4, 118 9 C 158 14, 184 33, 190 52 C 182 73, 148 90, 108 92 C 64 94, 30 79, 20 50 Z" fill="' + p[3] + '"/>' +
      (function () {
        var r = "", i, t, cx = 104, cy = 51, rx = 86, ry = 43;
        for (i = 0; i < 46; i++) {
          t = (i / 46) * Math.PI * 2;
          r += '<line x1="' + (cx + Math.cos(t) * rx * 0.9).toFixed(1) + '" y1="' + (cy + Math.sin(t) * ry * 0.9).toFixed(1) +
            '" x2="' + (cx + Math.cos(t) * rx).toFixed(1) + '" y2="' + (cy + Math.sin(t) * ry).toFixed(1) +
            '" stroke="' + p[5] + '" stroke-width="1.1" opacity=".5"/>';
        }
        return r;
      })() +
      '<path d="M 28 50 C 40 24, 78 13, 114 18 C 148 23, 172 38, 178 52 C 170 70, 142 82, 106 84 C 68 86, 37 74, 28 50 Z" fill="url(#' + id + ')"/>' +
      '<g fill="' + p[4] + '" opacity=".45">' +
      '<circle cx="72" cy="36" r="3.4"/><circle cx="100" cy="30" r="3"/><circle cx="128" cy="40" r="3.2"/>' +
      '<circle cx="86" cy="58" r="3"/><circle cx="116" cy="62" r="3.4"/><circle cx="146" cy="52" r="2.8"/>' +
      '<circle cx="60" cy="60" r="2.6"/></g>' +
      '<path d="M 184 44 L 197 30 C 192 42, 192 60, 197 72 L 184 58 Z" fill="' + p[4] + '"/>' +
      eye(52, 34, 5) + eye(50, 50, 4.6);
  }

  function shark(o) {   /* mako — conical snout, tall first dorsal, uneven crescent tail */
    var id = o.id, p = o.pal, gills = "";
    for (var i = 0; i < 5; i++) {
      gills += '<path d="M ' + (38 + i * 5) + " 42 C " + (36 + i * 5) + " 50, " + (36 + i * 5) +
        " 56, " + (39 + i * 5) + ' 62" fill="none" stroke="' + p[5] + '" stroke-width="1.3" opacity=".45"/>';
    }
    return grad(id, p[0], p[1], p[2]) +
      '<path d="M 78 34 L 96 6 L 110 36 Z" fill="' + p[3] + '"/>' +
      '<path d="M 128 62 L 138 74 L 142 60 Z" fill="' + p[3] + '"/>' +
      '<path d="M 132 36 L 142 28 L 145 39 Z" fill="' + p[3] + '"/>' +
      '<path d="M 6 52 C 24 40, 50 31, 82 30 C 116 30, 146 36, 164 46 C 150 58, 120 66, 84 67 C 50 66, 22 61, 6 52 Z" fill="url(#' + id + ')"/>' +
      gills +
      '<path d="M 10 53 C 18 61, 28 64, 38 63" fill="none" stroke="' + p[5] + '" stroke-width="1.6" opacity=".6"/>' +
      '<path d="M 62 58 C 76 68, 94 78, 110 84 C 90 79, 70 70, 59 61 Z" fill="' + p[5] + '" opacity=".55"/>' +
      '<path d="M 162 42 L 190 8 C 186 26, 186 44, 194 54 C 184 60, 176 68, 172 78 L 162 56 C 168 52, 168 47, 162 42 Z" fill="' + p[4] + '"/>' +
      eye(26, 46, 4.2);
  }

  /* ---------------- species ---------------- */

  var SPECIES = {
    "Bluefin Tuna": function (id) {
      return tuna({ id: id, pal: ["#12305a", "#5f87ad", "#e6ecf1", "#173a63", "#1d4674", "#0d2340"],
        marks: '<path d="M 20 52 C 60 44, 110 46, 158 52 C 110 56, 60 58, 20 56 Z" fill="#8fa9be" opacity=".45"/>' });
    },
    "Yellowfin Tuna": function (id) {
      return tuna({ id: id, sickle: true,
        pal: ["#153b6b", "#6f97bd", "#eef1f2", "#1c4a7c", "#f2b418", "#0e2a4d"],
        marks: '<path d="M 20 54 C 62 47, 112 49, 160 54 C 112 59, 62 60, 20 58 Z" fill="#f2c93f" opacity=".7"/>' });
    },
    "Bonito": function (id) {
      var s = "";
      for (var i = 0; i < 6; i++) {
        s += '<path d="M ' + (44 + i * 19) + " 24 C " + (56 + i * 19) + " 30, " + (64 + i * 19) +
          " 34, " + (74 + i * 19) + ' 36" fill="none" stroke="#0e2c50" stroke-width="2.4" opacity=".55"/>';
      }
      return tuna({ id: id, pal: ["#1a3f6a", "#7ea2c0", "#eef2f4", "#1e4470", "#22507f", "#122e52"], marks: s });
    },
    "Yellowtail": function (id) {
      return jack({ id: id, pal: ["#2c4a52", "#8aa3a8", "#f0f2ef", "#d8a72a", "#e0b12c", "#1c343a"] });
    },
    "Dorado": function (id) {
      return mahi({ id: id, pal: ["#1f7a3d", "#8dc63f", "#f4d743", "#2f8f47", "#2a6fb5", "#155c2c"] });
    },
    "Barracuda": function (id) {
      return cuda({ id: id, pal: ["#4a5b66", "#aebac2", "#f2f4f4", "#5b6d78", "#334452", "#26333d"] });
    },
    "Calico Bass": function (id) {
      var m = '<g fill="#f3ecdc" opacity=".55">' +
        '<rect x="46" y="30" width="11" height="13" rx="4"/><rect x="66" y="26" width="12" height="14" rx="4"/>' +
        '<rect x="88" y="30" width="12" height="14" rx="4"/><rect x="110" y="34" width="11" height="13" rx="4"/>' +
        '<rect x="56" y="52" width="11" height="12" rx="4"/><rect x="80" y="54" width="12" height="12" rx="4"/>' +
        '<rect x="104" y="54" width="11" height="12" rx="4"/><rect x="126" y="46" width="10" height="12" rx="4"/></g>';
      return bass({ id: id, pal: ["#2f3324", "#6d6f4c", "#d9d3b4", "#3c4029", "#2b2e20", "#1d2016"], marks: m });
    },
    "Sand Bass": function (id) {
      var m = "";
      for (var i = 0; i < 5; i++) {
        m += '<rect x="' + (48 + i * 20) + '" y="26" width="9" height="40" rx="4" fill="#4a4432" opacity=".45"/>';
      }
      return bass({ id: id, pal: ["#6a6247", "#a99b75", "#eee6cf", "#7a7154", "#5d5540", "#3f3a2b"], marks: m });
    },
    "Ocean Whitefish": function (id) {
      return bass({ id: id, pal: ["#8a7f5e", "#c3b48a", "#f4efdf", "#9a8e69", "#e0c96b", "#5f5741"] });
    },
    "Rockfish": function (id) {
      return rock({ id: id, pal: ["#a81d18", "#e34b28", "#f6b28c", "#c4291c", "#d33a22", "#7d130f"] });
    },
    "California Halibut": function (id) {
      return flat({ id: id, pal: ["#4a4436", "#7d7360", "#c8bfa8", "#3d382d", "#2d2a22", "#22201a"] });
    },
    "Mako Shark": function (id) {
      return shark({ id: id, pal: ["#1d4a7a", "#6d94b8", "#f0f2f2", "#23548a", "#1a4270", "#123153"] });
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
