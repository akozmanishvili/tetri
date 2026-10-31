import { App } from "aws-cdk-lib";
import { TetriStack } from "../lib/tetri-stack.js";

const app = new App();

new TetriStack(app, "TetriStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
});
