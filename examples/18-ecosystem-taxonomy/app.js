import {
  scalePitch,
  scaleGain,
  scalePan,
  scaleTension,
  audioLegend,
  choreography,
  defaultEngine,
  createSynth,
  createSamplePlayer
} from '../../src/index.js';

// ============================================================================
// 1. ECOSYSTEM TAXONOMY DATASETS (Directed Trophic Food Webs)
// ============================================================================
const biomeData = {
  rainforest: {
    name: "Tropical Rainforest Canopy",
    mode: "dorian",
    root: "D",
    species: [
      { id: "fig", name: "Strangler Fig Tree", tier: 0, category: "Producer", iucn: 0, emoji: "🌳", x: 120, y: 390 },
      { id: "orchid", name: "Canopy Epiphyte Orchid", tier: 0, category: "Producer", iucn: 1, emoji: "🌸", x: 260, y: 400 },
      { id: "bamboo", name: "Giant River Bamboo", tier: 0, category: "Producer", iucn: 0, emoji: "🎋", x: 420, y: 395 },

      { id: "monkey", name: "Howler Monkey", tier: 1, category: "Herbivore", iucn: 1, emoji: "🐒", x: 150, y: 290 },
      { id: "toucan", name: "Toco Toucan", tier: 1, category: "Herbivore", iucn: 0, emoji: "🦜", x: 300, y: 280 },
      { id: "sloth", name: "Three-Toed Sloth", tier: 1, category: "Herbivore", iucn: 2, emoji: "🦥", x: 440, y: 295 },

      { id: "frog", name: "Poison Dart Frog", tier: 2, category: "Carnivore", iucn: 3, emoji: "🐸", x: 200, y: 180 },
      { id: "eagle", name: "Harpy Eagle", tier: 2, category: "Carnivore", iucn: 3, emoji: "🦅", x: 370, y: 175 },

      { id: "jaguar", name: "Amazonian Jaguar", tier: 3, category: "Apex", iucn: 3, emoji: "🐆", x: 285, y: 70 },

      { id: "fungus", name: "Luminescent Bracket Fungi", tier: 4, category: "Decomposer", iucn: 0, emoji: "🍄", x: 550, y: 380 }
    ],
    // Directed links: [prey / food source, predator / consumer]
    links: [
      ["fig", "monkey"], ["fig", "toucan"],
      ["orchid", "frog"], ["orchid", "sloth"],
      ["bamboo", "sloth"],
      ["monkey", "jaguar"], ["toucan", "eagle"], ["sloth", "jaguar"],
      ["frog", "eagle"], ["eagle", "jaguar"],
      ["jaguar", "fungus"], ["sloth", "fungus"]
    ]
  },
  ocean: {
    name: "Pelagic Coral Reef & Open Ocean",
    mode: "lydian",
    root: "F",
    species: [
      { id: "phyto", name: "Phytoplankton Bloom", tier: 0, category: "Producer", iucn: 0, emoji: "🦠", x: 130, y: 390 },
      { id: "kelp", name: "Giant Kelp Forest", tier: 0, category: "Producer", iucn: 1, emoji: "🌿", x: 300, y: 400 },
      { id: "coral", name: "Staghorn Coral Colony", tier: 0, category: "Producer", iucn: 4, emoji: "🪸", x: 450, y: 395 },

      { id: "krill", name: "Euphausiid Krill Swarm", tier: 1, category: "Herbivore", iucn: 0, emoji: "🦐", x: 160, y: 290 },
      { id: "turtle", name: "Hawksbill Sea Turtle", tier: 1, category: "Herbivore", iucn: 4, emoji: "🐢", x: 380, y: 285 },

      { id: "tuna", name: "Bluefin Tuna", tier: 2, category: "Carnivore", iucn: 3, emoji: "🐟", x: 230, y: 180 },
      { id: "octopus", name: "Mimic Octopus", tier: 2, category: "Carnivore", iucn: 1, emoji: "🐙", x: 410, y: 175 },

      { id: "orca", name: "Transient Orca Pod", tier: 3, category: "Apex", iucn: 2, emoji: "🐋", x: 290, y: 70 },

      { id: "worm", name: "Benthic Abyssal Worms", tier: 4, category: "Decomposer", iucn: 0, emoji: "🪱", x: 550, y: 380 }
    ],
    links: [
      ["phyto", "krill"], ["kelp", "krill"], ["kelp", "turtle"], ["coral", "turtle"],
      ["krill", "octopus"], ["krill", "tuna"],
      ["octopus", "tuna"], ["tuna", "orca"], ["turtle", "orca"],
      ["orca", "worm"], ["tuna", "worm"]
    ]
  },
  savanna: {
    name: "East African Savanna & Grasslands",
    mode: "pentatonic",
    root: "C",
    species: [
      { id: "grass", name: "Red Oat Grass", tier: 0, category: "Producer", iucn: 0, emoji: "🌾", x: 140, y: 390 },
      { id: "acacia", name: "Umbrella Thorn Acacia", tier: 0, category: "Producer", iucn: 0, emoji: "🌳", x: 320, y: 400 },
      { id: "baobab", name: "Grand Baobab", tier: 0, category: "Producer", iucn: 2, emoji: "🪵", x: 460, y: 395 },

      { id: "zebra", name: "Plains Zebra", tier: 1, category: "Herbivore", iucn: 1, emoji: "🦓", x: 180, y: 290 },
      { id: "giraffe", name: "Masai Giraffe", tier: 1, category: "Herbivore", iucn: 3, emoji: "🦒", x: 390, y: 285 },

      { id: "cheetah", name: "Savanna Cheetah", tier: 2, category: "Carnivore", iucn: 2, emoji: "🐆", x: 220, y: 180 },
      { id: "hyena", name: "Spotted Hyena", tier: 2, category: "Carnivore", iucn: 0, emoji: "🐕", x: 410, y: 175 },

      { id: "lion", name: "African Lion Pride", tier: 3, category: "Apex", iucn: 2, emoji: "🦁", x: 290, y: 70 },

      { id: "beetle", name: "Scarabaeus Dung Beetle", tier: 4, category: "Decomposer", iucn: 0, emoji: "🪲", x: 550, y: 380 }
    ],
    links: [
      ["grass", "zebra"], ["acacia", "giraffe"], ["baobab", "giraffe"],
      ["zebra", "cheetah"], ["cheetah", "hyena"], ["hyena", "lion"],
      ["zebra", "lion"], ["giraffe", "lion"],
      ["lion", "beetle"], ["zebra", "beetle"]
    ]
  },
  arctic: {
    name: "High Arctic Tundra & Sea Ice",
    mode: "hirajoshi",
    root: "E",
    species: [
      { id: "lichen", name: "Reindeer Lichen", tier: 0, category: "Producer", iucn: 0, emoji: "🌱", x: 150, y: 390 },
      { id: "willow", name: "Arctic Willow Shrub", tier: 0, category: "Producer", iucn: 0, emoji: "🌿", x: 380, y: 400 },

      { id: "caribou", name: "Migratory Barren-ground Caribou", tier: 1, category: "Herbivore", iucn: 3, emoji: "🦌", x: 200, y: 290 },
      { id: "hare", name: "Arctic Snowshoe Hare", tier: 1, category: "Herbivore", iucn: 0, emoji: "🐇", x: 390, y: 285 },

      { id: "fox", name: "Arctic White Fox", tier: 2, category: "Carnivore", iucn: 0, emoji: "🦊", x: 230, y: 180 },
      { id: "seal", name: "Ringed Ice Seal", tier: 2, category: "Carnivore", iucn: 2, emoji: "🦭", x: 410, y: 175 },

      { id: "bear", name: "Polar Bear (Ursus maritimus)", tier: 3, category: "Apex", iucn: 3, emoji: "🐻‍❄️", x: 300, y: 70 },

      { id: "bacteria", name: "Permafrost Psychrophilic Microbiome", tier: 4, category: "Decomposer", iucn: 0, emoji: "🧫", x: 550, y: 380 }
    ],
    links: [
      ["lichen", "caribou"], ["willow", "hare"], ["lichen", "seal"],
      ["hare", "fox"], ["caribou", "bear"], ["seal", "bear"],
      ["fox", "bear"], ["bear", "bacteria"], ["seal", "bacteria"]
    ]
  }
};

