from datetime import datetime
from backend.database import db

class InstrumentType(db.Model):
    __tablename__ = 'instrument_types'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False) # Dimensional, Thermal, Pressure, Electrical, Mechanical, Chemical
    default_interval_months = db.Column(db.Integer, default=6)
    default_tolerance = db.Column(db.Float, default=0.05)
    unit_of_measure = db.Column(db.String(30), default='mm')
    description = db.Column(db.Text, nullable=True)

    assets = db.relationship('Asset', backref='instrument_type', lazy='dynamic')
    calibration_plans = db.relationship('CalibrationPlan', backref='instrument_type', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'type_code': self.type_code,
            'name': self.name,
            'category': self.category,
            'default_interval_months': self.default_interval_months,
            'default_tolerance': self.default_tolerance,
            'unit_of_measure': self.unit_of_measure,
            'description': self.description,
        }
