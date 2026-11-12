from datetime import datetime
from backend.database import db

class GroundTruth(db.Model):
    __tablename__ = 'ground_truth'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    issue_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # GT-0001
    entity_id = db.Column(db.String(80), nullable=False, index=True)
    entity_type = db.Column(db.String(50), nullable=False) # ASSET, CALIBRATION, CERTIFICATE, WORK_ORDER, PRODUCTION_USE
    issue_type = db.Column(db.String(50), nullable=False, index=True) 
    # DUE_DATE_MISMATCH, EXPIRED_USAGE, CERTIFICATE_ASSET_MISMATCH, MISSING_IMPACT_ASSESSMENT, etc.
    expected_decision = db.Column(db.String(50), nullable=False)
    expected_severity = db.Column(db.String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    description = db.Column(db.Text, nullable=False)
    injected_case_label = db.Column(db.String(50), nullable=False, index=True) # EDGE_CASE_1, EDGE_CASE_2, EDGE_CASE_3, EDGE_CASE_4, STANDARD_ANOMALY
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'issue_id': self.issue_id,
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'issue_type': self.issue_type,
            'expected_decision': self.expected_decision,
            'expected_severity': self.expected_severity,
            'description': self.description,
            'injected_case_label': self.injected_case_label,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
