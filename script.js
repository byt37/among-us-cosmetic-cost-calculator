// --- Data + state ---
let cosmeticsData = []; // array of items (we convert from object if needed)
let equipped = {
  hat: "No Hat",
  skin: "No Skin",
  visor: "No Visor",
  nameplate: "No Nameplate",
  pet: "No Pet",
};

const playerColors = [
  { name: "red", hex: "#c61111" },
  { name: "blue", hex: "#132ed2" },
  { name: "green", hex: "#11802d" },
  { name: "pink", hex: "#ee54bb" },
  { name: "orange", hex: "#f07d0d" },
  { name: "yellow", hex: "#f6f657" },
  { name: "black", hex: "#3f474e" },
  { name: "white", hex: "#d7e1f1" },
  { name: "purple", hex: "#6b2fbc" },
  { name: "brown", hex: "#71491e" },
  { name: "cyan", hex: "#38e2dd" },
  { name: "lime", hex: "#50f039" },
  { name: "maroon", hex: "#6b2b3c" },
  { name: "rose", hex: "#ecc0d3" },
  { name: "banana", hex: "#fffebe" },
  { name: "gray", hex: "#708496" },
  { name: "tan", hex: "#928776" },
  { name: "coral", hex: "#ec7578" },
];

// --- Cosmicube base costs ---
const cosmicubeCosts = {
  mira:{beans:0,stars:0},
  polus:{beans:3000,stars:0},
  airship:{beans:0,stars:90},
  arcane:{beans:0,stars:80},
  trick:{beans:0,stars:70},
  treat:{beans:2600,stars:0},
  innersloth:{beans:0,stars:0},
  snowbean:{beans:2100,stars:0},
  snowflake:{beans:0,stars:60},
  snack:{beans:2500,stars:0},
  feast:{beans:0,stars:110},
  hololive:{beans:0,stars:110},
  gift_cube:{beans:2000,stars:0},
  guardian:{beans:3500,stars:0},
  pusheen:{beans:0,stars:110},
  fungle:{beans:0,stars:70},
  indie:{beans:7000,stars:0},
  lunar_new_year:{beans:0,stars:20},
  gilmores_curious:{beans:0,stars:110},
  paws:{beans:3000,stars:0},
  claws:{beans:0,stars:80},
  kamurocho:{beans:0,stars:110},
  racing:{beans:0,stars:50},
};

let equippedColorIndex = 0; // default color index

// --- Load cosmetics.json ---
async function loadCosmetics() {
  try {
    const res = await fetch("cosmetics.json");
    const json = await res.json();

    if (!Array.isArray(json)) {
      cosmeticsData = Object.entries(json).map(([id, data]) => ({
        id: id,
        class: data.class,
        name: data.name,
        img: data.img,
        offset: data.offset || [0, 0],
        playercolor: data.playercolor || false,
        behindplayer: data.behindplayer || false,
        animname: data.animname || null,
        visorblocked: data.visorblocked !== undefined ? data.visorblocked : true,
        beans: data.beans || 0,
        stars: data.stars || 0,
        pods: data.pods || 0,
        podtype: data.podtype || "",
        obtainable: data.obtainable !== undefined ? data.obtainable : true,
        mustobtain: Array.isArray(data.mustobtain)
          ? data.mustobtain.map(String)
          : data.mustobtain
          ? [String(data.mustobtain)]
          : [],
      }));
    } else {
      cosmeticsData = json.map((item) => ({
        id: item.id || item.Name || item.Id || "",
        class: item.class || item.Class || "",
        name: item.name || item.Name || "",
        img: item.img || item.Img || null,
        offset: item.offset || item.Offset || [0, 0],
        playercolor: item.playercolor || item.Playercolor || false,
        behindplayer: item.behindplayer || item.Behindplayer || false,
        visorblocked: item.visorblocked !== undefined ? item.visorblocked : true,
        beans: item.beans || 0,
        stars: item.stars || 0,
        pods: item.pods || 0,
        podtype: item.podtype || "",
        mustobtain: Array.isArray(item.mustobtain)
          ? item.mustobtain.map(String)
          : item.mustobtain
          ? [String(item.mustobtain)]
          : [],
      }));
    }

    console.log("Loaded cosmetics:", cosmeticsData);
    populateColorGrid();
    calculateTotalCost();
  } catch (err) {
    console.error("Failed to load cosmetics.json", err);
  }
}

