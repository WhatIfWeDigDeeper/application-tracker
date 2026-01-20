/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["<rootDir>/../api/node_modules/ts-jest", { useESM: false }],
  },
};