const iucnLabels = [
  "Least Concern (LC)",
  "Near Threatened (NT)",
  "Vulnerable (VU)",
  "Endangered (EN)",
  "Critically Endangered (CR)"
];

const categoryColors = {
  Producer: "#10b981",
  Herbivore: "#38bdf8",
  Carnivore: "#f59e0b",
  Apex: "#f43f5e",
  Decomposer: "#a855f7"
};

// ============================================================================
// 2. AUDIO SYNTHESIS & SCALERS
// ============================================================================
const synthProducer = createSynth({ type: "polySynth", volume: -4 });
const synthHerbivore = createSynth({ type: "pluckSynth", volume: -2 });
const synthCarnivore = createSynth({ type: "fmSynth", harmonicity: 3.0, volume: -3 });
const synthApex = createSynth({ type: "polySynth", volume: -1 });
const drums = createSamplePlayer();

const tensionScaler = scaleTension().domain([0, 4]);
let currentBiomeKey = "rainforest";
let pitchScale = scalePitch().domain([0, 4]).range(["C3", "C5"]).scale("dorian").root("D");
const panScale = scalePan().domain([50, 600]).range([-0.8, 0.8]);

const legend = audioLegend()
  .title("Categorical Taxonomy ⬄ Timbre Mapping Key")
  .pitch(pitchScale, "Trophic Tier Level (Producers ➔ Apex)")
  .sample(null, "Decomposers (Granular Percussion Hits)")
  .tension(tensionScaler, "Conservation Status Risk (LC ➔ Critically Endangered)");

