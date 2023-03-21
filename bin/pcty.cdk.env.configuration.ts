#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PctyCdkEnvConfigurationStack } from '../lib/pcty.cdk.env.configuration-stack';

const app = new cdk.App();
new PctyCdkEnvConfigurationStack(app, 'blue', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stackName: 'blue',
  deploymentEnvironment: 'blue'
});

new PctyCdkEnvConfigurationStack(app, 'green', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stackName: 'green',
  deploymentEnvironment: 'green'
});