// script.js (replace your current file with this)

const coordinates = {
  "Jammu and Kashmir": { x: 360, y: 120 },
  "Himachal Pradesh": { x: 360, y: 250 },
  Punjab: { x: 300, y: 280 },
  Haryana: { x: 320, y: 320 },
  Delhi: { x: 335, y: 280 },
  Uttarakhand: { x: 430, y: 300 },

  Rajasthan: { x: 240, y: 470 },
  "Uttar Pradesh": { x: 430, y: 420 },
  Bihar: { x: 570, y: 460 },

  Sikkim: { x: 680, y: 390 },
  "Arunachal Pradesh": { x: 820, y: 410 },
  Assam: { x: 760, y: 450 },
  Meghalaya: { x: 740, y: 480 },
  Nagaland: { x: 860, y: 440 },
  Manipur: { x: 840, y: 500 },
  Mizoram: { x: 810, y: 540 },
  Tripura: { x: 780, y: 540 },

  "Madhya Pradesh": { x: 380, y: 560 },
  Chhattisgarh: { x: 460, y: 650 },

  Gujarat: { x: 180, y: 570 },
  Maharashtra: { x: 260, y: 720 },

  Jharkhand: { x: 560, y: 560 },
  Odisha: { x: 580, y: 700 },
  "West Bengal": { x: 660, y: 600 },

  Telangana: { x: 360, y: 820 },
  "Andhra Pradesh": { x: 380, y: 880 },
  Karnataka: { x: 280, y: 940 },
  "Tamil Nadu": { x: 350, y: 1100 },
  Kerala: { x: 280, y: 1100 },

  Goa: { x: 218, y: 870 },
};

const capitals = {
  "Jammu and Kashmir": "Srinagar",
  Ladakh: "Leh",
  "Himachal Pradesh": "Shimla",
  Punjab: "Chandigarh",
  Haryana: "Chandigarh",
  Delhi: "New Delhi",
  Uttarakhand: "Dehradun",

  Rajasthan: "Jaipur",
  "Uttar Pradesh": "Lucknow",
  Bihar: "Patna",

  Sikkim: "Gangtok",
  "Arunachal Pradesh": "Itanagar",
  Assam: "Dispur",
  Meghalaya: "Shillong",
  Nagaland: "Kohima",
  Manipur: "Imphal",
  Mizoram: "Aizawl",
  Tripura: "Agartala",

  "Madhya Pradesh": "Bhopal",
  Chhattisgarh: "Raipur",

  Gujarat: "Gandhinagar",
  Maharashtra: "Mumbai",

  Jharkhand: "Ranchi",
  Odisha: "Bhubaneswar",
  "West Bengal": "Kolkata",

  Telangana: "Hyderabad",
  "Andhra Pradesh": "Amaravati",
  Karnataka: "Bengaluru",
  "Tamil Nadu": "Chennai",
  Kerala: "Thiruvananthapuram",

  Goa: "Panaji",
  Chandigarh: "Chandigarh",
};

const createdMarkers = {};
const mapContainer = document.getElementById("im");
const imgEl = document.getElementById("image");

const muteBtn = document.getElementById("muteBtn");
let muted = false;

const audioMark = document.getElementById("flagSound");
const audioClear = document.getElementById("flagSound2");

let audioPrimed = false;
function primeAudioOnce() {
  if (audioPrimed) return;
  audioPrimed = true;
  [audioMark, audioClear].forEach((a) => {
    if (!a) return;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => {
        // ignore play rejection
      });
  });
}
// prime on click or touch so mobile allows later plays
document.addEventListener("click", primeAudioOnce, {
  once: true,
  capture: true,
});
document.addEventListener("touchstart", primeAudioOnce, {
  once: true,
  capture: true,
});

if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.innerHTML = muted
      ? '<i class="bi bi-volume-mute"></i>'
      : '<i class="bi bi-volume-up"></i>';

    if (audioMark) audioMark.muted = muted;
    if (audioClear) audioClear.muted = muted;
  });
}

function playSound(id) {
  if (muted) return;
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.catch((err) => {
        // mobile may block; already attempted to prime earlier
        console.warn("Audio play rejected:", err);
      });
    }
  } catch (err) {
    console.warn("Audio play error:", err);
  }
}

