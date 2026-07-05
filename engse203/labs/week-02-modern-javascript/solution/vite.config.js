import { defineConfig } from "vite";

// For deployment, change this to the exact repository name on GitHub.

const repositoryPrefix = "engse203/labs";
const repositoryName = "week-02-modern-javascript/solution/docs";


export default defineConfig({
  base: `/${repositoryPrefix}/`+`${repositoryName}/`,
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
