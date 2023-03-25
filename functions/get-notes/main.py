import json
import boto3
import urllib.parse
import urllib.request
from boto3.dynamodb.conditions import Key, Attr
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("lotion-30161318")

def handler(event, context):
    # access_token = event['headers']['authentication']
    # validation_url = f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}'
    # response = urllib.request.urlopen(validation_url)

    # # Parse the response as JSON
    # token_info = json.loads(response.read())
    email = event['queryStringParameters']['email']

    # Check if the token is valid
    # if ('error' in token_info) or (token_info['email'] != email):
    #     return {
    #         'statusCode': 401,
    #         'body': 'Authentication error'
    #     }
    
    
    try:
        response = table.query(KeyConditionExpression=Key('email').eq(email))

        if response['Count'] == 0:
            response = {
                "statusCode": 200,
                "body": json.dumps({
                    'message': "Success",
                    'data': []
                })
            }
            return response
        response = {
            "statusCode": 200,
            "body": json.dumps({
                'message': "Success",
                'data': response['Items']
            })
        }
        return response
    
    except Exception as e:
        response={
            "statusCode":404,
            "body":json.dumps(
                {
                    'message':"Its not working"
                }
            )
        }
        return response

