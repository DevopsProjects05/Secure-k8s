module.exports = {
  testEnvironment: 'node',
  collectCoverage: false, // Completely disable code coverage
  testPathIgnorePatterns: ["/node_modules/", "/dist/"], // Ignore unnecessary folders
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "./test-results", outputName: "results.xml" }]
  ],
  verbose: true, // Enables detailed test execution logs
};