
const settings = [
  { name: "General", min: 0, max: 200, value: 150 },
  { name: "Red Dot", min: 0, max: 200, value: 145 },
  { name: "2x Scope", min: 0, max: 200, value: 130 },
  { name: "4x Scope", min: 0, max: 200, value: 115 },
  { name: "Sniper Scope", min: 0, max: 200, value: 90 },
  { name: "Free Look", min: 0, max: 200, value: 120 }
];

const container = document.getElementById("settings");
const saveButton = document.getElementById("saveBtn");
const resetButton = document.getElementById("resetBtn");

function getSavedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("hackyx-settings"));
    if (saved && typeof saved === "object" && saved !== null) return saved;
  } catch (error) {
    console.warn("Could not load saved settings.", error);
  }
  return {};
}

let savedSettings = getSavedSettings();

function renderSettings() {
  if (!container) {
    console.error('Missing element with id="settings".');
    return;
  }

  container.replaceChildren();

  settings.forEach(setting => {
    const row = document.createElement("div");
    row.className = "setting-row";

    const heading = document.createElement("div");
    heading.className = "setting-heading";

    const label = document.createElement("label");
    label.htmlFor = setting.name.replace(/\s+/g, "-");
    label.textContent = setting.name;

    const valueText = document.createElement("span");
    valueText.className = "setting-value";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = label.htmlFor;
    slider.min = setting.min;
    slider.max = setting.max;
    slider.step = 1;

    const storedValue = Number(savedSettings[setting.name]);
    const hasSavedValue =
      savedSettings[setting.name] !== undefined &&
      savedSettings[setting.name] !== null &&
      savedSettings[setting.name] !== "";

    const initialValue =
      hasSavedValue &&
      Number.isFinite(storedValue) &&
      storedValue >= setting.min &&
      storedValue <= setting.max
        ? storedValue
        : setting.value;

    slider.value = initialValue;
    valueText.textContent = initialValue;

    slider.addEventListener("input", () => {
      valueText.textContent = slider.value;
    });

    heading.append(label, valueText);
    row.append(heading, slider);
    container.appendChild(row);
  });
}

function saveSettings() {
  const values = {};

  settings.forEach(setting => {
    const slider = document.getElementById(
      setting.name.replace(/\s+/g, "-")
    );
    if (slider) values[setting.name] = Number(slider.value);
  });

  try {
    localStorage.setItem("hackyx-settings", JSON.stringify(values));
    savedSettings = values;
    alert("HackyX settings saved!");
  } catch (error) {
    console.error("Could not save settings.", error);
    alert("Could not save settings in this browser.");
  }
}

function resetSettings() {
  try {
    localStorage.removeItem("hackyx-settings");
  } catch (error) {
    console.warn("Could not clear saved settings.", error);
  }

  savedSettings = {};
  renderSettings();
}

saveButton?.addEventListener("click", saveSettings);
resetButton?.addEventListener("click", resetSettings);
renderSettings();

// Register the service worker for optional offline support.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Offline support failed:", error);
    });
  });
}

// Browser-based timer: no C# server required.
const timerButton = document.getElementById("aimToggleBtn");
const timerMessage = document.getElementById("aimToggleMessage");

let timerIsRunning = false;
let timerStartedAt = 0;
let elapsedBeforeStart = 0;
let timerInterval = null;

function formatTimerTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
}

function updateTimerDisplay() {
  if (!timerMessage) return;

  const elapsedMs = elapsedBeforeStart +
    (timerIsRunning ? Date.now() - timerStartedAt : 0);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  timerMessage.textContent =
    `${timerIsRunning ? "Background timer is running" : "Background timer is stopped"} — ` +
    formatTimerTime(elapsedSeconds);
}

function updateTimerButton() {
  if (timerButton) {
    timerButton.textContent = timerIsRunning ? "Stop Timer" : "Start Timer";
    timerButton.setAttribute("aria-pressed", String(timerIsRunning));
    timerButton.classList.toggle("active", timerIsRunning);
  }

  updateTimerDisplay();
}

function startHackyXTimer() {
  if (timerIsRunning) return;

  timerStartedAt = Date.now();
  timerIsRunning = true;

  timerInterval = setInterval(updateTimerDisplay, 250);
  updateTimerButton();
}

function stopHackyXTimer() {
  if (!timerIsRunning) return;

  elapsedBeforeStart += Date.now() - timerStartedAt;
  timerIsRunning = false;

  clearInterval(timerInterval);
  timerInterval = null;
  updateTimerButton();
}

