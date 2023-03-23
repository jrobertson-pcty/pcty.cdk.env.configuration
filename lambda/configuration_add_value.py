import boto3
import json
import os

def lambda_handler(event, context):
    
    #get json data from rest API
    jsondata = event["body"]
    data = json.loads(jsondata)
    
    #create dynamoDB resource
    dynamodb = boto3.resource('dynamodb')
    
    #get reference to the table
    table = dynamodb.Table(os.environ['configTableName'])
    
    #check if an item with same key already exists
    response = table.get_item(Key={'key': data['key'].lower()})
    if 'Item' in response:
        return {
            'statusCode': 400,
            'body': 'Item with key {} already exists'.format(data['key'].lower())
        }
    
    #insert into the table
    table.put_item(
        Item={
            "key": data['key'].lower(),
            "value": data['value'].lower()
        }
    )
    
    #return a success Message
    return {
        'statusCode': 200,
        'body': 'Configuration Value inserted successfully'
    }