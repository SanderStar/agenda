const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "npm run start:backend",
      cwd: `${__dirname}/..`,
      port: 4004,
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command: "npm start",
      cwd: __dirname,
      port: 8080,
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