// --- Helpers ---
function getCosmeticsByClass(cosmeticClass) {
  return cosmeticsData.filter(
    (c) => (c.class || "").toLowerCase() === cosmeticClass.toLowerCase()
  );
}

// --- Build cosmetic grid ---
function populateCosmeticGrid(cosmeticClass) {
  if (cosmeticClass === "colors") {
    populateColorGrid();
    return;
  }

  const grid = document.getElementById("cosmeticGrid");
  grid.innerHTML = "";

  grid.classList.remove("nameplate-grid", "color-grid");
  if (cosmeticClass === "nameplate") grid.classList.add("nameplate-grid");

  let cosmetics = getCosmeticsByClass(cosmeticClass);

  // 🔍 Apply search filter
  const query = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";

  // Define pinned "none" cosmetics
  const pinned = cosmetics.filter(c =>
    /(^no\s|none|no_|noequipped)/i.test(c.name) || /(^no\s|none|no_|noequipped)/i.test(c.id)
  );

  // Filter the rest normally
  let filtered = cosmetics.filter(c => {
    const isPinned = pinned.includes(c);
    if (isPinned) return false; // skip, already in pinned
    if (!query) return true;
    return c.id.toLowerCase().includes(query) || c.name.toLowerCase().includes(query);
  });

  // Merge pinned first
  const finalList = [...pinned, ...filtered];

  finalList.forEach((cosmetic) => {
    const btn = document.createElement("button");
    btn.classList.add("cosmetic-button", cosmeticClass);
    if (cosmeticClass === "nameplate") btn.classList.add("nameplate");

    const img = document.createElement("img");

    if (
      cosmetic.name?.includes("None") && cosmetic.class !== "nameplate"
    ) {
      img.src = "img/none.png";
    } else if (cosmetic.playercolor === true) {
      img.src = `img/${cosmetic.class}s/${cosmetic.img}/icon.png`;
    } else if (cosmetic.class === "pet" && cosmetic.img && cosmetic.img !== "none") {
      img.src = `img/pets/${cosmetic.img}`;
    } else if (cosmetic.class === "nameplate") {
      img.src = `img/nameplate/${cosmetic.img}`;
    } else if (cosmetic.img) {
      img.src = `img/${cosmetic.class}s/${cosmetic.img}`;
    } else {
      img.src = "img/none.png";
    }

    img.alt = cosmetic.name;
    btn.appendChild(img);

    btn.addEventListener("click", () => {
      equipCosmetic(cosmetic);
      document
        .querySelectorAll(`.cosmetic-button.${cosmeticClass}`)
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });

    btn.addEventListener("mouseenter", () => {
      const hoverLabel = document.getElementById("hoveredCosmeticName");
      if (!hoverLabel) return;

      const name = cosmetic.name || "Unknown Cosmetic";
      const beans = cosmetic.beans || 0;
      const stars = cosmetic.stars || 0;
      const pods = cosmetic.pods || 0;
      const podType = cosmetic.podtype || "";
      let costParts = [];

      if (beans > 0) costParts.push(`${beans} Beans`);
      if (stars > 0) costParts.push(`${stars} Stars`);
      if (pods > 0 && podType) costParts.push(`${pods} ${capitalize(podType)} Pods`);
      const costText = costParts.length > 0 ? ` - ${costParts.join(" and ")}` : "";

      let labelHTML = `<span style="color:${
        cosmetic.obtainable === false ? "orange" : "#00ffcc"
      }">${name}${costText}</span>`;

      if (cosmetic.obtainable === false) {
        labelHTML += `<br><span style="color:orange; font-size:0.9em;">⚠ Warning! This item is no longer obtainable</span>`;
      }

      hoverLabel.innerHTML = labelHTML;
    });

    btn.addEventListener("mouseleave", () => {
      const hoverLabel = document.getElementById("hoveredCosmeticName");
      if (hoverLabel) hoverLabel.textContent = "";
    });

    if (cosmetic.obtainable === false) {
      btn.classList.add("unobtainable");
      const dot = document.createElement("div");
      dot.classList.add("unobtainable-dot");
      btn.appendChild(dot);
    }

    grid.appendChild(btn);
  });
}

