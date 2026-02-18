const { test, expect } = require("@playwright/test");

test("main page shows maintenance tiles", async ({ page }) => {
  await page.goto("/index.html");

  await expect(page.getByText("Maintain Persons")).toBeVisible();
  await expect(page.getByText("Maintain Locations")).toBeVisible();
  await expect(page.getByText("Maintain Events")).toBeVisible();
  await expect(page.getByText("Maintain Groups")).toBeVisible();
});