d3.select("#legend-mount").call(legend);

// ============================================================================
// 3. SVG CANVAS INITIALIZATION
// ============================================================================
const container = document.getElementById('ecosystem-area');
const width = container.clientWidth || 700;
const height = container.clientHeight || 480;

const svg = d3.select(container)
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`);

// Defs for directional arrowheads
const defs = svg.append('defs');

defs.append('marker')
  .attr('id', 'arrow-default')
  .attr('viewBox', '0 0 10 10')
  .attr('refX', 26)
  .attr('refY', 5)
  .attr('markerWidth', 6)
  .attr('markerHeight', 6)
  .attr('orient', 'auto')
  .append('path')
  .attr('d', 'M 0 1.5 L 8 5 L 0 8.5 z')
  .attr('fill', 'rgba(148, 163, 184, 0.45)');

defs.append('marker')
  .attr('id', 'arrow-active')
  .attr('viewBox', '0 0 10 10')
  .attr('refX', 26)
  .attr('refY', 5)
  .attr('markerWidth', 7)
  .attr('markerHeight', 7)
  .attr('orient', 'auto')
  .append('path')
  .attr('d', 'M 0 1.5 L 8 5 L 0 8.5 z')
  .attr('fill', '#10b981');

defs.append('marker')
  .attr('id', 'arrow-backtrack')
  .attr('viewBox', '0 0 10 10')
  .attr('refX', 26)
  .attr('refY', 5)
  .attr('markerWidth', 6)
  .attr('markerHeight', 6)
  .attr('orient', 'auto')
  .append('path')
  .attr('d', 'M 0 1.5 L 8 5 L 0 8.5 z')
  .attr('fill', '#fbbf24');

const g = svg.append('g');

let currentSpeciesNodes = null;
let currentLinkLines = null;

function renderBiome(biomeKey) {
  g.selectAll('*').remove();
  const biome = biomeData[biomeKey];
  document.getElementById('biome-status').innerText = biome.name;

  pitchScale.scale(biome.mode).root(biome.root);

  // Draw Trophic Tier Guidelines
  const tiers = [
    { y: 70, label: "Tier 3: Apex Predators" },
    { y: 175, label: "Tier 2: Secondary Carnivores" },
    { y: 285, label: "Tier 1: Primary Herbivores" },
    { y: 395, label: "Tier 0: Primary Producers" }
  ];

  tiers.forEach(t => {
    g.append('line')
      .attr('x1', 40).attr('x2', width - 40)
      .attr('y1', t.y).attr('y2', t.y)
      .attr('class', 'trophic-tier');

    g.append('text')
      .attr('x', 45)
      .attr('y', t.y - 6)
      .attr('fill', '#475569')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text(t.label);
  });

  // Food Web Directed Links
  const speciesMap = new Map(biome.species.map(s => [s.id, s]));
  const linkData = biome.links
    .map(l => ({ source: speciesMap.get(l[0]), target: speciesMap.get(l[1]) }))
    .filter(d => d.source && d.target);

  currentLinkLines = g.selectAll('.food-link')
    .data(linkData)
    .enter()
    .append('line')
    .attr('class', 'food-link')
    .attr('id', d => `link-${d.source.id}-${d.target.id}`)
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('marker-end', 'url(#arrow-default)');

  // Species Nodes
  currentSpeciesNodes = g.selectAll('.species-node')
    .data(biome.species)
    .enter()
    .append('g')
    .attr('class', 'species-node')
    .attr('id', d => `node-${d.id}`)
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  currentSpeciesNodes.append('circle')
    .attr('r', d => d.category === 'Apex' ? 22 : 17)
    .attr('fill', '#0b1322')
    .attr('stroke', d => categoryColors[d.category])
    .attr('stroke-width', 2);

  currentSpeciesNodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('font-size', d => d.category === 'Apex' ? '16px' : '14px')
    .text(d => d.emoji);

  // Click to start DFS from this specific organism
  currentSpeciesNodes.on('click', async function(event, d) {
    await defaultEngine.start();
    startTraversalFromNode(d.id);
  });

  // Hover to preview individual voice
  currentSpeciesNodes.on('mouseenter', async function(event, d) {
    if (!isPlaying) {
      await defaultEngine.start();
      sonifySpecies(d, this);
    }
  });

  setupTraversalSteps();
}

// ============================================================================
// 4. DEPTH-FIRST SEARCH (DFS) & BREADTH-FIRST SEARCH (BFS) GENERATORS
// ============================================================================
function generateDFSSteps(biome, startNodeId = null) {
  const speciesMap = new Map(biome.species.map(s => [s.id, s]));
  const adj = new Map();
  const inDegree = new Map();

  biome.species.forEach(s => {
    adj.set(s.id, []);
    inDegree.set(s.id, 0);
  });

  biome.links.forEach(([src, dst]) => {
    if (adj.has(src) && adj.has(dst)) {
      adj.get(src).push(dst);
      inDegree.set(dst, (inDegree.get(dst) || 0) + 1);
    }
  });

  let startRoots = [];
  if (startNodeId && speciesMap.has(startNodeId)) {
    startRoots = [startNodeId];
  } else {
    // Primary producers (inDegree === 0)
    startRoots = biome.species.filter(s => inDegree.get(s.id) === 0).map(s => s.id);
    if (startRoots.length === 0) {
      startRoots = biome.species.filter(s => s.tier === 0).map(s => s.id);
    }
  }

  const steps = [];
  const visitedOnCurrentPath = new Set();
  let chainCounter = 0;

  function dfs(currId, parentId, currentPath) {
    const node = speciesMap.get(currId);
    if (!node) return;

    visitedOnCurrentPath.add(currId);
    const newPath = [...currentPath, node];
    const children = (adj.get(currId) || []).filter(c => !visitedOnCurrentPath.has(c));
    const isLeaf = children.length === 0;

    if (isLeaf) chainCounter++;

    steps.push({
      type: 'dfs',
      action: 'visit',
      node,
      parentId,
      path: newPath,
      isLeaf,
      chainIndex: isLeaf ? chainCounter : null,
      description: parentId
        ? `${speciesMap.get(parentId).name} is consumed by ${node.name} (${node.category})`
        : `Base Producer: ${node.name} initiates food chain`
    });

    for (const childId of children) {
      dfs(childId, currId, newPath);
    }

    visitedOnCurrentPath.delete(currId);

    // Backtrack step if returning to parent
    if (parentId) {
      steps.push({
        type: 'dfs',
        action: 'backtrack',
        node: speciesMap.get(parentId),
        fromNode: node,
        path: currentPath,
        description: `Backtracking from ${node.name} to ${speciesMap.get(parentId).name}`
      });
    }
  }

  startRoots.forEach(rootId => {
    dfs(rootId, null, []);
  });

  return steps;
}

function generateBFSSteps(biome, startNodeId = null) {
  const steps = [];
  const tiers = [0, 1, 2, 3, 4];

  tiers.forEach(tier => {
    const tierSpecies = biome.species.filter(s => s.tier === tier);
    tierSpecies.forEach(node => {
      steps.push({
        type: 'bfs',
        action: 'visit',
        node,
        parentId: null,
        path: [node],
        isLeaf: tier === 3 || tier === 4,
        chainIndex: null,
        description: `Trophic Tier ${tier}: ${node.category} - ${node.name}`
      });
    });
  });

  return steps;
}

// ============================================================================
// 5. SONIFICATION ENGINE & VISUAL CHOREOGRAPHY
// ============================================================================
function sonifySpecies(d, domNode, isBacktrack = false, isLeaf = false) {
  const pan = panScale(d.x);
  const tInfo = tensionScaler(d.iucn);

  if (isBacktrack) {
    // Subtle acoustic backtrack tick
    drums.trigger("kick", "32n", undefined, 0.25, { pan });
    return;
  }

  // Categorical Instrument Timbre Routing
  if (d.category === "Decomposer") {
    drums.trigger("snare", "16n", undefined, 0.85, { pan });
  } else if (d.category === "Producer") {
    synthProducer.triggerAttackRelease(["C3", "G3"], "4n", undefined, 0.55, { pan });
  } else if (d.category === "Herbivore") {
    synthHerbivore.triggerAttackRelease(pitchScale(1), "16n", undefined, 0.75, { pan });
  } else if (d.category === "Carnivore") {
    synthCarnivore.triggerAttackRelease(pitchScale(2), "8n", undefined, 0.85, { pan });
  } else if (d.category === "Apex") {
    if (tInfo.isDissonant) {
      synthApex.triggerAttackRelease(tInfo.chord, "4n", undefined, 0.95, { pan });
    } else {
      synthApex.triggerAttackRelease(["C2", "G2", "C3"], "4n", undefined, 0.9, { pan });
    }
  }

  // If completing a food chain, add a bright harmonic resolution chime
  if (isLeaf && d.category !== "Producer") {
    setTimeout(() => {
      synthProducer.triggerAttackRelease(["E4", "B4"], "8n", undefined, 0.4, { pan });
    }, 120);
  }

  // Visual Choreography
  if (domNode) {
    choreography()
      .movement(d.iucn >= 3 ? "shake" : "pulse")
      .intensity(1.35)
      .duration(0.3)(domNode);

    d3.select(domNode).classed('active-pulse', true);
    setTimeout(() => d3.select(domNode).classed('active-pulse', false), 280);
  }
}

// ============================================================================
// 6. TRAVERSAL CONTROLLER & PLAYBACK STATE MACHINE
// ============================================================================
let activeSteps = [];
let currentStepIndex = -1;
let isPlaying = false;
let traversalTimer = null;
let traversalSpeedMs = 450;
let traversalMode = 'dfs'; // 'dfs' | 'bfs'
let customRootId = null;

function setupTraversalSteps() {
  const biome = biomeData[currentBiomeKey];
  activeSteps = traversalMode === 'dfs'
    ? generateDFSSteps(biome, customRootId)
    : generateBFSSteps(biome, customRootId);

  currentStepIndex = -1;
  resetLinkHighlights();
  updateHUD(null);
}

function resetLinkHighlights() {
  if (currentLinkLines) {
    currentLinkLines
      .attr('class', 'food-link')
      .attr('marker-end', 'url(#arrow-default)');
  }
  if (currentSpeciesNodes) {
    currentSpeciesNodes.classed('active-pulse', false);
  }
}

function highlightPath(path, backtrackFrom = null, backtrackTo = null) {
  resetLinkHighlights();

  if (backtrackFrom && backtrackTo) {
    const linkEl = d3.select(`#link-${backtrackTo.id}-${backtrackFrom.id}`);
    if (!linkEl.empty()) {
      linkEl.attr('class', 'food-link backtrack').attr('marker-end', 'url(#arrow-backtrack)');
    }
  }

  if (path && path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i].id;
      const v = path[i + 1].id;
      const linkEl = d3.select(`#link-${u}-${v}`);
      if (!linkEl.empty()) {
        linkEl.attr('class', 'food-link highlight').attr('marker-end', 'url(#arrow-active)');
      }
    }
  }
}

