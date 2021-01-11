const path = require("path");
process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function(config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    client: {
      jasmine: {
        random: false
      }
    },
    files: [
      { pattern: "src/**/*.ts" },
      { pattern: "test/**/*.ts" },
    ],
    karmaTypescriptConfig: {
      compilerOptions: {
        module: "commonjs",
      },
      tsconfig: "./tsconfig.json",
    },
    preprocessors: {
      "**/*.ts": ["karma-typescript"],
    },
    reporters: ["karma-typescript", "coverage-istanbul"],
    coverageIstanbulReporter: {
      reports: ["json", "lcovonly"], 
      dir: path.join(__dirname, "coverage"),
      combineBrowserReports: true,
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: true,
    },
    browsers: ["ChromeHeadless"],
    singleRun: true
  });
};
