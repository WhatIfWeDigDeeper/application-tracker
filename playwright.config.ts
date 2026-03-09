import { defineConfig, devices } from '@playwright/test';

const port = process.env.TEST_UI_PORT ? Number(process.env.TEST_UI_PORT) : 3000;
const baseURL = `http://localhost:${port}`;

interface WebServerConfig {
  command: string;
  timeout?: number;
}

const webServerCommands: Record<number, WebServerConfig | string> = {
  3000: 'cd ui && npm run dev',
  3010: 'cd react-ui && npm run dev',
  3020: 'cd vue-ui && npm run dev',
  3030: 'cd svelte-ui && npm run dev',
  3040: 'cd tanstack-start-ui && npm run dev',
  3050: 'cd tanstack-ui && npm run dev',
  3060: 'cd angular-ui && npm run start',
  3070: { command: 'npm run dev:angular-spring-ui', timeout: 120_000 },
  3080: 'cd react-apollo-ui && npm run dev',
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
  webServer: webServerCommands[port] ? (() => {
    const cfg = webServerCommands[port];
    const command = typeof cfg === 'string' ? cfg : cfg.command;
    const timeout = typeof cfg === 'string' ? undefined : cfg.timeout;
    return {
      command,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      ...(timeout !== undefined ? { timeout } : {}),
    };
  })() : undefined,
});
