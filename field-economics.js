/* =========================================================
   Seaways MPSS — Field economics comparison
   2026 refresh of the AUPEC (1989) single-field method.
   Conventional bespoke host vs the Seaways MPSS, on one field.
   Simplified, transparent DCF. Everything editable.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "mpss-field-economics-v1";

  function defaults() {
    return { price: 75, reserves: 65, opex: 26, other: 650, conv: 650, mpss: 160,
             take: 78, disc: 10, dev: 3, life: 12 };
  }
  var state = load() || defaults();

  function load() {
    try { var r = localStorage.getItem(KEY); if (!r) return null; var s = JSON.parse(r);
      return (s && typeof s.price !== "undefined") ? s : null; } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function toNum(v) { if (typeof v === "number") return isFinite(v) ? v : 0;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : 0; }
  function fmtM(n) { n = toNum(n); var s = n < 0 ? "-" : ""; var a = Math.abs(Math.round(n));
    return s + "$" + a.toLocaleString("en-US") + "m"; }
  function fmtPct(n) { return isFinite(n) ? (n).toFixed(1) + "%" : "—"; }
  function fmtP(n) { return "$" + toNum(n).toFixed(0) + "/bbl"; }

  /* ---- Production profile: ramp -> plateau -> decline over L years, normalised ---- */
  function profile(L) {
    L = Math.max(1, Math.round(L));
    var w = [], plateauEnd = Math.max(1, Math.floor(L * 0.35)), i, up, dec;
    for (i = 0; i < L; i++) {
      up = Math.min(1, (i + 1) / 2);                          // ramp over ~2 yrs
      dec = i <= plateauEnd ? 1 : Math.pow(0.82, i - plateauEnd); // decline after plateau
      w.push(up * dec);
    }
    var s = w.reduce(function (a, b) { return a + b; }, 0) || 1;
    return w.map(function (x) { return x / s; });
  }

  function npvAt(rate, cfs) { var v = 0; for (var t = 0; t < cfs.length; t++) v += cfs[t] / Math.pow(1 + rate, t); return v; }
  function irr(cfs) {
    var hasN = false, hasP = false, i;
    for (i = 0; i < cfs.length; i++) { if (cfs[i] < 0) hasN = true; if (cfs[i] > 0) hasP = true; }
    if (!hasN || !hasP) return NaN;
    var lo = -0.95, hi = 3, fl = npvAt(lo, cfs);
    if (fl * npvAt(hi, cfs) > 0) return NaN;
    for (var k = 0; k < 200; k++) { var m = (lo + hi) / 2, fm = npvAt(m, cfs);
      if (Math.abs(fm) < 1e-4) return m; if (fl * fm < 0) hi = m; else { lo = m; fl = fm; } }
    return (lo + hi) / 2;
  }

  /* ---- Build the after-tax cash flow for a given host cost & price ---- */
  function cashflows(host, price) {
    var R = toNum(state.reserves), opex = toNum(state.opex), other = toNum(state.other),
        take = toNum(state.take) / 100, dev = Math.max(1, Math.round(toNum(state.dev))),
        life = Math.max(1, Math.round(toNum(state.life)));
    var capex = toNum(host) + other, pre = [], y;
    for (y = 0; y < dev; y++) pre.push(-capex / dev);
    var prof = profile(life);
    for (y = 0; y < life; y++) { var prod = prof[y] * R; pre.push(prod * price - prod * opex); }
    var post = pre.map(function (x) { return x * (1 - take); });
    return { pre: pre, post: post };
  }
  function evalHost(host) {
    var price = toNum(state.price), disc = toNum(state.disc) / 100;
    var cf = cashflows(host, price);
    return { npv: npvAt(disc, cf.post), irr: irr(cf.pre) * 100, breakeven: breakeven(host) };
  }
  /* breakeven flat price where post-tax NPV@disc = 0 (bisection on price) */
  function breakeven(host) {
    var disc = toNum(state.disc) / 100;
    function f(p) { return npvAt(disc, cashflows(host, p).post); }
    var lo = 0, hi = 400;
    if (f(lo) > 0) return 0;             // profitable even at $0 (unlikely)
    if (f(hi) < 0) return NaN;           // never breaks even in range
    for (var k = 0; k < 120; k++) { var m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  /* ---- DOM ---- */
  var $ = function (id) { return document.getElementById(id); };
  var fields = { price: "fe-price", reserves: "fe-reserves", opex: "fe-opex", other: "fe-other",
    conv: "fe-conv", mpss: "fe-mpss", take: "fe-take", disc: "fe-disc", dev: "fe-dev", life: "fe-life" };
  var moneyInt = { other: 1, conv: 1, mpss: 1 };

  function fill() { Object.keys(fields).forEach(function (k) { var el = $(fields[k]); if (!el) return;
    el.value = moneyInt[k] ? toNum(state[k]).toLocaleString("en-US") : String(toNum(state[k])); }); }

  Object.keys(fields).forEach(function (k) {
    var el = $(fields[k]); if (!el) return;
    el.addEventListener("focus", function () { el.select(); });
    el.addEventListener("input", function () { state[k] = toNum(el.value); render(); save(); });
    el.addEventListener("blur", function () { el.value = moneyInt[k] ? toNum(state[k]).toLocaleString("en-US") : String(toNum(state[k])); });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".fe-field"), function (b) {
    b.addEventListener("click", function () {
      state.reserves = toNum(b.dataset.r); state.opex = toNum(b.dataset.opex);
      state.other = toNum(b.dataset.other); state.conv = toNum(b.dataset.conv); state.mpss = toNum(b.dataset.mpss);
      fill(); render(); save();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".fe-take-preset"), function (b) {
    b.addEventListener("click", function () { state.take = toNum(b.dataset.take); fill(); render(); save(); });
  });
  $("fe-reset").addEventListener("click", function () { state = defaults(); fill(); render(); save(); });

  /* ---- Render ---- */
  function render() {
    var c = evalHost(state.conv), m = evalHost(state.mpss);
    $("conv-npv").textContent = fmtM(c.npv);
    $("conv-irr").textContent = fmtPct(c.irr);
    $("conv-be").textContent = isFinite(c.breakeven) ? fmtP(c.breakeven) : "—";
    $("mpss-npv").textContent = fmtM(m.npv);
    $("mpss-irr").textContent = fmtPct(m.irr);
    $("mpss-be").textContent = isFinite(m.breakeven) ? fmtP(m.breakeven) : "—";

    setSign($("conv-npv"), c.npv); setSign($("mpss-npv"), m.npv);

    $("uplift-npv").textContent = "+" + fmtM(m.npv - c.npv).replace("$-", "-$");
    var dIrr = (isFinite(m.irr) && isFinite(c.irr)) ? (m.irr - c.irr) : NaN;
    $("uplift-irr").textContent = isFinite(dIrr) ? "+" + dIrr.toFixed(1) + " pts" : "—";
    var dBe = (isFinite(c.breakeven) && isFinite(m.breakeven)) ? (c.breakeven - m.breakeven) : NaN;
    $("uplift-be").textContent = isFinite(dBe) ? "−$" + dBe.toFixed(0) + "/bbl" : "—";

    // Verdict
    var v = $("fe-verdict"), cls = "fe-verdict", msg;
    if (c.npv < 0 && m.npv >= 0) {
      msg = "The MPSS makes this field economic — from " + fmtM(c.npv) + " to " + fmtM(m.npv) + " post-tax NPV.";
      cls += " fe-verdict-flip";
    } else if (c.npv >= 0 && m.npv >= 0) {
      msg = "Both work — the MPSS adds " + fmtM(m.npv - c.npv) + " NPV and " + (isFinite(dIrr) ? dIrr.toFixed(1) : "—") + " points of IRR.";
      cls += " fe-verdict-good";
    } else if (c.npv < 0 && m.npv < 0) {
      msg = "Sub-economic at these inputs — but the MPSS cuts the loss by " + fmtM(m.npv - c.npv) + ".";
      cls += " fe-verdict-warn";
    } else {
      msg = "The MPSS improves the field economics.";
      cls += " fe-verdict-good";
    }
    v.textContent = msg; v.className = cls;
  }
  function setSign(el, val) { el.classList.toggle("fe-neg", val < 0); el.classList.toggle("fe-pos", val >= 0); }

  /* ---- CSV ---- */
  $("fe-export").addEventListener("click", function () {
    var c = evalHost(state.conv), m = evalHost(state.mpss), L = [];
    function row(a) { return a.map(function (x) { var s = String(x == null ? "" : x);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(","); }
    L.push(row(["Seaways MPSS — Field economics (illustrative)"]));
    L.push(row([]));
    L.push(row(["Oil price ($/bbl)", state.price])); L.push(row(["Recoverable reserves (mmbbl)", state.reserves]));
    L.push(row(["Operating cost ($/bbl)", state.opex])); L.push(row(["Other capex ($m)", state.other]));
    L.push(row(["Conventional host ($m)", state.conv])); L.push(row(["MPSS host ($m)", state.mpss]));
    L.push(row(["Government take (%)", state.take])); L.push(row(["Discount (%)", state.disc]));
    L.push(row(["Development (yr)", state.dev])); L.push(row(["Producing life (yr)", state.life]));
    L.push(row([]));
    L.push(row(["", "Post-tax NPV@10% ($m)", "Project IRR (%)", "Breakeven ($/bbl)"]));
    L.push(row(["Conventional host", Math.round(c.npv), c.irr.toFixed(1), isFinite(c.breakeven) ? c.breakeven.toFixed(0) : ""]));
    L.push(row(["Seaways MPSS", Math.round(m.npv), m.irr.toFixed(1), isFinite(m.breakeven) ? m.breakeven.toFixed(0) : ""]));
    L.push(row(["Uplift", Math.round(m.npv - c.npv), (m.irr - c.irr).toFixed(1), ""]));
    var blob = new Blob(["﻿" + L.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "mpss-field-economics.csv"; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  fill(); render();
})();
