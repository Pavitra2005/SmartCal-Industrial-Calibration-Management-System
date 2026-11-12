from datetime import datetime
from backend.database import db

class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.String(50), primary_key=True) # AST-000001
    name = db.Column(db.String(150), nullable=False, index=True)
    instrument_type_id = db.Column(db.Integer, db.ForeignKey('instrument_types.id'), nullable=False, index=True)
    manufacturer = db.Column(db.String(100), nullable=False)
    model_number = db.Column(db.String(100), nullable=False)
    serial_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=False, index=True)
    department = db.Column(db.String(100), nullable=False, index=True)
    criticality_level = db.Column(db.String(20), default='MEDIUM', index=True) # CRITICAL, HIGH, MEDIUM, LOW
    installation_date = db.Column(db.Date, nullable=False)
    calibration_interval = db.Column(db.Integer, default=6, nullable=False)
    interval_unit = db.Column(db.String(20), default='months', nullable=False) # days, months, years
    tolerance_limit = db.Column(db.Float, default=0.05, nullable=False)
    last_calibration_date = db.Column(db.Date, nullable=True)
    next_calibration_due_date = db.Column(db.Date, nullable=False, index=True)
    current_status = db.Column(db.String(30), default='ACTIVE', index=True) # ACTIVE, OVERDUE, OUT_OF_SERVICE, UNDER_MAINTENANCE, RETIRED
    supplier_id = db.Column(db.String(50), db.ForeignKey('suppliers.id'), nullable=True, index=True)
    calibration_plan_id = db.Column(db.String(50), db.ForeignKey('calibration_plans.id'), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    calibration_events = db.relationship('CalibrationEvent', backref='asset', lazy='dynamic', cascade='all, delete-orphan')
    certificates = db.relationship('Certificate', backref='asset', lazy='dynamic')
    work_orders = db.relationship('WorkOrder', backref='asset', lazy='dynamic', cascade='all, delete-orphan')
    production_uses = db.relationship('ProductionUse', backref='asset', lazy='dynamic')
    alerts = db.relationship('Alert', backref='asset', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'instrument_type_id': self.instrument_type_id,
            'instrument_type_name': self.instrument_type.name if self.instrument_type else None,
            'instrument_category': self.instrument_type.category if self.instrument_type else None,
            'manufacturer': self.manufacturer,
            'model_number': self.model_number,
            'serial_number': self.serial_number,
            'description': self.description,
            'location': self.location,
            'department': self.department,
            'criticality_level': self.criticality_level,
            'installation_date': self.installation_date.isoformat() if self.installation_date else None,
            'calibration_interval': self.calibration_interval,
            'interval_unit': self.interval_unit,
            'tolerance_limit': self.tolerance_limit,
            'last_calibration_date': self.last_calibration_date.isoformat() if self.last_calibration_date else None,
            'next_calibration_due_date': self.next_calibration_due_date.isoformat() if self.next_calibration_due_date else None,
            'current_status': self.current_status,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'calibration_plan_id': self.calibration_plan_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
