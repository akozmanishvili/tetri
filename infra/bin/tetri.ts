import { App } from "aws-cdk-lib";
import { TetriStack } from "../lib/tetri-stack";
import { TetriCiStack } from "../lib/ci-stack";

const app = new App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" };

new TetriStack(app, "TetriStack", { env });
new TetriCiStack(app, "TetriCiStack", {
  env,
  githubRepo: "akozmanishvili/tetri",
});
