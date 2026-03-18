# Phase 02: Extensibility and Polish

Enhance the prototype with reusable components, configuration options, and production-ready polish. This phase adds a clean API for binding values to sliders, keyboard/mouse accessibility, and visual refinements to match professional audio tools. The code becomes modular and ready for integration into larger projects.

## Tasks

- [ ] Refactor app.js into modular structure:
  - Search existing code for extractable utilities before creating new modules
  - slider-engine.js: core gesture recognition and multi-touch handling
  - slider-values.js: SliderValue class for int/float/iterable/bool bindings
  - slider-render.js: DOM manipulation and visual updates
  - main.js: initialization and wiring
  - Keep all logic in /Users/e6d64/Documents/GitHub/efa403/combo/src/ folder

- [ ] Create programmatic binding API:
  - Sliders.bind(channelIndex, valueOrBindingFn, options) method
  - Options: { type, min, max, precision, labels, on change }
  - Support lazy evaluation with functions: () => getState()
  - Support push callbacks: onChange(newValue) for reactive updates
  - Document API structure in code comments (not separate docs yet)

- [ ] Add keyboard accessibility:
  - Arrow keys up/down increment/decrement active channel
  - Home/End keys jump to min/max
  - Number keys (0-9) jump to percentage positions
  - Tab navigation between slider arrays
  - ARIA labels for screen readers (role="slider", aria-valuenow, etc.)

- [ ] Add mouse wheel support as alternative input:
  - Wheel over channel region adjusts that channel
  - Ctrl+wheel for fine-tuning (10x precision)
  - Wheel delta clamping to prevent overshoot
  - Visual feedback on hover and wheel activity

- [ ] Implement undo/redo for value changes:
  - History buffer per channel (last 50 changes)
  - Undo/redo via keyboard (Cmd+Z / Cmd+Shift+Z)
  - Visual indicator when undo is available
  - Clear history on manual reset or binding swap

- [ ] Add value reset functionality:
  - Double-tap or double-click channel to reset to center (zero or middle index)
  - Configurable reset behavior (center vs min vs last known)
  - Visual feedback on reset (brief animation)

- [ ] Enhance visual polish:
  - Add subtle glow effect on active channels
  - Smooth gradient transitions between color states (intensity-based)
  - Optional value overlay showing exact numeric/string value on drag
  - Responsive font sizing for labels
  - Consider dark/light theme toggle (stored in localStorage)

- [ ] Add configuration export/import:
  - Export current slider values state as JSON
  - Import JSON to restore configuration
  - Support preset names saved to localStorage
  - Optional: drag-drop .json file to load

- [ ] Write unit tests for core logic:
  - Create /Users/e6d64/Documents/GitHub/efa403/combo/tests/ folder
  - Test SliderValue class: int, float, iterable, bool, edge cases
  - Test gesture handler: multi-touch, simultaneous events
  - Use minimal test runner (tape or assert module, no framework)
  - Run tests via `node tests/test-runner.js`

- [ ] Run tests and fix any failures:
  - Execute test suite
  - Debug and fix failing tests
  - Ensure 100% pass rate before commit

- [ ] Commit all improvements:
  - Add all files (refactored modules, tests, improvements)
  - Commit with message `+ modular structure with binding API, keyboard support, undo/redo, tests`
  - Include summary of new features in commit body
