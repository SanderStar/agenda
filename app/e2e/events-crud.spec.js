const { test, expect } = require("@playwright/test");

test("events CRUD flow works", async ({ page }) => {
  const updatedTitle = `E2E Updated Event ${Date.now()}`;

  await page.goto("/index.html");
  await page.getByRole("button", { name: /Maintain Events Navigation/i }).click();

  await expect(page.getByText("Event Details")).toBeVisible();
  await expect(page.locator("[id$='eventTitleInput-inner']")).toBeVisible();

  const originalTitle = await page.locator("[id$='eventTitleInput-inner']").inputValue();
  const originalStart = await page.locator("[id$='eventStartTimeInput-inner']").inputValue();
  const originalEnd = await page.locator("[id$='eventEndTimeInput-inner']").inputValue();

  await page.locator("[id$='eventTitleInput-inner']").fill(updatedTitle);
  await page.locator("[id$='eventStartTimeInput-inner']").fill("09:30");
  await page.locator("[id$='eventEndTimeInput-inner']").fill("10:30");
  await page.locator("[id$='saveEventButton']").click();

  await expect(page.getByText(updatedTitle)).toBeVisible();

  await page.locator("[id$='eventTitleInput-inner']").fill(originalTitle);
  await page.locator("[id$='eventStartTimeInput-inner']").fill(originalStart || "09:00");
  await page.locator("[id$='eventEndTimeInput-inner']").fill(originalEnd || "10:00");
  await page.locator("[id$='saveEventButton']").click();

  await expect(page.getByText(originalTitle)).toBeVisible();
});
