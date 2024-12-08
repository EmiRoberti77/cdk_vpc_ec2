#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkDeployEc2Stack } from "../lib/cdk_deploy_ec2-stack";

const app = new cdk.App();
new CdkDeployEc2Stack(app, "CdkDeployEc2Stack", {});
