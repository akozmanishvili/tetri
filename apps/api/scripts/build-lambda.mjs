import { build } from "esbuild";

await build({
  entryPoints: ["src/lambda.ts"],
  outfile: "dist-lambda/index.mjs",
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
