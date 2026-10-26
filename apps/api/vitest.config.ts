import { defineConfig } from "vitest/config";
import { config } from "dotenv";

const testEnv = config({ path: ".env.test", quiet: true }).parsed ?? {};

export default defineConfig({
  test: {
    env: testEnv,
    globalSetup: ["./src/test/globalSetup.ts"], //  apply migrations
    setupFiles: ["./src/test/setup.ts"], //  clean data
    fileParallelism: false, // test files share one DB
  },
});
