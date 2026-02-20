import { defineConfig, devices } from '@playwright/test';

const port = process.env.TEST_UI_PORT ? Number(process.env.TEST_UI_PORT) : 3000;
const baseURL = `http://localhost:${port}`;

const webServerCommands: Record<number, string> = {
  3000: 'cd ui && npm run dev',
  3010: 'cd react-ui && npm run dev',
  3020: 'cd vue-ui && npm run dev',
  3030: 'cd svelte-ui && npm run dev',
  3040: 'cd tanstack-start-ui && npm run dev',
  3050: 'cd tanstack-ui && npm run dev',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: webServerCommands[port] ? {
    command: webServerCommands[port],
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
