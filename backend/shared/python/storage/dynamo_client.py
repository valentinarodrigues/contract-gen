import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import Any, Optional


def _table():
    endpoint = os.environ.get("AWS_ENDPOINT_URL")
    kwargs = {"region_name": os.environ.get("AWS_DEFAULT_REGION", "us-east-1")}
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(os.environ["CONTRACTS_TABLE"])


def put_item(item: dict[str, Any]) -> None:
    _table().put_item(Item=item)


def get_item(contract_id: str, version: str = "v1") -> Optional[dict[str, Any]]:
    response = _table().get_item(Key={"contractId": contract_id, "version": version})
    return response.get("Item")


def update_item(contract_id: str, version: str, updates: dict[str, Any]) -> dict[str, Any]:
    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates)
    expr_names = {f"#{k}": k for k in updates}
    expr_values = {f":{k}": v for k, v in updates.items()}

    response = _table().update_item(
        Key={"contractId": contract_id, "version": version},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return response.get("Attributes", {})


def list_all(limit: int = 100) -> list[dict[str, Any]]:
    response = _table().scan(Limit=limit)
    items = response.get("Items", [])
    # Simple sort by createdAt descending
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return items


def list_by_status(status: str, limit: int = 100) -> list[dict[str, Any]]:
    response = _table().query(
        IndexName="status-index",
        KeyConditionExpression=Key("status").eq(status),
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])
