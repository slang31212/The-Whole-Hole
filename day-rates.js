/* =========================================================
   Seaways MPSS — Day-rate model
   A small, dependency-free spreadsheet-style calculator.
   Edit day rates, swap tenants in/out, export to CSV.
   ========================================================= */
(function () {
  "use strict";

  var STORE_KEY = "mpss-day-rate-model-v1";

  /* ---- Preset tenant library (illustrative defaults, all editable) ---- */
  var PRESETS = [
    { name: "Oil production host (FPSO)", dayRate: 350000, termYears: 8,  utilPct: 92, opexDay: 70000 },
    { name: "Drilling support",           dayRate: 300000, termYears: 3,  utilPct: 85, opexDay: 65000 },
    { name: "Offshore wind turbine install", dayRate: 180000, termYears: 2, utilPct: 80, opexDay: 55000 },
    { name: "Offshore data center",       dayRate: 220000, termYears: 10, utilPct: 95, opexDay: 60000 },
    { name: "Power generation",           dayRate: 160000, termYears: 10, utilPct: 90, opexDay: 45000 },
    { name: "CCS / carbon storage",       dayRate: 200000, termYears: 12, utilPct: 90, opexDay: 50000 },
    { name: "Green hydrogen",             dayRate: 210000, termYears: 10, utilPct: 88, opexDay: 55000 },
    { name: "Accommodation / flotel",     dayRate: 120000, termYears: 2,  utilPct: 80, opexDay: 40000 }
  ];

  /* ---- Default model shown on first visit ---- */
  function defaultState() {
    return {
      capex: 45000000,
      daysYear: 365,
      rows: [
        makeRow(PRESETS[0]),
        makeRow(PRESETS[3]),
        makeRow(PRESETS[2])
      ]
    };
  }

  var _id = 0;
  function makeRow(preset) {
    return {
      id: "r" + (++_id) + "_" + Date.now().toString(36),
      name: preset.name,
      dayRate: preset.dayRate,
      termYears: preset.termYears,
      utilPct: preset.utilPct,
      opexDay: preset.opexDay,
      enabled: true
    };
  }

  /* ---- State load / save ---- */
  var state = load() || defaultState();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.rows)) return null;
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
  function fmtMoneyShort(n) {
    n = toNum(n);
    var abs = Math.abs(n);
    if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
    if (abs >= 1e6) return "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 1e3) return "$" + Math.round(n / 1e3) + "k";
    return "$" + Math.round(n);
  }
  function fmtInt(n) { return Math.round(toNum(n)).toLocaleString("en-US"); }

  /* ---- Per-row economics ---- */
  function calcRow(row) {
    var onHireDays = toNum(state.daysYear) * (toNum(row.utilPct) / 100);
    var revYear = toNum(row.dayRate) * onHireDays;
    var opexYear = toNum(row.opexDay) * onHireDays;
    var netYear = revYear - opexYear;
    var netTerm = netYear * toNum(row.termYears);
    var payback = netYear > 0 ? toNum(state.capex) / netYear : Infinity;
    return {
      onHireDays: onHireDays,
      revYear: revYear,
      netYear: netYear,
      netTerm: netTerm,
      payback: payback
    };
  }

  /* ---- DOM refs ---- */
  var body = document.getElementById("rate-body");
  var presetSelect = document.getElementById("preset-select");
  var capexInput = document.getElementById("capex");
  var daysYearInput = document.getElementById("days-year");
  var emptyNote = document.getElementById("empty-note");
  var compareWrap = document.getElementById("compare-bars");

  /* ---- Populate preset dropdown ---- */
  PRESETS.forEach(function (p, i) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });

  /* ---- Build a spreadsheet cell input ---- */
  function cell(row, field, opts) {
    opts = opts || {};
    var td = document.createElement("td");
    td.className = "col-in" + (opts.money ? " col-money" : "");
    var wrap = td;
    if (opts.money) {
      wrap = document.createElement("div");
      wrap.className = "input-money";
      var pre = document.createElement("span");
      pre.className = "prefix";
      pre.textContent = "$";
      wrap.appendChild(pre);
      td.appendChild(wrap);
    }
    var input = document.createElement("input");
    input.type = "text";
    input.setAttribute("inputmode", opts.decimal ? "decimal" : "numeric");
    input.className = "calc-num";
    input.value = displayVal(row[field], opts);
    input.setAttribute("aria-label", opts.label || field);
    input.addEventListener("focus", function () { input.select(); });
    input.addEventListener("input", function () {
      row[field] = toNum(input.value);
      recompute();
      save();
    });
    input.addEventListener("blur", function () {
      input.value = displayVal(row[field], opts);
    });
    wrap.appendChild(input);
    return td;
  }
  function displayVal(v, opts) {
    if (opts && opts.money) return toNum(v).toLocaleString("en-US");
    return String(toNum(v));
  }

  /* ---- Render a single tenant row ---- */
  function renderRow(row) {
    var tr = document.createElement("tr");
    tr.dataset.id = row.id;
    if (!row.enabled) tr.className = "row-off";

    // On/off toggle
    var tdOn = document.createElement("td");
    tdOn.className = "col-on";
    var chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!row.enabled;
    chk.setAttribute("aria-label", "Include " + row.name + " in totals");
    chk.addEventListener("change", function () {
      row.enabled = chk.checked;
      render();
      save();
    });
    tdOn.appendChild(chk);
    tr.appendChild(tdOn);

    // Name (editable)
    var tdName = document.createElement("td");
    tdName.className = "col-name";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "calc-name-input";
    nameInput.value = row.name;
    nameInput.setAttribute("aria-label", "Tenant name");
    nameInput.addEventListener("input", function () {
      row.name = nameInput.value;
      recompute();
      save();
    });
    tdName.appendChild(nameInput);
    tr.appendChild(tdName);

    // Editable inputs
    tr.appendChild(cell(row, "dayRate", { money: true, label: "Day rate" }));
    tr.appendChild(cell(row, "termYears", { decimal: true, label: "Term in years" }));
    tr.appendChild(cell(row, "utilPct", { decimal: true, label: "Utilisation percent" }));
    tr.appendChild(cell(row, "opexDay", { money: true, label: "Operating cost per day" }));

    // Computed columns
    var c = calcRow(row);
    tr.appendChild(calcCell(fmtMoney(c.revYear)));
    tr.appendChild(calcCell(fmtMoney(c.netYear), c.netYear < 0 ? "neg" : ""));
    tr.appendChild(calcCell(fmtMoney(c.netTerm), c.netTerm < 0 ? "neg" : ""));
    tr.appendChild(calcCell(c.payback === Infinity ? "—" : c.payback.toFixed(1) + " yr"));

    // Remove
    var tdX = document.createElement("td");
    tdX.className = "col-x";
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "row-remove";
    rm.innerHTML = "&times;";
    rm.setAttribute("aria-label", "Remove " + row.name);
    rm.title = "Remove tenant";
    rm.addEventListener("click", function () {
      state.rows = state.rows.filter(function (r) { return r.id !== row.id; });
      render();
      save();
    });
    tdX.appendChild(rm);
    tr.appendChild(tdX);

    return tr;
  }
  function calcCell(text, cls) {
    var td = document.createElement("td");
    td.className = "num calc-calc" + (cls ? " " + cls : "");
    td.textContent = text;
    return td;
  }

  /* ---- Recompute only the computed cells + totals (no full re-render) ---- */
  function recompute() {
    Array.prototype.forEach.call(body.querySelectorAll("tr"), function (tr) {
      var row = state.rows.find(function (r) { return r.id === tr.dataset.id; });
      if (!row) return;
      var c = calcRow(row);
      var calcCells = tr.querySelectorAll(".calc-calc");
      // order: rev, net, termnet, payback
      if (calcCells[0]) calcCells[0].textContent = fmtMoney(c.revYear);
      if (calcCells[1]) { calcCells[1].textContent = fmtMoney(c.netYear); calcCells[1].classList.toggle("neg", c.netYear < 0); }
      if (calcCells[2]) { calcCells[2].textContent = fmtMoney(c.netTerm); calcCells[2].classList.toggle("neg", c.netTerm < 0); }
      if (calcCells[3]) calcCells[3].textContent = c.payback === Infinity ? "—" : c.payback.toFixed(1) + " yr";
    });
    updateTotals();
    renderCompare();
  }

  /* ---- Totals across ENABLED tenants (blended average book) ---- */
  function updateTotals() {
    var active = state.rows.filter(function (r) { return r.enabled; });
    var sumRev = 0, sumNet = 0, sumTermNet = 0, sumRate = 0, sumUtil = 0;
    active.forEach(function (r) {
      var c = calcRow(r);
      sumRev += c.revYear;
      sumNet += c.netYear;
      sumTermNet += c.netTerm;
      sumRate += toNum(r.dayRate);
      sumUtil += toNum(r.utilPct);
    });
    var n = active.length;
    var payback = sumNet > 0 ? toNum(state.capex) / sumNet : Infinity;

    document.getElementById("t-dayrate").textContent = n ? "avg " + fmtMoney(sumRate / n) : "—";
    document.getElementById("t-util").textContent = n ? "avg " + (sumUtil / n).toFixed(0) + "%" : "—";
    document.getElementById("t-rev").textContent = n ? fmtMoney(sumRev) : "—";
    document.getElementById("t-net").textContent = n ? fmtMoney(sumNet) : "—";
    document.getElementById("t-termnet").textContent = n ? fmtMoney(sumTermNet) : "—";
    document.getElementById("t-payback").textContent = n && payback !== Infinity ? payback.toFixed(1) + " yr" : "—";
  }

  /* ---- Comparison bars (net revenue per year) ---- */
  function renderCompare() {
    compareWrap.innerHTML = "";
    if (!state.rows.length) {
      compareWrap.innerHTML = '<p class="hull-note" style="margin:0;">Add tenants to compare.</p>';
      return;
    }
    var max = 0;
    state.rows.forEach(function (r) {
      var net = calcRow(r).netYear;
      if (net > max) max = net;
    });
    if (max <= 0) max = 1;

    state.rows.forEach(function (r) {
      var c = calcRow(r);
      var pct = Math.max(0, (c.netYear / max) * 100);

      var item = document.createElement("div");
      item.className = "compare-item" + (r.enabled ? "" : " compare-off");

      var label = document.createElement("div");
      label.className = "compare-label";
      label.textContent = r.name || "Unnamed";
      item.appendChild(label);

      var track = document.createElement("div");
      track.className = "compare-track";
      var bar = document.createElement("div");
      bar.className = "compare-bar";
      bar.style.width = pct.toFixed(1) + "%";
      track.appendChild(bar);
      item.appendChild(track);

      var val = document.createElement("div");
      val.className = "compare-val";
      val.textContent = fmtMoneyShort(c.netYear) + "/yr";
      item.appendChild(val);

      compareWrap.appendChild(item);
    });
  }

  /* ---- Full render ---- */
  function render() {
    body.innerHTML = "";
    state.rows.forEach(function (row) {
      body.appendChild(renderRow(row));
    });
    emptyNote.hidden = state.rows.length > 0;
    capexInput.value = toNum(state.capex).toLocaleString("en-US");
    daysYearInput.value = String(toNum(state.daysYear));
    updateTotals();
    renderCompare();
  }

  /* ---- Toolbar wiring ---- */
  document.getElementById("add-preset").addEventListener("click", function () {
    var i = parseInt(presetSelect.value, 10);
    if (isNaN(i) || !PRESETS[i]) return;
    state.rows.push(makeRow(PRESETS[i]));
    render();
    save();
  });
  document.getElementById("add-blank").addEventListener("click", function () {
    state.rows.push(makeRow({ name: "New tenant", dayRate: 0, termYears: 5, utilPct: 90, opexDay: 0 }));
    render();
    save();
  });
  document.getElementById("reset-all").addEventListener("click", function () {
    if (!window.confirm("Reset the whole model back to the default tenants and rates? Your edits will be lost.")) return;
    state = defaultState();
    render();
    save();
  });
  capexInput.addEventListener("input", function () {
    state.capex = toNum(capexInput.value);
    recompute();
    save();
  });
  capexInput.addEventListener("blur", function () {
    capexInput.value = toNum(state.capex).toLocaleString("en-US");
  });
  daysYearInput.addEventListener("input", function () {
    state.daysYear = toNum(daysYearInput.value);
    recompute();
    save();
  });

  /* ---- CSV export (opens in Excel / Google Sheets) ---- */
  document.getElementById("export-csv").addEventListener("click", exportCsv);
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportCsv() {
    var lines = [];
    lines.push(["Seaways MPSS — Day-rate model"].map(csvCell).join(","));
    lines.push([].join(","));
    lines.push(["CAPEX", toNum(state.capex)].map(csvCell).join(","));
    lines.push(["On-hire days/year (max)", toNum(state.daysYear)].map(csvCell).join(","));
    lines.push([].join(","));
    lines.push([
      "Included", "Tenant / use case", "Day rate ($/day)", "Term (years)",
      "Utilisation (%)", "Operating cost ($/day)", "On-hire days/yr",
      "Revenue/yr ($)", "Net/yr ($)", "Net over term ($)", "Payback (yr)"
    ].map(csvCell).join(","));

    state.rows.forEach(function (r) {
      var c = calcRow(r);
      lines.push([
        r.enabled ? "Yes" : "No",
        r.name,
        toNum(r.dayRate),
        toNum(r.termYears),
        toNum(r.utilPct),
        toNum(r.opexDay),
        Math.round(c.onHireDays),
        Math.round(c.revYear),
        Math.round(c.netYear),
        Math.round(c.netTerm),
        c.payback === Infinity ? "" : c.payback.toFixed(1)
      ].map(csvCell).join(","));
    });

    // Totals row (active tenants)
    var active = state.rows.filter(function (r) { return r.enabled; });
    var sumRev = 0, sumNet = 0, sumTermNet = 0;
    active.forEach(function (r) {
      var c = calcRow(r);
      sumRev += c.revYear; sumNet += c.netYear; sumTermNet += c.netTerm;
    });
    var payback = sumNet > 0 ? toNum(state.capex) / sumNet : "";
    lines.push([].join(","));
    lines.push([
      "", "TOTAL (active tenants)", "", "", "", "", "",
      Math.round(sumRev), Math.round(sumNet), Math.round(sumTermNet),
      payback === "" ? "" : payback.toFixed(1)
    ].map(csvCell).join(","));

    var csv = lines.join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mpss-day-rate-model.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- Go ---- */
  render();
})();
