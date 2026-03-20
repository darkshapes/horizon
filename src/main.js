import { SliderValue } from "./slider-values.js";
import {
  detectChannelFromPoint,
  calculateDeltaY,
  clampToRange,
} from "./slider-engine.js";
import {
  updateChannelIndicator,
  updateChannelDisplay,
  updateBoolVisuals,
  setActiveState,
  updateUndoRedoIndicator,
} from "./slider-render.js";
import { SliderBindings } from "./slider-bindings.js";
import { setupKeyboardAccessibility as setupKeyboard } from "./slider-keyboard.js";
import { setupWheelAccessibility as setupWheel } from "./slider-wheel.js";
import { setupUndoRedo } from "./slider-undo.js";
import { setupResetFunctionality } from "./slider-reset.js";
import { setupSliderIO } from "./slider-io.js";

class MultiTouchSlider {
  constructor() {
    this.channels = new Map();
    this.activeTouches = new Map();
    this.SliderValue = SliderValue;
    this.io = setupSliderIO(this);
    this.initTheme();
    // Performance-related state
    this._dirtyChannels = new Set();
    this._rafScheduled = false;
    this._persistTimer = null;
    this.initChannels();
    this.setupEventListeners();
    this.setupKeyboardAccessibility();
    this.setupWheelAccessibility();
    this.setupUndoRedo();
    this.setupResetFunctionality();
    this.bindings = new SliderBindings(this);
  }

  initTheme() {
    const savedTheme = localStorage.getItem("slider-theme");
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    const theme = savedTheme || (prefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.textContent = theme === "light" ? "🌙" : "☀️";
      themeToggle.addEventListener("click", () => {
        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("slider-theme", newTheme);
        themeToggle.textContent = newTheme === "light" ? "🌙" : "☀️";
      });
    }
  }

  // Performance optimization helpers
  scheduleRender() {
    if (this._rafScheduled) return;
    this._rafScheduled = true;
    requestAnimationFrame(() => {
      this._rafScheduled = false;
      this._dirtyChannels.forEach((key) => {
        const channel = this.channels.get(key);
        if (channel) this.updateChannelDisplay(channel);
      });
      this._dirtyChannels.clear();
    });
  }

  markDirty(key) {
    this._dirtyChannels.add(key);
    this.scheduleRender();
  }