// --- Search bar logic ---
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const activeBtn = document.querySelector(".menu-buttons button.active");
    if (!activeBtn) return;
    const currentClass = activeBtn.dataset.class;
    populateCosmeticGrid(currentClass);
  });
}

// --- Color grid ---
function populateColorGrid() {
  const grid = document.getElementById("cosmeticGrid");
  grid.innerHTML = "";
  grid.classList.remove("nameplate-grid");
  grid.classList.add("color-grid");

  playerColors.forEach((color, index) => {
    const btn = document.createElement("button");
    btn.classList.add("color-button");
    btn.style.backgroundColor = color.hex;
    btn.style.border = "2px solid #fff";
    btn.style.borderRadius = "12px";
    btn.style.width = "60px";
    btn.style.height = "40px";
    btn.style.margin = "4px";
    btn.title = color.name;

    if (index === equippedColorIndex) btn.classList.add("active");

    btn.addEventListener("click", () => {
      equippedColorIndex = index;
      document.querySelectorAll(".color-button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updatePlayerColor();
    });

    grid.appendChild(btn);
  });

  updatePlayerColor();
}

// --- Apply player color ---
function updatePlayerColor() {
  const player = document.getElementById("playerImage");
  if (!player) return;

  const colorName = playerColors[equippedColorIndex].name;
  player.src = `img/playerpreviews/${colorName}.png`;

  // --- Update any playercolor cosmetics currently equipped ---
  Object.entries(equipped).forEach(([cls, cosmetic]) => {
    if (!cosmetic || typeof cosmetic !== "object") return;
    if (!cosmetic.playercolor) return;

    const el = document.getElementById(`equipped${capitalize(cls)}`);
    if (!el) return;

    el.src = `img/${cls}s/${cosmetic.img}/${colorName}.png`;
  });
}

// --- Equip cosmetic ---
function equipCosmetic(cosmetic) {
  if (!cosmetic || !cosmetic.class) return;
  const cls = cosmetic.class;

  const idMap = {
    hat: "equippedHat",
    skin: "equippedSkin",
    visor: "equippedVisor",
    nameplate: "equippedNameplate",
    pet: "equippedPet",
  };

  const el = document.getElementById(idMap[cls]);
  if (!el) return;

  const isNone = cosmetic.name?.includes("None") && cosmetic.class !== "nameplate"
  if (isNone && cls !== "nameplate") {
    el.src = "";
    el.style.display = "none";
    el.style.transform = "";
    equipped[cls] = cosmetic.id || cosmetic.name;
    return;
  } else {
    el.style.display = "block";
  }

  equipped[cls] = cosmetic;

  // --- Determine player color ---
  const colorName = playerColors[equippedColorIndex]?.name || "red";

  // --- Set image path ---
  let imgPath = "";

  if (cosmetic.playercolor === true) {
    // If cosmetic.img = "angel_halo" → points to a folder
    imgPath = `img/${cls}s/${cosmetic.img}/${colorName}.png`;
  } else {
    if (cls === "hat") imgPath = `img/hats/${cosmetic.img}`;
    else if (cls === "skin") imgPath = `img/skins/${cosmetic.img}`;
    else if (cls === "pet") imgPath = `img/pets/${cosmetic.img}`;
    else if (cls === "nameplate") imgPath = `img/nameplate/${cosmetic.img}`;
    else imgPath = `img/visors/${cosmetic.img}`;
  }

  el.src = imgPath;

  // --- Offset positioning ---
  applyCosmeticOffset(cls, cosmetic, el);

  // --- Handle behindplayer ---
  if (cosmetic.behindplayer === true) {
    el.classList.add("behind-player");
  } else {
    el.classList.remove("behind-player");
  }

  // --- Handle visorblocked (for hats only) ---
if (cls === "hat") {
  const visorLayer = document.getElementById("defaultvisor");
  if (visorLayer) {
    if (cosmetic.visorblocked === false) {
      visorLayer.src = "img/truenone.png";
    } else {
      visorLayer.src = "img/visors/defvisor.png";
    }
  }
}

  // --- Adjust z-index dynamically ---
  const baseZ = {
    skin: 3,
    hat: 2,
    visor: 5,
    pet: 5,
    nameplate: 6,
  };

  if (cosmetic.behindplayer === true) {
    el.style.zIndex = 0;
  } else {
    el.style.zIndex = baseZ[cls] ?? 4;
  }
}

// --- Apply offsets ---
function applyCosmeticOffset(cls, cosmetic, el) {
  let [offsetX, offsetY] = cosmetic.offset || [0, 0];

  if (cls === "skin") { offsetX += 24; offsetY += 54; }
  if (cls === "pet") { offsetX -= 40; offsetY += 60; }
  if (cls === "nameplate") { offsetX += 200; offsetY += 45; }

  el.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

// --- Menu buttons ---
document.querySelectorAll(".menu-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".menu-buttons button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".cosmetic-button").forEach((b) => b.classList.remove("active"));
    const category = btn.dataset.class;
    populateCosmeticGrid(category);
  });
});

