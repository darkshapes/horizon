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
if (!('ontouchstart' in window)) {
          // Fallback for browsers without touch support
          array.addEventListener('mousedown', (e) => this.handlePointerDown(e));
          document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
          document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        }

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

    handleTouchStart(e) {
    e.preventDefault();
    const touches = e.touches;
    for (let i = 0; i < touches.length; i++) {
      this.processTouchStart(touches[i]);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touches = e.touches;
    for (let i = 0; i < touches.length; i++) {
      this.processTouchMove(touches[i]);
    }
  }

  handleTouchEnd(e) {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      this.processTouchEnd(touches[i]);
    }
  }

  handlePointerDown(e) {
    this.processPointerDown(e);
  }

  handlePointerMove(e) {
    this.processPointerMove(e);
  }

  handlePointerUp(e) {
    this.processPointerUp(e);
  }

  processTouchStart(touch) {
    const target = this.getElementAtCoordinates(touch.clientX, touch.clientY);
    if (!target) return;

    const channelKey = target.dataset.channel;
    if (!channelKey) return;

    const activeTouch = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      channelKey: channelKey
    };

    this.activeTouches.set(touch.identifier, activeTouch);
    target.classList.add('active');
  }

  processTouchMove(touch) {
    const activeTouch = this.activeTouches.get(touch.identifier);
    if (!activeTouch) return;

    const deltaY = touch.clientY - activeTouch.y;
    if (Math.abs(deltaY) < 0.5) return;

    activeTouch.y = touch.clientY;
    this.updateChannelValue(activeTouch.channelKey, deltaY);
  }

  processTouchEnd(touch) {
    const activeTouch = this.activeTouches.get(touch.identifier);
    if (!activeTouch) return;

    const target = document.querySelector(`.channel[data-channel="${activeTouch.channelKey}"]`);
    if (target) {
      target.classList.remove('active');
    }

    this.activeTouches.delete(touch.identifier);
  }

  processPointerDown(e) {
    if (e.button !== 0) return;

    const target = this.getElementAtCoordinates(e.clientX, e.clientY);
    if (!target) return;

    const channelKey = target.dataset.channel;
    if (!channelKey) return;

    const activePointer = {
      x: e.clientX,
      y: e.clientY,
      channelKey: channelKey
    };

    this.activePointer = activePointer;
    target.classList.add('active');
  }

  processPointerMove(e) {
    if (!this.activePointer) return;
    if (e.buttons !== 1) {
      this.processPointerUp(e);
      return;
    }

    const deltaY = e.clientY - this.activePointer.y;
    if (Math.abs(deltaY) < 0.5) return;

    this.activePointer.y = e.clientY;
    this.updateChannelValue(this.activePointer.channelKey, deltaY);
  }

  processPointerUp(e) {
    if (!this.activePointer) return;

    const target = document.querySelector(`.channel[data-channel="${this.activePointer.channelKey}"]`);
    if (target) {
      target.classList.remove('active');
    }

    this.activePointer = null;
  }

  getElementAtCoordinates(x, y) {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      if (el.classList.contains('channel')) {
        return el;
      }
    }
    return null;
  }

  updateChannelValue(channelKey, deltaY) {
    const channelData = this.channels.get(channelKey);
    if (!channelData) return;

    const indicatorHeight = channelData.indicator.offsetHeight;
    const arrayElement = channelData.element.parentElement;
    const arrayHeight = arrayElement.offsetHeight;

    const deltaPercentage = deltaY / arrayHeight;
    const currentPct = channelData.value.getRawPercentage();
    let newPct = currentPct - deltaPercentage;

    newPct = Math.max(0, Math.min(1, newPct));
    channelData.value.setFromNormalized(newPct);

    const indicatorTop = (1 - channelData.value.getRawPercentage()) * 100;
    channelData.indicator.style.top = `${indicatorTop}%`;

    this.updateChannelDisplay(channelData);
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
