// src/slider-controller.js
import { ChannelValue } from "./channel-value.js";

export class MultiTouchSlider {
  constructor() {
    this.channels = new Map();
    this.activeTouches = new Map();
    this.init();
  }

  init() {
    document.querySelectorAll(".slider-array").forEach((array) => {
      // Touch Events
      array.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
        passive: false,
      });
      array.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
        passive: false,
      });
      array.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
        passive: false,
      });

      // Pointer Events
      array.addEventListener("pointerdown", (e) => this.handlePointerDown(e));
      document.addEventListener("pointermove", (e) =>
        this.handlePointerMove(e),
      );
      document.addEventListener("pointerup", (e) => this.handlePointerUp(e));

      // Initialize Channels
      array.querySelectorAll(".channel").forEach((channelEl) => {
        const arrayId = array.id;
        const channelIndex = parseInt(channelEl.dataset.channel);
        const type = channelEl.dataset.type;

        // Configure based on type
        let config = {};
        if (type === "int") config = { min: 0, max: 100 };
        if (type === "float") config = { min: -10, max: 10, decimals: 2 };
        if (type === "iterable") config = { steps: ["red", "green", "blue"] };

        const key = `${arrayId}-${channelIndex}`;
        const valueObj = new ChannelValue(type, 0.5, config);

        this.channels.set(key, {
          element: channelEl,
          value: valueObj,
          indicator: channelEl.querySelector(".channel-indicator"),
          display: channelEl.querySelector(".channel-display"),
        });

        this.updateChannelDisplay(this.channels.get(key));
      });
    });
  }

  // ... [Keep all your handleTouch* and handlePointer* methods exactly as they were] ...
  // I am omitting the handlers here for brevity, but copy them from your original code into this class.

  handleTouchStart(e) {
    /* ... logic ... */
  }
  handleTouchMove(e) {
    /* ... logic ... */
  }
  handleTouchEnd(e) {
    /* ... logic ... */
  }
  handlePointerDown(e) {
    /* ... logic ... */
  }
  handlePointerMove(e) {
    /* ... logic ... */
  }
  handlePointerUp(e) {
    /* ... logic ... */
  }

  updateChannelDisplay(channel) {
    const pct = channel.value.getRawPercentage();
    channel.indicator.style.top = `${(1 - pct) * 100}%`;
    channel.display.textContent = channel.value.getDisplay();

    if (channel.value.type === "bool") {
      const isTrue = pct > 0.5;
      channel.display.style.color = isTrue
        ? "var(--active-color)"
        : "var(--text-color)";
      channel.display.style.textShadow = isTrue
        ? "0 0 10px var(--active-color)"
        : "0 1px 2px rgba(0, 0, 0, 0.5)";
      channel.element.classList.remove("bool-true", "bool-false");
      channel.element.classList.add(isTrue ? "bool-true" : "bool-false");
    } else {
      channel.display.style.color = "var(--text-color)";
      channel.display.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.5)";
    }
  }
}