function updateHUD(step) {
  const counterEl = document.getElementById('dfs-step-counter');
  const titleEl = document.getElementById('species-title');
  const statsEl = document.getElementById('species-stats');
  const breadcrumbEl = document.getElementById('dfs-breadcrumb');

  if (!step) {
    if (counterEl) counterEl.innerText = `${traversalMode.toUpperCase()} Ready (${activeSteps.length} Steps)`;
    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `<span style="font-size: 0.72rem; color: var(--muted); font-style: italic;">Press Run DFS or click any species to start</span>`;
    }
    return;
  }

  if (counterEl) {
    counterEl.innerText = `${traversalMode.toUpperCase()} Step ${currentStepIndex + 1}/${activeSteps.length}`;
  }

  titleEl.innerHTML = `${step.node.emoji} ${step.node.name}`;
  const tInfo = tensionScaler(step.node.iucn);

  statsEl.innerHTML = `
    <strong>Category:</strong> ${step.node.category} (Tier ${step.node.tier})<br>
    <strong>Path Status:</strong> ${step.description}<br>
    <strong>IUCN Red List:</strong> <span style="color: ${step.node.iucn >= 3 ? '#f43f5e' : (step.node.iucn >= 2 ? '#fbbf24' : '#10b981')}">${iucnLabels[step.node.iucn]}</span> • <strong>Tension:</strong> ${tInfo.tier.toUpperCase()}
  `;

  if (breadcrumbEl) {
    if (step.action === 'backtrack') {
      breadcrumbEl.innerHTML = `
        <span class="path-chip backtracked">↩ Backtracking to: ${step.node.emoji} ${step.node.name}</span>
        <span class="path-arrow">• exploring next branch</span>
      `;
    } else {
      breadcrumbEl.innerHTML = step.path.map((n, idx) => {
        const isCurrent = idx === step.path.length - 1;
        const arrow = idx < step.path.length - 1 ? '<span class="path-arrow">➔</span>' : '';
        return `<span class="path-chip ${isCurrent ? 'active' : ''}">${n.emoji} ${n.name.split(' ')[0]}</span> ${arrow}`;
      }).join(' ');

      if (step.isLeaf) {
        breadcrumbEl.innerHTML += ` <span class="path-chip" style="background:#10b981; color:#030712;">🏆 Complete Chain #${step.chainIndex}</span>`;
      }
    }
  }
}

