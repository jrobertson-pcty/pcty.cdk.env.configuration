#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PctyCdkEnvConfigurationStack } from '../lib/pcty.cdk.env.configuration-stack';

const app = new cdk.App();
new PctyCdkEnvConfigurationStack(app, 'blueConfig', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stackName: 'blueConfig',
  deploymentEnvironment: 'blueConfig'
});

new PctyCdkEnvConfigurationStack(app, 'greenConfig', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stackName: 'greenConfig',
  deploymentEnvironment: 'greenConfig'
});