  persistState() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      this.io.export();
    }, 500);
  }

  loadAutosave() {
    if (!window.localStorage) return;
    try {
      const data = this.io.export();
      if (Object.keys(data.channels).length) {
        this.io.import(data);
      }
    } catch (e) {
      console.error("Failed to load autosave:", e);
    }
  }

  initChannels() {
    const channelElements = document.querySelectorAll(".channel");
    channelElements.forEach((el, index) => {
      const arrayId = el.closest(".slider-array").id;
      const channelIndex = parseInt(el.dataset.channel);
      const type = el.dataset.type;
      const key = `${arrayId}-${channelIndex}`;

      let options = {};
      if (type === "int") {
        options = { min: -127, max: 127 };
      } else if (type === "float") {
        options = { min: -10.0, max: 10.0, precision: 0.1 };
      } else if (type === "iterable") {
        options = { items: ["red", "green", "blue", "yellow", "purple"] };
      }

      const channelObj = {
        element: el,
        display: el.querySelector(".channel-display"),
        indicator: el.querySelector(".channel-indicator"),
        value: new SliderValue(type, options),
        startY: null,
      };

      if (type === "bool") {
        channelObj.element.classList.add("bool-false");
      }

      this.initARIA(channelObj, channelIndex);
      channelObj.valueOverlay = el.querySelector(".channel-value-overlay");
      this.channels.set(key, channelObj);
      this.updateChannelDisplay(channelObj);
    });
  }

  initARIA(channelObj, channelIndex) {
    const el = channelObj.element;
    const type = channelObj.value.type;
    el.setAttribute("role", "slider");
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-hidden", "true");

    if (type === "bool") {
      el.setAttribute("aria-checked", "false");
      el.setAttribute("aria-valuenow", "0");
      el.setAttribute("aria-valuemin", "0");
      el.setAttribute("aria-valuemax", "1");
    } else if (type === "int") {
      el.setAttribute("aria-valuenow", "0");
      el.setAttribute("aria-valuemin", String(channelObj.value.min));
      el.setAttribute("aria-valuemax", String(channelObj.value.max));
    } else if (type === "float") {
      el.setAttribute("aria-valuenow", "0.0");
      el.setAttribute("aria-valuemin", String(channelObj.value.min));
      el.setAttribute("aria-valuemax", String(channelObj.value.max));
    } else if (type === "iterable") {
      el.setAttribute("aria-valuenow", "1");
      el.setAttribute("aria-valuemin", "1");
      el.setAttribute("aria-valuemax", String(channelObj.value.items.length));
    }
    el.setAttribute("aria-label", `Channel ${channelIndex + 1}, type ${type}`);
  }

  setupEventListeners() {
    const sliderArrays = document.querySelectorAll(".slider-array");
    sliderArrays.forEach((array) => {
      array.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
        passive: false,
      });
      array.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
        passive: false,
      });
      array.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
        passive: false,
      });
      array.addEventListener("touchcancel", (e) => this.handleTouchEnd(e), {
        passive: false,
      });

      array.addEventListener("pointerdown", (e) => this.handlePointerDown(e));
      document.addEventListener("pointermove", (e) =>
        this.handlePointerMove(e),
      );
      document.addEventListener("pointerup", (e) => this.handlePointerUp(e));
    });
  }

  handleTouchStart(e) {
    e.preventDefault();
    e.changedTouches.forEach((touch) => {
      const detected = detectChannelFromPoint(touch.clientX, touch.clientY);
      if (!detected) return;
      const { arrayId, channelIndex, element: channelEl } = detected;
      const key = `${arrayId}-${channelIndex}`;
      const channel = this.channels.get(key);
      if (!channel) return;
      setActiveState(channel, true);
      const currentRaw = channel.value.getRawPercentage();
      this.activeTouches.set(touch.identifier, {
        key,
        startY: touch.clientY,
        startRaw: currentRaw,
        savedValue: currentRaw,
      });
    });
  }

  handleTouchMove(e) {
    e.preventDefault();
    e.changedTouches.forEach((touch) => {
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData) return;
      const channel = this.channels.get(touchData.key);
      if (!channel) return;
      const deltaPct = calculateDeltaY(
        touch.clientY,
        touchData.startY,
        channel.element.offsetHeight,
      );
      const newRaw = clampToRange(touchData.startRaw + deltaPct);
      channel.value.setFromPercentage(newRaw);
      this.markDirty(touchData.key);
      this.persistState();
    });
  }

  handleTouchEnd(e) {
    e.preventDefault();
    e.changedTouches.forEach((touch) => {
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData) return;
      const channel = this.channels.get(touchData.key);
      if (channel) {
        const newValue = channel.value.getRawPercentage();
        if (newValue !== touchData.savedValue && this.saveHistoryEntry)
          this.saveHistoryEntry(channel);
        setActiveState(channel, false);
      }
      this.activeTouches.delete(touch.identifier);
    });
  }

  handlePointerDown(e) {
    const channelEl = e.target.closest(".channel");
    if (!channelEl || e.pointerType === "touch") return;
    const arrayId = channelEl.closest(".slider-array").id;
    const channelIndex = parseInt(channelEl.dataset.channel);
    const key = `${arrayId}-${channelIndex}`;
    const channel = this.channels.get(key);
    if (!channel) return;
    setActiveState(channel, true);
    channel.element.setPointerCapture(e.pointerId);
    const currentRaw = channel.value.getRawPercentage();
    this.activeTouches.set(e.pointerId, {
      key,
      startY: e.clientY,
      startRaw: currentRaw,
      savedValue: currentRaw,
      element: channel.element,
    });
  }

  handlePointerMove(e) {
    const touchData = this.activeTouches.get(e.pointerId);
    if (!touchData || e.pointerType === "touch") return;
    const channel = this.channels.get(touchData.key);
    if (!channel) return;
    const deltaPct = calculateDeltaY(
      e.clientY,
      touchData.startY,
      channel.element.offsetHeight,
    );
    const newRaw = clampToRange(touchData.startRaw + deltaPct);
    channel.value.setFromPercentage(newRaw);
    this.markDirty(touchData.key);
    this.persistState();
  }

  handlePointerUp(e) {
    const touchData = this.activeTouches.get(e.pointerId);
    if (!touchData) return;
    const channel = this.channels.get(touchData.key);
    if (channel) {
      const newValue = channel.value.getRawPercentage();
      if (newValue !== touchData.savedValue && this.saveHistoryEntry)
        this.saveHistoryEntry(channel);
    }
    const element = touchData.element;
    if (element) {
      element.classList.remove("active");
      element.style.removeProperty("--glow-intensity");
      element.releasePointerCapture(e.pointerId);
    }
    this.activeTouches.delete(e.pointerId);
  }

  updateChannelDisplay(channelObj) {
    const pct = channelObj.value.getRawPercentage();
    updateChannelIndicator(channelObj, pct);
    updateChannelDisplay(channelObj, channelObj.value.getDisplay());
    if (channelObj.valueOverlay) {
      channelObj.valueOverlay.textContent = channelObj.value.getDisplay();
      const indicatorRect = channelObj.indicator.getBoundingClientRect();
      const channelRect = channelObj.element.getBoundingClientRect();
      const overlayTop = indicatorRect.top - channelRect.top - 12;
      channelObj.valueOverlay.style.top = `${overlayTop}px`;
    }
    if (channelObj.value.type === "bool") {
      const isTrue = pct > 0.5;
      updateBoolVisuals(channelObj, isTrue);
    } else {
      const glowIntensity = Math.min(1, Math.abs(pct - 0.5) * 2);
      channelObj.element.style.setProperty("--glow-intensity", glowIntensity);
      channelObj.display.style.color = "var(--text-color)";
      channelObj.display.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.5)";
    }
    if (this.updateUndoRedoIndicator) {
      const key = Array.from(this.channels.entries()).find(
        ([, c]) => c === channelObj,
      )?.[0];
      if (key && this.undoManager) {
        const canUndo = this.undoManager.canUndo(key);
        const canRedo = this.undoManager.canRedo(key);
        updateUndoRedoIndicator(channelObj, canUndo, canRedo);
      }
    }
  }

  setupKeyboardAccessibility() {
    setupKeyboard(this, () => {
      this.clearGlowEffects();
    });
  }

  clearGlowEffects() {
    this.channels.forEach((channel) => {
      channel.element.style.removeProperty("--glow-intensity");
    });
  }

  setupWheelAccessibility() {
    setupWheel(this);
  }

  setupUndoRedo() {
    setupUndoRedo(this);
  }

  setupResetFunctionality() {
    setupResetFunctionality(this);
  }
}

