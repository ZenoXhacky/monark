
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
    const saved = JSON.parse(
      localStorage.getItem("hackyx-settings")
    );

    if (saved && typeof saved === "object") {
      return saved;
    }
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

  container.innerHTML = "";

  settings.forEach((setting) => {
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
    const initialValue =
      Number.isFinite(storedValue) &&
      savedSettings[setting.name] !== undefined &&
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

  settings.forEach((setting) => {
    const id = setting.name.replace(/\s+/g, "-");
    const slider = document.getElementById(id);

    if (slider) {
      values[setting.name] = Number(slider.value);
    }
  });

  try {
    localStorage.setItem(
      "hackyx-settings",
      JSON.stringify(values)
    );

    savedSettings = values;
    alert("HackyX settings saved!");
  } catch (error) {
    alert("Could not save settings in this browser.");
    console.error(error);
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

if (saveButton) {
  saveButton.addEventListener("click", saveSettings);
}

if (resetButton) {
  resetButton.addEventListener("click", resetSettings);
}

renderSettings();

// Enable offline support when served through localhost or HTTPS.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch((error) => {
        console.error("Offline support failed:", error);
      });
  });
}
