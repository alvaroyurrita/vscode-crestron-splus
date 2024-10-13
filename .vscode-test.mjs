import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  workspaceFolder: "${workspaceFolder}/testworkspace",
  outFiles: ["${workspaceFolder}/out/test/**/*.js"],
});
