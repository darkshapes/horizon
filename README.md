# horizon <br><hr><sub> Universal Multi‑Touch Sliders</sub>

Horizon is a lightweight, framework‑agnostic Vanllia JavaScript component library that converts input fields into fully‑interactive multi‑touch slider surface. The component is built around a minimal _slider‑engine_ with no dependencies that provides immediate visual feedback. 

[<img src="https://img.shields.io/badge/feed_me-__?logo=kofi&logoColor=white&logoSize=auto&label=donate&labelColor=maroon&color=grey&link=https%3A%2F%2Fko-fi.com%2Fdarkshapes">](https://ko-fi.com/darkshapes)<br>

<img width="1678" height="928" alt="image" src="https://github.com/user-attachments/assets/2fee4485-458b-4af1-a69c-568b2fea76d8" />

## Technical Details

- supports multiple data types
- RAF‑based rendering
- throttled updates
- debounced persistence
- reactive one‑way or two‑way bindings to external state
- optional persistence via localStorage.
- Demo examples MIDI output, Web Audio, and state serialization.

## Requirements

### Hardware

- Touch enabled device capable of running a modern browser

### Software

- Chrome 67+
- Firefox 68+
- Safari 12+ (pointer events supported)
- Edge 79+
- Mobile browsers (iOS Safari, Android Chrome) – works with touch and pointer events.

> **Caveat:** Web MIDI is only available in Chrome, Edge, and Opera. Safari and Firefox currently do not support Web MIDI API.

### Experience

- Light programming experience recommend.ed. The component is meant to be integrated into other projects.

## Setup

Files can be copied directly or `npm install`ed for the additional testing library.

### CDN

> ```html
> <script src="https://unpkg.com/horizon@latest/horizon/main.js"></script>
> <script>
>   const sl = new Horizon();
> </script>
> ```

### NPM

> ```sh
> npm install horizon
> ```

_Build and serve for production:_

> ```sh
> npm run build
> # Output file is build/main.js
> # Serve the static folder
> npx serve -p 8080
> ```

## Demo pages

Open these files locally or serve them via `npm run serve`.

> - / : Minimal UI that loads the library.
> - _midi-demo_ : Showcases real‑time MIDI CC, note, and pitchbend.
> - _audio-demo_ : Demonstrates Web Audio parameter control.

## Integration

> HTML:
>
> ```html
> <div id="array-1" class="slider-array">
>   <div class="channel" data-type="int" data-channel="0"></div>
>   <div class="channel" data-type="int" data-channel="1"></div>
>   <div class="channel" data-type="bool" data-channel="2"></div>
> </div>
> ```
>
> JS:
>
> ```js
> import { MultiTouchSlider, Sliders } from "horizon/main.js";
> ```

> ```js
> const slider = new MultiTouchSlider();
> // Bind channel 0 of array-1 to an external value
> Sliders.bind("array-1", 0, 10, { type: "int", min: -127, max: 127 });
> ```

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



