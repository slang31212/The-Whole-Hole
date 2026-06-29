const form = document.getElementById("platformForm");
const listEl = document.getElementById("platformList");
const listCountEl = document.getElementById("listCount");
const totalPlatformsEl = document.getElementById("totalPlatforms");
const totalCapacityEl = document.getElementById("totalCapacity");
const totalDisplacementEl = document.getElementById("totalDisplacement");
const statusFilterEl = document.getElementById("statusFilter");

function render() {
  const platforms = loadPlatforms();
  const filter = statusFilterEl.value;
  const visible = filter === "All" ? platforms : platforms.filter((p) => p.status === filter);

  totalPlatformsEl.textContent = platforms.length;
  totalCapacityEl.textContent = platforms
    .reduce((sum, p) => sum + (Number(p.turbineCapacity) || 0), 0)
    .toFixed(1);
  totalDisplacementEl.textContent = platforms
    .reduce((sum, p) => sum + (Number(p.displacement) || 0), 0)
    .toLocaleString();

  listCountEl.textContent = visible.length;
  listEl.innerHTML = "";

  if (visible.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No platforms match this filter.</li>';
    return;
  }

  platforms.forEach((p, index) => {
    if (filter !== "All" && p.status !== filter) return;

    const li = document.createElement("li");
    li.className = "platform-card";
    li.innerHTML = `
      <button class="remove-btn" data-index="${index}">Remove</button>
      <h3>${escapeHtml(p.siteName)}<span class="status-badge ${statusClass(p.status)}">${escapeHtml(p.status || "Operational")}</span></h3>
      <div class="details">
        <span><strong>Turbine:</strong> ${escapeHtml(p.turbineModel)}</span>
        <span><strong>Capacity:</strong> ${p.turbineCapacity || "-"} MW</span>
        <span><strong>Rotor diameter:</strong> ${p.rotorDiameter || "-"} m</span>
        <span><strong>Hub height:</strong> ${p.hubHeight || "-"} m</span>
        <span><strong>Base type:</strong> ${escapeHtml(p.baseType)}</span>
        <span><strong>Displacement:</strong> ${p.displacement || "-"} t</span>
        <span><strong>Draft:</strong> ${p.draft || "-"} m</span>
        <span><strong>Mooring:</strong> ${escapeHtml(p.mooring || "-")}</span>
        <span><strong>Water depth:</strong> ${p.waterDepth || "-"} m</span>
      </div>
      ${p.sourceUrl ? `<a class="source-link" href="${escapeHtml(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>` : ""}
    `;
    listEl.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const platform = {
    siteName: document.getElementById("siteName").value.trim(),
    status: document.getElementById("status").value,
    sourceUrl: document.getElementById("sourceUrl").value.trim(),
    turbineModel: document.getElementById("turbineModel").value.trim(),
    turbineCapacity: document.getElementById("turbineCapacity").value,
    rotorDiameter: document.getElementById("rotorDiameter").value,
    hubHeight: document.getElementById("hubHeight").value,
    baseType: document.getElementById("baseType").value,
    displacement: document.getElementById("displacement").value,
    draft: document.getElementById("draft").value,
    mooring: document.getElementById("mooring").value.trim(),
    waterDepth: document.getElementById("waterDepth").value,
  };

  const platforms = loadPlatforms();
  platforms.push(platform);
  savePlatforms(platforms);

  form.reset();
  render();
});

listEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-btn")) return;
  const index = Number(e.target.dataset.index);
  const platforms = loadPlatforms();
  platforms.splice(index, 1);
  savePlatforms(platforms);
  render();
});

statusFilterEl.addEventListener("change", render);

seedAnnouncedPlatformsOnce();
render();
