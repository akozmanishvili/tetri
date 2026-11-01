import { loadSecrets } from "./lib/secrets.js";

await loadSecrets();
const { runDailyJobs } = await import("./jobs/daily.js");

export async function handler() {
  return runDailyJobs();
}
