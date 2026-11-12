from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.alert import Alert
from backend.services.alert_service import scan_and_generate_alerts, resolve_alert
from backend.services.audit_service import record_audit

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('', methods=['GET'])
def get_alerts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    severity = request.args.get('severity', '', type=str).strip()
    issue_type = request.args.get('issue_type', '', type=str).strip()
    status = request.args.get('status', '', type=str).strip()
    asset_id = request.args.get('asset_id', '', type=str).strip()

    query = Alert.query

    if severity:
        query = query.filter(Alert.severity == severity)
    if issue_type:
        query = query.filter(Alert.issue_type == issue_type)
    if status:
        query = query.filter(Alert.resolution_status == status)
    if asset_id:
        query = query.filter(Alert.asset_id == asset_id)

    query = query.order_by(Alert.detection_timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Breakdown by severity
    critical_count = Alert.query.filter(Alert.severity == 'CRITICAL', Alert.resolution_status.in_(['OPEN', 'INVESTIGATING'])).count()
    high_count = Alert.query.filter(Alert.severity == 'HIGH', Alert.resolution_status.in_(['OPEN', 'INVESTIGATING'])).count()
    medium_count = Alert.query.filter(Alert.severity == 'MEDIUM', Alert.resolution_status.in_(['OPEN', 'INVESTIGATING'])).count()
    low_count = Alert.query.filter(Alert.severity == 'LOW', Alert.resolution_status.in_(['OPEN', 'INVESTIGATING'])).count()

    return jsonify({
        'alerts': [a.to_dict() for a in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'severity_summary': {
            'critical': critical_count,
            'high': high_count,
            'medium': medium_count,
            'low': low_count
        }
    })

@alert_bp.route('/scan', methods=['POST'])
def trigger_scan():
    created = scan_and_generate_alerts()
    return jsonify({
        'message': f"Anomaly scan completed. {created} new alerts identified.",
        'new_alerts_count': created
    })

@alert_bp.route('/<id>/resolve', methods=['PUT'])
def resolve_alert_endpoint(id):
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')
    remarks = payload.get('resolution_remarks')

    if not remarks:
        return jsonify({'error': 'resolution_remarks is required to resolve alert.'}), 400

    try:
        alert = resolve_alert(id, remarks, user)
        return jsonify({
            'message': f"Alert {id} marked as RESOLVED.",
            'alert': alert.to_dict()
        })
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@alert_bp.route('/<id>/assign', methods=['PUT'])
def assign_alert_endpoint(id):
    alert = Alert.query.get(id)
    if not alert:
        return jsonify({'error': f'Alert {id} not found'}), 404

    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')
    assigned_person = payload.get('assigned_person')
    new_status = payload.get('resolution_status', 'INVESTIGATING')

    if not assigned_person:
        return jsonify({'error': 'assigned_person is required'}), 400

    prev_assigned = alert.assigned_person
    alert.assigned_person = assigned_person
    alert.resolution_status = new_status

    record_audit(
        entity_type='ALERT',
        entity_id=alert.id,
        action='UPDATE',
        previous_value={'assigned_person': prev_assigned, 'status': alert.resolution_status},
        new_value={'assigned_person': assigned_person, 'status': new_status},
        user=user,
        reason=f"Assigned alert investigation to {assigned_person}"
    )

    db.session.commit()
    return jsonify(alert.to_dict())
