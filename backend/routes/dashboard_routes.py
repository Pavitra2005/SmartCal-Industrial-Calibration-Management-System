from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.models.instrument_type import InstrumentType
from backend.models.audit_record import AuditRecord

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    today = date.today()
    in_30_days = today + timedelta(days=30)

    total_instruments = Asset.query.count()
    active_instruments = Asset.query.filter_by(current_status='ACTIVE').count()
    overdue_instruments = Asset.query.filter(Asset.next_calibration_due_date < today, Asset.current_status != 'RETIRED').count()
    due_within_30_days = Asset.query.filter(Asset.next_calibration_due_date >= today, Asset.next_calibration_due_date <= in_30_days).count()
    failed_calibrations = CalibrationEvent.query.filter_by(pass_fail_result='FAIL').count()
    valid_certificates = Certificate.query.filter(Certificate.expiry_date >= today, Certificate.verification_status == 'VERIFIED').count()
    open_work_orders = WorkOrder.query.filter(WorkOrder.status.in_(['OPEN', 'ASSIGNED', 'IN_PROGRESS'])).count()
    active_alerts = Alert.query.filter(Alert.resolution_status.in_(['OPEN', 'INVESTIGATING', 'ACKNOWLEDGED'])).count()

    return jsonify({
        'total_instruments': total_instruments,
        'active_instruments': active_instruments,
        'overdue_instruments': overdue_instruments,
        'due_within_30_days': due_within_30_days,
        'failed_calibrations': failed_calibrations,
        'valid_certificates': valid_certificates,
        'open_work_orders': open_work_orders,
        'active_alerts': active_alerts
    })

@dashboard_bp.route('/charts', methods=['GET'])
def get_dashboard_charts():
    today = date.today()

    # 1. Calibration pass/fail distribution
    pass_count = CalibrationEvent.query.filter_by(pass_fail_result='PASS').count()
    fail_count = CalibrationEvent.query.filter_by(pass_fail_result='FAIL').count()
    pass_fail_dist = [
        {'name': 'Passed', 'value': pass_count, 'color': '#10B981'},
        {'name': 'Failed', 'value': fail_count, 'color': '#EF4444'}
    ]

    # 2. Monthly calibration trends (last 6 months)
    monthly_trends = []
    # Query grouped by month
    cal_dates = db.session.query(CalibrationEvent.calibration_date, CalibrationEvent.pass_fail_result).all()
    months_map = {}
    for cd, res in cal_dates:
        if cd:
            m_key = cd.strftime('%Y-%m')
            if m_key not in months_map:
                months_map[m_key] = {'month': cd.strftime('%b %Y'), 'passed': 0, 'failed': 0, 'total': 0}
            if res == 'PASS':
                months_map[m_key]['passed'] += 1
            else:
                months_map[m_key]['failed'] += 1
            months_map[m_key]['total'] += 1
    
    sorted_months = sorted(months_map.keys())[-6:]
    for m in sorted_months:
        monthly_trends.append(months_map[m])

    # 3. Instrument status distribution
    status_counts = db.session.query(Asset.current_status, func.count(Asset.id)).group_by(Asset.current_status).all()
    status_colors = {
        'ACTIVE': '#10B981',
        'OVERDUE': '#EF4444',
        'OUT_OF_SERVICE': '#F59E0B',
        'UNDER_MAINTENANCE': '#3B82F6',
        'RETIRED': '#94A3B8'
    }
    instrument_status_dist = [
        {'name': s.replace('_', ' ').title(), 'value': c, 'status': s, 'color': status_colors.get(s, '#64748B')}
        for s, c in status_counts
    ]

    # 4. Overdue instruments by instrument type
    overdue_by_type_query = db.session.query(
        InstrumentType.name,
        func.count(Asset.id)
    ).join(Asset, Asset.instrument_type_id == InstrumentType.id)\
     .filter(Asset.next_calibration_due_date < today, Asset.current_status != 'RETIRED')\
     .group_by(InstrumentType.name).all()

    overdue_by_type = [
        {'type': name, 'count': count} for name, count in overdue_by_type_query
    ]

    # 5. Production usage violations (by issue type or line)
    violations_query = db.session.query(
        ProductionUse.production_line,
        func.count(ProductionUse.id)
    ).filter(ProductionUse.usage_decision != 'ALLOWED')\
     .group_by(ProductionUse.production_line).all()

    usage_violations = [
        {'line': line.split(' - ')[0], 'full_line': line, 'violations': count} for line, count in violations_query
    ]

    # 6. Work order status distribution
    wo_status_counts = db.session.query(WorkOrder.status, func.count(WorkOrder.id)).group_by(WorkOrder.status).all()
    wo_colors = {
        'OPEN': '#EF4444',
        'ASSIGNED': '#F59E0B',
        'IN_PROGRESS': '#3B82F6',
        'ON_HOLD': '#8B5CF6',
        'COMPLETED': '#10B981',
        'CANCELLED': '#94A3B8'
    }
    wo_status_dist = [
        {'name': s.replace('_', ' ').title(), 'value': c, 'status': s, 'color': wo_colors.get(s, '#64748B')}
        for s, c in wo_status_counts
    ]

    return jsonify({
        'pass_fail_distribution': pass_fail_dist,
        'monthly_trends': monthly_trends,
        'instrument_status_distribution': instrument_status_dist,
        'overdue_by_type': overdue_by_type,
        'production_usage_violations': usage_violations,
        'work_order_status_distribution': wo_status_dist
    })

@dashboard_bp.route('/recent-activities', methods=['GET'])
def get_recent_activities():
    activities = AuditRecord.query.order_by(AuditRecord.timestamp.desc()).limit(8).all()
    return jsonify([a.to_dict() for a in activities])

@dashboard_bp.route('/upcoming-calibrations', methods=['GET'])
def get_upcoming_calibrations():
    today = date.today()
    upcoming = Asset.query.filter(
        Asset.next_calibration_due_date >= today,
        Asset.current_status != 'RETIRED'
    ).order_by(Asset.next_calibration_due_date.asc()).limit(6).all()
    return jsonify([a.to_dict() for a in upcoming])

@dashboard_bp.route('/critical-alerts', methods=['GET'])
def get_critical_alerts():
    critical = Alert.query.filter(
        Alert.resolution_status.in_(['OPEN', 'INVESTIGATING']),
        Alert.severity.in_(['CRITICAL', 'HIGH'])
    ).order_by(Alert.detection_timestamp.desc()).limit(6).all()
    return jsonify([a.to_dict() for a in critical])
