import {
  scalePitch,
  scaleGain,
  scalePan,
  audioLegend,
  choreography,
  defaultEngine,
  createSynth,
  createSamplePlayer
} from '../../src/index.js';

// ============================================================================
// 1. REGIONS: The 6 Global Seismic Fault Zones (Pie Chart Pieces)
// ============================================================================
const REGION_COORDS = {
  0: { lon: 142.4, lat: 38.3 },  // Japan Trench
  1: { lon: -72.7, lat: -36.3 }, // Chile Trench
  2: { lon: -125.0, lat: 45.0 }, // Cascadia Zone
  3: { lon: 95.85, lat: 3.3 },   // Sunda Megathrust
  4: { lon: -120.5, lat: 36.0 }, // San Andreas
  5: { lon: 85.0, lat: 28.0 }    // Himalayan Belt
};

// Precise geological tectonic fault traces for the 6 primary regions (Multi-Segment Fault Systems)
const FAULT_TRACES = [
  {
    id: 0,
    name: "Japan Trench & East Asia Arc",
    regionId: 0,
    color: "#f43f5e",
    coords: [
      // 1. Kuril-Kamchatka Trench (Kamchatka through Kurils to Hokkaido)
      [[163.0, 56.5], [160.0, 53.5], [156.0, 49.5], [151.0, 46.0], [147.0, 43.5], [144.5, 41.5]],
      // 2. Japan Trench & Izu-Bonin-Mariana Trench (Tohoku, Kanto, Izu Arc)
      [[144.5, 41.5], [143.8, 39.0], [143.0, 37.0], [141.8, 35.0], [140.8, 32.5], [141.0, 27.5], [142.5, 22.0], [144.5, 17.0], [145.5, 12.0]],
      // 3. Nankai Trough, Ryukyu Arc & Taiwan (Sagami, Nankai, Okinawa Trough, Taiwan, Manila Trench)
      [[139.0, 35.0], [136.5, 33.3], [134.0, 32.2], [131.5, 30.5], [128.5, 28.0], [125.5, 25.5], [123.0, 24.2], [121.8, 23.8], [120.8, 21.8], [119.8, 17.0]],
      // 4. Eastern Margin of Sea of Japan & Noto Peninsula (2024 Noto reverse fault system)
      [[141.5, 46.5], [140.0, 43.0], [139.0, 40.0], [137.0, 37.5], [134.0, 36.0]]
    ]
  },
  {
    id: 1,
    name: "Peru-Chile Trench & South America Arc",
    regionId: 1,
    color: "#ec4899",
    coords: [
      // 1. Peru-Chile Megathrust (Colombia to Southern Chile & Magallanes)
      [[-78.0, 6.0], [-79.5, 1.5], [-81.2, -4.5], [-80.5, -9.0], [-76.5, -14.0], [-73.0, -18.0], [-71.5, -22.0], [-71.2, -27.0], [-72.0, -32.5], [-73.5, -37.0], [-75.0, -42.0], [-76.0, -46.5], [-75.5, -50.0], [-73.0, -53.0], [-68.0, -55.0]],
      // 2. Middle America Trench (Mexico, Guatemala, Costa Rica, Panama)
      [[-106.0, 20.0], [-102.5, 17.5], [-97.5, 15.5], [-93.0, 14.0], [-87.5, 11.5], [-83.5, 8.5], [-81.0, 7.5], [-77.5, 6.5]],
      // 3. Scotia Arc & South Sandwich Trench
      [[-65.0, -55.0], [-52.0, -54.0], [-38.0, -55.0], [-26.0, -56.5], [-26.5, -60.0], [-36.0, -61.0], [-55.0, -61.0]]
    ]
  },
  {
    id: 2,
    name: "Cascadia & Alaska-Aleutian Megathrust",
    regionId: 2,
    color: "#38bdf8",
    coords: [
      // 1. Cascadia Megathrust (Cape Mendocino, Oregon, Washington, Vancouver Island)
      [[-124.3, 40.3], [-124.7, 43.5], [-125.4, 46.8], [-126.8, 48.5], [-128.5, 50.8]],
      // 2. Queen Charlotte - Fairweather Fault System (British Columbia / SE Alaska)
      [[-128.5, 50.8], [-131.0, 52.8], [-133.8, 55.0], [-136.5, 57.5], [-139.0, 59.5]],
      // 3. Alaska Subduction Megathrust (Yakutat, Prince William Sound, Cook Inlet, Kodiak, Alaska Peninsula)
      [[-139.0, 59.5], [-144.0, 60.0], [-148.0, 60.0], [-151.0, 59.0], [-154.0, 57.5], [-158.0, 55.5], [-162.0, 54.5]],
      // 4. Aleutian Subduction Trench (Fox Islands, Andreanof, Rat, Near Islands to Kamchatka juncture)
      [[-162.0, 54.5], [-167.0, 53.0], [-173.0, 51.5], [-179.0, 51.0], [176.0, 51.5], [171.0, 52.5], [165.0, 54.0], [162.0, 55.0]],
      // 5. Denali & Alaska Range Fault Arc
      [[-137.0, 60.5], [-143.0, 62.0], [-149.0, 63.3], [-153.0, 63.0], [-157.0, 61.5]]
    ]
  },
  {
    id: 3,
    name: "Sunda Megathrust & SW Pacific Ring",
    regionId: 3,
    color: "#a855f7",
    coords: [
      // 1. Sunda-Java-Banda Trench (Andaman, Nicobar, Sumatra, Java, Bali, Timor, Banda Arc)
      [[93.5, 14.5], [94.0, 10.5], [95.0, 6.0], [97.5, 1.5], [101.0, -2.5], [105.0, -6.5], [110.0, -9.0], [115.5, -9.8], [122.0, -10.2], [128.0, -8.5], [131.5, -5.5], [131.0, -3.5]],
      // 2. Great Sumatran Fault (active strike-slip spine)
      [[95.3, 5.5], [97.0, 3.0], [99.0, 0.5], [101.5, -1.8], [103.5, -4.0], [105.0, -5.8]],
      // 3. Philippine Trench & Molucca Sea (Halmahera, Mindanao, Leyte, Samar, Luzon)
      [[126.5, 1.0], [127.0, 4.0], [126.5, 7.5], [126.0, 11.0], [124.0, 15.5], [122.5, 18.5]],
      // 4. New Guinea & Melanesia Trench (Papua New Guinea, New Britain, Solomons, Vanuatu / New Hebrides)
      [[134.0, -1.5], [140.0, -3.0], [146.0, -4.5], [152.0, -5.5], [156.0, -7.5], [161.0, -10.5], [166.0, -13.5], [168.5, -17.5], [170.0, -21.5]],
      // 5. Tonga-Kermadec-Hikurangi Trench & New Zealand Alpine Fault
      [[-173.5, -15.0], [-175.5, -21.0], [-177.0, -28.0], [-178.5, -34.0], [178.5, -38.0], [175.5, -41.5], [171.0, -43.5], [166.0, -46.5]]
    ]
  },
  {
    id: 4,
    name: "San Andreas & Western North America Faults",
    regionId: 4,
    color: "#f59e0b",
    coords: [
      // 1. San Andreas Fault (Mendocino, SF Bay, Central Coast, Mojave, San Bernardino, Salton Sea, Imperial)
      [[-124.5, 40.4], [-123.8, 39.0], [-122.9, 38.1], [-122.4, 37.6], [-121.7, 37.0], [-120.5, 36.0], [-119.5, 35.0], [-118.0, 34.4], [-116.8, 33.9], [-115.8, 33.3], [-115.2, 32.7], [-114.8, 32.0]],
      // 2. Gulf of California Spreading Rifts & Baja California
      [[-114.8, 32.0], [-114.0, 31.0], [-113.0, 29.5], [-111.5, 27.5], [-110.0, 25.5], [-108.5, 23.5], [-107.0, 21.0]],
      // 3. Eastern California Shear Zone & Walker Lane (Ridgecrest, Owens Valley, Nevada, Reno)
      [[-118.5, 34.8], [-117.6, 35.7], [-118.0, 36.8], [-118.4, 38.0], [-119.5, 39.5], [-120.2, 41.0]],
      // 4. Mendocino Fracture Zone & Gorda Ridge
      [[-124.5, 40.4], [-126.0, 40.3], [-128.5, 40.3], [-129.5, 41.5]]
    ]
  },
  {
    id: 5,
    name: "Himalayan Thrust & Alpide Collision Belt",
    regionId: 5,
    color: "#10b981",
    coords: [
      // 1. Main Himalayan Frontal Thrust Arc (Pamir, Kashmir, Nepal, Bhutan, Assam)
      [[70.0, 36.5], [74.0, 34.5], [77.5, 31.8], [81.5, 29.5], [85.5, 27.8], [89.5, 27.2], [93.5, 27.8], [97.0, 28.5]],
      // 2. Tibetan Plateau Faults & Longmenshan Fault (Sichuan/Wenchuan)
      [[85.0, 34.5], [92.0, 35.5], [98.5, 33.5], [103.5, 31.5], [105.0, 32.5]],
      // 3. Sagaing Fault & Indo-Burman Ranges (Myanmar)
      [[97.0, 28.5], [95.5, 25.0], [95.8, 22.0], [96.2, 18.0], [96.5, 14.5]],
      // 4. Zagros Mountains Fold-Thrust Belt & Makran (Iran / Pakistan / Afghanistan)
      [[45.0, 38.0], [48.5, 35.0], [51.5, 30.5], [56.0, 27.5], [62.0, 25.5], [66.5, 29.5], [70.0, 34.0]],
      // 5. North & East Anatolian Faults & Hellenic Arc (Turkey / Greece / Mediterranean)
      [[20.0, 37.5], [25.0, 39.0], [29.5, 40.8], [35.5, 40.3], [41.0, 39.5], [37.5, 37.5]]
    ]
  }
];

// Connecting major planetary plate boundaries (Global Tectonic Grid)
const GLOBAL_PLATE_BOUNDARIES = [
  // Mid-Atlantic Ridge
  { name: "Mid-Atlantic Ridge", coords: [[-28, 80], [-19, 65], [-29, 45], [-42, 25], [-35, 0], [-18, -25], [-14, -50], [0, -60]] },
  // East Pacific Rise
  { name: "East Pacific Rise", coords: [[-110, -55], [-112, -40], [-111, -20], [-105, 0], [-104, 10], [-107, 20]] },
  // Pacific-Antarctic Ridge
  { name: "Pacific-Antarctic Ridge", coords: [[-110, -55], [-125, -58], [-145, -62], [-165, -64], [175, -63]] },
  // Indian Ocean Ridges
  { name: "Southwest Indian Ridge", coords: [[20, -53], [35, -45], [45, -38], [55, -35], [70, -25]] },
  { name: "Southeast Indian Ridge", coords: [[70, -25], [85, -34], [105, -45], [125, -50], [140, -52], [160, -55]] },
  { name: "Central Indian Ridge", coords: [[70, -25], [67, -10], [63, 5], [58, 14], [43, 12]] },
  // Red Sea & East African Rift
  { name: "Red Sea & Afar Rift", coords: [[43, 12], [40, 18], [35, 25], [33, 29]] },
  { name: "East African Rift", coords: [[40, 10], [36, 0], [34, -10], [35, -18]] },
  // Caribbean Plate Boundary
  { name: "Caribbean Plate Boundary", coords: [[-85, 16], [-75, 18], [-68, 19], [-63, 17], [-60, 11], [-65, 10], [-73, 10]] }
];

