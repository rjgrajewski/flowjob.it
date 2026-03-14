"""
AWS Secrets Manager integration for database credentials.
"""
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError


def get_secret(secret_arn: str) -> dict:
    """
    Retrieve secret from AWS Secrets Manager.
    
    Args:
        secret_arn: ARN of the secret in AWS Secrets Manager
        
    Returns:
        dict: Secret value as dictionary
    """
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=os.getenv('AWS_REGION', 'eu-central-1')
    )

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_arn)
    except ClientError as e:
        logging.error(f"❌ Failed to retrieve secret: {e}")
        raise

    # Parse the secret
    secret = get_secret_value_response['SecretString']
    return json.loads(secret)


def setup_database_credentials_from_secrets(secret_arn: str):
    """
    Set up database credentials from AWS Secrets Manager with fallback to .env.
    
    Args:
        secret_arn: ARN of the secret containing database credentials
    """
    try:
        secret = get_secret(secret_arn)
        
        # Set username and password from secret (sensitive data)
        os.environ['AWS_DB_USERNAME'] = secret.get('username')
        os.environ['AWS_DB_PASSWORD'] = secret.get('password')
        
        # Set endpoint, dbname, region from .env (non-sensitive data)
        # These should already be set from .env file, but we can set defaults
        if not os.getenv('AWS_DB_ENDPOINT'):
            os.environ['AWS_DB_ENDPOINT'] = secret.get('host', 'localhost')
        if not os.getenv('AWS_DB_NAME'):
            os.environ['AWS_DB_NAME'] = secret.get('dbname', 'postgres')
        if not os.getenv('AWS_REGION'):
            os.environ['AWS_REGION'] = os.getenv('AWS_REGION', 'eu-central-1')
        
        logging.info("✅ Database credentials loaded from AWS Secrets Manager")
        
    except Exception as e:
        logging.warning(f"⚠️ Failed to load from Secrets Manager, using .env fallback: {e}")
        # Fallback to .env file values (should be loaded by dotenv)
        if not os.getenv('AWS_DB_USERNAME'):
            logging.error("❌ No AWS_DB_USERNAME found in .env file")
        if not os.getenv('AWS_DB_PASSWORD'):
            logging.error("❌ No AWS_DB_PASSWORD found in .env file")
