// bundled handler with fake Lambda Function URL event
import "dotenv/config";
import { handler } from "../dist-lambda/index.mjs";

const event = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/health",
  rawQueryString: "",
  headers: { host: "localhost" },
  requestContext: {
    http: { method: "GET", path: "/health", sourceIp: "127.0.0.1" },
  },
  isBase64Encoded: false,
};

const res = await handler(event, {});
console.log(res.statusCode, res.body);
process.exit(res.statusCode === 200 ? 0 : 1);
