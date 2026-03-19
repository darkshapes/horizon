import { SliderValue } from '../src/slider-values.js';
import { detectChannelFromPoint, calculateDeltaY, clampToRange } from '../src/slider-engine.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${e.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

function assertClose(actual, expected, epsilon = 0.0001, msg) {
    const diff = Math.abs(actual - expected);
    if (diff > epsilon) {
        throw new Error(`${msg || 'Assertion failed'}: expected ${expected} (±${epsilon}), got ${actual}`);
    }
}

function assertTrue(condition, msg) {
    if (!condition) {
        throw new Error(msg || 'Expected true');
    }
}

function assertFalse(condition, msg) {
    if (condition) {
        throw new Error(msg || 'Expected false');
        }
}

// ============ SliderValue Tests ============
console.log('\n=== SliderValue Tests ===\n');

test('SliderValue int type: defaults to 0.5 raw value', () => {
    const sv = new SliderValue('int');
    assertEqual(sv.rawValue, 0.5);
});

test('SliderValue int type: default min/max', () => {
    const sv = new SliderValue('int');
    assertEqual(sv.min, -127);
    assertEqual(sv.max, 127);
});

test('SliderValue int type: custom min/max', () => {
    const sv = new SliderValue('int', { min: 0, max: 100 });
    assertEqual(sv.min, 0);
    assertEqual(sv.max, 100);
});

test('SliderValue int type: get() returns 0 at center', () => {
    const sv = new SliderValue('int', { min: -127, max: 127 });
    sv.rawValue = 0.5;
    assertEqual(sv.get(), 0);
});

test('SliderValue int type: get() returns max at 100%', () => {
    const sv = new SliderValue('int', { min: -127, max: 127 });
    sv.rawValue = 1.0;
    const val = sv.get();
    assertEqual(val, 127);
});

test('SliderValue int type: get() returns min at 0%', () => {
    const sv = new SliderValue('int', { min: -127, max: 127 });
    sv.rawValue = 0.0;
    const val = sv.get();
    assertEqual(val, -127);
});

test('SliderValue int type: get() returns positive at 75%', () => {
    const sv = new SliderValue('int', { min: -127, max: 127 });
    sv.rawValue = 0.75;
    const val = sv.get();
    assertClose(val, 63, 1);
});

test('SliderValue int type: get() returns negative at 25%', () => {
    const sv = new SliderValue('int', { min: -127, max: 127 });
    sv.rawValue = 0.25;
    const val = sv.get();
    assertClose(val, -64, 1);
});

test('SliderValue int type: clamped at minimum', () => {
    const sv = new SliderValue('int', { min: 0, max: 100 });
    sv.rawValue = -0.5;
    const val = sv.get();
    assertEqual(val, 0);
});

test('SliderValue int type: clamped at maximum', () => {
    const sv = new SliderValue('int', { min: 0, max: 100 });
    sv.rawValue = 1.5;
    const val = sv.get();
    assertEqual(val, 100);
});

test('SliderValue float type: default min/max/precision', () => {
    const sv = new SliderValue('float');
    assertEqual(sv.min, -10.0);
    assertEqual(sv.max, 10.0);
    assertEqual(sv.precision, 0.1);
});

test('SliderValue float type: custom precision', () => {
    const sv = new SliderValue('float', { min: 0, max: 1, precision: 0.01 });
    assertEqual(sv.precision, 0.01);
});

test('SliderValue float type: get() returns 0 at center', () => {
    const sv = new SliderValue('float', { min: -10, max: 10, precision: 0.1 });
    sv.rawValue = 0.5;
    const val = sv.get();
    assertClose(val, 0, 0.01);
});

test('SliderValue float type: get() returns max at 100%', () => {
    const sv = new SliderValue('float', { min: -10, max: 10, precision: 0.1 });
    sv.rawValue = 1.0;
    const val = sv.get();
    assertClose(val, 10, 0.01);
});

test('SliderValue float type: get() returns min at 0%', () => {
    const sv = new SliderValue('float', { min: -10, max: 10, precision: 0.1 });
    sv.rawValue = 0.0;
    const val = sv.get();
    assertClose(val, -10, 0.01);
});

test('SliderValue float type: respects precision rounding', () => {
    const sv = new SliderValue('float', { min: 0, max: 1, precision: 0.25 });
    sv.rawValue = 0.75;
    const val = sv.get();
    assertClose(val, 0.25, 0.01);
});

