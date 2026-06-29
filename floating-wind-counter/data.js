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

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status) {
  return (status || "Operational").toLowerCase().replace(/\s+/g, "-");
}
