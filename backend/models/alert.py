from datetime import datetime
from backend.database import db

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.String(50), primary_key=True) # ALT-2026-000001
    asset_id = db.Column(db.String(50), db.ForeignKey('assets.id'), nullable=False, index=True)
    related_event_id = db.Column(db.String(80), nullable=True, index=True)
    issue_type = db.Column(db.String(50), nullable=False, index=True) 
    # OVERDUE_CALIBRATION, CALIBRATION_DUE_SOON, FAILED_CALIBRATION, MISSING_CERTIFICATE,
    # EXPIRED_CERTIFICATE, CERTIFICATE_ASSET_MISMATCH, EXPIRED_USAGE, MISSING_IMPACT_ASSESSMENT, DUE_DATE_MISMATCH
    severity = db.Column(db.String(20), nullable=False, index=True) # CRITICAL, HIGH, MEDIUM, LOW
    description = db.Column(db.Text, nullable=False)
    detection_timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    assigned_person = db.Column(db.String(100), nullable=True)
    resolution_status = db.Column(db.String(30), default='OPEN', index=True) # OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    resolution_remarks = db.Column(db.Text, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'related_event_id': self.related_event_id,
            'issue_type': self.issue_type,
            'severity': self.severity,
            'description': self.description,
            'detection_timestamp': self.detection_timestamp.isoformat() if self.detection_timestamp else None,
            'assigned_person': self.assigned_person,
            'resolution_status': self.resolution_status,
            'resolution_remarks': self.resolution_remarks,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
        }
