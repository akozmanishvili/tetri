import { build } from "esbuild";

await build({
  entryPoints: { index: "src/lambda.ts", jobs: "src/jobsLambda.ts" },
  outdir: "dist-lambda",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  external: ["pg-native", "@aws-sdk/*"],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});
