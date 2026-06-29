const STATUS_ORDER = ["Operational", "Under Construction", "Planned"];

function groupCount(platforms, key, fallback) {
  const counts = {};
  platforms.forEach((p) => {
    const value = p[key] || fallback;
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function renderBarChart(containerEl, counts, order) {
  const labels = order || Object.keys(counts).sort();
  const max = Math.max(1, ...Object.values(counts));

  containerEl.innerHTML = "";
  labels.forEach((label) => {
    const count = counts[label] || 0;
    if (count === 0 && order) return;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${escapeHtml(label)}</span>
      <div class="bar-track">
        <div class="bar-fill ${statusClass(label)}" style="width: ${(count / max) * 100}%"></div>
      </div>
      <span class="bar-value">${count}</span>
    `;
    containerEl.appendChild(row);
  });

  if (Object.values(counts).every((c) => c === 0)) {
    containerEl.innerHTML = '<p class="empty-state">No data yet.</p>';
  }
}

function renderTable(platforms) {
  const body = document.getElementById("platformTableBody");
  body.innerHTML = "";

  if (platforms.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">No platforms added yet.</td></tr>';
    return;
  }

  platforms.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.className = "clickable-row";
    tr.dataset.index = index;
    tr.innerHTML = `
      <td>${escapeHtml(p.siteName)}</td>
      <td><span class="status-badge ${statusClass(p.status)}">${escapeHtml(p.status || "Operational")}</span></td>
      <td>${escapeHtml(p.turbineModel)}</td>
      <td>${p.turbineCapacity || "-"}</td>
      <td>${escapeHtml(p.baseType)}</td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", () => {
      window.location.href = `detail.html?i=${row.dataset.index}`;
    });
  });
}

function renderDashboard() {
  const platforms = loadPlatforms();

  document.getElementById("totalPlatforms").textContent = platforms.length;
  document.getElementById("totalCapacity").textContent = platforms
    .reduce((sum, p) => sum + (Number(p.turbineCapacity) || 0), 0)
    .toFixed(1);
  document.getElementById("totalDisplacement").textContent = platforms
    .reduce((sum, p) => sum + (Number(p.displacement) || 0), 0)
    .toLocaleString();

  renderBarChart(document.getElementById("statusChart"), groupCount(platforms, "status", "Operational"), STATUS_ORDER);
  renderBarChart(document.getElementById("baseTypeChart"), groupCount(platforms, "baseType", "Unspecified"));
  renderTable(platforms);
}

const REFRESH_INTERVAL_MS = 5000;

seedAnnouncedPlatformsOnce();
renderDashboard();
setInterval(renderDashboard, REFRESH_INTERVAL_MS);
