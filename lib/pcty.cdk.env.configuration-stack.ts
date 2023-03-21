import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { TableViewer } from 'cdk-dynamo-table-viewer';

// define deploy stacks
interface PctyCdkEnvConfigurationStackProps extends cdk.StackProps {
  stackName: 'blue' | 'green'
  deploymentEnvironment: 'blue' | 'green'
}

export class PctyCdkEnvConfigurationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PctyCdkEnvConfigurationStackProps) {
    super(scope, id, props);

    // create dynamoDb table for configuration data
    const configTable = new dynamodb.Table(this, "configTable", {
      partitionKey: { name: "key", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: (props.stackName + "_configuration_table"),
    });

    // create IAM role to allow lambdas to interact with dynamoDB table
    const dynamo_lambda_role = new iam.Role(this, "configuration_lambda_role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    dynamo_lambda_role.attachInlinePolicy(
      new iam.Policy(this, "configuration_dynamo_lambda_policy", {
        policyName: "configuration_dynamo_lambda_policy",
        statements: [
          new iam.PolicyStatement({
            actions: ["logs:CreateLogStream","logs:PutLogEvents","logs:CreateLogGroup"],
            effect: iam.Effect.ALLOW,
            resources:["*"]
          }),
          new iam.PolicyStatement({
            actions: ["dynamodb:ListTables","dynamodb:BatchGetItem","dynamodb:PutItem","dynamodb:ListTables","dynamodb:DeleteItem","dynamodb:GetItem","dynamodb:Scan","dynamodb:UpdateItem"],
            effect: iam.Effect.ALLOW,
            resources: [configTable.tableArn]
          })
        ]
      })
    )

    // create lambda to add data to configuration table
    const add_to_dynamodb_lambda = new lambda.Function(this, "add_configuration_data_fromApi_function", {
      environment: {
        EnvName: props.stackName,
        configTableName: configTable.tableName
      },
      code: lambda.Code.fromAsset("lambda"),
      handler: "configuration_add_value.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "configuration_add_value",
      role: dynamo_lambda_role,
    });
    add_to_dynamodb_lambda.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
    const add_lambda_api_integration = new apigw.LambdaIntegration(add_to_dynamodb_lambda);

    // create lambda to update data in configuration table
    const update_dynamodb_lambda = new lambda.Function(this, "update_configuration_data_fromApi_function", {
      environment: {
        EnvName: props.stackName,
        configTableName: configTable.tableName
      },
      code: lambda.Code.fromAsset("lambda"),
      handler: "configuration_update_value.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "configuration_update_value",
      role: dynamo_lambda_role,
    });
    update_dynamodb_lambda.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
    const update_lambda_api_integration = new apigw.LambdaIntegration(update_dynamodb_lambda);

    // create lambda to get data from the configuration table
    const get_dynamodb_lambda = new lambda.Function(this, "get_configuration_data_fromApi_function", {
      environment: {
        EnvName: props.stackName,
        configTableName: configTable.tableName
      },
      code: lambda.Code.fromAsset("lambda"),
      handler: "configuration_get_value.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "configuration_get_value",
      role: dynamo_lambda_role,
    });
    get_dynamodb_lambda.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
    const get_lambda_api_integration = new apigw.LambdaIntegration(get_dynamodb_lambda);

    // create api gateway to front the configuration table
    const api = new apigw.RestApi(this, "config_api", {
      restApiName: (props.stackName + "configuration_api"),
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'v1',
      }
    });

    // add resources to the api gateway
    const api_add_resource = api.root.addResource("addConfig");
    api_add_resource.addMethod('POST', add_lambda_api_integration, {
      methodResponses: [{ statusCode: '200', responseModels: { "application/json": apigw.Model.EMPTY_MODEL}}]
    });
    const api_update_resource = api.root.addResource("updateConfig");
    api_update_resource.addMethod('POST', update_lambda_api_integration, {
      methodResponses: [{ statusCode: '200', responseModels: { "application/json": apigw.Model.EMPTY_MODEL}}]
    });
    const api_get_resource = api.root.addResource("getConfig");
    api_get_resource.addMethod('POST', get_lambda_api_integration, {
      methodResponses: [{ statusCode: '200', responseModels: { "application/json": apigw.Model.EMPTY_MODEL}}]
    });
    
    // add a table viewer for the config data
    new TableViewer(this, 'configTableViewer', {
      title: (props.stackName + " Configuration Data"),
      table: configTable,
      sortBy: 'key'
    });
  }
}