function executeStep(step) {
  if (!step) return;

  const domNode = currentSpeciesNodes ? currentSpeciesNodes.filter(d => d.id === step.node.id).node() : null;

  if (step.action === 'backtrack') {
    highlightPath(step.path, step.fromNode, step.node);
    sonifySpecies(step.node, domNode, true, false);
  } else {
    highlightPath(step.path, null, null);
    sonifySpecies(step.node, domNode, false, step.isLeaf);
  }

  updateHUD(step);
}

function advanceStep() {
  if (activeSteps.length === 0) return;

  currentStepIndex++;
  if (currentStepIndex >= activeSteps.length) {
    // Loop back to start or pause
    currentStepIndex = 0;
  }

  executeStep(activeSteps[currentStepIndex]);
}

function stepBack() {
  pauseTraversal();
  if (activeSteps.length === 0) return;

  currentStepIndex--;
  if (currentStepIndex < 0) {
    currentStepIndex = activeSteps.length - 1;
  }

  executeStep(activeSteps[currentStepIndex]);
}

function stepForward() {
  pauseTraversal();
  advanceStep();
}

function startTraversal() {
  if (isPlaying) return;
  isPlaying = true;
  document.getElementById('play-cascade-btn').innerText = "⏸ Pause DFS Traversal";

  advanceStep();
  traversalTimer = setInterval(advanceStep, traversalSpeedMs);
}

