const STORAGE_KEY = "floatingWindPlatforms";
const SEEDED_KEY = "floatingWindPlatformsSeeded";

// Real announced floating wind platforms not yet operational, gathered from
// public reporting. Seeded once on first load so the board starts populated;
// users can remove or add to these like any other entry.
const ANNOUNCED_FUTURE_PLATFORMS = [
  {
    siteName: "Green Volt (ScotWind, North Sea, UK)",
    status: "Planned",
    sourceUrl: "https://en.wikipedia.org/wiki/Green_Volt_offshore_wind_farm",
    turbineModel: "TBD (10-16 MW class)",
    turbineCapacity: "16",
    rotorDiameter: "",
    hubHeight: "",
    baseType: "Semi-submersible",
    displacement: "",
    draft: "",
    mooring: "Catenary, up to 6 lines per turbine",
    waterDepth: "",
  },
  {
    siteName: "Salamander (Peterhead, Scotland, UK)",
    status: "Planned",
    sourceUrl: "https://salamanderfloatingwind.com/",
    turbineModel: "TBD (6-7 turbines, 100 MW total)",
    turbineCapacity: "14.3",
    rotorDiameter: "",
    hubHeight: "",
    baseType: "Semi-submersible",
    displacement: "",
    draft: "",
    mooring: "",
    waterDepth: "100",
  },
  {
    siteName: "Erebus (Celtic Sea, Wales, UK)",
    status: "Under Construction",
    sourceUrl: "https://en.wikipedia.org/wiki/Erebus_Offshore_Wind_Farm",
    turbineModel: "TBD (up to 18 MW, 7 turbines)",
    turbineCapacity: "18",
    rotorDiameter: "",
    hubHeight: "",
    baseType: "Semi-submersible",
    displacement: "",
    draft: "",
    mooring: "",
    waterDepth: "75",
  },
  {
    siteName: "Firefly / Bandibuli (Ulsan, South Korea)",
    status: "Planned",
    sourceUrl: "https://www.offshorewind.biz/2025/06/19/equinor-selects-ekwils-semi-submersible-floating-foundation-for-south-korean-project/",
    turbineModel: "Siemens Gamesa 15 MW",
    turbineCapacity: "15",
    rotorDiameter: "",
    hubHeight: "",
    baseType: "Semi-submersible",
    displacement: "",
    draft: "",
    mooring: "3-point",
    waterDepth: "200-250",
  },
];

const form = document.getElementById("platformForm");
const listEl = document.getElementById("platformList");
const listCountEl = document.getElementById("listCount");
const totalPlatformsEl = document.getElementById("totalPlatforms");
const totalCapacityEl = document.getElementById("totalCapacity");
const totalDisplacementEl = document.getElementById("totalDisplacement");
const statusFilterEl = document.getElementById("statusFilter");

function loadPlatforms() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePlatforms(platforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(platforms));
}

function seedAnnouncedPlatformsOnce() {
  if (localStorage.getItem(SEEDED_KEY)) return;
  const platforms = loadPlatforms();
  savePlatforms(platforms.concat(ANNOUNCED_FUTURE_PLATFORMS));
  localStorage.setItem(SEEDED_KEY, "true");
}

function statusClass(status) {
  return (status || "Operational").toLowerCase().replace(/\s+/g, "-");
}

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
