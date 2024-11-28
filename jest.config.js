/** @type {import('jest').Config} */
const config = {
  preset: "@shelf/jest-mongodb",
  // The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/*.(spec|test).[jt]s?(x)"],
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/"],
  verbose: true,
  collectCoverage: true,
  coverageReporters: ["clover", "json", "lcov", "html", "text"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/coverage/**",
    "!**/.docker/**",
    "!.prettierrc.js",
    "!jest.config.js",
  ],
}

module.exports = config