let regions = [
  {
    id: 0,
    name: "Japan Trench",
    subtitle: "NW Pacific / Japan & Taiwan Arc",
    plate: "Pacific & Philippine Sea under Okhotsk / Eurasia",
    type: "Subduction Megathrust",
    color: "#f43f5e",
    defaultDepthKm: 29,
    defaultMag: 9.1,
    lon: REGION_COORDS[0].lon,
    lat: REGION_COORDS[0].lat,
    fact: "The Japan Trench megathrust shifted the main island of Honshu 2.4 meters eastward in 2011 and altered Earth's rotational axis by ~17 cm.",
    quakeCount: 0,
    quakes: []
  },
  {
    id: 1,
    name: "Chile Trench",
    subtitle: "South & Central America Arc",
    plate: "Nazca & Cocos under South America",
    type: "Megathrust Subduction",
    color: "#ec4899",
    defaultDepthKm: 33,
    defaultMag: 9.5,
    lon: REGION_COORDS[1].lon,
    lat: REGION_COORDS[1].lat,
    fact: "The Peru-Chile Trench hosted the 1960 M9.5 Valdivia rupture—the largest earthquake ever instrumentally recorded, releasing energy equivalent to 1,000 atomic bombs.",
    quakeCount: 0,
    quakes: []
  },
  {
    id: 2,
    name: "Cascadia Zone",
    subtitle: "Pacific NW / Alaska / Aleutians",
    plate: "Juan de Fuca & Pacific under North America",
    type: "Locked Megathrust",
    color: "#38bdf8",
    defaultDepthKm: 25,
    defaultMag: 9.0,
    lon: REGION_COORDS[2].lon,
    lat: REGION_COORDS[2].lat,
    fact: "Cascadia ruptures in massive ~M9.0 megathrust events every 400–600 years. Its 1700 rupture sent an 'orphan tsunami' across the Pacific to Japan.",
    quakeCount: 0,
    quakes: []
  },
  {
    id: 3,
    name: "Sunda Megathrust",
    subtitle: "SE Asia & SW Pacific (Ring of Fire)",
    plate: "Indo-Australian & Pacific under Sunda / Burma / Philippine",
    type: "Subduction Megathrust",
    color: "#a855f7",
    defaultDepthKm: 30,
    defaultMag: 9.1,
    lon: REGION_COORDS[3].lon,
    lat: REGION_COORDS[3].lat,
    fact: "The 2004 Sumatra quake caused the entire planet to vibrate by up to 1 cm and ruptured a 1,300 km section of oceanic crust, triggering ocean-wide tsunamis.",
    quakeCount: 0,
    quakes: []
  },
  {
    id: 4,
    name: "San Andreas",
    subtitle: "California & Western NA Faults",
    plate: "Pacific sliding alongside North America",
    type: "Strike-Slip Transform Fault",
    color: "#f59e0b",
    defaultDepthKm: 10,
    defaultMag: 7.9,
    lon: REGION_COORDS[4].lon,
    lat: REGION_COORDS[4].lat,
    fact: "A shallow continental transform fault where the Pacific plate slides northwest past North America at roughly fingernail growth speed (~33 mm/yr).",
    quakeCount: 0,
    quakes: []
  },
  {
    id: 5,
    name: "Himalayan Belt",
    subtitle: "Central / South Asia & Alpide Belt",
    plate: "Indian & Arabian Plates colliding into Eurasia",
    type: "Continental Collision Thrust",
    color: "#10b981",
    defaultDepthKm: 15,
    defaultMag: 7.8,
    lon: REGION_COORDS[5].lon,
    lat: REGION_COORDS[5].lat,
    fact: "The continuous collision of the Indian subcontinent into Asia raises the Himalayas by ~5 mm every year while generating major seismic ruptures.",
    quakeCount: 0,
    quakes: []
  }
];

// ============================================================================
// 2. CHRONOLOGICAL EARTHQUAKE SEQUENCE (Real Order of Occurrence by Region)
// ============================================================================
const CURATED_EARTHQUAKES = [
  {
    order: 1,
    year: 1700,
    dateStr: "Jan 26, 1700",
    regionId: 2, // Cascadia
    lon: -125.0,
    lat: 45.0,
    title: "1700 Cascadia Megathrust",
    place: "Cascadia Subduction Zone (Pacific NW)",
    mag: 9.0,
    depthKm: 25,
    plate: "Juan de Fuca under North America",
    type: "Locked Megathrust",
    fact: "Ruptured ~1,000 km of the Cascadia megathrust fault; generated a trans-Pacific tsunami documented in Japanese samurai village records."
  },
  {
    order: 2,
    year: 1906,
    dateStr: "Apr 18, 1906",
    regionId: 4, // San Andreas
    lon: -122.5,
    lat: 37.7,
    title: "1906 San Francisco Earthquake",
    place: "San Andreas Fault (Northern California)",
    mag: 7.9,
    depthKm: 10,
    plate: "Pacific alongside North America",
    type: "Strike-Slip Transform Fault",
    fact: "Ruptured 477 km of the San Andreas fault. The massive surface offset led to the discovery of elastic-rebound theory, the foundation of modern seismology."
  },
  {
    order: 3,
    year: 1923,
    dateStr: "Sep 1, 1923",
    regionId: 0, // Japan Trench
    lon: 139.3,
    lat: 35.3,
    title: "1923 Great Kanto Earthquake",
    place: "Sagami Trough / Japan Arc",
    mag: 7.9,
    depthKm: 15,
    plate: "Philippine Sea under Okhotsk/Eurasia",
    type: "Subduction Megathrust",
    fact: "Struck Tokyo and Yokohama with violent shaking and fire whirlwinds, fundamentally transforming Japanese seismic engineering and building codes."
  },
  {
    order: 4,
    year: 1934,
    dateStr: "Jan 15, 1934",
    regionId: 5, // Himalayan Belt
    lon: 86.5,
    lat: 26.5,
    title: "1934 Nepal-Bihar Earthquake",
    place: "Main Himalayan Thrust (Nepal/Bihar)",
    mag: 8.0,
    depthKm: 15,
    plate: "Indian colliding into Eurasian Plate",
    type: "Continental Collision Thrust",
    fact: "A catastrophic collision event along the Main Himalayan Thrust that leveled structures across Kathmandu Valley and northern India."
  },
  {
    order: 5,
    year: 1960,
    dateStr: "May 22, 1960",
    regionId: 1, // Chile Trench
    lon: -73.0,
    lat: -39.5,
    title: "1960 Great Chilean (Valdivia) Quake",
    place: "Peru-Chile Trench (Valdivia, Chile)",
    mag: 9.5,
    depthKm: 33,
    plate: "Nazca under South American Plate",
    type: "Megathrust Subduction",
    fact: "The most powerful earthquake ever recorded (M9.5). Its tsunami raced across the Pacific Ocean at 700 km/h, impacting Hawaii, Japan, and the Philippines."
  },
  {
    order: 6,
    year: 1964,
    dateStr: "Mar 27, 1964",
    regionId: 2, // Cascadia / Pacific NW Arc
    lon: -147.5,
    lat: 61.0,
    title: "1964 Great Alaska Good Friday Quake",
    place: "Aleutian-Cascadia Arc (Prince William Sound)",
    mag: 9.2,
    depthKm: 25,
    plate: "Pacific under North American Plate",
    type: "Megathrust Subduction",
    fact: "The most powerful recorded US temblor; liquefied soils in Anchorage and uplifted parts of the coastline by up to 9 meters."
  },
  {
    order: 7,
    year: 1976,
    dateStr: "Jul 28, 1976",
    regionId: 5, // Himalayan / Eurasian Belt
    lon: 118.2,
    lat: 39.6,
    title: "1976 Tangshan Earthquake",
    place: "Eurasian Collision Belt (Tangshan, China)",
    mag: 7.6,
    depthKm: 12,
    plate: "Indian-Eurasian Intraplate Zone",
    type: "Strike-Slip / Collision",
    fact: "A destructive strike-slip rupture in northern China that prompted nationwide modernization of earthquake building resistance standards."
  },
  {
    order: 8,
    year: 1989,
    dateStr: "Oct 17, 1989",
    regionId: 4, // San Andreas
    lon: -121.9,
    lat: 37.0,
    title: "1989 Loma Prieta (World Series Quake)",
    place: "San Andreas Fault (Santa Cruz Mountains)",
    mag: 6.9,
    depthKm: 19,
    plate: "Pacific alongside North America",
    type: "Strike-Slip / Oblique Fault",
    fact: "Struck during live television coverage of the 1989 World Series; caused the upper deck collapse of the double-decker Cypress Structure in Oakland."
  },
  {
    order: 9,
    year: 1994,
    dateStr: "Jan 17, 1994",
    regionId: 4, // San Andreas system
    lon: -118.5,
    lat: 34.2,
    title: "1994 Northridge Earthquake",
    place: "San Andreas System (San Fernando Valley)",
    mag: 6.7,
    depthKm: 18,
    plate: "Pacific alongside North America",
    type: "Blind Thrust Fault",
    fact: "Ruptured an unmapped blind thrust fault under Los Angeles, producing intense ground accelerations that collapsed key freeway interchanges."
  },
  {
    order: 10,
    year: 1995,
    dateStr: "Jan 17, 1995",
    regionId: 0, // Japan Trench Arc
    lon: 135.0,
    lat: 34.6,
    title: "1995 Great Hanshin (Kobe) Earthquake",
    place: "Nojima Fault / Japan Arc (Kobe)",
    mag: 6.9,
    depthKm: 16,
    plate: "Philippine / Eurasian Boundary",
    type: "Strike-Slip / Subduction Arc",
    fact: "Directly ruptured the crust under urban Kobe, demonstrating the severe vulnerability of modern infrastructure to shallow near-fault ground motion."
  },
  {
    order: 11,
    year: 2004,
    dateStr: "Dec 26, 2004",
    regionId: 3, // Sunda Megathrust
    lon: 95.85,
    lat: 3.3,
    title: "2004 Indian Ocean (Sumatra) Megathrust",
    place: "Sunda Megathrust (Off Northern Sumatra)",
    mag: 9.1,
    depthKm: 30,
    plate: "Indo-Australian under Burma Plate",
    type: "Subduction Megathrust",
    fact: "Ruptured 1,300 km of seafloor, vibrating the entire planet by 1 cm and generating devastating Indian Ocean basin tsunami waves."
  },
  {
    order: 12,
    year: 2005,
    dateStr: "Oct 8, 2005",
    regionId: 5, // Himalayan Belt
    lon: 73.6,
    lat: 34.5,
    title: "2005 Kashmir Earthquake",
    place: "Main Himalayan Thrust (Muzaffarabad)",
    mag: 7.6,
    depthKm: 26,
    plate: "Indian colliding into Eurasian Plate",
    type: "Continental Collision Thrust",
    fact: "Ruptured 75 km of the Balakot-Bagh thrust fault in the northwest Himalayan syntaxis, triggering widespread catastrophic landslides."
  },
  {
    order: 13,
    year: 2008,
    dateStr: "May 12, 2008",
    regionId: 5, // Himalayan Belt
    lon: 103.4,
    lat: 31.0,
    title: "2008 Great Wenchuan (Sichuan) Quake",
    place: "Longmenshan Fault (Tibetan Plateau Rim)",
    mag: 7.9,
    depthKm: 19,
    plate: "Indian-Tibetan Crustal Extrusion",
    type: "Thrust / Dextral Fault",
    fact: "Ruptured over 240 km along the boundary of the Tibetan Plateau and Sichuan Basin, with horizontal and vertical displacements of up to 9 meters."
  },
  {
    order: 14,
    year: 2010,
    dateStr: "Feb 27, 2010",
    regionId: 1, // Chile Trench
    lon: -72.7,
    lat: -36.3,
    title: "2010 Maule Chile Megathrust",
    place: "Peru-Chile Trench (Offshore Maule, Chile)",
    mag: 8.8,
    depthKm: 35,
    plate: "Nazca under South American Plate",
    type: "Megathrust Subduction",
    fact: "Moved the city of Concepción 3 meters to the west, redistributed Earth's mass, and shortened the length of Earth's day by 1.26 microseconds."
  },
  {
    order: 15,
    year: 2011,
    dateStr: "Mar 11, 2011",
    regionId: 0, // Japan Trench
    lon: 142.4,
    lat: 38.3,
    title: "2011 Tohoku Great East Japan Quake",
    place: "Japan Trench (Off Pacific Coast of Tohoku)",
    mag: 9.1,
    depthKm: 29,
    plate: "Pacific under Okhotsk Plate",
    type: "Subduction Megathrust",
    fact: "Shifted Honshu 2.4 meters eastward, altered Earth's rotational axis by ~17 cm, and generated a massive 40-meter tsunami."
  },
  {
    order: 16,
    year: 2015,
    dateStr: "Apr 25, 2015",
    regionId: 5, // Himalayan Belt
    lon: 84.7,
    lat: 28.1,
    title: "2015 Gorkha Nepal Earthquake",
    place: "Main Himalayan Thrust (Gorkha, Nepal)",
    mag: 7.8,
    depthKm: 15,
    plate: "Indian colliding into Eurasian Plate",
    type: "Continental Collision Thrust",
    fact: "Uplifted the Kathmandu Valley by nearly 1 meter while Mount Everest subsided by 2.5 cm as the Indian plate pushed beneath Eurasia."
  },
  {
    order: 17,
    year: 2018,
    dateStr: "Sep 28, 2018",
    regionId: 3, // Sunda Megathrust / Indonesia
    lon: 119.8,
    lat: -0.2,
    title: "2018 Palu Sulawesi Rupture",
    place: "Palu-Koro Fault / Sunda Arc (Indonesia)",
    mag: 7.5,
    depthKm: 20,
    plate: "Sunda-Molucca Microplate Boundary",
    type: "Supershear Strike-Slip",
    fact: "A rare supershear rupture propagating faster than seismic shear waves, triggering devastating soil liquefaction and flowslides in Palu."
  },
  {
    order: 18,
    year: 2019,
    dateStr: "Jul 5, 2019",
    regionId: 4, // San Andreas system
    lon: -117.6,
    lat: 35.7,
    title: "2019 Ridgecrest Earthquake Sequence",
    place: "Eastern California Shear Zone (San Andreas System)",
    mag: 7.1,
    depthKm: 8,
    plate: "Pacific alongside North America",
    type: "Orthogonal Strike-Slip Faults",
    fact: "Ruptured two mutually perpendicular fault planes in the Mojave Desert, producing crisp surface rupture traces visible from satellite radar."
  },
  {
    order: 19,
    year: 2021,
    dateStr: "Feb 13, 2021",
    regionId: 0, // Japan Trench
    lon: 141.7,
    lat: 37.7,
    title: "2021 Fukushima Offshore Earthquake",
    place: "Japan Trench Intra-Slab (Fukushima)",
    mag: 7.1,
    depthKm: 55,
    plate: "Pacific Plate Intra-Slab",
    type: "Deep Slab Rupture",
    fact: "A deep intra-slab event within the descending Pacific plate, occurring nearly a decade after the 2011 megathrust as continuing plate accommodation."
  },
  {
    order: 20,
    year: 2024,
    dateStr: "Jan 1, 2024",
    regionId: 0, // Japan Trench Arc
    lon: 137.2,
    lat: 37.5,
    title: "2024 Noto Peninsula Earthquake",
    place: "Sea of Japan Arc / Japan System",
    mag: 7.5,
    depthKm: 10,
    plate: "Eurasian-Okhotsk Convergent Margin",
    type: "Shallow Reverse Faulting",
    fact: "Violent reverse faulting along the Noto coast uplifted sea beds by up to 4 meters, expanding coastal dry land seaward by over 200 meters."
  }
];

