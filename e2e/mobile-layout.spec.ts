import { test, expect } from "playwright/test";

const EDITOR_PAGES = [
  { name: "image-edit", path: "/en/image-edit" },
  { name: "retouching", path: "/en/retouching" },
  { name: "face-edit", path: "/en/face-edit" },
];

for (const { name, path } of EDITOR_PAGES) {
  test(`${name} — no horizontal overflow on mobile`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Take full-page screenshot
    await page.screenshot({
      path: `e2e/results/${name}-${test.info().project.name}.png`,
      fullPage: true,
    });

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBe(false);
  });
}
