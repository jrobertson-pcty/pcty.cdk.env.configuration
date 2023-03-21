import { GetItemCommand,UpdateItemCommand,PutItemCommand,DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDBClient({ region: "us-east-2" });
let counter = 0;

export const handler = async (event) => {
    let response;
    let existsItem;
    counter++;
    var jsonobject = JSON.parse(event.body);

    const Env = process.env.EnvName;
    const configTable = process.env.configTableName;

    const existsQuery = {
        "Key": {
            "key": { "S": jsonobject.key }
        },
        TableName: configTable
    };
    existsItem = await dynamoDB.send( new GetItemCommand(existsQuery));

    if (typeof existsItem.Item != 'undefined') {
        const bodyMessage = "The configuration value already exists. If you need to change it, use the updateConfig api endpoint";
        response = {
            statusCode: 200,
            body: JSON.stringify(bodyMessage)
        };
        return response;
    } else {
        const configParams = {
            Item: {
                "key": { S: jsonobject.key },
                "value": { S: jsonobject.value }
            },
            TableName: configTable
        };

        try {
            const data = await dynamoDB.send( new PutItemCommand(configParams));
            if (data) {
                console.log("Configuration Item added to DyanmoDb Table");
                const bodyMessage = "Configuration Item added to DyanmoDb Table";
                response = {
                    statusCode: 200,
                    body: JSON.stringify(bodyMessage)
                };
                //return response;
            } else {
                response = {
                    statusCode: 500,
                    body: JSON.stringify("Some Error Occured")
                };
                //return response;
            }
            return response;
        } catch (err) {
            console.log("Error", err);
        }
    } 
}