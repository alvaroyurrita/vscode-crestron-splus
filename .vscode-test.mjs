import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  workspaceFolder: "./testWorkspace",
  outFiles: ["${workspaceFolder}/out/test/**/*.js"],
  mocha: {
    timeout: 200000,
  },
});