// --- COST CALCULATION w/ mustobtain support ---
// If an equipped item lists another equipped item in its mustobtain,
// the dependent item's cost is excluded from totals.

function calculateTotalCost() {
  const equippedItems = Object.values(equipped).filter(
    (it) => it && typeof it === "object"
  );

  const equippedIdSet = new Set();
  const equippedNameSet = new Set();
  equippedItems.forEach((it) => {
    if (it.id) equippedIdSet.add(String(it.id).toLowerCase());
    if (it.name) equippedNameSet.add(String(it.name).toLowerCase());
  });

  const excludeSet = new Set();

  // --- Step 1: one-way mustobtain (as before) ---
  for (const it of equippedItems) {
    const musts = it.mustobtain || [];
    if (!Array.isArray(musts) || musts.length === 0) continue;

    for (const req of musts) {
      const reqLower = String(req).toLowerCase();
      if (equippedIdSet.has(reqLower) || equippedNameSet.has(reqLower)) {
        equippedItems.forEach((candidate) => {
          const candId = candidate.id ? candidate.id.toLowerCase() : "";
          const candName = candidate.name ? candidate.name.toLowerCase() : "";
          if (candId === reqLower || candName === reqLower) {
            excludeSet.add(candId || candName);
          }
        });
      }
    }
  }

  // --- Step 2: mutual mustobtain resolution (compare currencies separately) ---
  for (const a of equippedItems) {
    for (const b of equippedItems) {
      if (a === b) continue;

      const aId = a.id?.toLowerCase() || "";
      const bId = b.id?.toLowerCase() || "";
      const aName = a.name?.toLowerCase() || "";
      const bName = b.name?.toLowerCase() || "";

      const aMust = a.mustobtain.map((m) => m.toLowerCase());
      const bMust = b.mustobtain.map((m) => m.toLowerCase());

      const aHasB = aMust.includes(bId) || aMust.includes(bName);
      const bHasA = bMust.includes(aId) || bMust.includes(aName);

      if (aHasB && bHasA) {
        // Compare by each currency
        const aBeans = a.beans || 0;
        const aStars = a.stars || 0;
        const aPods = a.pods || 0;
        const bBeans = b.beans || 0;
        const bStars = b.stars || 0;
        const bPods = b.pods || 0;

        // Check which is more expensive by any currency
        let aMore = false;
        let bMore = false;

        if (aBeans > bBeans || aStars > bStars || aPods > bPods) aMore = true;
        if (bBeans > aBeans || bStars > aStars || bPods > aPods) bMore = true;

        if (aMore && !bMore) {
          excludeSet.add(bId || bName);
        } else if (bMore && !aMore) {
          excludeSet.add(aId || aName);
        } else {
          // equal prices → exclude one to avoid double count
          excludeSet.add(bId || bName);
        }
      }
    }
  }

  // --- Step 3: total aggregation ---
  let totalBeans = 0;
  let totalStars = 0;
  const podsTotals = {};
  const usedPodTypes = new Set();

  for (const it of equippedItems) {
    const idLower = it.id?.toLowerCase() || "";
    const nameLower = it.name?.toLowerCase() || "";

    if (excludeSet.has(idLower) || excludeSet.has(nameLower)) continue;
    if (it.obtainable === false) continue; // ⬅️ Skip unobtainable cosmetics

    totalBeans += it.beans || 0;
    totalStars += it.stars || 0;

    if (it.pods && it.podtype) {
      const pt = String(it.podtype).toLowerCase();
      podsTotals[pt] = (podsTotals[pt] || 0) + (it.pods || 0);
      usedPodTypes.add(pt);
    }
  }

// --- Step 4: add cosmicube costs once per type ---
for (const type of usedPodTypes) {
  const cube = cosmicubeCosts[type];
  if (!cube) continue;
  totalBeans += cube.beans || 0;
  totalStars += cube.stars || 0;
}

  updateTotalCostDisplay(totalBeans, totalStars, podsTotals);
}

