const { test, expect } = require("@playwright/test");

test("groups CRUD flow works", async ({ page }) => {
  const groupName = `E2E Group ${Date.now()}`;
  const groupDescription = "Created by Playwright E2E";

  await page.goto("/index.html#/groups");

  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();

  await page.getByRole("button", { name: "Add" }).click();
  await page.locator("[id$='groupNameInput-inner']").fill(groupName);
  await page.locator("[id$='groupDescriptionInput-inner']").fill(groupDescription);
  await page.locator("[id$='saveGroupButton']").click();

  await expect(page.getByText(groupName)).toBeVisible();

  await page.locator("[id$='deleteGroupButton']").click();
  await expect(page.getByText(groupName)).not.toBeVisible();
});