let earthquakeTimeline = [...CURATED_EARTHQUAKES];
let currentDatasetMode = 'historical'; // 'historical', 'year', 'month', 'singleday'
let activeDateLabel = '1700–2024 (Centuries)';

function updateDatasetDisplay() {
  const mode = currentDatasetMode;

  // 1. Tab buttons
  const tabHist = document.getElementById('tab-mode-historical');
  const tabYear = document.getElementById('tab-mode-year');
  const tabMonth = document.getElementById('tab-mode-month');
  const tabSingle = document.getElementById('tab-mode-singleday');

  if (tabHist) tabHist.classList.toggle('active', mode === 'historical');
  if (tabYear) tabYear.classList.toggle('active', mode === 'year');
  if (tabMonth) tabMonth.classList.toggle('active', mode === 'month');
  if (tabSingle) tabSingle.classList.toggle('active', mode === 'singleday');

  // 2. Mode Panels visibility
  const panelHist = document.getElementById('historic-panel');
  const panelYear = document.getElementById('year-panel');
  const panelMonth = document.getElementById('month-panel');
  const panelSingle = document.getElementById('singleday-panel');

  if (panelHist) panelHist.classList.toggle('active', mode === 'historical');
  if (panelYear) panelYear.classList.toggle('active', mode === 'year');
  if (panelMonth) panelMonth.classList.toggle('active', mode === 'month');
  if (panelSingle) panelSingle.classList.toggle('active', mode === 'singleday');

  // 3. Banner pill and restore button
  const pill = document.getElementById('banner-mode-pill');
  if (pill) {
    if (mode === 'historical') {
      pill.className = 'banner-mode-pill pill-historical';
      pill.innerText = '🏛️ Historical Mode (1700–2024)';
    } else if (mode === 'year') {
      pill.className = 'banner-mode-pill pill-year';
      pill.innerText = `🗓️ Yearly Top Quakes (${activeDateLabel})`;
    } else if (mode === 'month') {
      pill.className = 'banner-mode-pill pill-month';
      pill.innerText = `📆 Monthly Top Quakes (${activeDateLabel})`;
    } else {
      pill.className = 'banner-mode-pill pill-singleday';
      pill.innerText = `⏰ Single-Day Mode (${activeDateLabel})`;
    }
  }

  const restoreBtn = document.getElementById('btn-restore-historical');
  if (restoreBtn) {
    restoreBtn.style.display = mode === 'historical' ? 'none' : 'inline-block';
  }

  // 4. Banner text details
  const nameEl = document.getElementById('banner-dataset-name');
  if (nameEl) {
    if (mode === 'historical') {
      nameEl.innerText = 'Curated Global Megathrust Timeline (1700 – 2024)';
    } else if (mode === 'year') {
      nameEl.innerText = `Top Earthquakes of ${activeDateLabel} (Jan ➔ Dec Chronological)`;
    } else if (mode === 'month') {
      nameEl.innerText = `Top Earthquakes of ${activeDateLabel} (Day 1 ➔ 31 Chronological)`;
    } else {
      nameEl.innerText = `Single-Day 24h Tremor Feed (${activeDateLabel})`;
    }
  }

  const spanEl = document.getElementById('banner-span-val');
  if (spanEl) {
    if (mode === 'historical') spanEl.innerText = '324 Years';
    else if (mode === 'year') spanEl.innerText = `1 Year (${activeDateLabel.replace('Year ', '')})`;
    else if (mode === 'month') spanEl.innerText = '1 Month';
    else spanEl.innerText = '24 Hours';
  }

  const orderEl = document.getElementById('banner-order-val');
  if (orderEl) {
    if (mode === 'historical') orderEl.innerText = '1700 ➔ 2024';
    else if (mode === 'year') orderEl.innerText = 'Jan ➔ Dec';
    else if (mode === 'month') orderEl.innerText = 'Day 1 ➔ 31';
    else orderEl.innerText = '00:00 ➔ 23:59';
  }

  const countEl = document.getElementById('banner-count-val');
  if (countEl) {
    if (mode === 'historical') countEl.innerText = '20 Megathrusts';
    else countEl.innerText = `${earthquakeTimeline.length} Quakes`;
  }

  const descEl = document.getElementById('banner-desc-text');
  if (descEl) {
    if (mode === 'historical') {
      descEl.innerText = 'Initial default dataset: 20 of Earth\'s most cataclysmic megathrust earthquakes spanning over three centuries in chronological order (1700 Cascadia ➔ 2024 Noto). Slices represent long-term regional megathrust frequency.';
    } else if (mode === 'year') {
      descEl.innerText = `Loaded the top ${earthquakeTimeline.length} largest global earthquakes of ${activeDateLabel}, arranged in chronological order from January through December. Hear how the planet\'s seismic energy released across the seasons!`;
    } else if (mode === 'month') {
      descEl.innerText = `Loaded the top ${earthquakeTimeline.length} largest global earthquakes of ${activeDateLabel}, arranged in chronological order from Day 1 to the end of the month. Perfect for exploring major mainshock/aftershock rupture sequences!`;
    } else {
      descEl.innerText = `Loaded ${earthquakeTimeline.length} real earthquakes recorded on ${activeDateLabel}. Slices represent regional cluster activity across 24 hours (00:00 to 23:59 UTC).`;
    }
  }

  // 5. Chart top bar badge
  const chartBadge = document.getElementById('chart-dataset-badge');
  if (chartBadge) {
    if (mode === 'historical') {
      chartBadge.className = 'chart-badge-historical';
      chartBadge.innerText = '🏛️ Historical Megathrusts (1700–2024 • 324-Year Scope)';
    } else if (mode === 'year') {
      chartBadge.className = 'chart-badge-year';
      chartBadge.innerText = `🗓️ ${activeDateLabel} Largest Quakes (Jan ➔ Dec Scope)`;
    } else if (mode === 'month') {
      chartBadge.className = 'chart-badge-month';
      chartBadge.innerText = `📆 ${activeDateLabel} Largest Quakes (Month Scope)`;
    } else {
      chartBadge.className = 'chart-badge-singleday';
      chartBadge.innerText = `⏰ Single-Day Global Activity (${activeDateLabel} • 24h Scope)`;
    }
  }

  // 6. Update Corner HUD dataset pill
  const cornerBadge = document.getElementById('corner-mode-badge');
  if (cornerBadge) {
    if (mode === 'historical') {
      cornerBadge.className = 'corner-mode-badge corner-mode-historical';
      cornerBadge.innerText = '🏛️ 1700–2024';
    } else if (mode === 'year') {
      cornerBadge.className = 'corner-mode-badge corner-mode-year';
      cornerBadge.innerText = `🗓️ ${activeDateLabel}`;
    } else if (mode === 'month') {
      cornerBadge.className = 'corner-mode-badge corner-mode-month';
      cornerBadge.innerText = `📆 ${activeDateLabel.split(' ')[0]}`;
    } else {
      cornerBadge.className = 'corner-mode-badge corner-mode-singleday';
      cornerBadge.innerText = '⏰ 24h UTC';
    }
  }
}

function loadHistoricalTimeline() {
  currentDatasetMode = 'historical';
  activeDateLabel = '1700–2024 (Centuries)';
  earthquakeTimeline = [...CURATED_EARTHQUAKES];
  syncRegionsWithTimeline(earthquakeTimeline);
  renderPie(regions);

  // Reset Simon Game if running
  isGameRunning = false;
  isPlayerTurn = false;
  playerStep = 0;
  currentRound = 1;
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.innerText = "▶ Start Seismic Simon Game";
    startBtn.classList.remove('running');
  }
  const gameBadge = document.getElementById('game-status-badge');
  if (gameBadge) {
    gameBadge.innerText = "Ready to Play";
    gameBadge.style.background = "rgba(16, 185, 129, 0.15)";
    gameBadge.style.color = "#10b981";
  }
  updateTurnIndicator("Start", "start");
  const scoreVal = document.getElementById('score-val');
  if (scoreVal) scoreVal.innerText = '0';
  const roundNum = document.getElementById('round-num');
  if (roundNum) roundNum.innerText = '1';

  // Highlight default Cascadia event
  const initQuake = earthquakeTimeline[0];
  const initRegion = regions[initQuake.regionId] || regions[2];
  rotateGlobeTo(initQuake.lon, initQuake.lat, 800);
  setGlobeActiveEpicenter(initQuake.lon, initQuake.lat, initQuake, initRegion);
  updateFactCard(initRegion, initQuake);

  updateDatasetDisplay();
}

