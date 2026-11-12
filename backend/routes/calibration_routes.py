from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.calibration_event import CalibrationEvent
from backend.models.asset import Asset
from backend.services.calibration_service import execute_calibration

calibration_bp = Blueprint('calibrations', __name__)

@calibration_bp.route('', methods=['GET'])
def get_calibrations():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()
    result = request.args.get('result', '', type=str).strip() # PASS, FAIL
    asset_id = request.args.get('asset_id', '', type=str).strip()
    technician = request.args.get('technician', '', type=str).strip()

    query = CalibrationEvent.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (CalibrationEvent.id.ilike(search_filter)) |
            (CalibrationEvent.asset_id.ilike(search_filter)) |
            (CalibrationEvent.technician.ilike(search_filter)) |
            (CalibrationEvent.reference_standard.ilike(search_filter))
        )

    if result:
        query = query.filter(CalibrationEvent.pass_fail_result == result)
    if asset_id:
        query = query.filter(CalibrationEvent.asset_id == asset_id)
    if technician:
        query = query.filter(CalibrationEvent.technician.ilike(f"%{technician}%"))

    query = query.order_by(CalibrationEvent.calibration_date.desc(), CalibrationEvent.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'calibrations': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    })

@calibration_bp.route('/<id>', methods=['GET'])
def get_calibration_detail(id):
    event = CalibrationEvent.query.get(id)
    if not event:
        return jsonify({'error': f'Calibration event {id} not found'}), 404

    data = event.to_dict()
    data['asset_details'] = event.asset.to_dict() if event.asset else None
    data['certificate'] = event.certificate.to_dict() if event.certificate else None
    data['work_orders'] = [w.to_dict() for w in event.work_orders.all()]
    return jsonify(data)

@calibration_bp.route('', methods=['POST'])
def record_calibration():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')

    required = ['asset_id', 'calibration_date', 'technician', 'reference_standard', 'measured_value', 'expected_value']
    for r in required:
        if payload.get(r) is None or payload.get(r) == '':
            return jsonify({'error': f"Missing required parameter: {r}"}), 400

    try:
        event, corrective_wo = execute_calibration(
            asset_id=payload['asset_id'],
            calibration_date=payload['calibration_date'],
            technician=payload['technician'],
            supplier_id=payload.get('supplier_id'),
            reference_standard=payload['reference_standard'],
            measured_value=payload['measured_value'],
            expected_value=payload['expected_value'],
            tolerance=payload.get('tolerance'),
            remarks=payload.get('calibration_remarks', ''),
            user=user
        )

        return jsonify({
            'calibration_event': event.to_dict(),
            'corrective_work_order': corrective_wo.to_dict() if corrective_wo else None,
            'message': f"Calibration recorded with result: {event.pass_fail_result}"
        }), 201

    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': f"Internal error executing calibration: {str(e)}"}), 500
