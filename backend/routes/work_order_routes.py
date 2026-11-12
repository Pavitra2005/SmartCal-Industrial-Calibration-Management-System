from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.work_order import WorkOrder
from backend.models.asset import Asset
from backend.models.alert import Alert
from backend.services.audit_service import record_audit

work_order_bp = Blueprint('work_orders', __name__)

@work_order_bp.route('', methods=['GET'])
def get_work_orders():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()
    status = request.args.get('status', '', type=str).strip()
    priority = request.args.get('priority', '', type=str).strip()
    asset_id = request.args.get('asset_id', '', type=str).strip()

    query = WorkOrder.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (WorkOrder.id.ilike(search_filter)) |
            (WorkOrder.asset_id.ilike(search_filter)) |
            (WorkOrder.description.ilike(search_filter)) |
            (WorkOrder.assigned_technician.ilike(search_filter))
        )

    if status:
        query = query.filter(WorkOrder.status == status)
    if priority:
        query = query.filter(WorkOrder.priority == priority)
    if asset_id:
        query = query.filter(WorkOrder.asset_id == asset_id)

    query = query.order_by(WorkOrder.created_date.desc(), WorkOrder.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'work_orders': [w.to_dict() for w in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    })

@work_order_bp.route('/<id>', methods=['GET'])
def get_work_order_detail(id):
    wo = WorkOrder.query.get(id)
    if not wo:
        return jsonify({'error': f'Work order {id} not found'}), 404

    data = wo.to_dict()
    data['asset_details'] = wo.asset.to_dict() if wo.asset else None
    data['calibration_details'] = wo.related_calibration.to_dict() if wo.related_calibration else None
    return jsonify(data)

@work_order_bp.route('', methods=['POST'])
def create_work_order():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'PRODUCTION_PLANNER')

    asset_id = payload.get('asset_id')
    desc = payload.get('description')
    if not asset_id or not desc:
        return jsonify({'error': 'asset_id and description are required'}), 400

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': f'Asset {asset_id} not found'}), 404

    count = WorkOrder.query.count()
    wo_id = f"WO-2026-{count + 1:06d}"

    wo = WorkOrder(
        id=wo_id,
        asset_id=asset.id,
        related_calibration_id=payload.get('related_calibration_id'),
        work_order_type=payload.get('work_order_type', 'PREVENTATIVE_MAINTENANCE'),
        priority=payload.get('priority', 'MEDIUM'),
        description=desc,
        assigned_technician=payload.get('assigned_technician'),
        created_date=date.today(),
        planned_start_date=date.today(),
        status='OPEN',
        downtime_hours=float(payload.get('downtime_hours', 0.0)),
        impact_assessment_status=payload.get('impact_assessment_status', 'NOT_REQUIRED'),
        responsible_engineer=user,
        created_at=datetime.utcnow()
    )
    db.session.add(wo)
    db.session.flush()

    record_audit(
        entity_type='WORK_ORDER',
        entity_id=wo.id,
        action='CREATE',
        previous_value=None,
        new_value=wo.to_dict(),
        user=user,
        reason="Manual work order creation"
    )

    db.session.commit()
    return jsonify(wo.to_dict()), 201

@work_order_bp.route('/<id>', methods=['PUT'])
def update_work_order(id):
    wo = WorkOrder.query.get(id)
    if not wo:
        return jsonify({'error': f'Work order {id} not found'}), 404

    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'PRODUCTION_PLANNER')
    prev_state = wo.to_dict()

    if 'status' in payload:
        new_status = payload['status']
        wo.status = new_status
        if new_status == 'IN_PROGRESS' and not wo.actual_start_date:
            wo.actual_start_date = date.today()
        elif new_status == 'COMPLETED':
            wo.completion_date = date.today()

    if 'assigned_technician' in payload:
        wo.assigned_technician = payload['assigned_technician']
    if 'downtime_hours' in payload:
        wo.downtime_hours = float(payload['downtime_hours'])
    if 'corrective_action' in payload:
        wo.corrective_action = payload['corrective_action']
    if 'description' in payload:
        wo.description = payload['description']

    record_audit(
        entity_type='WORK_ORDER',
        entity_id=wo.id,
        action='STATUS_CHANGE',
        previous_value=prev_state,
        new_value=wo.to_dict(),
        user=user,
        reason=f"Work order updated to {wo.status}"
    )

    db.session.commit()
    return jsonify(wo.to_dict())

@work_order_bp.route('/<id>/impact-assessment', methods=['POST'])
def complete_impact_assessment(id):
    wo = WorkOrder.query.get(id)
    if not wo:
        return jsonify({'error': f'Work order {id} not found'}), 404

    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')
    notes = payload.get('impact_assessment_notes')
    status = payload.get('impact_assessment_status', 'COMPLETED')

    if not notes:
        return jsonify({'error': 'impact_assessment_notes are required to sign off'}), 400

    prev_status = wo.impact_assessment_status
    wo.impact_assessment_status = status
    wo.impact_assessment_notes = notes
    wo.responsible_engineer = user

    # Check and resolve related alert
    if status == 'COMPLETED':
        alert = Alert.query.filter_by(
            asset_id=wo.asset_id,
            issue_type='MISSING_IMPACT_ASSESSMENT',
            resolution_status='OPEN'
        ).first()
        if alert:
            alert.resolution_status = 'RESOLVED'
            alert.resolution_remarks = f"Impact assessment signed off by {user}: {notes[:100]}"
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = user

    record_audit(
        entity_type='WORK_ORDER',
        entity_id=wo.id,
        action='UPDATE',
        previous_value={'impact_assessment_status': prev_status},
        new_value={'impact_assessment_status': status, 'notes': notes, 'engineer': user},
        user=user,
        reason="Quality Impact Assessment signoff completed"
    )

    db.session.commit()
    return jsonify({
        'work_order': wo.to_dict(),
        'message': "Engineering Quality Impact Assessment recorded successfully."
    })
