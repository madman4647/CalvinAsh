const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Drop {projectName}/{platform} from the snapshot filename: there's only one
  // project (chromium) and fonts are loaded as webfonts rather than falling
  // back to OS-installed families, so one baseline is meant to serve macOS and
  // the Linux CI runner alike (toHaveScreenshot's maxDiffPixelRatio below
  // absorbs the remaining anti-aliasing differences between platforms).
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev -w client',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  // A single fixed browser project keeps the screenshot baseline deterministic -
  // cross-browser font rendering differences would otherwise make this flaky.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