function syncRegionsWithTimeline(timeline) {
  regions.forEach(r => {
    r.quakes = [];
    r.quakeCount = 0;
  });

  timeline.forEach(q => {
    if (regions[q.regionId]) {
      regions[q.regionId].quakes.push(q);
      regions[q.regionId].quakeCount++;
    }
  });
}

syncRegionsWithTimeline(earthquakeTimeline);

// ============================================================================
// 3. D3 AUDIO SCALERS & AUDIO LEGEND
// ============================================================================
const pitchScale = scalePitch()
  .domain([5, 60])
  .range(["G4", "C2"])
  .scale("pentatonic")
  .root("C");

const gainScale = scaleGain()
  .domain([3.5, 9.5])
  .range([0.55, 0.90]);

const panScale = scalePan()
  .domain([-130, 150])
  .range([-0.8, 0.8]);

const legend = audioLegend()
  .title("Seismic Sonification Audio Key")
  .pitch(pitchScale, "Focal Depth (5km Crustal Ring ➔ 60km Mantle Sub-Bass)")
  .gain(gainScale, "Earthquake Magnitude (3.5 ➔ 9.5 Mw: Subtle Dynamics 55% ➔ 90%)")
  .pan(panScale, "Stereo Fault Longitude (West -130° ↔ East +150°)");

d3.select("#legend-mount").call(legend);

const synthMelody = createSynth({ type: "fmSynth", harmonicity: 2.5, volume: -1 });
const drums = createSamplePlayer();

// ============================================================================
// 4. D3 PIE CHART: SPATIAL ORDERING (Adjacent Faults Next to Each Other)
// ============================================================================
// Optimal global ring sequence minimizing total closed-loop distance (42,317 km):
// Cascadia (2) -> Japan (0) -> Himalayas (5) -> Sunda (3) -> Chile (1) -> San Andreas (4) -> (Cascadia)
const SPATIAL_REGION_ORDER = [2, 0, 5, 3, 1, 4];

const container = document.getElementById('pie-area');
const width = 760;
const height = 600;
const radius = 236;
const innerRadius = 136;

