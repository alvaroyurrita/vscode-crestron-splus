import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  label:"UnitTests",
  files: "out/test/**/*.test.js",
  workspaceFolder: "./testWorkspace",
  outFiles: ["${workspaceFolder}/out/test/**/*.js"],
  coverage: {
    output: "./coverage",
    includeAll: true,
    reporter: ["html"],
  },
  mocha: {
    timeout: 200000,
  },
});
