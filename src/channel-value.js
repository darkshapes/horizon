// src/channel-value.js
export class ChannelValue {
  constructor(type, initialValue = 0, options = {}) {
    this.type = type;
    this.raw = initialValue; // 0.0 to 1.0
    this.min = options.min ?? 0;
    this.max = options.max ?? 100;
    this.steps = options.steps ?? ["red", "green", "blue"];
    this.decimals = options.decimals ?? 2;
  }

  getRawPercentage() {
    return this.raw;
  }

  setFromPercentage(pct) {
    // Clamp between 0 and 1
    this.raw = Math.max(0, Math.min(1, pct));
  }

  getDisplay() {
    if (this.type === "int") {
      return Math.round(this.mapRange(this.raw, 0, 1, this.min, this.max));
    }
    if (this.type === "float") {
      return this.mapRange(this.raw, 0, 1, this.min, this.max).toFixed(
        this.decimals,
      );
    }
    if (this.type === "iterable") {
      const index = Math.round(
        this.mapRange(this.raw, 0, 1, 0, this.steps.length - 1),
      );
      return this.steps[index] || "";
    }
    if (this.type === "bool") {
      return this.raw > 0.5 ? "true" : "false";
    }
    return "";
  }

  mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