test('SliderValue iterable type: default items', () => {
    const sv = new SliderValue('iterable');
    assertEqual(sv.items.length, 5);
    assertEqual(sv.items[0], 'red');
    assertEqual(sv.items[4], 'purple');
});

test('SliderValue iterable type: custom items', () => {
    const items = ['a', 'b', 'c'];
    const sv = new SliderValue('iterable', { items });
    assertEqual(sv.items.length, 3);
});

test('SliderValue iterable type: get() returns first item at 0%', () => {
    const sv = new SliderValue('iterable', { items: ['x', 'y', 'z'] });
    sv.rawValue = 0.0;
    assertEqual(sv.get(), 'x');
});

test('SliderValue iterable type: get() returns last item at 100%', () => {
    const sv = new SliderValue('iterable', { items: ['x', 'y', 'z'] });
    sv.rawValue = 1.0;
    assertEqual(sv.get(), 'z');
});

test('SliderValue iterable type: get() returns middle item at 50%', () => {
    const sv = new SliderValue('iterable', { items: ['x', 'y', 'z'] });
    sv.rawValue = 0.5;
    assertEqual(sv.get(), 'y');
});

test('SliderValue bool type: get() returns false at 50% or below', () => {
    const sv = new SliderValue('bool');
    sv.rawValue = 0.5;
    assertEqual(sv.get(), false);
});

test('SliderValue bool type: get() returns true at 50% + epsilon', () => {
    const sv = new SliderValue('bool');
    sv.rawValue = 0.51;
    assertEqual(sv.get(), true);
});

test('SliderValue bool type: get() returns true at 100%', () => {
    const sv = new SliderValue('bool');
    sv.rawValue = 1.0;
    assertEqual(sv.get(), true);
});

test('SliderValue setFromPercentage: clamps negative values', () => {
    const sv = new SliderValue('int');
    sv.setFromPercentage(-0.5);
    assertEqual(sv.rawValue, 0);
});

test('SliderValue setFromPercentage: clamps values over 1', () => {
    const sv = new SliderValue('int');
    sv.setFromPercentage(1.5);
    assertEqual(sv.rawValue, 1);
});

test('SliderValue setFromPercentage: accepts values in range', () => {
    const sv = new SliderValue('int');
    sv.setFromPercentage(0.75);
    assertEqual(sv.rawValue, 0.75);
});

test('SliderValue getDisplay: formats float with one decimal', () => {
    const sv = new SliderValue('float', { min: 0, max: 10, precision: 0.1 });
    sv.rawValue = 0.75;
    assertTrue(sv.getDisplay().includes('.'));
});

test('SliderValue getDisplay: returns string for non-float types', () => {
    const sv = new SliderValue('int');
    sv.rawValue = 0.5;
    assertTrue(typeof sv.getDisplay() === 'string');
});

// ============ SliderEngine Tests ============
console.log('\n=== SliderEngine Tests ===\n');

test('calculateDeltaY: returns 0 when no movement', () => {
    const result = calculateDeltaY(100, 100, 200);
    assertClose(result, 0);
});

test('calculateDeltaY: returns negative when moving down', () => {
    const result = calculateDeltaY(150, 100, 200);
    assertClose(result, -0.25);
});

test('calculateDeltaY: returns positive when moving up', () => {
    const result = calculateDeltaY(50, 100, 200);
    assertClose(result, 0.25);
});

test('calculateDeltaY: max value at full height', () => {
    const result = calculateDeltaY(0, 100, 200);
    assertClose(result, 0.5);
});

test('calculateDeltaY: min value at full height', () => {
    const result = calculateDeltaY(200, 100, 200);
    assertClose(result, -0.5);
});

test('clampToRange: clamps to default 0-1 range', () => {
    assertEqual(clampToRange(-0.5), 0);
    assertEqual(clampToRange(1.5), 1);
    assertEqual(clampToRange(0.5), 0.5);
});

test('clampToRange: clamps to custom range', () => {
    assertEqual(clampToRange(-10, 0, 100), 0);
    assertEqual(clampToRange(150, 0, 100), 100);
    assertEqual(clampToRange(50, 0, 100), 50);
});

test('clampToRange: clamps to negative range', () => {
    assertEqual(clampToRange(-150, -100, 100), -100);
    assertEqual(clampToRange(150, -100, 100), 100);
});

// ============ Summary ============
console.log('\n=== Test Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
    process.exit(1);
}