function pauseTraversal() {
  if (!isPlaying) return;
  isPlaying = false;
  clearInterval(traversalTimer);
  traversalTimer = null;
  document.getElementById('play-cascade-btn').innerText = "▶ Run Depth-First Food Chain Traversal (DFS)";
}

function resetTraversal() {
  pauseTraversal();
  customRootId = null;
  setupTraversalSteps();
}

function startTraversalFromNode(nodeId) {
  pauseTraversal();
  customRootId = nodeId;
  setupTraversalSteps();
  startTraversal();
}

// ============================================================================
// 7. EVENT LISTENERS
// ============================================================================
const playBtn = document.getElementById('play-cascade-btn');
playBtn.addEventListener('click', async () => {
  await defaultEngine.start();
  if (isPlaying) {
    pauseTraversal();
  } else {
    startTraversal();
  }
});

const prevBtn = document.getElementById('step-prev-btn');
if (prevBtn) {
  prevBtn.addEventListener('click', async () => {
    await defaultEngine.start();
    stepBack();
  });
}

const nextBtn = document.getElementById('step-next-btn');
if (nextBtn) {
  nextBtn.addEventListener('click', async () => {
    await defaultEngine.start();
    stepForward();
  });
}

const resetBtn = document.getElementById('reset-traversal-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    resetTraversal();
  });
}

