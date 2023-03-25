import boto3;
import json;
import urllib.parse
import urllib.request

dynamodb_resouce = boto3.resource('dynamodb')
table = dynamodb_resouce.Table('lotion-30161318')

def handler(event, context):
    print(event)

    # backend authentication check
    #how to get the token from the headers
    access_token = event['headers']['authentication']
    

    validation_url = f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}'
    print(validation_url)
    response = urllib.request.urlopen(validation_url)

    # Parse the response as JSON
    token_info = json.loads(response.read())
    body =json.loads(event['body'])

    # Check if the token is valid
    if ('error' in token_info) or (token_info['email'] != body['email']):
        return {
            'statusCode': 401,
            'body': 'Authentication error'
        }
    # Delete note from DynamoDB
    id = body['id']
    email = body['email']
    try:
        response = table.delete_item(
            Key={
                'email': email,
                'id': id
            }
        )
        return {
        'statusCode':200,
        'body':json.dumps("Item deleted successfully")
        }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body' : json.dumps(
                {'message':str(e)}
            )
        }