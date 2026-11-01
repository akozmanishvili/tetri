import serverless from "serverless-http";
import { loadSecrets } from "./lib/secrets.js";

await loadSecrets();
const { app } = await import("./app.js");

export const handler = serverless(app);
