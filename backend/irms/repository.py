"""Thin Firestore data-access helpers used by every app.

Centralising the read/write patterns keeps app code free of raw Firestore
queries and gives us a single seam to swap collections, add caching, or mock
in tests.
"""
from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Any

from google.cloud.firestore import Query  # type: ignore[import-untyped]

from .firestore import get_client


def now() -> datetime:
    return datetime.now(UTC)


def doc(collection: str, doc_id: str) -> dict[str, Any] | None:
    snap = get_client().collection(collection).document(doc_id).get()
    if not snap.exists:
        return None
    data = snap.to_dict() or {}
    data["id"] = snap.id
    return data


def set_doc(collection: str, doc_id: str, data: dict[str, Any], merge: bool = False) -> None:
    get_client().collection(collection).document(doc_id).set(data, merge=merge)


def create_doc(collection: str, data: dict[str, Any], doc_id: str | None = None) -> str:
    coll = get_client().collection(collection)
    payload = {**data, "created_at": now(), "updated_at": now()}
    if doc_id:
        coll.document(doc_id).set(payload)
        return doc_id
    ref = coll.document()
    ref.set(payload)
    return ref.id


def update_doc(collection: str, doc_id: str, patch: dict[str, Any]) -> None:
    payload = {**patch, "updated_at": now()}
    get_client().collection(collection).document(doc_id).update(payload)


def delete_doc(collection: str, doc_id: str) -> None:
    get_client().collection(collection).document(doc_id).delete()


def list_docs(
    collection: str,
    *,
    where: list[tuple[str, str, Any]] | None = None,
    order_by: str | None = None,
    descending: bool = False,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    query: Any = get_client().collection(collection)
    for field, op, value in where or []:
        query = query.where(field, op, value)
    if order_by:
        direction = Query.DESCENDING if descending else Query.ASCENDING
        query = query.order_by(order_by, direction=direction)
    if limit:
        query = query.limit(limit)
    out: list[dict[str, Any]] = []
    for snap in query.stream():
        data = snap.to_dict() or {}
        data["id"] = snap.id
        out.append(data)
    return out


def subcollection_add(
    parent_collection: str,
    parent_id: str,
    sub_name: str,
    data: dict[str, Any],
    doc_id: str | None = None,
) -> str:
    parent = get_client().collection(parent_collection).document(parent_id)
    sub = parent.collection(sub_name)
    payload = {**data, "created_at": now()}
    if doc_id:
        sub.document(doc_id).set(payload)
        return doc_id
    ref = sub.document()
    ref.set(payload)
    return ref.id


def subcollection_list(
    parent_collection: str,
    parent_id: str,
    sub_name: str,
    *,
    order_by: str | None = None,
    descending: bool = False,
) -> list[dict[str, Any]]:
    parent = get_client().collection(parent_collection).document(parent_id)
    query: Any = parent.collection(sub_name)
    if order_by:
        direction = Query.DESCENDING if descending else Query.ASCENDING
        query = query.order_by(order_by, direction=direction)
    out: list[dict[str, Any]] = []
    for snap in query.stream():
        data = snap.to_dict() or {}
        data["id"] = snap.id
        out.append(data)
    return out


def batch_set(items: Iterable[tuple[str, str, dict[str, Any]]]) -> None:
    client = get_client()
    batch = client.batch()
    for collection, doc_id, data in items:
        ref = client.collection(collection).document(doc_id)
        batch.set(ref, data, merge=True)
    batch.commit()
