from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_plan import CalibrationPlan
from backend.models.instrument_type import InstrumentType
from backend.services.audit_service import record_audit

schedule_bp = Blueprint('schedule', __name__)

@schedule_bp.route('', methods=['GET'])
def get_schedule():
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    end_of_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    assets = Asset.query.filter(Asset.current_status != 'RETIRED').all()

    overdue = []
    due_this_week = []
    due_this_month = []
    upcoming = []

    for a in assets:
        d = a.next_calibration_due_date
        item = {
            'asset_id': a.id,
            'asset_name': a.name,
            'department': a.department,
            'location': a.location,
            'criticality': a.criticality_level,
            'next_due_date': d.isoformat(),
            'current_status': a.current_status,
            'interval': f"{a.calibration_interval} {a.interval_unit}",
            'supplier_name': a.supplier.name if a.supplier else 'Internal Metrology'
        }

        if d < today:
            overdue.append(item)
        elif start_of_week <= d <= end_of_week:
            due_this_week.append(item)
        elif today <= d <= end_of_month:
            due_this_month.append(item)
        else:
            upcoming.append(item)

    # Sort each list by date
    overdue.sort(key=lambda x: x['next_due_date'])
    due_this_week.sort(key=lambda x: x['next_due_date'])
    due_this_month.sort(key=lambda x: x['next_due_date'])
    upcoming.sort(key=lambda x: x['next_due_date'])

    return jsonify({
        'summary': {
            'overdue_count': len(overdue),
            'due_this_week_count': len(due_this_week),
            'due_this_month_count': len(due_this_month),
            'upcoming_count': len(upcoming),
        },
        'overdue': overdue,
        'due_this_week': due_this_week,
        'due_this_month': due_this_month,
        'upcoming': upcoming[:50]
    })

@schedule_bp.route('/reschedule', methods=['POST'])
def reschedule_instrument():
    payload = request.get_json() or {}
    asset_id = payload.get('asset_id')
    new_due_str = payload.get('new_due_date')
    reason = payload.get('reason')
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')

    if not asset_id or not new_due_str or not reason:
        return jsonify({'error': 'asset_id, new_due_date, and reason are required.'}), 400

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': f'Instrument {asset_id} not found'}), 404

    try:
        new_due_date = datetime.strptime(new_due_str, '%Y-%m-%d').date()
    except Exception:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    prev_due = asset.next_calibration_due_date
    asset.next_calibration_due_date = new_due_date

    # Record immutable audit trail with justification
    record_audit(
        entity_type='ASSET',
        entity_id=asset.id,
        action='RESCHEDULE',
        previous_value={'next_calibration_due_date': prev_due.isoformat() if prev_due else None},
        new_value={'next_calibration_due_date': new_due_date.isoformat()},
        user=user,
        reason=reason
    )

    db.session.commit()
    return jsonify({
        'message': f"Instrument {asset.id} rescheduled successfully.",
        'instrument': asset.to_dict()
    })

@schedule_bp.route('/plans', methods=['GET'])
def get_calibration_plans():
    plans = CalibrationPlan.query.all()
    return jsonify([p.to_dict() for p in plans])

@schedule_bp.route('/plans', methods=['POST'])
def create_calibration_plan():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')

    plan_name = payload.get('plan_name')
    instrument_type_id = payload.get('instrument_type_id')
    interval = payload.get('calibration_interval', 6)
    interval_unit = payload.get('interval_unit', 'months')
    tol = payload.get('tolerance_limits', 0.05)
    dept = payload.get('responsible_department', 'Quality Metrology Lab')

    if not plan_name or not instrument_type_id:
        return jsonify({'error': 'plan_name and instrument_type_id are required'}), 400

    count = CalibrationPlan.query.count()
    plan_id = f"PLAN-{count + 1:04d}"

    plan = CalibrationPlan(
        id=plan_id,
        plan_name=plan_name,
        instrument_type_id=int(instrument_type_id),
        calibration_interval=int(interval),
        interval_unit=interval_unit,
        tolerance_limits=float(tol),
        due_date_calc_method='FROM_LAST_CALIBRATION',
        responsible_department=dept,
        supplier_id=payload.get('supplier_id'),
        effective_start_date=date.today(),
        plan_status='ACTIVE',
        created_at=datetime.utcnow()
    )
    db.session.add(plan)
    db.session.flush()

    record_audit(
        entity_type='CALIBRATION_PLAN',
        entity_id=plan.id,
        action='CREATE',
        previous_value=None,
        new_value=plan.to_dict(),
        user=user,
        reason="Created new calibration protocol"
    )

    db.session.commit()
    return jsonify(plan.to_dict()), 201
