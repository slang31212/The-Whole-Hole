/* =========================================================
   Seaways MPSS — Family-office equity returns model
   Dependency-free. Type in a check size; it returns
   ownership, cash yield, IRR, MOIC, payback and a
   year-by-year distribution schedule. Editable + CSV.
   ========================================================= */
(function () {
  "use strict";

  var STORE_KEY = "mpss-invest-model-v1";

  /* ---- Default deal (illustrative placeholders) ---- */
  function defaultState() {
    return {
      assetCost: 600000000,   // all-in cost of one host
      debtPct: 55,            // debt share of the capital stack
      interestRate: 8,        // annual interest on debt (interest-only)
      netCharter: 94000000,   // net charter cash flow per year (after opex)
      holdYears: 10,          // years to exit / redeployment
      residualPct: 60,        // asset value at exit, % of cost
      yourCheck: 25000000     // the family office's equity commitment
    };
  }

  var state = load() || defaultState();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s.assetCost === "undefined") return null;
      return s;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---- Number helpers ---- */
  function toNum(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  }
  function fmtMoney(n) {
    n = Math.round(toNum(n));
    return "$" + n.toLocaleString("en-US");
  }
  function fmtShort(n) {
    n = toNum(n);
    var abs = Math.abs(n), sign = n < 0 ? "-" : "";
    if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
    if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 1e3) return sign + "$" + Math.round(abs / 1e3) + "k";
    return sign + "$" + Math.round(abs);
  }
  function fmtPct(n, dp) {
    if (!isFinite(n)) return "—";
    return (n * 100).toFixed(dp == null ? 1 : dp) + "%";
  }
  function clampPct(v) { v = toNum(v); return Math.max(0, Math.min(100, v)); }

  /* ---- IRR via bisection over a cash-flow array (annual) ---- */
  function npv(rate, cfs) {
    var v = 0;
    for (var t = 0; t < cfs.length; t++) v += cfs[t] / Math.pow(1 + rate, t);
    return v;
  }
  function irr(cfs) {
    // Need at least one negative and one positive flow.
    var hasNeg = false, hasPos = false;
    for (var i = 0; i < cfs.length; i++) {
      if (cfs[i] < 0) hasNeg = true;
      if (cfs[i] > 0) hasPos = true;
    }
    if (!hasNeg || !hasPos) return NaN;
    var lo = -0.9999, hi = 10; // -100% .. +1000%
    var fLo = npv(lo, cfs), fHi = npv(hi, cfs);
    if (fLo * fHi > 0) return NaN; // no sign change in range
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2;
      var fMid = npv(mid, cfs);
      if (Math.abs(fMid) < 1e-6) return mid;
      if (fLo * fMid < 0) { hi = mid; fHi = fMid; }
      else { lo = mid; fLo = fMid; }
    }
    return (lo + hi) / 2;
  }

  /* ---- Core economics ---- */
  function compute() {
    var assetCost = toNum(state.assetCost);
    var debtPct = clampPct(state.debtPct);
    var equityTotal = assetCost * (1 - debtPct / 100);
    var debt = assetCost * (debtPct / 100);
    var interest = debt * (toNum(state.interestRate) / 100);
    var hold = Math.max(1, Math.round(toNum(state.holdYears)));
    var netCharter = toNum(state.netCharter);

    // Project-level levered cash flow to equity, per year.
    var projLeveredCF = netCharter - interest;

    // Exit: asset residual less debt principal (interest-only => full debt repaid).
    var residual = assetCost * (toNum(state.residualPct) / 100);
    var exitEquity = residual - debt;

    // The family office's slice.
    var check = toNum(state.yourCheck);
    var ownership = equityTotal > 0 ? check / equityTotal : 0;
    var yourCF = projLeveredCF * ownership;       // per year
    var yourExit = exitEquity * ownership;
    var yourDistTotal = yourCF * hold;
    var yourTotalOut = yourDistTotal + yourExit;

    var cashYield = check > 0 ? yourCF / check : 0;   // annual cash-on-cash
    var moic = check > 0 ? yourTotalOut / check : 0;
    var payback = yourCF > 0 ? check / yourCF : Infinity;

    // Cash-flow vector for IRR: -check at t0, +yourCF y1..hold, +exit at hold.
    var cfs = [-check];
    for (var y = 1; y <= hold; y++) {
      cfs.push(yourCF + (y === hold ? yourExit : 0));
    }
    var rate = irr(cfs);

    // Year-by-year schedule for the family office.
    var schedule = [];
    var cum = 0;
    for (var yr = 1; yr <= hold; yr++) {
      var dist = yourCF + (yr === hold ? yourExit : 0);
      cum += dist;
      schedule.push({
        year: yr,
        dist: dist,
        cum: cum,
        net: cum - check,            // cumulative cash vs. capital in
        rocPct: check > 0 ? Math.min(1, cum / check) : 0,
        isExit: yr === hold
      });
    }

    return {
      equityTotal: equityTotal, debt: debt, interest: interest,
      projLeveredCF: projLeveredCF, residual: residual, exitEquity: exitEquity,
      check: check, ownership: ownership, yourCF: yourCF, yourExit: yourExit,
      yourDistTotal: yourDistTotal, yourTotalOut: yourTotalOut,
      cashYield: cashYield, moic: moic, payback: payback, irr: rate,
      hold: hold, schedule: schedule
    };
  }

  /* ---- DOM refs ---- */
  var $ = function (id) { return document.getElementById(id); };
  var inputs = {
    assetCost: $("asset-cost"),
    debtPct: $("debt-pct"),
    interestRate: $("interest-rate"),
    netCharter: $("net-charter"),
    holdYears: $("hold-years"),
    residualPct: $("residual-pct"),
    yourCheck: $("your-check")
  };
  var moneyFields = { assetCost: 1, netCharter: 1, yourCheck: 1 };

  /* ---- Wire inputs ---- */
  Object.keys(inputs).forEach(function (key) {
    var el = inputs[key];
    if (!el) return;
    el.addEventListener("focus", function () { el.select(); });
    el.addEventListener("input", function () {
      state[key] = toNum(el.value);
      render(false);
      save();
    });
    el.addEventListener("blur", function () { el.value = displayVal(key); });
  });
  function displayVal(key) {
    var v = toNum(state[key]);
    return moneyFields[key] ? v.toLocaleString("en-US") : String(v);
  }
  function fillInputs() {
    Object.keys(inputs).forEach(function (key) {
      if (inputs[key]) inputs[key].value = displayVal(key);
    });
  }

  /* ---- Check-size chips ---- */
  Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (chip) {
    chip.addEventListener("click", function () {
      state.yourCheck = toNum(chip.dataset.check);
      if (inputs.yourCheck) inputs.yourCheck.value = displayVal("yourCheck");
      render(true);
      save();
    });
  });

  /* ---- Toolbar ---- */
  $("reset-all").addEventListener("click", function () {
    if (!window.confirm("Reset the model back to the default deal assumptions?")) return;
    state = defaultState();
    render(true);
    save();
  });
  $("export-csv").addEventListener("click", exportCsv);

  /* ---- Render ---- */
  function render(refillInputs) {
    if (refillInputs) fillInputs();
    var m = compute();

    // Headline cards
    $("r-irr").textContent = isFinite(m.irr) ? fmtPct(m.irr, 1) : "—";
    $("r-yield").textContent = m.check > 0 ? fmtPct(m.cashYield, 1) : "—";
    $("r-yield-abs").textContent = m.check > 0 ? fmtShort(m.yourCF) + " / yr to you" : "—";
    $("r-moic").textContent = m.check > 0 ? m.moic.toFixed(2) + "x" : "—";
    $("r-payback").textContent = isFinite(m.payback) ? m.payback.toFixed(1) + " yr" : "—";
    $("r-own").textContent = m.check > 0 ? fmtPct(m.ownership, 1) : "—";
    $("r-own-sub").textContent = "of " + fmtShort(m.equityTotal) + " project equity";
    $("r-total").textContent = m.check > 0 ? fmtShort(m.yourTotalOut) : "—";

    // Contextual note
    var note = $("check-note");
    if (m.check <= 0) {
      note.textContent = "Enter a check size to model your position.";
    } else if (m.check > m.equityTotal) {
      note.textContent = "That's larger than the whole equity ticket (" + fmtShort(m.equityTotal) +
        ") — you'd anchor the deal, or take the platform. We can size a facility to fit.";
    } else {
      note.textContent = "A " + fmtShort(m.check) + " check buys " + fmtPct(m.ownership, 1) +
        " of the equity in a " + fmtShort(toNum(state.assetCost)) + " asset.";
    }

    // Negative-return guard styling on the hero card
    var heroCard = document.querySelector(".result-card-hero");
    if (heroCard) heroCard.classList.toggle("result-neg", isFinite(m.irr) && m.irr < 0);

    renderSchedule(m);
    renderChart(m);
  }

  function renderSchedule(m) {
    var body = $("schedule-body");
    body.innerHTML = "";
    m.schedule.forEach(function (row) {
      var tr = document.createElement("tr");
      if (row.isExit) tr.className = "row-exit";

      var yLabel = "Year " + row.year + (row.isExit ? " · exit" : "");
      tr.appendChild(td(yLabel, "col-name yr-label"));
      tr.appendChild(td(fmtMoney(row.dist), "calc-calc num"));
      tr.appendChild(td(fmtMoney(row.cum), "calc-calc num"));
      tr.appendChild(td(fmtMoney(row.net), "calc-calc num" + (row.net < 0 ? " neg" : " pos")));

      // Return-of-capital mini bar
      var tdRoc = document.createElement("td");
      tdRoc.className = "num roc-cell";
      var track = document.createElement("div");
      track.className = "roc-track";
      var bar = document.createElement("div");
      bar.className = "roc-bar";
      bar.style.width = (row.rocPct * 100).toFixed(1) + "%";
      if (row.rocPct >= 1) bar.classList.add("roc-full");
      track.appendChild(bar);
      var lbl = document.createElement("span");
      lbl.className = "roc-lbl";
      lbl.textContent = (row.rocPct * 100).toFixed(0) + "%";
      tdRoc.appendChild(track);
      tdRoc.appendChild(lbl);
      tr.appendChild(tdRoc);

      body.appendChild(tr);
    });
  }
  function td(text, cls) {
    var el = document.createElement("td");
    if (cls) el.className = cls;
    el.textContent = text;
    return el;
  }

  /* ---- Cumulative distributions chart (inline SVG) ---- */
  function renderChart(m) {
    var wrap = $("invest-chart");
    var W = 720, H = 240, padL = 58, padR = 16, padT = 18, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    var maxCum = m.check;
    m.schedule.forEach(function (r) { if (r.cum > maxCum) maxCum = r.cum; });
    if (maxCum <= 0) maxCum = 1;

    var n = m.schedule.length;
    var xFor = function (yr) { return padL + (n <= 1 ? plotW / 2 : (yr / n) * plotW); };
    var yFor = function (v) { return padT + plotH - (v / maxCum) * plotH; };

    // Build cumulative distribution area path (start at 0,0).
    var area = "M " + padL + " " + yFor(0);
    var line = "M " + padL + " " + yFor(0);
    m.schedule.forEach(function (r) {
      var x = xFor(r.year), y = yFor(r.cum);
      area += " L " + x.toFixed(1) + " " + y.toFixed(1);
      line += " L " + x.toFixed(1) + " " + y.toFixed(1);
    });
    area += " L " + xFor(n) + " " + yFor(0) + " Z";

    // Capital-invested reference line.
    var capY = yFor(m.check);

    // Gridlines (0, 50%, 100% of max) — labelled in $.
    var grids = "";
    [0, 0.5, 1].forEach(function (f) {
      var gy = padT + plotH - f * plotH;
      grids += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) +
        '" y2="' + gy.toFixed(1) + '" class="grid"/>' +
        '<text x="' + (padL - 8) + '" y="' + (gy + 4).toFixed(1) +
        '" class="gtxt" text-anchor="end">' + fmtShort(maxCum * f) + '</text>';
    });

    // X labels (year 0 and final).
    var xlabels = '<text x="' + padL + '" y="' + (H - 10) + '" class="gtxt" text-anchor="middle">Y0</text>' +
      '<text x="' + xFor(n) + '" y="' + (H - 10) + '" class="gtxt" text-anchor="middle">Y' + n + '</text>';

    // Exit marker (last point).
    var last = m.schedule[n - 1];
    var exitDot = '<circle cx="' + xFor(n) + '" cy="' + yFor(last.cum) + '" r="5" class="exit-dot"/>';

    var svg =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2ea3d9" stop-opacity="0.42"/>' +
      '<stop offset="1" stop-color="#2ea3d9" stop-opacity="0.04"/>' +
      '</linearGradient></defs>' +
      grids +
      '<path d="' + area + '" fill="url(#distFill)"/>' +
      '<path d="' + line + '" fill="none" class="dist-line"/>' +
      '<line x1="' + padL + '" y1="' + capY.toFixed(1) + '" x2="' + (W - padR) +
      '" y2="' + capY.toFixed(1) + '" class="cap-line"/>' +
      '<text x="' + (W - padR) + '" y="' + (capY - 6).toFixed(1) +
      '" class="captxt" text-anchor="end">Capital in · ' + fmtShort(m.check) + '</text>' +
      exitDot +
      xlabels +
      '</svg>';

    wrap.innerHTML = svg;
  }

  /* ---- CSV export ---- */
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportCsv() {
    var m = compute();
    var L = [];
    L.push(["Seaways MPSS — Family-office return model"].map(csvCell).join(","));
    L.push([].join(","));
    L.push(["Deal assumptions"].map(csvCell).join(","));
    L.push(["All-in asset cost", toNum(state.assetCost)].map(csvCell).join(","));
    L.push(["Debt (% of stack)", clampPct(state.debtPct)].map(csvCell).join(","));
    L.push(["Interest rate (%)", toNum(state.interestRate)].map(csvCell).join(","));
    L.push(["Net charter cash flow / yr", toNum(state.netCharter)].map(csvCell).join(","));
    L.push(["Hold (years)", m.hold].map(csvCell).join(","));
    L.push(["Residual at exit (%)", toNum(state.residualPct)].map(csvCell).join(","));
    L.push([].join(","));
    L.push(["Project equity", Math.round(m.equityTotal)].map(csvCell).join(","));
    L.push(["Project debt", Math.round(m.debt)].map(csvCell).join(","));
    L.push(["Exit equity value", Math.round(m.exitEquity)].map(csvCell).join(","));
    L.push([].join(","));
    L.push(["Your position"].map(csvCell).join(","));
    L.push(["Equity check", Math.round(m.check)].map(csvCell).join(","));
    L.push(["Ownership of equity (%)", (m.ownership * 100).toFixed(2)].map(csvCell).join(","));
    L.push(["Cash yield / yr (%)", (m.cashYield * 100).toFixed(2)].map(csvCell).join(","));
    L.push(["Distribution / yr", Math.round(m.yourCF)].map(csvCell).join(","));
    L.push(["Net IRR (%)", isFinite(m.irr) ? (m.irr * 100).toFixed(2) : ""].map(csvCell).join(","));
    L.push(["MOIC (x)", m.moic.toFixed(2)].map(csvCell).join(","));
    L.push(["Cash payback (yr)", isFinite(m.payback) ? m.payback.toFixed(1) : ""].map(csvCell).join(","));
    L.push(["Exit proceeds to you", Math.round(m.yourExit)].map(csvCell).join(","));
    L.push(["Total out to you", Math.round(m.yourTotalOut)].map(csvCell).join(","));
    L.push([].join(","));
    L.push(["Year", "Distribution", "Cumulative", "Net cash position", "Return of capital (%)"].map(csvCell).join(","));
    m.schedule.forEach(function (r) {
      L.push([
        r.year + (r.isExit ? " (exit)" : ""),
        Math.round(r.dist), Math.round(r.cum), Math.round(r.net),
        (r.rocPct * 100).toFixed(0)
      ].map(csvCell).join(","));
    });

    var blob = new Blob(["﻿" + L.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mpss-family-office-model.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- Go ---- */
  render(true);
})();
