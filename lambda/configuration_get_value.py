import boto3
import json
import os

def lambda_handler(event, context):
    
    jsondata = event['body']
    data = json.loads(jsondata)
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['configTableName'])
    
    response = table.get_item(Key={'key': data['key'].lower()})
    if 'Item' not in response:
        return {
            'statusCode': 400,
            'body': 'Item with key {} does not exist'.format(data['key'].lower())
        }
    
    return {
        'statusCode': 200,
        'body': response['Item']['value'].lower()
    }