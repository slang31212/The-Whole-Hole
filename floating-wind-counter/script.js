const STORAGE_KEY = "floatingWindPlatforms";

const form = document.getElementById("platformForm");
const listEl = document.getElementById("platformList");
const listCountEl = document.getElementById("listCount");
const totalPlatformsEl = document.getElementById("totalPlatforms");
const totalCapacityEl = document.getElementById("totalCapacity");
const totalDisplacementEl = document.getElementById("totalDisplacement");

function loadPlatforms() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePlatforms(platforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(platforms));
}

function render() {
  const platforms = loadPlatforms();

  totalPlatformsEl.textContent = platforms.length;
  totalCapacityEl.textContent = platforms
    .reduce((sum, p) => sum + (Number(p.turbineCapacity) || 0), 0)
    .toFixed(1);
  totalDisplacementEl.textContent = platforms
    .reduce((sum, p) => sum + (Number(p.displacement) || 0), 0)
    .toLocaleString();

  listCountEl.textContent = platforms.length;
  listEl.innerHTML = "";

  if (platforms.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No platforms added yet.</li>';
    return;
  }

  platforms.forEach((p, index) => {
    const li = document.createElement("li");
    li.className = "platform-card";
    li.innerHTML = `
      <button class="remove-btn" data-index="${index}">Remove</button>
      <h3>${escapeHtml(p.siteName)}</h3>
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
    `;
    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const platform = {
    siteName: document.getElementById("siteName").value.trim(),
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

render();
