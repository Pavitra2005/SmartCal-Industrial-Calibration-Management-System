from datetime import datetime
from backend.database import db

class CalibrationEvent(db.Model):
    __tablename__ = 'calibration_events'

    id = db.Column(db.String(80), primary_key=True) # CAL-AST-000001-2026-000001
    asset_id = db.Column(db.String(50), db.ForeignKey('assets.id'), nullable=False, index=True)
    calibration_date = db.Column(db.Date, nullable=False, index=True)
    technician = db.Column(db.String(100), nullable=False)
    supplier_id = db.Column(db.String(50), db.ForeignKey('suppliers.id'), nullable=True, index=True)
    reference_standard = db.Column(db.String(150), nullable=False)
    measured_value = db.Column(db.Float, nullable=False)
    expected_value = db.Column(db.Float, nullable=False)
    measurement_error = db.Column(db.Float, nullable=False) # measured - expected
    tolerance = db.Column(db.Float, nullable=False)
    pass_fail_result = db.Column(db.String(10), nullable=False, index=True) # PASS, FAIL
    calibration_remarks = db.Column(db.Text, nullable=True)
    certificate_status = db.Column(db.String(30), default='PENDING_APPROVAL', index=True) # VALID, MISSING, EXPIRED, PENDING_APPROVAL, MISMATCH
    next_calibration_due_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    certificate = db.relationship('Certificate', backref='calibration_event', uselist=False, cascade='all, delete-orphan')
    work_orders = db.relationship('WorkOrder', backref='related_calibration', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'asset_serial': self.asset.serial_number if self.asset else None,
            'calibration_date': self.calibration_date.isoformat() if self.calibration_date else None,
            'technician': self.technician,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'reference_standard': self.reference_standard,
            'measured_value': round(self.measured_value, 5),
            'expected_value': round(self.expected_value, 5),
            'measurement_error': round(self.measurement_error, 5),
            'tolerance': round(self.tolerance, 5),
            'pass_fail_result': self.pass_fail_result,
            'calibration_remarks': self.calibration_remarks,
            'certificate_status': self.certificate_status,
            'next_calibration_due_date': self.next_calibration_due_date.isoformat() if self.next_calibration_due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'has_certificate': bool(self.certificate),
            'certificate_id': self.certificate.id if self.certificate else None,
        }
