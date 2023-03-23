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
            'body': 'Item with key {} does not exist, thus can not be updated'.format(data['key'].lower())
        }
        
    if data['value'].lower() == response['Item']['value'].lower():
        return {
            'statusCode': 201,
            'body': 'The key {} is already set to this value'.format(data['key'].lower())
        }
    
    table.update_item(
        Key={
            'key': data['key'].lower()
        },
        UpdateExpression='SET #va = :value',
        ExpressionAttributeValues={
            ':value': data['value'].lower()
        },
        ExpressionAttributeNames={
            '#va': 'value'
        }
    )
    
    return {
        'statusCode': 200,
        'body': 'Configuration Value updated successfully to {}'.format(data['value'].lower())
    }