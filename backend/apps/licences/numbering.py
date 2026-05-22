"""Licence number allocator.

Uses a counter at `_counters/licences`. In production we issue an atomic
Firestore transaction; in tests (mock-firestore) we fall back to a plain
read-modify-write — collisions are tolerable in the test path.
Format: RPA-<YYYY>-<6-digit zero-padded>.
"""
from __future__ import annotations

import os
from datetime import datetime

from irms.firestore import get_client

COUNTER_PATH = ("_counters", "licences")


def next_licence_number(year: int | None = None) -> str:
    year = year or datetime.utcnow().year
    client = get_client()
    counter_ref = client.collection(COUNTER_PATH[0]).document(COUNTER_PATH[1])

    if _supports_transactions():
        from google.cloud.firestore import (  # type: ignore[import-untyped]
            Transaction,
            transactional,
        )

        @transactional
        def _alloc(tx: Transaction) -> int:
            snap = counter_ref.get(transaction=tx)
            data = (snap.to_dict() if snap.exists else None) or {}
            current = int(data.get(str(year), 0)) + 1
            tx.set(counter_ref, {**data, str(year): current})
            return current

        seq = _alloc(client.transaction())
    else:
        snap = counter_ref.get()
        data = (snap.to_dict() if snap.exists else None) or {}
        seq = int(data.get(str(year), 0)) + 1
        counter_ref.set({**data, str(year): seq})

    return f"RPA-{year}-{seq:06d}"


def _supports_transactions() -> bool:
    """Detect mock-firestore by class name — it lacks the transactional API."""
    if os.environ.get("FIRESTORE_FORCE_NO_TX"):
        return False
    cls_name = type(get_client()).__name__
    return cls_name != "MockFirestore"
