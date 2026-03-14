"""
Invoke the skill-normalization Lambda after scraping completes.
Set NORMALIZE_LAMBDA_NAME (e.g. aligno-normalize-skills) or NORMALIZE_LAMBDA_ARN in env.
If unset, no invocation (safe for local runs).
"""
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def invoke_normalize_lambda(payload: Optional[Dict[str, Any]] = None):
    """Invoke normalization Lambda asynchronously. No-op if Lambda name/ARN not configured."""
    name = os.getenv("NORMALIZE_LAMBDA_NAME")
    arn = os.getenv("NORMALIZE_LAMBDA_ARN")
    if not name and not arn:
        logger.info("ℹ️ NORMALIZE_LAMBDA_NAME/ARN not set, skipping Lambda invoke")
        return
    try:
        import boto3
        client = boto3.client("lambda", region_name=os.getenv("AWS_REGION", "eu-central-1"))
        kwargs = {"InvocationType": "Event", "Payload": __import__("json").dumps(payload or {})}
        if arn:
            kwargs["FunctionName"] = arn
        else:
            kwargs["FunctionName"] = name
        client.invoke(**kwargs)
        logger.info("📤 Normalization Lambda invoked (async)")
    except Exception as e:
        logger.warning("⚠️ Failed to invoke normalization Lambda: %s", e)