let _sliderInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  _sliderInstance = new MultiTouchSlider();
  _sliderInstance.loadAutosave();
});

const Sliders = {
  bind(arrayId, channelIndex, valueOrBindingFn, options = {}) {
    if (!_sliderInstance) {
      console.error("Sliders API: Instance not initialized yet");
      return null;
    }
    return _sliderInstance.bindings.bind(
      arrayId,
      channelIndex,
      valueOrBindingFn,
      options,
    );
  },

  get(arrayId, channelIndex) {
    if (!_sliderInstance) {
      return undefined;
    }
    return _sliderInstance.bindings.get(arrayId, channelIndex);
  },

  unbind(arrayId, channelIndex) {
    if (!_sliderInstance) {
      return false;
    }
    return _sliderInstance.bindings.unbind(arrayId, channelIndex);
  },

  clear() {
    if (!_sliderInstance) {
      return;
    }
    _sliderInstance.bindings.clear();
  },

  getAll() {
    if (!_sliderInstance) {
      return {};
    }
    return _sliderInstance.bindings.getAll();
  },

  export(presetName) {
    if (!_sliderInstance) {
      return null;
    }
    return _sliderInstance.io.export(presetName);
  },

  exportAsJSON(presetName, spaces) {
    if (!_sliderInstance) {
      return null;
    }
    return _sliderInstance.io.exportAsJSON(presetName, spaces);
  },

  import(data) {
    if (!_sliderInstance) {
      return { success: false, error: "Instance not initialized" };
    }
    return _sliderInstance.io.import(data);
  },

  importFromFile(fileInput) {
    if (!_sliderInstance) {
      return Promise.resolve({
        success: false,
        error: "Instance not initialized",
      });
    }
    return _sliderInstance.io.importFromFile(fileInput);
  },

  savePreset(name) {
    if (!_sliderInstance) {
      return false;
    }
    return _sliderInstance.io.savePreset(name);
  },

  loadPreset(name) {
    if (!_sliderInstance) {
      return { success: false, error: "Instance not initialized" };
    }
    return _sliderInstance.io.loadPreset(name);
  },

  listPresets() {
    if (!_sliderInstance) {
      return [];
    }
    return _sliderInstance.io.listPresets();
  },

  deletePreset(name) {
    if (!_sliderInstance) {
      return false;
    }
    return _sliderInstance.io.deletePreset(name);
  },

  download(filename) {
    if (!_sliderInstance) {
      return;
    }
    _sliderInstance.io.download(filename);
  },
};

export { MultiTouchSlider, Sliders };
