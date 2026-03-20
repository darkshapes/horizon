# Horizon <br><hr><sub> Universal Multi‑Touch Sliders</sub>

Horizon is a lightweight, framework‑agnostic JavaScript library that turns any web form into a fully‑interactive, multi‑touch slider surface. The library is built around a minimal _slider‑engine_ that supports four core data types (int, float, iterable, bool), instant visual feedback, and optional persistence via localStorage.

### Features

- **Multi‑touch** – Touch any number of sliders simultaneously.
- **Performance‑oriented** – RAF‑based rendering, throttled updates, and debounced persistence.
- **Reactive bindings** – One‑way or two‑way bindings to external state.
- **Demo demos** – MIDI output, Web Audio, and state serialization.
- **No dependencies** – Built with vanilla JS.

## Installation

You can copy the bundled files directly or npm‑install the library.

### CDN

```html
<script src="https://unpkg.com/horizon@latest/horizon/main.js"></script>
<script>
  const sl = new Horizon();
</script>
```

### NPM

```bash
npm install horizon
```

```js
import { MultiTouchSlider, Sliders } from "horizon/main.js";
```

_Build and serve for production:_

```bash
npm run build
# Output file is build/main.js
# Serve the static folder
npx serve -p 8080
```

## Usage

```html
<div id="array-1" class="slider-array">
  <div class="channel" data-type="int" data-channel="0"></div>
  <div class="channel" data-type="int" data-channel="1"></div>
  <div class="channel" data-type="bool" data-channel="2"></div>
</div>
```

```js
const slider = new MultiTouchSlider();
// Bind channel 0 of array-1 to an external value
Sliders.bind("array-1", 0, 10, { type: "int", min: -127, max: 127 });
```

## API Reference

| Method                                                    | Description                               | Example                                                                              |
| --------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `Sliders.bind(arrayId, channelIndex, valueOrFn, options)` | Attach a binding.                         | `Sliders.bind('array-1', 0, () => Math.random()*127, {type:'int', min:0, max:127});` |
| `Sliders.get(arrayId, channelIndex)`                      | Get a binding object.                     | `const b = Sliders.get('array-1',0);`                                                |
| `Sliders.unbind(arrayId, channelIndex)`                   | Remove a binding.                         | `Sliders.unbind('array-1',0);`                                                       |
| `Sliders.clear()`                                         | Remove all bindings.                      | `Sliders.clear();`                                                                   |
| `Sliders.export(presetName)`                              | Export current slider state to an object. | `const config = Sliders.export('myPreset');`                                         |
| `Sliders.import(data)`                                    | Load a previously exported state.         | `Sliders.import(config);`                                                            |
| `Sliders.savePreset(name)`                                | Persist preset to localStorage.           | `Sliders.savePreset('default');`                                                     |
| `Sliders.listPresets()`                                   | List stored presets.                      | `console.log(Sliders.listPresets());`                                                |
| `Sliders.loadPreset(name)`                                | Load a preset.                            | `Sliders.loadPreset('default');`                                                     |
| `Sliders.deletePreset(name)`                              | Delete preset.                            | `Sliders.deletePreset('default');`                                                   |

## Browser Compatibility

- Chrome 67+
- Firefox 68+
- Safari 12+ (pointer events supported)
- Edge 79+
- Mobile browsers (iOS Safari, Android Chrome) – works with touch and pointer events.

> **Caveat:** Web MIDI is only available in Chrome, Edge, and Opera. Safari and Firefox currently do not support the Web MIDI API.

## Demo pages

- **midi-demo.html** – Showcases real‑time MIDI CC, note, and pitchbend.
- **audio-demo.html** – Demonstrates Web Audio parameter control.
- **index.html** – Minimal UI that loads the library.

Open these files locally or serve them via `npm run serve`.

## Commit format reminder

Use the following prefixes to indicate the intent of a commit:

```plaintext
+ Add new feature
- Remove obsolete code
~ Update existing feature
```