const svg = d3.select(container)
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`);

const g = svg.append('g')
  .attr('transform', `translate(${width / 2}, ${height / 2})`);

const pieLayout = d3.pie()
  .value(d => Math.max(2, (d.quakeCount || 1) * 1.5))
  .startAngle(-Math.PI / 6)
  .endAngle(2 * Math.PI - Math.PI / 6)
  .padAngle(0.04)
  .sort(null);

const arcGenerator = d3.arc()
  .innerRadius(innerRadius)
  .outerRadius(radius)
  .cornerRadius(6);

let piePaths, sliceLabelGroups;

function getSliceNode(regionId) {
  let found = null;
  if (piePaths) {
    piePaths.each(function(d) {
      if (d && d.data && d.data.id === regionId) found = this;
    });
  }
  return found;
}

function renderPie(regionsData) {
  g.selectAll('*').remove();

  // Order regions spatially by shortest global great-circle distance
  const orderedRegions = SPATIAL_REGION_ORDER.map(id => regionsData.find(r => r.id === id) || regionsData[id]);
  const arcs = pieLayout(orderedRegions);

  piePaths = g.selectAll('.pie-slice')
    .data(arcs)
    .enter()
    .append('path')
    .attr('class', 'pie-slice')
    .attr('d', arcGenerator)
    .attr('fill', d => d.data.color)
    .attr('opacity', 0.88);

  sliceLabelGroups = g.selectAll('.slice-label')
    .data(arcs)
    .enter()
    .append('g')
    .attr('class', 'slice-label')
    .attr('transform', d => {
      const [x, y] = arcGenerator.centroid(d);
      return `translate(${x}, ${y})`;
    })
    .attr('pointer-events', 'none');

  sliceLabelGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.3em')
    .attr('fill', '#ffffff')
    .attr('font-size', '13px')
    .attr('font-weight', '800')
    .text(d => d.data.name);

  sliceLabelGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.15em')
    .attr('fill', 'rgba(255, 255, 255, 0.8)')
    .attr('font-size', '10.5px')
    .attr('font-weight', '600')
    .text(d => `${d.data.quakeCount} Quake${d.data.quakeCount === 1 ? '' : 's'}`);

  piePaths.on('mouseenter', function(event, d) {
    if (!isGameRunning || isPlayerTurn) {
      const latestQuake = d.data.quakes[d.data.quakes.length - 1] || {
        mag: d.data.defaultMag,
        depthKm: d.data.defaultDepthKm,
        title: d.data.name,
        place: d.data.subtitle,
        dateStr: d.data.quakeCount > 0 ? "Latest Recorded Event" : "Quiescent Tectonic Zone",
        lon: d.data.lon,
        lat: d.data.lat
      };
      updateCornerStats(d.data, latestQuake);
    }
  });

  piePaths.on('click', async function(event, d) {
    await defaultEngine.start();
    if (isPlayerTurn) {
      handlePlayerInput(d.data.id, this, d.data);
    } else if (!isGameRunning) {
      handleExploreRegion(d.data.id, this, d.data);
    }
  });
}

renderPie(regions);

// ============================================================================
// 5. 3D ORTHOGRAPHIC WORLD MAP WITH CINEMATIC ZOOM FLY-THROUGH
// ============================================================================
const globeSvg = d3.select("#globe-svg");
const globeWidth = 256;
const globeHeight = 256;

const BASE_ZOOM_IN = 114;   // Detailed fault viewing scale (zoomed in)
const BASE_ZOOM_OUT = 70;   // Wide orbital view scale (zoomed out)
let userPreferredZoom = BASE_ZOOM_IN;
let isCinematicZoomActive = true;

const projection = d3.geoOrthographic()
  .scale(BASE_ZOOM_IN)
  .translate([globeWidth / 2, globeHeight / 2])
  .clipAngle(90)
  .rotate([-REGION_COORDS[2].lon, -REGION_COORDS[2].lat]); // Initial view facing Cascadia

const geoPath = d3.geoPath().projection(projection);
const graticule = d3.geoGraticule().step([30, 30]);

let worldLand = null;
let currentEpicenter = {
  lon: REGION_COORDS[2].lon,
  lat: REGION_COORDS[2].lat,
  regionId: 2,
  title: "Cascadia Zone",
  mag: 9.0
};

// SVG Globe Layer Groups
const defs = globeSvg.append('defs');

// Ocean sphere gradient
const oceanGrad = defs.append('radialGradient')
  .attr('id', 'ocean-gradient')
  .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0f244a');
oceanGrad.append('stop').attr('offset', '70%').attr('stop-color', '#091530');
oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#030814');

// Atmosphere limb glow gradient
const atmoGrad = defs.append('radialGradient')
  .attr('id', 'atmosphere-gradient')
  .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
atmoGrad.append('stop').attr('offset', '75%').attr('stop-color', 'transparent');
atmoGrad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(56, 189, 248, 0.45)');

// Glow filter
const filter = defs.append('filter')
  .attr('id', 'epicenter-glow')
  .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
filter.append('feMerge').selectAll('feMergeNode')
  .data(['blur', 'SourceGraphic'])
  .enter()
  .append('feMergeNode')
  .attr('in', d => d);

const globeGroup = globeSvg.append('g').attr('class', 'globe-layers');
const oceanPath = globeGroup.append('path').attr('class', 'globe-ocean').attr('fill', 'url(#ocean-gradient)');
const graticulePath = globeGroup.append('path').attr('class', 'globe-graticule');
const landPath = globeGroup.append('path').attr('class', 'globe-land');

// Global plate boundary network layer
const globalFaultsPath = globeGroup.append('path')
  .attr('class', 'globe-global-faults')
  .attr('fill', 'none')
  .attr('stroke', 'rgba(255, 255, 255, 0.22)')
  .attr('stroke-width', 0.9)
  .attr('stroke-dasharray', '2.5 3');

// Regional faults & active rupture layers
const regionalFaultsGroup = globeGroup.append('g').attr('class', 'globe-regional-faults');
const activeRuptureGroup = globeGroup.append('g').attr('class', 'globe-active-rupture');

const regionsPinGroup = globeGroup.append('g').attr('class', 'globe-region-pins');
const epicenterGroup = globeGroup.append('g').attr('class', 'globe-epicenter');
const atmospherePath = globeGroup.append('path').attr('class', 'globe-atmosphere').attr('fill', 'url(#atmosphere-gradient)');

// Dynamic atmospheric rim circle (resizes dynamically with scale)
const atmosphereRimCircle = globeGroup.append('circle')
  .attr('cx', globeWidth / 2)
  .attr('cy', globeHeight / 2)
  .attr('r', BASE_ZOOM_IN)
  .attr('fill', 'none')
  .attr('stroke', 'rgba(56, 189, 248, 0.45)')
  .attr('stroke-width', 1.5)
  .attr('pointer-events', 'none');

function renderGlobe() {
  const currentScale = projection.scale();
  const sphereGeo = { type: "Sphere" };

  oceanPath.attr('d', geoPath(sphereGeo));
  atmospherePath.attr('d', geoPath(sphereGeo));
  graticulePath.attr('d', geoPath(graticule()));

  if (worldLand) {
    landPath.attr('d', geoPath(worldLand));
  }

  // Update outer atmospheric rim to match current zoom scale
  atmosphereRimCircle.attr('r', currentScale);

  // Render connecting global plate boundaries
  const globalMultiLine = {
    type: "MultiLineString",
    coordinates: GLOBAL_PLATE_BOUNDARIES.map(b => b.coords)
  };
  globalFaultsPath.attr('d', geoPath(globalMultiLine));

  // Render the 6 regional fault lines and active rupture highlight
  renderRegionalFaults();

  renderGlobePins();
  renderGlobeEpicenter();
}

function renderRegionalFaults() {
  regionalFaultsGroup.selectAll('*').remove();
  activeRuptureGroup.selectAll('*').remove();

  FAULT_TRACES.forEach(fault => {
    const isMulti = Array.isArray(fault.coords[0]) && Array.isArray(fault.coords[0][0]);
    const geo = isMulti
      ? { type: "MultiLineString", coordinates: fault.coords }
      : { type: "LineString", coordinates: fault.coords };
    const pathStr = geoPath(geo);
    if (!pathStr) return;

    const isActive = fault.id === currentEpicenter.regionId;

    // Draw tectonic fault line network
    regionalFaultsGroup.append('path')
      .attr('class', `regional-fault fault-${fault.id} ${isActive ? 'active-fault' : ''}`)
      .attr('d', pathStr)
      .attr('fill', 'none')
      .attr('stroke', fault.color)
      .attr('stroke-width', isActive ? 3.5 : 1.8)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('opacity', isActive ? 1.0 : 0.55)
      .attr('filter', isActive ? 'url(#epicenter-glow)' : null);

    // If active region, render glowing rupture flash line across the entire fault network
    if (isActive) {
      activeRuptureGroup.append('path')
        .attr('class', 'rupture-pulse-line')
        .attr('d', pathStr)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

      // Place fault label near current epicenter if visible, or visible segment midpoint
      let labelPt = null;
      if (isPointVisibleOnGlobe(currentEpicenter.lon, currentEpicenter.lat)) {
        labelPt = projection([currentEpicenter.lon, currentEpicenter.lat]);
      } else {
        const segments = isMulti ? fault.coords : [fault.coords];
        for (const seg of segments) {
          const mid = seg[Math.floor(seg.length / 2)];
          if (isPointVisibleOnGlobe(mid[0], mid[1])) {
            labelPt = projection(mid);
            break;
          }
        }
      }

      if (labelPt) {
        activeRuptureGroup.append('text')
          .attr('class', 'fault-tag-label')
          .attr('x', labelPt[0] + 6)
          .attr('y', labelPt[1] - 8)
          .attr('fill', fault.color)
          .attr('font-size', '8.5px')
          .attr('font-weight', '800')
          .attr('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))')
          .text(`⚡ ${fault.name}`);
      }
    }
  });
}

function isPointVisibleOnGlobe(lon, lat) {
  const rotate = projection.rotate();
  const center = [-rotate[0], -rotate[1]];
  return d3.geoDistance([lon, lat], center) <= (Math.PI / 2);
}

function renderGlobePins() {
  regionsPinGroup.selectAll('*').remove();

  regions.forEach(region => {
    const coords = [region.lon, region.lat];
    if (isPointVisibleOnGlobe(coords[0], coords[1])) {
      const pt = projection(coords);
      if (pt) {
        const isActive = region.id === currentEpicenter.regionId;
        const pin = regionsPinGroup.append('g')
          .attr('transform', `translate(${pt[0]}, ${pt[1]})`)
          .style('cursor', 'pointer')
          .on('click', async () => {
            await defaultEngine.start();
            const node = getSliceNode(region.id);
            if (isPlayerTurn) {
              handlePlayerInput(region.id, node, region);
            } else if (!isGameRunning) {
              handleExploreRegion(region.id, node, region);
            }
          });

        pin.append('circle')
          .attr('r', isActive ? 6 : 3.5)
          .attr('fill', region.color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', isActive ? 2 : 1)
          .attr('filter', isActive ? 'url(#epicenter-glow)' : null);

        pin.append('text')
          .attr('x', 7)
          .attr('y', 3)
          .attr('fill', '#ffffff')
          .attr('font-size', isActive ? '9.5px' : '8px')
          .attr('font-weight', isActive ? '800' : '600')
          .attr('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))')
          .text(region.name.split(' ')[0]);
      }
    }
  });
}

function renderGlobeEpicenter() {
  epicenterGroup.selectAll('*').remove();

  const coords = [currentEpicenter.lon, currentEpicenter.lat];
  if (isPointVisibleOnGlobe(coords[0], coords[1])) {
    const pt = projection(coords);
    if (pt) {
      const region = regions[currentEpicenter.regionId] || regions[0];

      // Pulsing shockwave ring
      epicenterGroup.append('circle')
        .attr('cx', pt[0])
        .attr('cy', pt[1])
        .attr('r', 15)
        .attr('fill', 'none')
        .attr('stroke', region.color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.85);

      // Bright focal core
      epicenterGroup.append('circle')
        .attr('cx', pt[0])
        .attr('cy', pt[1])
        .attr('r', 4.5)
        .attr('fill', '#ffffff')
        .attr('stroke', region.color)
        .attr('stroke-width', 1.8)
        .attr('filter', 'url(#epicenter-glow)');
    }
  }

  const coordLabel = document.getElementById('globe-epicenter-coord');
  if (coordLabel) {
    coordLabel.innerText = `Lat: ${currentEpicenter.lat.toFixed(1)}°, Lon: ${currentEpicenter.lon.toFixed(1)}°`;
  }
}

// ============================================================================
// CINEMATIC GLOBE FLIGHT: ZOOM OUT => ROTATE => ZOOM IN
// ============================================================================
function rotateGlobeTo(targetLon, targetLat, duration = 800) {
  const clampedLat = Math.max(-75, Math.min(75, targetLat));
  const currentRotate = projection.rotate();
  const currentCenter = [-currentRotate[0], -currentRotate[1]];
  const targetCenter = [targetLon, clampedLat];
  const startScale = projection.scale();
  const targetScale = userPreferredZoom;

  const angularDist = d3.geoDistance(currentCenter, targetCenter);

  // If already at target location, perform an intimate focal punch zoom
  if (angularDist < 0.05) {
    globeSvg.transition("globeFly")
      .duration(duration * 0.45)
      .ease(d3.easeCubicOut)
      .tween("scalePunch", () => {
        return t => {
          const s = targetScale + Math.sin(t * Math.PI) * 12;
          projection.scale(s);
          renderGlobe();
        };
      })
      .on("end", () => {
        projection.scale(targetScale);
        renderGlobe();
        updateZoomBadge();
      });
    return;
  }

  // If cinematic zoom is disabled, perform direct rotation without zoom dip
  if (!isCinematicZoomActive) {
    const interpolateDirect = d3.geoInterpolate(currentCenter, targetCenter);
    globeSvg.transition("globeFly")
      .duration(duration * 0.75)
      .ease(d3.easeCubicOut)
      .tween("rotateDirect", () => {
        return t => {
          const [lon, lat] = interpolateDirect(t);
          projection.rotate([-lon, -lat]);
          renderGlobe();
        };
      })
      .on("end", () => {
        renderGlobe();
      });
    return;
  }

  // Cinematic Parabolic Flight: Zoom Out => Rotate to New Location => Zoom In
  // Pull back to wide orbital scale during mid-flight rotation
  const minScale = Math.max(60, Math.min(startScale, targetScale) * 0.62);
  const interpolateRotate = d3.geoInterpolate(currentCenter, targetCenter);

  globeSvg.transition("globeFly")
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .tween("cinematicFlight", () => {
      return t => {
        // 1. Great-circle spherical rotation
        const [lon, lat] = interpolateRotate(t);
        projection.rotate([-lon, -lat]);

        // 2. Parabolic zoom curve: zoom out => rotate => zoom in
        // At t=0: startScale (zoomed in)
        // At t=0.5: minScale (pulled back to wide orbit showing full planet curvature)
        // At t=1: targetScale (swooping in close to inspect the fault line)
        const currentBase = startScale * (1 - t) + targetScale * t;
        const dip = 4 * (currentBase - minScale) * t * (1 - t);
        const s = Math.max(55, currentBase - dip);
        projection.scale(s);

        renderGlobe();
      };
    })
    .on("end", () => {
      projection.rotate([-targetLon, -clampedLat]);
      projection.scale(targetScale);
      renderGlobe();
      updateZoomBadge();
    });
}

function setGlobeActiveEpicenter(lon, lat, quake, region) {
  currentEpicenter = {
    lon,
    lat,
    regionId: region.id,
    title: quake.title || region.name,
    mag: quake.mag || region.defaultMag
  };

  const facingBadge = document.getElementById('globe-facing-badge');
  if (facingBadge) {
    const activeFault = FAULT_TRACES.find(f => f.id === region.id);
    const faultName = activeFault ? activeFault.name : region.name;
    facingBadge.innerHTML = `Facing: <strong>${region.name}</strong> <span style="font-size:0.65rem; color:#94a3b8;">(${faultName})</span>`;
    facingBadge.style.color = region.color;
  }

  renderGlobe();
}

function updateZoomBadge() {
  const zoomLevelEl = document.getElementById('globe-zoom-level');
  if (zoomLevelEl) {
    const pct = Math.round((projection.scale() / BASE_ZOOM_IN) * 100);
    zoomLevelEl.innerText = `${pct}%`;
  }
}

// Interactive user drag to rotate globe freely
let isUserDragging = false;
const globeDrag = d3.drag()
  .on("start", () => {
    isUserDragging = true;
    globeSvg.interrupt("globeFly");
  })
  .on("drag", (event) => {
    const rotate = projection.rotate();
    const k = 70 / projection.scale();
    projection.rotate([
      rotate[0] + event.dx * k,
      Math.max(-80, Math.min(80, rotate[1] - event.dy * k))
    ]);
    renderGlobe();

    const center = [-projection.rotate()[0], -projection.rotate()[1]];
    let nearestRegion = regions[0];
    let minDist = Infinity;
    regions.forEach(r => {
      const dist = d3.geoDistance([r.lon, r.lat], center);
      if (dist < minDist) {
        minDist = dist;
        nearestRegion = r;
      }
    });

    const facingBadge = document.getElementById('globe-facing-badge');
    if (facingBadge) {
      const activeFault = FAULT_TRACES.find(f => f.id === nearestRegion.id);
      const faultName = activeFault ? activeFault.name : nearestRegion.name;
      facingBadge.innerHTML = `Facing: <strong>${nearestRegion.name}</strong> <span style="font-size:0.65rem; color:#94a3b8;">(${faultName})</span>`;
      facingBadge.style.color = nearestRegion.color;
    }
  })
  .on("end", () => {
    setTimeout(() => { isUserDragging = false; }, 200);
  });

globeSvg.call(globeDrag);

// Mouse wheel zoom
globeSvg.on("wheel", (event) => {
  event.preventDefault();
  globeSvg.interrupt("globeFly");
  const currentScale = projection.scale();
  const newScale = Math.max(60, Math.min(240, currentScale - event.deltaY * 0.25));
  projection.scale(newScale);
  userPreferredZoom = newScale;
  renderGlobe();
  updateZoomBadge();
});

// Interactive Zoom Control Buttons
const zoomInBtn = document.getElementById('globe-zoom-in');
if (zoomInBtn) {
  zoomInBtn.addEventListener('click', () => {
    globeSvg.interrupt("globeFly");
    const newScale = Math.min(240, projection.scale() + 20);
    projection.scale(newScale);
    userPreferredZoom = newScale;
    renderGlobe();
    updateZoomBadge();
  });
}

const zoomOutBtn = document.getElementById('globe-zoom-out');
if (zoomOutBtn) {
  zoomOutBtn.addEventListener('click', () => {
    globeSvg.interrupt("globeFly");
    const newScale = Math.max(60, projection.scale() - 20);
    projection.scale(newScale);
    userPreferredZoom = newScale;
    renderGlobe();
    updateZoomBadge();
  });
}

const zoomResetBtn = document.getElementById('globe-zoom-reset');
if (zoomResetBtn) {
  zoomResetBtn.addEventListener('click', () => {
    globeSvg.interrupt("globeFly");
    userPreferredZoom = BASE_ZOOM_IN;
    projection.scale(BASE_ZOOM_IN);
    renderGlobe();
    updateZoomBadge();
  });
}

const cinematicToggleBtn = document.getElementById('globe-cinematic-toggle');
if (cinematicToggleBtn) {
  cinematicToggleBtn.addEventListener('click', () => {
    isCinematicZoomActive = !isCinematicZoomActive;
    cinematicToggleBtn.classList.toggle('active', isCinematicZoomActive);
    cinematicToggleBtn.innerText = isCinematicZoomActive ? "🎬 Fly-Through: ON" : "🎬 Fly-Through: OFF";
  });
}

// Load world atlas TopoJSON land contours
async function loadWorldLand() {
  try {
    const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json').then(r => r.json());
    if (window.topojson) {
      worldLand = window.topojson.feature(topo, topo.objects.land);
    }
  } catch (err) {
    console.warn("Could not load world-atlas land:", err);
  }
  renderGlobe();
}

loadWorldLand();

// Initialize corner stats with the first event on the timeline
if (earthquakeTimeline && earthquakeTimeline[0]) {
  const initQuake = earthquakeTimeline[0];
  const initRegion = regions[initQuake.regionId] || regions[2];
  updateCornerStats(initRegion, initQuake);
}

// ============================================================================
// 6. SOUND & VISUAL ACTIVATION (Synchronized with Fault & 3D Globe)
// ============================================================================
function activateRegionSlice(region, quake, domElement, isComputer = false) {
  const depth = quake.depthKm || region.defaultDepthKm;
  const mag = quake.mag || region.defaultMag;
  const note = pitchScale(depth);
  const vel = gainScale(mag);
  const targetLon = quake.lon !== undefined ? quake.lon : region.lon;
  const targetLat = quake.lat !== undefined ? quake.lat : region.lat;
  const pan = panScale(targetLon);

  // Play subterranean bass impact + resonant tectonic chime with subtle magnitude-scaled velocity
  drums.trigger("kick", "8n", undefined, vel * 0.9, { pan });
  synthMelody.triggerAttackRelease(note, "4n", undefined, vel, { pan });

  // Update Educational Fact Sheet Card & Corner Stats
  updateFactCard(region, quake);
  updateCornerStats(region, quake);

  // 3D Globe Sync: Cinematic Zoom Out => Rotate => Zoom In onto the Fault
  rotateGlobeTo(targetLon, targetLat, 780);
  setGlobeActiveEpicenter(targetLon, targetLat, quake, region);

  // Rhythmic Choreography: Shockwave Ripple + Glow on the Region slice
  choreography()
    .movement("ripple")
    .intensity(mag / 5.5)
    .duration(0.45)(domElement);

  choreography()
    .movement("glow")
    .intensity(1.8)
    .duration(0.35)(domElement);

  // Active flash class
  d3.select(domElement).classed('active-flash', true);
  setTimeout(() => {
    d3.select(domElement).classed('active-flash', false);
  }, 350);
}

function updateCornerStats(region, quake) {
  if (!region || !quake) return;
  const mag = quake.mag != null ? quake.mag : region.defaultMag;
  const depth = quake.depthKm != null ? quake.depthKm : region.defaultDepthKm;
  const dateStr = quake.dateStr || (quake.year ? `Year ${quake.year}` : 'Recent');
  const targetLon = quake.lon !== undefined ? quake.lon : region.lon;
  const note = pitchScale(depth);
  const vel = Math.round(gainScale(mag) * 100);
  const dbStr = gainScale.db(mag);
  const panVal = panScale(targetLon);
  const panText = panVal < -0.1 ? `${Math.abs(panVal).toFixed(2)} L` : panVal > 0.1 ? `${panVal.toFixed(2)} R` : 'Center';

  const activeFault = FAULT_TRACES.find(f => f.id === region.id);
  const faultName = activeFault ? activeFault.name : (quake.type || region.type);

  // Magnitude rating class and color
  let magClass = "Minor";
  let magColor = "#38bdf8";
  let magBg = "rgba(56, 189, 248, 0.14)";
  if (mag >= 8.5) {
    magClass = "Cataclysmic";
    magColor = "#f43f5e";
    magBg = "rgba(244, 63, 94, 0.22)";
  } else if (mag >= 7.8) {
    magClass = "Megathrust";
    magColor = "#f43f5e";
    magBg = "rgba(244, 63, 94, 0.16)";
  } else if (mag >= 7.0) {
    magClass = "Major Quake";
    magColor = "#f59e0b";
    magBg = "rgba(245, 158, 11, 0.16)";
  } else if (mag >= 6.0) {
    magClass = "Strong Quake";
    magColor = "#fbbf24";
    magBg = "rgba(251, 191, 36, 0.16)";
  } else {
    magClass = "Moderate";
    magColor = "#10b981";
    magBg = "rgba(16, 185, 129, 0.16)";
  }

  // Top-Left Corner: Real-Time Event & Magnitude Stats
  const titleEl = document.getElementById('corner-event-name');
  if (titleEl) {
    const rawTitle = quake.title || quake.place || region.name;
    titleEl.innerText = rawTitle;
    titleEl.title = rawTitle;
  }

  const magValEl = document.getElementById('corner-mag-val');
  if (magValEl) magValEl.innerText = `M ${Number(mag).toFixed(1)}`;

  const magContainer = document.getElementById('corner-mag-container');
  if (magContainer) {
    magContainer.style.background = magBg;
    magContainer.style.borderColor = magColor;
  }

  const magClassEl = document.getElementById('corner-mag-class');
  if (magClassEl) {
    magClassEl.innerText = magClass;
    magClassEl.style.color = magColor;
  }

  const depthEl = document.getElementById('corner-depth-val');
  if (depthEl) depthEl.innerText = `${depth} km`;

  const mode = currentDatasetMode;
  const cornerBadge = document.getElementById('corner-mode-badge');
  if (cornerBadge) {
    if (mode === 'historical') {
      cornerBadge.className = 'corner-mode-badge corner-mode-historical';
      cornerBadge.innerText = '🏛️ 1700–2024';
    } else if (mode === 'year') {
      cornerBadge.className = 'corner-mode-badge corner-mode-year';
      cornerBadge.innerText = `🗓️ ${activeDateLabel}`;
    } else if (mode === 'month') {
      cornerBadge.className = 'corner-mode-badge corner-mode-month';
      cornerBadge.innerText = `📆 ${activeDateLabel.split(' ')[0]}`;
    } else {
      cornerBadge.className = 'corner-mode-badge corner-mode-singleday';
      cornerBadge.innerText = '⏰ 24h UTC';
    }
  }

  const dateLabelEl = document.getElementById('corner-date-label');
  if (dateLabelEl) {
    dateLabelEl.innerText = mode === 'singleday' ? 'TIME' : 'DATE';
  }

  const dateEl = document.getElementById('corner-date-val');
  if (dateEl) {
    dateEl.innerText = mode === 'singleday' ? `${dateStr} UTC` : dateStr;
  }

  const regionEl = document.getElementById('corner-region-val');
  if (regionEl) {
    regionEl.innerText = region.name.split(' ')[0];
    regionEl.style.color = region.color;
  }

  // Top-Right Corner: Real-Time Sonic & Rupture Telemetry
  const pitchEl = document.getElementById('corner-pitch-val');
  if (pitchEl) pitchEl.innerText = note;

  const panEl = document.getElementById('corner-pan-val');
  if (panEl) panEl.innerText = panText;

  const gainEl = document.getElementById('corner-gain-val');
  if (gainEl) gainEl.innerText = `${vel}% (${dbStr} dB)`;

  const faultEl = document.getElementById('corner-fault-val');
  if (faultEl) {
    faultEl.innerText = faultName.split('&')[0].trim();
    faultEl.style.color = region.color;
  }
}

function updateFactCard(region, quake) {
  updateCornerStats(region, quake);
  const dateLabel = quake.dateStr || (quake.year ? `Year ${quake.year}` : 'Recent');
  const activeFault = FAULT_TRACES.find(f => f.id === region.id);
  const faultName = activeFault ? activeFault.name : (quake.type || region.type);

  document.getElementById('info-title').innerHTML = `🌋 ${quake.title || quake.place || region.name}`;
  document.getElementById('info-badges').innerHTML = `
    <span class="info-stat">Region: ${region.name}</span>
    <span class="info-stat">Fault: ${faultName}</span>
    <span class="info-stat">Magnitude: M${quake.mag}</span>
    <span class="info-stat">Depth: ${quake.depthKm} km</span>
    <span class="info-stat">Date: ${dateLabel}</span>
    <span class="info-stat">Plate: ${quake.plate || region.plate}</span>
  `;
  document.getElementById('info-desc').innerText = quake.fact || region.fact;
  exploredSet.add(region.id);
  document.getElementById('unlocked-val').innerText = `${exploredSet.size}/${regions.length}`;
}

function handleExploreRegion(regionId, domElement, region) {
  const latestQuake = region.quakes[region.quakes.length - 1] || {
    mag: region.defaultMag,
    depthKm: region.defaultDepthKm,
    title: `${region.name} (Quiescent / Locked)`,
    fact: `${region.name} had 0 events on this selected timeline. ${region.fact}`,
    plate: region.plate,
    type: region.type,
    lon: region.lon,
    lat: region.lat,
    dateStr: "No Events on Selected Date"
  };
  activateRegionSlice(region, latestQuake, domElement, false);
}

// ============================================================================
// 7. SEISMIC SIMON ENGINE: ORDER OF OCCURRENCE BY REGION
// ============================================================================
let playerStep = 0;
let isPlayerTurn = false;
let currentRound = 1;
let currentScore = 0;
let highStreak = 0;
let isGameRunning = false;
const exploredSet = new Set();

function updateTurnIndicator(text, mode = 'watch') {
  const indicator = document.getElementById('turn-indicator');
  const badge = document.getElementById('turn-badge');
  if (indicator) indicator.innerText = text;
  if (!badge) return;

  if (mode === 'start' || mode === 'ready') {
    if (indicator) indicator.style.color = "#38bdf8";
    badge.style.borderColor = "rgba(56, 189, 248, 0.55)";
    badge.style.boxShadow = "0 0 16px rgba(56, 189, 248, 0.4)";
    badge.style.cursor = "pointer";
    badge.style.pointerEvents = "auto";
  } else if (mode === 'watch') {
    if (indicator) indicator.style.color = "#fbbf24";
    badge.style.borderColor = "rgba(251, 191, 36, 0.45)";
    badge.style.boxShadow = "0 0 14px rgba(251, 191, 36, 0.35)";
    badge.style.cursor = "default";
    badge.style.pointerEvents = "none";
  } else if (mode === 'player') {
    if (indicator) indicator.style.color = "#10b981";
    badge.style.borderColor = "rgba(16, 185, 129, 0.65)";
    badge.style.boxShadow = "0 0 16px rgba(16, 185, 129, 0.5)";
    badge.style.cursor = "default";
    badge.style.pointerEvents = "none";
  } else if (mode === 'break') {
    if (indicator) indicator.style.color = "#f43f5e";
    badge.style.borderColor = "rgba(244, 63, 94, 0.7)";
    badge.style.boxShadow = "0 0 16px rgba(244, 63, 94, 0.6)";
    badge.style.cursor = "pointer";
    badge.style.pointerEvents = "auto";
  } else if (mode === 'success') {
    if (indicator) indicator.style.color = "#fbbf24";
    badge.style.borderColor = "rgba(251, 191, 36, 0.8)";
    badge.style.boxShadow = "0 0 20px rgba(251, 191, 36, 0.6)";
    badge.style.cursor = "pointer";
    badge.style.pointerEvents = "auto";
  }
}

async function startNewGame() {
  await defaultEngine.start();
  playerStep = 0;
  currentRound = 1;
  currentScore = 0;
  isGameRunning = true;

  document.getElementById('score-val').innerText = '0';
  document.getElementById('round-num').innerText = '1';
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.innerText = "🔄 Restart Seismic Simon";
    startBtn.classList.add('running');
  }
  document.getElementById('game-status-badge').innerText = "Round 1 Active";
  document.getElementById('game-status-badge').style.background = "rgba(56, 189, 248, 0.2)";
  document.getElementById('game-status-badge').style.color = "#38bdf8";
  updateTurnIndicator("Watch", "watch");

  nextRound();
}

function nextRound() {
  isPlayerTurn = false;
  playerStep = 0;
  updateTurnIndicator("Watch", "watch");
  document.getElementById('round-num').innerText = currentRound;
  updateStepIndicator(0, currentRound);

  playSimonSequence();
}

function updateStepIndicator(current, total) {
  const trackerEl = document.getElementById('step-tracker');
  if (trackerEl) {
    if (current > 0 && earthquakeTimeline[current - 1]) {
      const q = earthquakeTimeline[current - 1];
      const timeTag = currentDatasetMode === 'historical'
        ? (q.year ? `Yr ${q.year}` : '')
        : (q.dateStr ? `${q.dateStr}` : '');
      trackerEl.innerText = `Quake ${current}/${total} ${timeTag ? '(' + timeTag + ')' : ''}`;
    } else {
      trackerEl.innerText = `Quake ${current}/${total}`;
    }
  }
}

async function playSimonSequence() {
  await new Promise(r => setTimeout(r, 600));

  for (let i = 0; i < currentRound; i++) {
    const quake = earthquakeTimeline[i];
    const region = regions[quake.regionId];
    const node = getSliceNode(quake.regionId);

    updateStepIndicator(i + 1, currentRound);
    activateRegionSlice(region, quake, node, true);

    // Adjusted speed to accommodate full cinematic fly-through
    const speed = Math.max(820, 1180 - (currentRound * 25));
    await new Promise(r => setTimeout(r, speed));
  }

  // Turn over to player
  isPlayerTurn = true;
  updateTurnIndicator("Your Turn!", "player");
  updateStepIndicator(0, currentRound);
}

function handlePlayerInput(clickedRegionId, domElement, clickedRegion) {
  const expectedQuake = earthquakeTimeline[playerStep];
  const expectedRegionId = expectedQuake.regionId;
  const expectedRegion = regions[expectedRegionId];

  if (clickedRegionId === expectedRegionId) {
    // Correct region clicked!
    activateRegionSlice(expectedRegion, expectedQuake, domElement, false);
    playerStep++;
    currentScore += 10 * currentRound;
    document.getElementById('score-val').innerText = currentScore;
    updateStepIndicator(playerStep, currentRound);

    if (playerStep > highStreak) {
      highStreak = playerStep;
      document.getElementById('streak-val').innerText = highStreak;
    }

    if (playerStep === currentRound) {
      isPlayerTurn = false;

      if (currentRound >= earthquakeTimeline.length) {
        // Player mastered the entire earthquake timeline!
        isGameRunning = false;
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
          startBtn.innerText = "▶ Play Again";
          startBtn.classList.remove('running');
        }
        updateTurnIndicator("🏆 Master!", "success");
        document.getElementById('game-status-badge').innerText = "Timeline Mastered!";
        document.getElementById('game-status-badge').style.background = "rgba(251, 191, 36, 0.2)";
        document.getElementById('game-status-badge').style.color = "#fbbf24";

        document.getElementById('info-title').innerHTML = `🏆 Full Seismic Timeline Mastered!`;
        document.getElementById('info-desc').innerText = `Phenomenal memory! You successfully reproduced all ${earthquakeTimeline.length} earthquakes across the globe in their exact chronological order of occurrence! Final Score: ${currentScore}.`;
      } else {
        currentRound++;
        updateTurnIndicator("✓ Nice!", "player");

        setTimeout(() => {
          nextRound();
        }, 900);
      }
    }
  } else {
    // Fault Rupture / Mistake
    isPlayerTurn = false;
    isGameRunning = false;
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.innerText = "🔄 Retry Simon Game";
      startBtn.classList.remove('running');
    }
    updateTurnIndicator("Break!", "break");
    document.getElementById('game-status-badge').innerText = "Seismic Fault Break!";
    document.getElementById('game-status-badge').style.background = "rgba(244, 63, 94, 0.2)";
    document.getElementById('game-status-badge').style.color = "#f43f5e";

    drums.trigger("snare", "8n", undefined, 1.0);
    g.selectAll('.pie-slice').each(function() {
      choreography().movement("shake").intensity(2.0).duration(0.5)(this);
    });

    const dateStr = expectedQuake.dateStr || (expectedQuake.year ? `Year ${expectedQuake.year}` : 'Recent');
    document.getElementById('info-title').innerHTML = `⚠️ Seismic Fault Rupture!`;
    document.getElementById('info-desc').innerText = `At sequence step ${playerStep + 1}, the earthquake occurred in ${expectedRegion.name} (${expectedQuake.title || expectedQuake.place}, M${expectedQuake.mag}, ${dateStr}), but you clicked ${clickedRegion.name}. You reached Round ${currentRound} with a final score of ${currentScore}! Press Restart to try again.`;
  }
}

document.getElementById('start-game-btn').addEventListener('click', () => {
  startNewGame();
});

const globeTurnBadge = document.getElementById('turn-badge');
if (globeTurnBadge) {
  globeTurnBadge.addEventListener('click', () => {
    if (!isGameRunning) {
      startNewGame();
    }
  });
}

// ============================================================================
// 8. USGS QUERY ENGINE: YEAR, MONTH, DAY, AND LIVE FEEDS
// ============================================================================
function classifyQuakeToRegion(f) {
  const [lon, lat] = f.geometry.coordinates;
  const place = (f.properties.place || "").toLowerCase();

  // 1. San Andreas / California / Nevada / Baja
  if (
    place.includes("california") ||
    place.includes("nevada") ||
    place.includes("baja") ||
    (lat >= 24 && lat <= 42 && lon >= -126 && lon <= -113)
  ) {
    return 4; // San Andreas
  }

  // 2. Cascadia / Pacific NW / Alaska / Aleutians / BC
  if (
    place.includes("oregon") ||
    place.includes("washington") ||
    place.includes("alaska") ||
    place.includes("aleutian") ||
    place.includes("british columbia") ||
    place.includes("cascadia") ||
    (lat > 42 && lat <= 72 && lon >= -180 && lon <= -115)
  ) {
    return 2; // Cascadia Zone
  }

  // 3. Chile Trench / South America & Scotia Arc
  if (
    place.includes("chile") ||
    place.includes("peru") ||
    place.includes("ecuador") ||
    place.includes("colombia") ||
    place.includes("argentina") ||
    place.includes("bolivia") ||
    place.includes("sandwich") ||
    (lat < 15 && lat >= -60 && lon >= -90 && lon <= -25)
  ) {
    return 1; // Chile Trench
  }

  // 4. Japan Trench / East Asia (Japan, Kuril, Kamchatka, Sakhalin, Taiwan)
  if (
    place.includes("japan") ||
    place.includes("kuril") ||
    place.includes("kamchatka") ||
    place.includes("russia") ||
    place.includes("taiwan") ||
    place.includes("honshu") ||
    place.includes("hokkaido") ||
    (lat >= 20 && lat <= 65 && lon >= 120 && lon <= 170)
  ) {
    return 0; // Japan Trench
  }

  // 5. Sunda Megathrust / SE Asia & SW Pacific (Indonesia, Sumatra, Philippines, Fiji, Tonga, Kermadec, NZ)
  if (
    place.includes("indonesia") ||
    place.includes("sumatra") ||
    place.includes("java") ||
    place.includes("philippines") ||
    place.includes("fiji") ||
    place.includes("tonga") ||
    place.includes("kermadec") ||
    place.includes("new zealand") ||
    place.includes("vanuatu") ||
    place.includes("papua") ||
    place.includes("caledonia") ||
    place.includes("molucca") ||
    place.includes("banda") ||
    (lat < 20 && lat >= -55 && lon >= 90 && lon <= 180)
  ) {
    return 3; // Sunda Megathrust
  }

  // 6. Himalayan Belt / Central & South Asia / Eurasia
  if (
    place.includes("nepal") ||
    place.includes("india") ||
    place.includes("china") ||
    place.includes("tibet") ||
    place.includes("pakistan") ||
    place.includes("afghanistan") ||
    place.includes("burma") ||
    place.includes("myanmar") ||
    place.includes("iran") ||
    place.includes("turkey") ||
    place.includes("greece") ||
    place.includes("italy") ||
    place.includes("chagos") ||
    (lat >= 0 && lon >= -20 && lon < 90)
  ) {
    return 5; // Himalayan Belt
  }

  // Fallback spatial partition
  if (lon < -30) return 4;
  if (lon < 90) return 5;
  if (lon < 140) return 3;
  return 0;
}

function getNextDay(dateString) {
  const d = new Date(dateString + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

// 8A. Fetch Top Largest Earthquakes for a Given Year (Sorted Jan -> Dec)
async function fetchLargestQuakesForYear(year) {
  const loadBtn = document.getElementById('fetch-year-btn');
  if (loadBtn) loadBtn.innerText = "⏳ Querying USGS...";

  try {
    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31`;
    // Attempt minmagnitude=6.5 first for true major temblors
    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startStr}&endtime=${endStr}&minmagnitude=6.5&orderby=magnitude&limit=20`;
    let res = await fetch(url);
    let json = await res.json();

    if (!json.features || json.features.length < 5) {
      url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startStr}&endtime=${endStr}&minmagnitude=5.8&orderby=magnitude&limit=20`;
      res = await fetch(url);
      json = await res.json();
    }

    if (json.features && json.features.length >= 3) {
      const parsed = json.features
        .filter(f => f.geometry && f.geometry.coordinates && f.properties.mag != null)
        .map(f => {
          const regionId = classifyQuakeToRegion(f);
          const date = new Date(f.properties.time);
          const [lon, lat, depth] = f.geometry.coordinates;
          const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          return {
            time: f.properties.time,
            year: date.getFullYear(),
            dateStr: `${monthDay}, ${year}`,
            regionId,
            lon,
            lat,
            title: `M${Number(f.properties.mag).toFixed(1)} - ${f.properties.place || "Earthquake"}`,
            place: f.properties.place || regions[regionId].name,
            mag: Math.max(3.5, Number(Number(f.properties.mag).toFixed(1))),
            depthKm: Math.max(5, Math.round(depth || 10)),
            plate: `Coord: [${lat.toFixed(1)}°, ${lon.toFixed(1)}°]`,
            type: `${year} Top Event`,
            fact: `One of the largest global earthquakes of ${year}, recorded by USGS on ${date.toDateString()} with magnitude M${Number(f.properties.mag).toFixed(1)} and depth ${Math.round(depth)} km.`
          };
        });

      // Sort the top largest quakes in chronological order (Jan -> Dec)
      parsed.sort((a, b) => a.time - b.time);

      currentDatasetMode = 'year';
      activeDateLabel = `Year ${year}`;
      earthquakeTimeline = parsed.slice(0, 20);
      syncRegionsWithTimeline(earthquakeTimeline);
      renderPie(regions);

      const firstQuake = earthquakeTimeline[0];
      const targetRegion = regions[firstQuake.regionId];
      rotateGlobeTo(firstQuake.lon, firstQuake.lat, 800);
      setGlobeActiveEpicenter(firstQuake.lon, firstQuake.lat, firstQuake, targetRegion);
      updateFactCard(targetRegion, firstQuake);

      updateDatasetDisplay();

      if (loadBtn) loadBtn.innerText = `✓ Loaded (${earthquakeTimeline.length} Quakes)`;
    } else {
      if (loadBtn) loadBtn.innerText = "⚠ Few Quakes";
      document.getElementById('info-title').innerText = `📅 Few Quakes in ${year}`;
      document.getElementById('info-desc').innerText = `USGS reported fewer than 3 significant events for ${year}. Try another year or one of the presets!`;
    }
  } catch (err) {
    console.error("USGS year query error:", err);
    if (loadBtn) loadBtn.innerText = "✖ Query Error";
  }
}

