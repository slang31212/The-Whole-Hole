/* Seaways MPSS Command — working-notes persistence (browser-only) */
(function () {
  "use strict";
  var KEY = "mpss-command-notes-v1";
  var ta = document.getElementById("cmd-notes");
  var save = document.getElementById("cmd-save");
  var clear = document.getElementById("cmd-clear");
  var status = document.getElementById("cmd-notes-status");
  if (!ta) return;

  function load() {
    try {
      var v = localStorage.getItem(KEY);
      if (v != null) ta.value = v;
    } catch (e) {}
  }
  function flash(msg) {
    if (!status) return;
    var prev = "Stored only in this browser.";
    status.textContent = msg;
    setTimeout(function () { status.textContent = prev; }, 1800);
  }
  load();

  if (save) save.addEventListener("click", function () {
    try { localStorage.setItem(KEY, ta.value); flash("Saved to this browser ✓"); }
    catch (e) { flash("Could not save (storage blocked)."); }
  });
  if (clear) clear.addEventListener("click", function () {
    if (!ta.value || window.confirm("Clear the working notes on this browser?")) {
      ta.value = "";
      try { localStorage.removeItem(KEY); } catch (e) {}
      flash("Cleared.");
      ta.focus();
    }
  });

  // Save on Ctrl/Cmd+S while typing in the notes
  ta.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (save) save.click();
    }
  });
})();
