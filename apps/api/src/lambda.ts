import serverless from "serverless-http";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

const SECRET_NAMES = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "ORIGIN_VERIFY_SECRET",
];

async function loadSecrets() {
  const prefix = process.env.SSM_PREFIX;
  if (!prefix) return;

  const res = await new SSMClient({}).send(
    new GetParametersCommand({
      Names: SECRET_NAMES.map((name) => prefix + name),
      WithDecryption: true,
    }),
  );

  if (res.InvalidParameters?.length) {
    throw new Error(
      `Missing SSM parameters: ${res.InvalidParameters.join(", ")}`,
    );
  }
  for (const p of res.Parameters ?? []) {
    process.env[p.Name!.slice(prefix.length)] = p.Value;
  }
}

await loadSecrets();

const { app } = await import("./app.js");

export const handler = serverless(app);
