import boto3
import json
import os

def lambda_handler(event, context):
    
    jsondata = event['body']
    data = json.loads(jsondata)
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['configTableName'])
    
    response = table.get_item(Key={'key': data['key']})
    if 'Item' not in response:
        return {
            'statusCode': 400,
            'body': 'Item with key {} does not exist, thus can not be updated'.format(data['key'])
        }
        
    print(response['Item']['value'])
        
    if data['value'] == response['Item']['value']:
        return {
            'statusCode': 201,
            'body': 'The key {} is already set to this value'.format(data['key'])
        }
    
    table.update_item(
        Key={
            'key': data['key']
        },
        UpdateExpression='SET #va = :value',
        ExpressionAttributeValues={
            #':key': data['key'],
            ':value': data['value']
        },
        ExpressionAttributeNames={
            #'#ke': 'key',
            '#va': 'value'
        }
    )
    
    return {
        'statusCode': 200,
        'body': 'Configuration Value updated successfully to {}'.format(data['value'])
    }