/**
 * Compute scaled pixel position for a coordinate defined in original image pixels.
 * This handles responsive scaling of the image.
 * Returns { left: pxRelativeToContainer, top: pxRelativeToContainer }
 */
function getScaledPositionForState(state) {
  if (!imgEl || !coordinates[state]) return null;

  // bounding rect of the image on screen
  const imgRect = imgEl.getBoundingClientRect();
  const containerRect = mapContainer.getBoundingClientRect();

  // natural/original size required for correct scale
  const naturalWidth = imgEl.naturalWidth || imgEl.width;
  const naturalHeight = imgEl.naturalHeight || imgEl.height;

  // scale factors
  const scaleX = imgRect.width / naturalWidth;
  const scaleY = imgRect.height / naturalHeight;

  // use same scale for x and y if image keeps aspect ratio (should)
  // but compute both just in case
  const leftOnPage = imgRect.left + coordinates[state].x * scaleX;
  const topOnPage = imgRect.top + coordinates[state].y * scaleY;

  // convert to coordinates relative to container (since markers are appended to container)
  const leftRelative = leftOnPage - containerRect.left;
  const topRelative = topOnPage - containerRect.top;

  return { left: Math.round(leftRelative), top: Math.round(topRelative) };
}

function createOrUpdateMarker(state) {
  if (!state || !coordinates[state]) {
    console.warn("Unknown state or missing coordinates:", state);
    return;
  }

  const pos = getScaledPositionForState(state);
  if (!pos) return;

  if (createdMarkers[state]) {
    const existing = createdMarkers[state];
    existing.style.left = pos.left + "px";
    existing.style.top = pos.top + "px";

    const lbl = existing.querySelector(".label .state-name");
    const cap = existing.querySelector(".label .state-cap");
    if (lbl) lbl.textContent = state;
    if (cap) cap.textContent = capitals[state] || "Unknown";
    return;
  }

  const marker = document.createElement("div");
  marker.className = "marker";
  marker.style.left = pos.left + "px";
  marker.style.top = pos.top + "px";
  marker.setAttribute("data-state", state);

  const flagImg = document.createElement("img");
  flagImg.className = "flag-img";
  flagImg.src = "flag.jpg";
  flagImg.alt = state + " flag";

  const label = document.createElement("div");
  label.className = "label";
  label.innerHTML = `<strong class="state-name">${state}</strong><small class="state-cap">Capital: ${
    capitals[state] || "Unknown"
  }</small>`;

  marker.appendChild(flagImg);
  marker.appendChild(label);
  mapContainer.appendChild(marker);

  createdMarkers[state] = marker;

  playSound("flagSound");
}

function search() {
  const stateVal = document.getElementById("state").value;
  if (!stateVal) return;
  const exact = coordinates[stateVal]
    ? stateVal
    : Object.keys(coordinates).find(
        (k) => k.toLowerCase() === stateVal.toLowerCase()
      );
  if (exact) {
    createOrUpdateMarker(exact);
  } else {
    const trimmed = stateVal.trim().toLowerCase();
    const match = Object.keys(coordinates).find((k) =>
      k.toLowerCase().includes(trimmed)
    );
    if (match) createOrUpdateMarker(match);
    else console.warn("No coordinate match for:", stateVal);
  }
}

function resetMarkers() {
  Object.keys(createdMarkers).forEach((k) => {
    const el = createdMarkers[k];
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  for (const k in createdMarkers) delete createdMarkers[k];

  const sel = document.getElementById("state");
  if (sel) sel.value = "";

  playSound("flagSound2");
}

function markAll() {
  Object.keys(coordinates).forEach((state) => createOrUpdateMarker(state));
}

function updateAllMarkerPositions() {
  Object.keys(createdMarkers).forEach((state) => {
    if (createdMarkers[state]) {
      const pos = getScaledPositionForState(state);
      if (pos) {
        createdMarkers[state].style.left = pos.left + "px";
        createdMarkers[state].style.top = pos.top + "px";
      }
    }
  });
}

// reposition on resize / orientation change
window.addEventListener("resize", updateAllMarkerPositions);
window.addEventListener("orientationchange", updateAllMarkerPositions);

// also re-calc whenever image finishes loading or when layout may change
if (imgEl) {
  imgEl.addEventListener("load", updateAllMarkerPositions);
  // in case image was already loaded (cached)
  if (imgEl.complete) updateAllMarkerPositions();
}
