/** @type {import('jest').Config} */
const config = {
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
