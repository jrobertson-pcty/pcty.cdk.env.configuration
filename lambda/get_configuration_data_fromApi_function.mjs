import { GetItemCommand,UpdateItemCommand,PutItemCommand,DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDBClient({ region: "us-east-2" });

export const handler = async (event) => {
    let response;
    let existsItem;
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

    if (typeof existsItem.Item == 'undefined') {
        const bodyMessage = "The configuration value requested does not exist";
        response = {
            statusCode: 200,
            body: JSON.stringify(bodyMessage)
        };
        return response;
    } else {
        try {
            const value = JSON.parse((JSON.stringify(existsItem.Item.value.S)))
            console.log(value);
            response = {
                statusCode: 200,
                body: value
            };
            return response;
        } catch (err) {
            console.log("Error", err);
        }
    } 
}