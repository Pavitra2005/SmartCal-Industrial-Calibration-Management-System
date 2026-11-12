from datetime import datetime
from backend.database import db

class Certificate(db.Model):
    __tablename__ = 'certificates'

    id = db.Column(db.String(120), primary_key=True) # CERT-CAL-AST-000001-2026-000001
    calibration_id = db.Column(db.String(80), db.ForeignKey('calibration_events.id'), unique=True, nullable=False, index=True)
    asset_id = db.Column(db.String(50), db.ForeignKey('assets.id'), nullable=False, index=True)
    certificate_number = db.Column(db.String(100), nullable=False, index=True)
    issue_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False, index=True)
    supplier_id = db.Column(db.String(50), db.ForeignKey('suppliers.id'), nullable=True, index=True)
    approval_status = db.Column(db.String(30), default='APPROVED', index=True) # APPROVED, PENDING, REJECTED
    document_location = db.Column(db.String(255), nullable=False)
    file_size_kb = db.Column(db.Integer, default=125)
    verification_status = db.Column(db.String(30), default='VERIFIED', index=True) # VERIFIED, MISMATCH_FLAGGED, MISSING_FLAGGED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'calibration_id': self.calibration_id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'certificate_number': self.certificate_number,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'approval_status': self.approval_status,
            'document_location': self.document_location,
            'file_size_kb': self.file_size_kb,
            'verification_status': self.verification_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