// 8B. Fetch Top Largest Earthquakes for a Given Month (Sorted Day 1 -> 31)
async function fetchLargestQuakesForMonth(yearMonth) {
  const loadBtn = document.getElementById('fetch-month-btn');
  if (loadBtn) loadBtn.innerText = "⏳ Querying USGS...";

  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const startStr = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    // Attempt minmagnitude=6.0 first
    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startStr}&endtime=${endStr}&minmagnitude=6.0&orderby=magnitude&limit=20`;
    let res = await fetch(url);
    let json = await res.json();

    if (!json.features || json.features.length < 5) {
      url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startStr}&endtime=${endStr}&minmagnitude=5.0&orderby=magnitude&limit=20`;
      res = await fetch(url);
      json = await res.json();
    }

    if (json.features && json.features.length >= 3) {
      const monthName = new Date(year, month - 1, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });
      const parsedQuakes = json.features
        .filter(f => f.geometry && f.geometry.coordinates && f.properties.mag != null)
        .map(f => {
          const regionId = classifyQuakeToRegion(f);
          const date = new Date(f.properties.time);
          const [lon, lat, depth] = f.geometry.coordinates;
          const dayStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            time: f.properties.time,
            year: date.getFullYear(),
            dateStr: `${dayStr} (${timeStr})`,
            regionId,
            lon,
            lat,
            title: `M${Number(f.properties.mag).toFixed(1)} - ${f.properties.place || "Earthquake"}`,
            place: f.properties.place || regions[regionId].name,
            mag: Math.max(3.5, Number(Number(f.properties.mag).toFixed(1))),
            depthKm: Math.max(5, Math.round(depth || 10)),
            plate: `Coord: [${lat.toFixed(1)}°, ${lon.toFixed(1)}°]`,
            type: `${monthName} Top Event`,
            fact: `One of the largest global earthquakes of ${monthName}, recorded by USGS on ${date.toDateString()} at ${timeStr} with magnitude M${Number(f.properties.mag).toFixed(1)} and focal depth ${Math.round(depth)} km.`
          };
        });

      // Sort the top largest quakes in chronological order (Day 1 -> Day 31)
      parsedQuakes.sort((a, b) => a.time - b.time);

      currentDatasetMode = 'month';
      activeDateLabel = monthName;
      earthquakeTimeline = parsedQuakes.slice(0, 20);
      syncRegionsWithTimeline(earthquakeTimeline);
      renderPie(regions);

      const firstQuake = earthquakeTimeline[0];
      const targetRegion = regions[firstQuake.regionId];
      rotateGlobeTo(firstQuake.lon, firstQuake.lat, 800);
      setGlobeActiveEpicenter(firstQuake.lon, firstQuake.lat, firstQuake, targetRegion);
      updateFactCard(targetRegion, firstQuake);

      updateDatasetDisplay();

      if (loadBtn) loadBtn.innerText = `✓ Loaded (${earthquakeTimeline.length} Quakes)`;
    } else {
      if (loadBtn) loadBtn.innerText = "⚠ Few Quakes";
      document.getElementById('info-title').innerText = `📅 Few Quakes in ${yearMonth}`;
      document.getElementById('info-desc').innerText = `USGS reported fewer than 3 significant events for ${yearMonth}. Try another month or preset!`;
    }
  } catch (err) {
    console.error("USGS month query error:", err);
    if (loadBtn) loadBtn.innerText = "✖ Query Error";
  }
}

