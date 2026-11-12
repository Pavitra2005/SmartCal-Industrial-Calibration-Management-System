from datetime import datetime
from backend.database import db

class AuditRecord(db.Model):
    __tablename__ = 'audit_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    audit_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # AUD-2026-000001
    entity_type = db.Column(db.String(50), nullable=False, index=True) # ASSET, CALIBRATION, CERTIFICATE, WORK_ORDER, PRODUCTION_USE, ALERT, CALIBRATION_PLAN
    entity_id = db.Column(db.String(80), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False, index=True) # CREATE, UPDATE, DELETE, STATUS_CHANGE, CALIBRATE, RESCHEDULE, APPROVE_EXCEPTION, RESOLVE_ALERT, RECORD_USAGE
    previous_value = db.Column(db.Text, nullable=True) # JSON
    new_value = db.Column(db.Text, nullable=True) # JSON
    user = db.Column(db.String(100), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    reason = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'audit_id': self.audit_id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action': self.action,
            'previous_value': self.previous_value,
            'new_value': self.new_value,
            'user': self.user,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'reason': self.reason,
        }
