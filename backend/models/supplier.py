from datetime import datetime
from backend.database import db

class Supplier(db.Model):
    __tablename__ = 'suppliers'

    id = db.Column(db.String(50), primary_key=True) # e.g. SUP-0001
    name = db.Column(db.String(150), nullable=False, index=True)
    contact_name = db.Column(db.String(100), nullable=True)
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    calibration_services = db.Column(db.Text, nullable=True)
    accreditation_details = db.Column(db.String(255), nullable=True) # e.g. ISO/IEC 17025:2017
    address = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='ACTIVE', index=True) # ACTIVE, INACTIVE, SUSPENDED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assets = db.relationship('Asset', backref='supplier', lazy='dynamic')
    calibration_events = db.relationship('CalibrationEvent', backref='supplier', lazy='dynamic')
    certificates = db.relationship('Certificate', backref='supplier', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'calibration_services': self.calibration_services,
            'accreditation_details': self.accreditation_details,
            'address': self.address,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'total_events': self.calibration_events.count(),
        }
