from datetime import datetime
from backend.database import db

class CalibrationPlan(db.Model):
    __tablename__ = 'calibration_plans'

    id = db.Column(db.String(50), primary_key=True) # e.g. PLAN-0001
    plan_name = db.Column(db.String(150), nullable=False)
    instrument_type_id = db.Column(db.Integer, db.ForeignKey('instrument_types.id'), nullable=False, index=True)
    calibration_interval = db.Column(db.Integer, default=6, nullable=False)
    interval_unit = db.Column(db.String(20), default='months', nullable=False) # days, months, years
    tolerance_limits = db.Column(db.Float, default=0.05, nullable=False)
    due_date_calc_method = db.Column(db.String(50), default='FROM_LAST_CALIBRATION', nullable=False)
    responsible_department = db.Column(db.String(100), nullable=False)
    supplier_id = db.Column(db.String(50), db.ForeignKey('suppliers.id'), nullable=True)
    effective_start_date = db.Column(db.Date, nullable=False)
    effective_end_date = db.Column(db.Date, nullable=True)
    plan_status = db.Column(db.String(30), default='ACTIVE', index=True) # ACTIVE, INACTIVE, REVISED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assets = db.relationship('Asset', backref='calibration_plan', lazy='dynamic')
    supplier_rel = db.relationship('Supplier', backref='calibration_plans')

    def to_dict(self):
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'instrument_type_id': self.instrument_type_id,
            'instrument_type_name': self.instrument_type.name if self.instrument_type else None,
            'calibration_interval': self.calibration_interval,
            'interval_unit': self.interval_unit,
            'tolerance_limits': self.tolerance_limits,
            'due_date_calc_method': self.due_date_calc_method,
            'responsible_department': self.responsible_department,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier_rel.name if self.supplier_rel else None,
            'effective_start_date': self.effective_start_date.isoformat() if self.effective_start_date else None,
            'effective_end_date': self.effective_end_date.isoformat() if self.effective_end_date else None,
            'plan_status': self.plan_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
