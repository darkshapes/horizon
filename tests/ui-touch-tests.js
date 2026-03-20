const { test, expect } = require('@playwright/test');

// Helper to perform touch move
async function touchMove(page, selector, startY, endY) {
  await page.touchscreen.tap(selector, { x: 0, y: startY });
  await page.touchscreen.dragTo(selector, { x: 0, y: endY });
}

// Test touch drag updates channel value
test('touch dragging updates channel', async ({ page }) => {
  await page.goto('http://localhost:8080/reactive-demo.html');
  // Ensure page loaded
  const indicator = await page.locator('#array-1 .channel:nth-child(1) .channel-indicator');
  const initialBox = await indicator.boundingBox();
  const startY = initialBox!.y + initialBox!.height / 2;
  const endY = startY + 50; // drag down
  await touchMove(page, '#array-1 .channel:nth-child(1)', startY, endY);
  const newBox = await indicator.boundingBox();
  expect(newBox!.y).toBeGreaterThan(initialBox!.y);
});

// Test multiple simultaneous touch points
test('multiple simultaneous touches', async ({ page }) => {
  await page.goto('http://localhost:8080/reactive-demo.html');
  const chan1 = '#array-1 .channel:nth-child(1)';
  const chan2 = '#array-1 .channel:nth-child(2)';
  await page.touchscreen.tap(chan1, { x: 0, y: 50 });
  await page.touchscreen.tap(chan2, { x: 0, y: 50 });
  const indicator1 = await page.locator('#array-1 .channel:nth-child(1) .channel-indicator');
  const indicator2 = await page.locator('#array-1 .channel:nth-child(2) .channel-indicator');
  const y1 = (await indicator1.boundingBox())!.y;
  const y2 = (await indicator2.boundingBox())!.y;
  expect(y1).toBeCloseTo(y2);
});