// 8C. Fetch Single-Day Earthquakes (Sorted 00:00 -> 23:59 UTC)
async function fetchEarthquakesForDate(dateStr) {
  const nextDayStr = getNextDay(dateStr);
  const fetchDateBtn = document.getElementById('fetch-date-btn');
  if (fetchDateBtn) fetchDateBtn.innerText = "⏳ Loading...";

  try {
    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${dateStr}&endtime=${nextDayStr}&minmagnitude=3.0&orderby=time-asc`;
    let res = await fetch(url);
    let json = await res.json();

    if (!json.features || json.features.length < 5) {
      url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${dateStr}&endtime=${nextDayStr}&minmagnitude=2.0&orderby=time-asc`;
      res = await fetch(url);
      json = await res.json();
    }

    if (json.features && json.features.length >= 3) {
      const parsedQuakes = json.features
        .filter(f => f.geometry && f.geometry.coordinates && f.properties.mag != null)
        .map(f => {
          const regionId = classifyQuakeToRegion(f);
          const date = new Date(f.properties.time);
          const [lon, lat, depth] = f.geometry.coordinates;
          return {
            time: f.properties.time,
            year: date.getFullYear(),
            dateStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            regionId,
            lon,
            lat,
            title: `M${Number(f.properties.mag).toFixed(1)} - ${f.properties.place || "Earthquake"}`,
            place: f.properties.place || regions[regionId].name,
            mag: Math.max(3.5, Number(Number(f.properties.mag).toFixed(1))),
            depthKm: Math.max(5, Math.round(depth || 10)),
            plate: `Coord: [${lat.toFixed(1)}°, ${lon.toFixed(1)}°]`,
            type: "USGS Event",
            fact: `USGS recorded this event on ${date.toDateString()} at ${date.toTimeString().split(' ')[0]} with magnitude M${Number(f.properties.mag).toFixed(1)} and depth ${Math.round(depth)} km.`
          };
        })
        .sort((a, b) => a.time - b.time);

      currentDatasetMode = 'singleday';
      activeDateLabel = dateStr;
      earthquakeTimeline = parsedQuakes.slice(0, 25);
      syncRegionsWithTimeline(earthquakeTimeline);
      renderPie(regions);

      const firstQuake = earthquakeTimeline[0];
      const targetRegion = regions[firstQuake.regionId];
      rotateGlobeTo(firstQuake.lon, firstQuake.lat, 800);
      setGlobeActiveEpicenter(firstQuake.lon, firstQuake.lat, firstQuake, targetRegion);
      updateFactCard(targetRegion, firstQuake);

      updateDatasetDisplay();

      if (fetchDateBtn) fetchDateBtn.innerText = `✓ Loaded (${earthquakeTimeline.length} Quakes)`;
      document.getElementById('info-desc').innerText = `Loaded ${earthquakeTimeline.length} real earthquakes recorded on ${dateStr}. Slices reflect regional tremor counts across 24 hours. Earliest event occurred in ${targetRegion.name} (${firstQuake.title}). Press Start Game to play the chronological sequence!`;
    } else {
      if (fetchDateBtn) fetchDateBtn.innerText = "⚠ Few Quakes";
      document.getElementById('info-title').innerText = `📅 Few Quakes on ${dateStr}`;
      document.getElementById('info-desc').innerText = `USGS reported fewer than 3 significant events on ${dateStr}. Try another date or use one of the quick presets!`;
    }
  } catch (err) {
    console.error("USGS date query error:", err);
    if (fetchDateBtn) fetchDateBtn.innerText = "✖ Query Error";
  }
}

