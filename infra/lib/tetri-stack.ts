import * as path from "node:path";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

const SSM_PREFIX = "/tetri/prod/";

export class TetriStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiLogs = new logs.LogGroup(this, "ApiLogs", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new lambda.Function(this, "Api", {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/api/dist-lambda"),
      ),
      memorySize: 1024,
      timeout: Duration.seconds(15),
      logGroup: apiLogs,
      environment: {
        NODE_ENV: "production",
        SSM_PREFIX,
      },
    });

    api.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/tetri/prod/*`,
        ],
      }),
    );

    const apiUrl = api.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const originSecret = ssm.StringParameter.valueForStringParameter(
      this,
      `${SSM_PREFIX}ORIGIN_VERIFY_SECRET`,
    );

    const site = new s3.Bucket(this, "Site", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // only CloudFront can read it
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const spaRewrite = new cloudfront.Function(this, "SpaRewrite", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var req = event.request;
          if (!req.uri.includes('.')) { req.uri = '/index.html'; }
          return req;
        }
      `),
    });

    const distribution = new cloudfront.Distribution(this, "Cdn", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(site),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: spaRewrite,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.FunctionUrlOrigin(apiUrl, {
            customHeaders: { "x-origin-verify": originSecret },
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    });

    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../apps/web/dist")),
      ],
      destinationBucket: site,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new CfnOutput(this, "ApiFunctionUrl", { value: apiUrl.url });
  }
}
