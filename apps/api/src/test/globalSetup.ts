import { execSync } from "node:child_process";
import { config } from "dotenv";

// test database's schema up to date before any test runs
export default function setup() {
  const { parsed } = config({ path: ".env.test", override: true, quiet: true });
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...parsed },
  });
}
