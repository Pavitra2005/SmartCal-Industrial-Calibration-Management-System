import json
from datetime import datetime
from backend.database import db
from backend.models.audit_record import AuditRecord

_audit_counter = 0

def record_audit(entity_type, entity_id, action, previous_value=None, new_value=None, user='SYSTEM', reason=None):
    global _audit_counter
    try:
        if _audit_counter == 0:
            last = AuditRecord.query.order_by(AuditRecord.id.desc()).first()
            if last:
                _audit_counter = last.id

        _audit_counter += 1
        audit_id = f"AUD-2026-{_audit_counter:06d}"
        
        prev_str = json.dumps(previous_value, default=str) if isinstance(previous_value, (dict, list)) else (str(previous_value) if previous_value is not None else None)
        new_str = json.dumps(new_value, default=str) if isinstance(new_value, (dict, list)) else (str(new_value) if new_value is not None else None)

        record = AuditRecord(
            audit_id=audit_id,
            entity_type=entity_type,
            entity_id=str(entity_id),
            action=action,
            previous_value=prev_str,
            new_value=new_str,
            user=user,
            timestamp=datetime.utcnow(),
            reason=reason
        )
        db.session.add(record)
        return record
    except Exception as e:
        print(f"Error recording audit: {e}")
        return None
