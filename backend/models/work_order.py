from datetime import datetime
from backend.database import db

class WorkOrder(db.Model):
    __tablename__ = 'work_orders'

    id = db.Column(db.String(50), primary_key=True) # WO-2026-000001
    asset_id = db.Column(db.String(50), db.ForeignKey('assets.id'), nullable=False, index=True)
    related_calibration_id = db.Column(db.String(80), db.ForeignKey('calibration_events.id'), nullable=True, index=True)
    work_order_type = db.Column(db.String(50), default='CORRECTIVE_CALIBRATION', nullable=False) 
    priority = db.Column(db.String(20), default='HIGH', index=True) # CRITICAL, HIGH, MEDIUM, LOW
    description = db.Column(db.Text, nullable=False)
    assigned_technician = db.Column(db.String(100), nullable=True)
    created_date = db.Column(db.Date, nullable=False, index=True)
    planned_start_date = db.Column(db.Date, nullable=True)
    actual_start_date = db.Column(db.Date, nullable=True)
    completion_date = db.Column(db.Date, nullable=True)
    downtime_hours = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='OPEN', index=True) # OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
    corrective_action = db.Column(db.Text, nullable=True)
    impact_assessment_status = db.Column(db.String(30), default='PENDING', index=True) # PENDING, COMPLETED, NOT_REQUIRED
    impact_assessment_notes = db.Column(db.Text, nullable=True)
    responsible_engineer = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'related_calibration_id': self.related_calibration_id,
            'work_order_type': self.work_order_type,
            'priority': self.priority,
            'description': self.description,
            'assigned_technician': self.assigned_technician,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'planned_start_date': self.planned_start_date.isoformat() if self.planned_start_date else None,
            'actual_start_date': self.actual_start_date.isoformat() if self.actual_start_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'downtime_hours': self.downtime_hours,
            'status': self.status,
            'corrective_action': self.corrective_action,
            'impact_assessment_status': self.impact_assessment_status,
            'impact_assessment_notes': self.impact_assessment_notes,
            'responsible_engineer': self.responsible_engineer,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