// 9. Wire Mode Switcher Tabs
const tabHist = document.getElementById('tab-mode-historical');
if (tabHist) {
  tabHist.addEventListener('click', () => {
    loadHistoricalTimeline();
  });
}

const tabYear = document.getElementById('tab-mode-year');
if (tabYear) {
  tabYear.addEventListener('click', () => {
    currentDatasetMode = 'year';
    updateDatasetDisplay();
    const yearPicker = document.getElementById('quake-year-picker');
    if (yearPicker && yearPicker.value) {
      fetchLargestQuakesForYear(yearPicker.value);
    }
  });
}

const tabMonth = document.getElementById('tab-mode-month');
if (tabMonth) {
  tabMonth.addEventListener('click', () => {
    currentDatasetMode = 'month';
    updateDatasetDisplay();
    const monthPicker = document.getElementById('quake-month-picker');
    if (monthPicker && monthPicker.value) {
      fetchLargestQuakesForMonth(monthPicker.value);
    }
  });
}

const tabSingle = document.getElementById('tab-mode-singleday');
if (tabSingle) {
  tabSingle.addEventListener('click', () => {
    currentDatasetMode = 'singleday';
    updateDatasetDisplay();
    const dateInput = document.getElementById('quake-date-picker');
    if (dateInput && dateInput.value) {
      fetchEarthquakesForDate(dateInput.value);
    }
  });
}

const restoreHistBtn = document.getElementById('btn-restore-historical');
if (restoreHistBtn) {
  restoreHistBtn.addEventListener('click', () => {
    loadHistoricalTimeline();
  });
}

// 10. Wire Year Picker & Preset Buttons
const yearInput = document.getElementById('quake-year-picker');
const fetchYearBtn = document.getElementById('fetch-year-btn');
if (fetchYearBtn && yearInput) {
  fetchYearBtn.addEventListener('click', () => {
    if (yearInput.value) {
      document.querySelectorAll('.quick-preset-year').forEach(b => b.classList.remove('active'));
      fetchLargestQuakesForYear(yearInput.value);
    }
  });
}

document.querySelectorAll('.quick-preset-year').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-preset-year').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const y = btn.dataset.year;
    if (y) {
      if (yearInput) yearInput.value = y;
      fetchLargestQuakesForYear(y);
    }
  });
});

// 11. Wire Month Picker & Preset Buttons
const monthInput = document.getElementById('quake-month-picker');
const fetchMonthBtn = document.getElementById('fetch-month-btn');
if (fetchMonthBtn && monthInput) {
  fetchMonthBtn.addEventListener('click', () => {
    if (monthInput.value) {
      document.querySelectorAll('.quick-preset-month').forEach(b => b.classList.remove('active'));
      fetchLargestQuakesForMonth(monthInput.value);
    }
  });
}

document.querySelectorAll('.quick-preset-month').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-preset-month').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const m = btn.dataset.month;
    if (m) {
      if (monthInput) monthInput.value = m;
      fetchLargestQuakesForMonth(m);
    }
  });
});

// 12. Wire Date Picker & Single-Day Presets
const dateInput = document.getElementById('quake-date-picker');
const fetchDateBtn = document.getElementById('fetch-date-btn');

if (dateInput) {
  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.value = todayStr;
}

if (fetchDateBtn && dateInput) {
  fetchDateBtn.addEventListener('click', () => {
    if (dateInput.value) {
      document.querySelectorAll('.quick-preset-day').forEach(b => b.classList.remove('active'));
      fetchEarthquakesForDate(dateInput.value);
    }
  });
}

document.querySelectorAll('.quick-preset-day').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-preset-day').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const preset = btn.dataset.preset;
    const dateVal = btn.dataset.date;

    if (preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = today;
      fetchEarthquakesForDate(today);
    } else if (preset === 'yesterday') {
      const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dateInput) dateInput.value = yest;
      fetchEarthquakesForDate(yest);
    } else if (dateVal) {
      if (dateInput) dateInput.value = dateVal;
      fetchEarthquakesForDate(dateVal);
    }
  });
});

const liveBtn = document.getElementById('fetch-live-btn');
if (liveBtn) {
  liveBtn.addEventListener('click', async () => {
    liveBtn.innerText = "⏳ Querying USGS Live Feed...";
    try {
      let res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      let json = await res.json();

      if (!json.features || json.features.length < 5) {
        res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson');
        json = await res.json();
      }

      if (json.features && json.features.length >= 5) {
        const parsedQuakes = json.features
          .filter(f => f.geometry && f.geometry.coordinates && f.properties.mag != null)
          .map(f => {
            const regionId = classifyQuakeToRegion(f);
            const date = new Date(f.properties.time);
            const [lon, lat, depth] = f.geometry.coordinates;
            return {
              time: f.properties.time,
              year: date.getFullYear(),
              dateStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              regionId,
              lon,
              lat,
              title: `M${Number(f.properties.mag).toFixed(1)} - ${f.properties.place || "Earthquake"}`,
              place: f.properties.place || regions[regionId].name,
              mag: Math.max(3.5, Number(Number(f.properties.mag).toFixed(1))),
              depthKm: Math.max(5, Math.round(depth || 10)),
              plate: `Coord: [${lat.toFixed(1)}°, ${lon.toFixed(1)}°]`,
              type: "Live USGS Event",
              fact: `Recorded live by USGS seismological network at ${date.toUTCString()} with magnitude M${Number(f.properties.mag).toFixed(1)}.`
            };
          })
          .sort((a, b) => a.time - b.time);

        currentDatasetMode = 'singleday';
        activeDateLabel = 'Past 24h Live';
        earthquakeTimeline = parsedQuakes.slice(0, 25);
        syncRegionsWithTimeline(earthquakeTimeline);
        renderPie(regions);

        const firstQuake = earthquakeTimeline[0];
        const targetRegion = regions[firstQuake.regionId];
        rotateGlobeTo(firstQuake.lon, firstQuake.lat, 800);
        setGlobeActiveEpicenter(firstQuake.lon, firstQuake.lat, firstQuake, targetRegion);
        updateFactCard(targetRegion, firstQuake);

        updateDatasetDisplay();

        liveBtn.innerText = `✓ Loaded ${earthquakeTimeline.length} Live USGS Quakes`;
        document.getElementById('info-desc').innerText = `Loaded ${earthquakeTimeline.length} real earthquakes occurring over the past 24 hours. Earliest event occurred in ${targetRegion.name} (${firstQuake.title}). Press Start Game to play the chronological sequence!`;
      } else {
        liveBtn.innerText = "✓ Using Historical Timeline";
      }
    } catch (err) {
      console.warn("USGS live fetch fallback:", err);
      liveBtn.innerText = "✓ Historical Timeline Active";
    }
  });
}

// Initial display sync on load
updateDatasetDisplay();
