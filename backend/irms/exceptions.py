from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class NotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found."
    default_code = "not_found"


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflict with current resource state."
    default_code = "conflict"


class WorkflowError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid workflow transition."
    default_code = "workflow_error"


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    if isinstance(response.data, dict):
        response.data.setdefault("code", getattr(exc, "default_code", "error"))
    elif isinstance(response.data, list):
        response.data = {"detail": response.data, "code": "error"}
    return response
