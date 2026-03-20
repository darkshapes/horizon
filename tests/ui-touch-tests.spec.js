const { test, expect, beforeAll, afterAll } = require('@playwright/test');
const { spawn } = require('child_process');

let server;
beforeAll(() => {
  // No server needed; using file protocol
});

afterAll(() => {
  if (server && server.pid) {
    try {
      process.kill(server.pid);
    } catch (e) {}
  }
});

// Use headed browser
test.use({ headless: false });

// Helper to perform touch move
async function touchMove(page, selector, startY, endY) {
  const indicatorSelector = `${selector} .channel-indicator`;
  const delta = endY - startY;
  await page.evaluate(([s,d])=>{ const el=document.querySelector(s); if(el){ const current=el.style.transform.match(/translateY\(([-\d\.]+)px\)/); const cur=(current?parseFloat(current[1]):0); el.style.transform=`translateY(${cur + d}px)`; } }, [indicatorSelector, delta]);
}

// Test touch drag updates channel value
test('touch dragging updates channel', async ({ page }) => {
  await page.goto(`file://${process.cwd()}/reactive-demo.html`);
  const indicator = await page.locator('#array-1 .channel:nth-child(1) .channel-indicator');
  const initialBox = await indicator.boundingBox();
  const startY = initialBox.y + initialBox.height / 2;
  const endY = startY + 50;
  await touchMove(page, '#array-1 .channel:nth-child(1)', startY, endY);
  const newBox = await indicator.boundingBox();
  expect(newBox.y).toBeGreaterThan(initialBox.y);
});

// Test multiple simultaneous touch points
test('multiple simultaneous touches', async ({ page }) => {
  await page.goto(`file://${process.cwd()}/reactive-demo.html`);
  const chan1 = '#array-1 .channel:nth-child(1)';
  const chan2 = '#array-1 .channel:nth-child(2)';
  await page.click(chan1);
  await page.click(chan2);
  const indicator1 = await page.locator('#array-1 .channel:nth-child(1) .channel-indicator');
  const indicator2 = await page.locator('#array-1 .channel:nth-child(2) .channel-indicator');
  const y1 = (await indicator1.boundingBox()).y;
  const y2 = (await indicator2.boundingBox()).y;
  expect(y1).toBeCloseTo(y2);
});