function updateTotalCostDisplay(beans, stars, podsTotals) {
  const container = document.getElementById("totalCostContainer");
  const breakdown = document.getElementById("costBreakdown");
  if (!container || !breakdown) return;

  breakdown.innerHTML = "";

  // Always show container (as you requested). It will show 0/0 when free.
  container.style.display = "block";

  // Beans row
  const beansRow = document.createElement("div");
  beansRow.classList.add("cost-row");
  beansRow.innerHTML = `<img src="img/icons/beans.png" class="cost-icon"> <strong>${beans}</strong> Beans`;
  breakdown.appendChild(beansRow);

  // Stars row
  const starsRow = document.createElement("div");
  starsRow.classList.add("cost-row");
  starsRow.innerHTML = `<img src="img/icons/stars.png" class="cost-icon"> <strong>${stars}</strong> Stars`;
  breakdown.appendChild(starsRow);

  // Pods: sort pod types alphabetically; hide entirely if none
  const podTypes = Object.keys(podsTotals).sort();
  if (podTypes.length > 0) {
    for (const type of podTypes) {
      const podsRow = document.createElement("div");
      podsRow.classList.add("cost-row");
      // Use pod icon from img/icons/pods/<type>.png
      podsRow.innerHTML = `<img src="img/icons/pods/${type}.png" class="cost-icon"> <strong>${podsTotals[type]}</strong> ${capitalize(type)} Pods`;
      breakdown.appendChild(podsRow);
    }
  }
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Hook into equipCosmetic and updatePlayerColor ---
const originalEquipCosmetic = equipCosmetic;
equipCosmetic = function(cosmetic) {
  originalEquipCosmetic(cosmetic);
  calculateTotalCost();
};

if (typeof updatePlayerColor === "function") {
  const originalUpdatePlayerColor = updatePlayerColor;
  updatePlayerColor = function() {
    originalUpdatePlayerColor();
    calculateTotalCost();
  };
}


// --- Init ---
loadCosmetics();




// === Parallax Starfield Background ===
const canvas = document.getElementById("spaceBackground");
const ctx = canvas.getContext("2d");

let stars = [];
let width, height;

const starCount = 150;     // total number of stars
const minSize = 1;         // smallest star radius (px)
const maxSize = 4;         // largest star radius (px)
const minSpeed = 0.1;      // slowest horizontal speed (px per frame)
const maxSpeed = 0.6;      // fastest horizontal speed (px per frame)

// resize canvas dynamically
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  if (stars.length === 0) createStars();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// create star data
function createStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * (maxSize - minSize) + minSize,
      s: Math.random() * (maxSpeed - minSpeed) + minSpeed,
    });
  }
}

// main draw loop
function drawStars() {
  ctx.fillStyle = "#000"; // base space color
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();

    // move stars left to right
    star.x += star.s;
    if (star.x > width + star.r) {
      star.x = -star.r;
      star.y = Math.random() * height;
    }
  });

  ctx.globalAlpha = 1.0;
  requestAnimationFrame(drawStars);
}

createStars();
drawStars();