const modeSelect = document.getElementById('traversal-mode-select');
if (modeSelect) {
  modeSelect.addEventListener('change', (e) => {
    traversalMode = e.target.value;
    resetTraversal();
    playBtn.innerText = traversalMode === 'dfs'
      ? "▶ Run Depth-First Food Chain Traversal (DFS)"
      : "▶ Run Breadth-First Trophic Traversal (BFS)";
  });
}

const speedSlider = document.getElementById('traversal-speed');
const speedValLabel = document.getElementById('speed-val');
if (speedSlider) {
  speedSlider.addEventListener('input', (e) => {
    traversalSpeedMs = parseInt(e.target.value, 10);
    if (speedValLabel) speedValLabel.innerText = `${traversalSpeedMs} ms`;
    if (isPlaying) {
      clearInterval(traversalTimer);
      traversalTimer = setInterval(advanceStep, traversalSpeedMs);
    }
  });
}

document.getElementById('biome-select').addEventListener('change', (e) => {
  pauseTraversal();
  currentBiomeKey = e.target.value;
  customRootId = null;
  renderBiome(currentBiomeKey);
});

document.getElementById('status-filter').addEventListener('change', (e) => {
  const val = e.target.value;
  currentSpeciesNodes.attr('opacity', d => {
    if (val === 'threatened') return d.iucn >= 2 ? 1 : 0.2;
    if (val === 'leastConcern') return d.iucn < 2 ? 1 : 0.2;
    return 1;
  });
});

// Initial boot
renderBiome(currentBiomeKey);
