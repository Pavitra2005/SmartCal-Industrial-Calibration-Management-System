from datetime import datetime
from backend.database import db

class ProductionUse(db.Model):
    __tablename__ = 'production_uses'

    id = db.Column(db.String(80), primary_key=True) # USE-AST-000001-1762934123
    asset_id = db.Column(db.String(50), db.ForeignKey('assets.id'), nullable=False, index=True)
    production_batch_id = db.Column(db.String(80), nullable=False, index=True)
    production_line = db.Column(db.String(100), nullable=False, index=True)
    operator = db.Column(db.String(100), nullable=False)
    usage_timestamp = db.Column(db.DateTime, nullable=False, index=True)
    calibration_status_at_usage = db.Column(db.String(30), nullable=False) # CALIBRATED, OVERDUE, FAILED, UNAVAILABLE
    exception_approval_id = db.Column(db.String(80), nullable=True) # EXC-2026-001
    usage_decision = db.Column(db.String(30), nullable=False, index=True) # ALLOWED, BLOCKED, ALLOWED_WITH_EXCEPTION
    issue_type = db.Column(db.String(50), nullable=True, index=True) # EXPIRED_USAGE, FAILED_CALIBRATION_USAGE, NONE
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'production_batch_id': self.production_batch_id,
            'production_line': self.production_line,
            'operator': self.operator,
            'usage_timestamp': self.usage_timestamp.isoformat() if self.usage_timestamp else None,
            'calibration_status_at_usage': self.calibration_status_at_usage,
            'exception_approval_id': self.exception_approval_id,
            'usage_decision': self.usage_decision,
            'issue_type': self.issue_type,
            'notes': self.notes,
        }
