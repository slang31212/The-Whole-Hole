/* =========================================================
   Seaways MPSS — The Menu
   One basic barge, fitted à la carte for 7–8 disciplines.
   Pick a discipline (a recipe of adders), tune the adders,
   set a fleet size, and the per-vessel and fleet economics
   recompute live. Dependency-free; saved in this browser.
   ========================================================= */
(function () {
  "use strict";

  var STORE_KEY = "mpss-menu-config-v1";

  /* ---- The basic barge (base hull, editable) ---- */
  var BASE_DEFAULT = { capex: 140000000, dayRate: 55000 };

  /* ---- À la carte adder library --------------------------------
     Each module is a priced fit-out package. capex is the build /
     lease-in adder; dayRate is the charter uplift it commands.
     ------------------------------------------------------------- */
  var ADDERS = [
    { id: "dp2",     name: "DP2 dynamic positioning",     note: "Redundant thrusters & station-keeping for open-water work.", capex: 22000000, dayRate: 9000 },
    { id: "jackup",  name: "Jack-up / elevating system",  note: "Four legs and jacking gear for a stable elevated deck.",     capex: 48000000, dayRate: 14000 },
    { id: "turbine", name: "Turbine handling package",    note: "Main-lift rigging, blade racks and nacelle handling frame.", capex: 26000000, dayRate: 12000 },
    { id: "mccrane", name: "Heavy-lift crane upgrade",    note: "Motion-compensated crane for components at height.",         capex: 55000000, dayRate: 16000 },
    { id: "hvdc",    name: "HVDC converter module",       note: "Skidded converter package for export-voltage tie-in.",       capex: 70000000, dayRate: 18000 },
    { id: "bess",    name: "BESS energy-storage pack",    note: "Containerised battery banks with grid-forming inverters.",   capex: 45000000, dayRate: 11000 },
    { id: "cable",   name: "Cable-lay spread",            note: "Carousel, tensioners and quadrant for inter-array / export.", capex: 38000000, dayRate: 13000 },
    { id: "rov",     name: "ROV & survey suite",          note: "Work-class ROV, launch system and survey sensors.",          capex: 12000000, dayRate: 6000 },
    { id: "landing", name: "Landing package",             note: "Helideck plus motion-compensated walk-to-work gangway.",     capex: 18000000, dayRate: 7000 },
    { id: "accom",   name: "Accommodation module",        note: "Berths, galley and HVAC for an offshore crew.",              capex: 20000000, dayRate: 8000 }
  ];

  /* ---- Disciplines: each is a recipe of adder ids -------------- */
  var DISCIPLINES = [
    { id: "wtiv",   name: "Turbine installation",   tag: "WTIV",     adders: ["jackup", "turbine", "mccrane", "dp2"] },
    { id: "found",  name: "Foundation / monopile",  tag: "Install",  adders: ["jackup", "mccrane", "dp2", "rov"] },
    { id: "cable",  name: "Cable lay",              tag: "Array + export", adders: ["dp2", "cable", "rov"] },
    { id: "hvdc",   name: "HVDC substation landing",tag: "Grid tie-in", adders: ["dp2", "hvdc", "mccrane", "landing"] },
    { id: "bess",   name: "Floating BESS",          tag: "Storage",  adders: ["bess", "dp2"] },
    { id: "sov",    name: "O&M / service (SOV)",    tag: "Operations", adders: ["dp2", "landing", "accom", "rov"] },
    { id: "decom",  name: "Heavy-lift / decom",     tag: "Removal",  adders: ["jackup", "mccrane", "dp2", "rov"] },
    { id: "flotel", name: "Accommodation / flotel", tag: "Landing",  adders: ["dp2", "accom", "landing"] }
  ];

  /* ---- Default configuration (first visit) --------------------
     "About 8 just turbine vessels" — a fleet of 8, fitted WTIV.
     ------------------------------------------------------------- */
  function defaultState() {
    var picked = {};
    ADDERS.forEach(function (a) { picked[a.id] = false; });
    DISCIPLINES[0].adders.forEach(function (id) { picked[id] = true; });
    var caps = {}, rates = {};
    ADDERS.forEach(function (a) { caps[a.id] = a.capex; rates[a.id] = a.dayRate; });
    return {
      base: { capex: BASE_DEFAULT.capex, dayRate: BASE_DEFAULT.dayRate },
      discipline: "wtiv",
      picked: picked,
      caps: caps,
      rates: rates,
      fleet: 8,
      daysYear: 365,
      utilPct: 85
    };
  }

  /* ---- State load / save ---- */
  var state = load() || defaultState();

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!s || !s.picked || !s.caps || !s.rates || !s.base) return null;
      // Backfill any adders added since the config was saved.
      ADDERS.forEach(function (a) {
        if (typeof s.picked[a.id] !== "boolean") s.picked[a.id] = false;
        if (typeof s.caps[a.id] !== "number") s.caps[a.id] = a.capex;
        if (typeof s.rates[a.id] !== "number") s.rates[a.id] = a.dayRate;
      });
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
  function fmtMoney(n) { return "$" + Math.round(toNum(n)).toLocaleString("en-US"); }
  function fmtShort(n) {
    n = toNum(n); var abs = Math.abs(n);
    if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
    if (abs >= 1e6) return "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 1e3) return "$" + Math.round(n / 1e3) + "k";
    return "$" + Math.round(n);
  }

  /* ---- Economics ---- */
  function perVessel() {
    var capex = toNum(state.base.capex), dayRate = toNum(state.base.dayRate);
    ADDERS.forEach(function (a) {
      if (state.picked[a.id]) {
        capex += toNum(state.caps[a.id]);
        dayRate += toNum(state.rates[a.id]);
      }
    });
    return { capex: capex, dayRate: dayRate };
  }
  function fleetEcon() {
    var pv = perVessel();
    var qty = Math.max(0, Math.round(toNum(state.fleet)));
    var onHire = toNum(state.daysYear) * (toNum(state.utilPct) / 100);
    var annualPer = pv.dayRate * onHire;
    return {
      pv: pv,
      qty: qty,
      capex: pv.capex * qty,
      dayRate: pv.dayRate * qty,
      annualPer: annualPer,
      annualFleet: annualPer * qty
    };
  }
  function disciplineById(id) {
    return DISCIPLINES.filter(function (d) { return d.id === id; })[0] || null;
  }
  function matchesDiscipline(d) {
    if (!d) return false;
    return ADDERS.every(function (a) {
      var want = d.adders.indexOf(a.id) !== -1;
      return !!state.picked[a.id] === want;
    });
  }

  /* ---- DOM refs ---- */
  var elChips   = document.getElementById("discipline-chips");
  var elMenu    = document.getElementById("adder-menu");
  var elBaseCap = document.getElementById("base-capex");
  var elBaseDay = document.getElementById("base-dayrate");
  var elFleet   = document.getElementById("fleet-qty");
  var elDays    = document.getElementById("days-year");
  var elUtil    = document.getElementById("util-pct");

  /* ---- Discipline chips ---- */
  function renderChips() {
    elChips.innerHTML = "";
    DISCIPLINES.forEach(function (d) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "menu-chip" + (state.discipline === d.id && matchesDiscipline(d) ? " is-on" : "");
      btn.innerHTML = '<span class="menu-chip-name">' + d.name + '</span>' +
                      '<span class="menu-chip-tag">' + d.tag + '</span>';
      btn.addEventListener("click", function () {
        state.discipline = d.id;
        ADDERS.forEach(function (a) { state.picked[a.id] = d.adders.indexOf(a.id) !== -1; });
        render(); save();
      });
      elChips.appendChild(btn);
    });
  }

  /* ---- Money input builder (shared) ---- */
  function moneyInput(value, onInput, aria) {
    var wrap = document.createElement("div");
    wrap.className = "input-money";
    var pre = document.createElement("span");
    pre.className = "prefix"; pre.textContent = "$";
    var input = document.createElement("input");
    input.type = "text";
    input.setAttribute("inputmode", "numeric");
    input.className = "calc-num";
    input.value = toNum(value).toLocaleString("en-US");
    if (aria) input.setAttribute("aria-label", aria);
    input.addEventListener("focus", function () { input.select(); });
    input.addEventListener("input", function () { onInput(toNum(input.value)); });
    input.addEventListener("blur", function () { input.value = toNum(input.value).toLocaleString("en-US"); });
    wrap.appendChild(pre); wrap.appendChild(input);
    return wrap;
  }

  /* ---- The menu of adders ---- */
  function renderMenu() {
    elMenu.innerHTML = "";
    ADDERS.forEach(function (a) {
      var on = !!state.picked[a.id];
      var item = document.createElement("div");
      item.className = "menu-item" + (on ? " is-on" : "");

      // Toggle + name/note
      var left = document.createElement("label");
      left.className = "menu-item-main";
      var chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "menu-check";
      chk.checked = on;
      chk.setAttribute("aria-label", "Add " + a.name);
      chk.addEventListener("change", function () {
        state.picked[a.id] = chk.checked;
        // Once you go off-recipe, we no longer claim a named discipline.
        render(); save();
      });
      var txt = document.createElement("div");
      txt.className = "menu-item-text";
      txt.innerHTML = '<span class="menu-item-name">' + a.name + '</span>' +
                      '<span class="menu-item-note">' + a.note + '</span>';
      left.appendChild(chk); left.appendChild(txt);
      item.appendChild(left);

      // Prices (editable)
      var prices = document.createElement("div");
      prices.className = "menu-item-prices";

      var pcap = document.createElement("div");
      pcap.className = "menu-price-field";
      pcap.innerHTML = '<span class="menu-price-lbl">Fit-out</span>';
      pcap.appendChild(moneyInput(state.caps[a.id], function (v) {
        state.caps[a.id] = v; recompute(); save();
      }, a.name + " fit-out cost"));

      var pday = document.createElement("div");
      pday.className = "menu-price-field";
      pday.innerHTML = '<span class="menu-price-lbl">Day-rate uplift</span>';
      pday.appendChild(moneyInput(state.rates[a.id], function (v) {
        state.rates[a.id] = v; recompute(); save();
      }, a.name + " day-rate uplift"));

      prices.appendChild(pcap); prices.appendChild(pday);
      item.appendChild(prices);

      elMenu.appendChild(item);
    });
  }

  /* ---- Results ---- */
  function renderResults() {
    var f = fleetEcon();
    var d = disciplineById(state.discipline);
    var label = matchesDiscipline(d) && d ? d.name : "Custom fit-out";

    setText("r-config", label);
    setText("r-count", ADDERS.filter(function (a) { return state.picked[a.id]; }).length + " modules");
    setText("r-vessel-capex", fmtMoney(f.pv.capex));
    setText("r-vessel-day", fmtMoney(f.pv.dayRate));
    setText("r-fleet-qty", f.qty + (f.qty === 1 ? " vessel" : " vessels"));
    setText("r-fleet-capex", fmtShort(f.capex));
    setText("r-fleet-day", fmtShort(f.dayRate));
    setText("r-fleet-annual", fmtShort(f.annualFleet));
  }
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  /* ---- Recompute results only (inputs already in DOM) ---- */
  function recompute() { renderResults(); renderChips(); }

  /* ---- Full render ---- */
  function render() {
    renderChips();
    renderMenu();
    elBaseCap.value = toNum(state.base.capex).toLocaleString("en-US");
    elBaseDay.value = toNum(state.base.dayRate).toLocaleString("en-US");
    elFleet.value = String(Math.max(0, Math.round(toNum(state.fleet))));
    elDays.value = String(toNum(state.daysYear));
    elUtil.value = String(toNum(state.utilPct));
    renderResults();
  }

  /* ---- Wire the base + fleet inputs ---- */
  elBaseCap.addEventListener("input", function () { state.base.capex = toNum(elBaseCap.value); recompute(); save(); });
  elBaseCap.addEventListener("blur", function () { elBaseCap.value = toNum(state.base.capex).toLocaleString("en-US"); });
  elBaseDay.addEventListener("input", function () { state.base.dayRate = toNum(elBaseDay.value); recompute(); save(); });
  elBaseDay.addEventListener("blur", function () { elBaseDay.value = toNum(state.base.dayRate).toLocaleString("en-US"); });
  elFleet.addEventListener("input", function () { state.fleet = toNum(elFleet.value); recompute(); save(); });
  elDays.addEventListener("input", function () { state.daysYear = toNum(elDays.value); recompute(); save(); });
  elUtil.addEventListener("input", function () { state.utilPct = toNum(elUtil.value); recompute(); save(); });

  document.getElementById("reset-all").addEventListener("click", function () {
    if (!window.confirm("Reset the menu back to the default barge, prices and an 8-vessel turbine fleet? Your edits will be lost.")) return;
    state = defaultState(); render(); save();
  });

  /* ---- CSV export ---- */
  document.getElementById("export-csv").addEventListener("click", exportCsv);
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportCsv() {
    var f = fleetEcon();
    var d = disciplineById(state.discipline);
    var label = matchesDiscipline(d) && d ? d.name : "Custom fit-out";
    var lines = [];
    lines.push(["Seaways MPSS — The Menu (barge fit-out)"].map(csvCell).join(","));
    lines.push([]);
    lines.push(["Discipline", label].map(csvCell).join(","));
    lines.push(["Basic barge — fit-out cost", toNum(state.base.capex)].map(csvCell).join(","));
    lines.push(["Basic barge — day rate", toNum(state.base.dayRate)].map(csvCell).join(","));
    lines.push([]);
    lines.push(["Module", "Included", "Fit-out cost ($)", "Day-rate uplift ($/day)"].map(csvCell).join(","));
    ADDERS.forEach(function (a) {
      lines.push([
        a.name, state.picked[a.id] ? "Yes" : "No",
        toNum(state.caps[a.id]), toNum(state.rates[a.id])
      ].map(csvCell).join(","));
    });
    lines.push([]);
    lines.push(["Per vessel — configured capex", Math.round(f.pv.capex)].map(csvCell).join(","));
    lines.push(["Per vessel — configured day rate", Math.round(f.pv.dayRate)].map(csvCell).join(","));
    lines.push(["Per vessel — annual charter (at util)", Math.round(f.annualPer)].map(csvCell).join(","));
    lines.push([]);
    lines.push(["Fleet size", f.qty].map(csvCell).join(","));
    lines.push(["On-hire days/year (max)", toNum(state.daysYear)].map(csvCell).join(","));
    lines.push(["Utilisation (%)", toNum(state.utilPct)].map(csvCell).join(","));
    lines.push(["Fleet capex", Math.round(f.capex)].map(csvCell).join(","));
    lines.push(["Fleet day rate", Math.round(f.dayRate)].map(csvCell).join(","));
    lines.push(["Fleet annual charter", Math.round(f.annualFleet)].map(csvCell).join(","));

    var csv = lines.join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "mpss-menu-config.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- Go ---- */
  render();
})();
