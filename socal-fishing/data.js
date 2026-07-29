/* =========================================================
   SoCal Fishing — dataset
   All figures are illustrative placeholders modeled on the
   kinds of feeds a real build would pull (NOAA / NDBC /
   Copernicus / SportfishingReport / GasBuddy / bait reports).
   Coordinates are real-world lon/lat for Southern California.
   ========================================================= */
window.SF_DATA = (function () {
  "use strict";

  // Geographic window shown on the chart (decimal degrees).
  // Centred on Huntington Beach (-118.00, 33.656) with roughly a 30 NM
  // radius (a little wider E-W so the view fills the map panel).
  var BOUNDS = { lonMin: -118.70, lonMax: -117.30, latMin: 33.156, latMax: 34.156 };

  // Harbors / launch ramps.
  var harbors = [
    { name: "Long Beach",       lon: -118.190, lat: 33.752, label: "LONG BEACH",       launch: true },
    { name: "Huntington Beach", lon: -118.000, lat: 33.656, label: "HUNTINGTON BEACH", launch: false },
    { name: "Newport Beach",    lon: -117.928, lat: 33.603, label: "NEWPORT BEACH",     launch: true },
    { name: "Dana Point",       lon: -117.702, lat: 33.461, label: "DANA POINT",        launch: true },
    { name: "Oceanside",        lon: -117.392, lat: 33.205, label: "OCEANSIDE",         launch: true }
  ];

  // Land masses (lon/lat rings). Mainland is closed against the NE corners in JS.
  var mainlandCoast = [
    { lon: -118.66, lat: 33.78 }, // Palos Verdes / LA edge
    { lon: -118.42, lat: 33.77 },
    { lon: -118.19, lat: 33.752 }, // Long Beach
    { lon: -118.08, lat: 33.72 },
    { lon: -118.00, lat: 33.656 }, // Huntington Beach
    { lon: -117.955, lat: 33.63 },
    { lon: -117.928, lat: 33.603 }, // Newport
    { lon: -117.83, lat: 33.545 },
    { lon: -117.76, lat: 33.50 },
    { lon: -117.702, lat: 33.461 }, // Dana Point
    { lon: -117.62, lat: 33.42 },
    { lon: -117.51, lat: 33.34 },
    { lon: -117.392, lat: 33.205 }, // Oceanside
    { lon: -117.30, lat: 33.14 }
  ];

  var catalina = [
    { lon: -118.505, lat: 33.443 }, // NW isthmus
    { lon: -118.470, lat: 33.435 },
    { lon: -118.420, lat: 33.405 },
    { lon: -118.365, lat: 33.365 },
    { lon: -118.320, lat: 33.335 }, // SE / east end
    { lon: -118.345, lat: 33.322 },
    { lon: -118.400, lat: 33.350 },
    { lon: -118.455, lat: 33.392 },
    { lon: -118.495, lat: 33.425 }
  ];

  // Recommended zone (the "best play"): centre + radius in nautical miles.
  var recommendedZone = { lon: -118.03, lat: 33.47, radiusNm: 1.6,
                          tempLabel: "69.1°–70.0°F", subLabel: "PRODUCTIVE EDGE" };

  // Recent catch markers dropped on the chart.
  var catches = [
    { lon: -117.98, lat: 33.545, species: "Bonito" },
    { lon: -118.05, lat: 33.52,  species: "Yellowtail" },
    { lon: -117.94, lat: 33.50,  species: "Bonito" },
    { lon: -118.10, lat: 33.49,  species: "Calico Bass" },
    { lon: -117.99, lat: 33.455, species: "Barracuda" },
    { lon: -117.90, lat: 33.42,  species: "Yellowtail" },
    { lon: -117.82, lat: 33.40,  species: "Bonito" },
    { lon: -117.70, lat: 33.34,  species: "Calico Bass" },
    { lon: -118.14, lat: 33.575, species: "Barracuda" }
  ];

  // Ranked catch hotspots (search areas, not exact spots).
  var hotspots = [
    { rank: 1, area: "15–18 NM SW Newport",    species: "Bonito, Yellowtail",   age: "2d ago", lon: -118.05, lat: 33.50 },
    { rank: 2, area: "10–14 NM SW Dana Point", species: "Calico Bass, Barracuda", age: "1d ago", lon: -117.86, lat: 33.36 },
    { rank: 3, area: "22–26 NM SW Oceanside",  species: "Yellowtail, Bonito",    age: "2d ago", lon: -117.61, lat: 32.95 }
  ];

  // Regional bite counts from landing reports.
  var bite = [
    { species: "Bonito",     count: 272, trend: +12 },
    { species: "Yellowtail", count: 155, trend: +6 },
    { species: "Calico Bass",count: 435, trend: +24 },
    { species: "Barracuda",  count: 361, trend: +18 },
    { species: "Rockfish",   count: 72,  trend: -5 }
  ];

  // Bait barges / receivers.
  var bait = [
    { name: "Dana Wharf Bait Barge", stock: "Sardine, Anchovy, Squid, Mackerel", status: "GOOD", updated: "12:45 PM", lon: -117.700, lat: 33.458 },
    { name: "Newport Live Bait",     stock: "Sardine, Anchovy, Squid",           status: "GOOD", updated: "1:05 PM",  lon: -117.905, lat: 33.607 },
    { name: "Oceanside Sea Center",  stock: "Sardine, Anchovy",                  status: "FAIR", updated: "12:30 PM", lon: -117.388, lat: 33.208 }
  ];

  // Fuel prices near harbors.
  var fuel = [
    { station: "Costco (Huntington Beach)", price: 3.89, dist: 3.2 },
    { station: "Chevron (Newport Beach)",   price: 3.97, dist: 2.1 },
    { station: "Shell (Costa Mesa)",        price: 4.05, dist: 3.8 },
    { station: "Arco (Dana Point)",         price: 3.92, dist: 5.4 },
    { station: "Marine Fuel Dock (Newport)",price: 5.35, dist: 0.4 }
  ];

  // Water-temp stations with timestamps.
  var tempStations = [
    { name: "Newport Harbor",   temp: 67.8, updated: "18m ago", lon: -117.905, lat: 33.60 },
    { name: "Dana Point Harbor",temp: 68.2, updated: "22m ago", lon: -117.700, lat: 33.458 },
    { name: "Oceanside Buoy",   temp: 69.2, updated: "32m ago", lon: -117.40,  lat: 33.18 },
    { name: "San Pedro Buoy",   temp: 68.5, updated: "11m ago", lon: -118.25,  lat: 33.62 },
    { name: "Catalina East End",temp: 68.9, updated: "27m ago", lon: -118.32,  lat: 33.35 }
  ];

  // Hourly wind & swell forecast.
  var forecast = [
    { hr: "3 PM",  ktn: 8, dir: "NW", ft: 2.1 },
    { hr: "6 PM",  ktn: 6, dir: "NW", ft: 1.8 },
    { hr: "9 PM",  ktn: 5, dir: "NW", ft: 1.6 },
    { hr: "12 AM", ktn: 4, dir: "NW", ft: 1.4 },
    { hr: "3 AM",  ktn: 4, dir: "NW", ft: 1.3 },
    { hr: "6 AM",  ktn: 5, dir: "N",  ft: 1.2 }
  ];

  // Current headline conditions.
  var conditions = [
    { key: "airTemp",  ico: "🌡", label: "AIR TEMP",   val: "72",   unit: "°F" },
    { key: "wind",     ico: "🜁", label: "WIND",       val: "8",    unit: "KT NW" },
    { key: "gust",     ico: "≈",  label: "WIND GUSTS", val: "12",   unit: "KT" },
    { key: "swell",    ico: "〜", label: "SWELL",      val: "2.1",  unit: "FT WSW" },
    { key: "vis",      ico: "◉",  label: "VISIBILITY", val: "10+",  unit: "NM" },
    { key: "pressure", ico: "◧",  label: "PRESSURE",   val: "1018", unit: "MB" },
    { key: "water",    ico: "🌊", label: "WATER TEMP", val: "68.4", unit: "°F" },
    { key: "moon",     ico: "☾",  label: "MOON",       val: "63%",  unit: "WAXING" }
  ];

  // Numeric conditions used by the "Should I Go?" model.
  var scoreInputs = {
    windKt: 8, gustKt: 12, swellFt: 2.1, visNm: 10,
    waterTemp: 68.4, edgeTemp: 67.8, biteMomentum: 0.72, pressureMb: 1018
  };

  // Sun / tide / moon.
  var almanac = {
    sunrise: "5:46 AM", sunset: "7:59 PM",
    highTide: { time: "5:02 PM", ft: "+3.1 FT" },
    lowTide:  { time: "11:13 PM", ft: "-0.4 FT" },
    moon: "63% Waxing", updatedSST: "1:15 PM PT"
  };

  // Boats -> fuel burn (gal/hr at cruise) and default cruise speed (kt).
  var boats = [
    { name: "22 ft Center Console", gph: 9,  cruise: 26, tank: 60 },
    { name: "26 ft Center Console", gph: 13, cruise: 24, tank: 90 },
    { name: "28 ft Center Console", gph: 16, cruise: 24, tank: 110 },
    { name: "32 ft Sportfisher",    gph: 24, cruise: 22, tank: 200 },
    { name: "38 ft Sportfisher",    gph: 34, cruise: 20, tank: 340 }
  ];
  var speeds = [18, 20, 22, 24, 26, 28, 30];

  var quickLinks = [
    { label: "Tide Chart", url: "https://tidesandcurrents.noaa.gov/" },
    { label: "Marine Weather", url: "https://www.weather.gov/marine/" },
    { label: "NOAA Wave Model", url: "https://polar.ncep.noaa.gov/waves/" },
    { label: "Sea Conditions Camera", url: "https://www.surfline.com/" }
  ];

  return {
    BOUNDS: BOUNDS, harbors: harbors, mainlandCoast: mainlandCoast, catalina: catalina,
    recommendedZone: recommendedZone, catches: catches, hotspots: hotspots, bite: bite,
    bait: bait, fuel: fuel, tempStations: tempStations, forecast: forecast,
    conditions: conditions, scoreInputs: scoreInputs, almanac: almanac,
    boats: boats, speeds: speeds, quickLinks: quickLinks
  };
})();