timerButton?.addEventListener("click", () => {
  if (timerIsRunning) {
    stopHackyXTimer();
  } else {
    startHackyXTimer();
  }
});

// Refresh the display when the page becomes visible again.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateTimerDisplay();
});

window.startHackyXTimer = startHackyXTimer;
window.stopHackyXTimer = stopHackyXTimer;

updateTimerButton();

// Panel Lock controls for the local practice simulation.
const panelLockBtn = document.getElementById("panelLockBtn");
const panelLockUI = document.getElementById("panelLockUI");
const aimLockBtn = document.getElementById("aimLockBtn");
const closeLockBtn = document.getElementById("closeLockBtn");
const aimLockMessage = document.getElementById("aimLockMessage");

let aimLockEnabled = false;

panelLockBtn?.addEventListener("click", () => {
  if (!panelLockUI) return;
  panelLockUI.hidden = false;
  panelLockBtn.setAttribute("aria-expanded", "true");
});

closeLockBtn?.addEventListener("click", () => {
  if (panelLockUI) panelLockUI.hidden = true;
  panelLockBtn?.setAttribute("aria-expanded", "false");
});

aimLockBtn?.addEventListener("click", () => {
  aimLockEnabled = !aimLockEnabled;

  aimLockBtn.textContent = aimLockEnabled ? "ON" : "OFF";
  aimLockBtn.classList.toggle("is-on", aimLockEnabled);
  aimLockBtn.setAttribute("aria-pressed", String(aimLockEnabled));

  if (aimLockMessage) {
    aimLockMessage.textContent = aimLockEnabled
      ? "Aim Lock is ON."
      : "Aim Lock is OFF.";
  }
});

// Interactive Target Lab practice simulation.
const aimArena = document.getElementById("aimArena");
const demoCrosshair = document.getElementById("demoCrosshair");
const demoStatus = document.getElementById("demoStatus");
const demoScore = document.getElementById("demoScore");

let demoX = 50;
let demoY = 50;
let demoLocked = false;
let demoSelections = 0;

function getDemoTargets() {
  return aimArena
    ? [...aimArena.querySelectorAll(".demo-target")]
    : [];
}

function moveDemoCrosshair(x, y) {
  demoX = Math.max(3, Math.min(97, x));
  demoY = Math.max(5, Math.min(95, y));

  if (demoCrosshair) {
    demoCrosshair.style.left = `${demoX}%`;
    demoCrosshair.style.top = `${demoY}%`;
  }
}

function nearestDemoTarget() {
  const targets = getDemoTargets();
  if (!targets.length) return null;

  return targets.reduce((nearest, target) => {
    const x = parseFloat(target.style.left);
    const y = parseFloat(target.style.top);
    const distance = Math.hypot(x - demoX, y - demoY);

    return !nearest || distance < nearest.distance
      ? { target, x, y, distance }
      : nearest;
  }, null);
}

function updateDemoLock() {
  demoLocked = aimLockBtn?.getAttribute("aria-pressed") === "true";

  if (demoStatus) {
    demoStatus.textContent = demoLocked ? "LOCK ON" : "FREE AIM";
    demoStatus.classList.toggle("locked", demoLocked);
  }

  if (demoLocked) {
    const nearest = nearestDemoTarget();
    if (nearest) moveDemoCrosshair(nearest.x, nearest.y);
  }
}

aimLockBtn?.addEventListener("click", updateDemoLock);

aimArena?.addEventListener("pointermove", event => {
  if (demoLocked) return;

  const rect = aimArena.getBoundingClientRect();

  moveDemoCrosshair(
    ((event.clientX - rect.left) / rect.width) * 100,
    ((event.clientY - rect.top) / rect.height) * 100
  );
});

aimArena?.addEventListener("click", event => {
  if (event.target.closest(".demo-target")) return;

  const rect = aimArena.getBoundingClientRect();

  if (demoLocked) {
    const nearest = nearestDemoTarget();
    if (nearest) moveDemoCrosshair(nearest.x, nearest.y);
  } else {
    moveDemoCrosshair(
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100
    );
  }
});

getDemoTargets().forEach(target => {
  target.addEventListener("click", event => {
    event.stopPropagation();

    moveDemoCrosshair(
      parseFloat(target.style.left),
      parseFloat(target.style.top)
    );

    demoSelections++;
    target.classList.add("selected");

    if (demoScore) {
      demoScore.textContent = `Targets selected: ${demoSelections}`;
    }
  });
});
