from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.asset import Asset
from backend.models.instrument_type import InstrumentType
from backend.models.calibration_plan import CalibrationPlan
from backend.models.supplier import Supplier
from backend.services.calibration_service import calculate_next_due_date
from backend.services.audit_service import record_audit

instrument_bp = Blueprint('instruments', __name__)

@instrument_bp.route('', methods=['GET'])
def get_instruments():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()
    status = request.args.get('status', '', type=str).strip()
    location = request.args.get('location', '', type=str).strip()
    type_id = request.args.get('type_id', '', type=str).strip()
    department = request.args.get('department', '', type=str).strip()

    query = Asset.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Asset.id.ilike(search_filter)) |
            (Asset.name.ilike(search_filter)) |
            (Asset.serial_number.ilike(search_filter)) |
            (Asset.manufacturer.ilike(search_filter))
        )

    if status:
        query = query.filter(Asset.current_status == status)
    if location:
        query = query.filter(Asset.location == location)
    if department:
        query = query.filter(Asset.department == department)
    if type_id and type_id.isdigit():
        query = query.filter(Asset.instrument_type_id == int(type_id))

    query = query.order_by(Asset.id.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'instruments': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    })

@instrument_bp.route('/<id>', methods=['GET'])
def get_instrument_detail(id):
    asset = Asset.query.get(id)
    if not asset:
        return jsonify({'error': f'Instrument {id} not found'}), 404

    # Fetch related history
    calibrations = [c.to_dict() for c in asset.calibration_events.order_by(db.desc('calibration_date')).all()]
    certificates = [c.to_dict() for c in asset.certificates.order_by(db.desc('issue_date')).all()]
    work_orders = [w.to_dict() for w in asset.work_orders.order_by(db.desc('created_date')).all()]
    usages = [u.to_dict() for u in asset.production_uses.order_by(db.desc('usage_timestamp')).limit(50).all()]
    alerts = [a.to_dict() for a in asset.alerts.order_by(db.desc('detection_timestamp')).all()]

    data = asset.to_dict()
    data['calibration_history'] = calibrations
    data['certificates'] = certificates
    data['work_orders'] = work_orders
    data['production_usage_history'] = usages
    data['alerts'] = alerts

    return jsonify(data)

@instrument_bp.route('', methods=['POST'])
def create_instrument():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'ADMIN')

    # Basic validations
    required_fields = ['name', 'instrument_type_id', 'manufacturer', 'model_number', 'serial_number', 'location', 'department']
    for rf in required_fields:
        if not payload.get(rf):
            return jsonify({'error': f"Missing required field: {rf}"}), 400

    # Validate unique serial number
    existing_serial = Asset.query.filter_by(serial_number=payload['serial_number'].strip()).first()
    if existing_serial:
        return jsonify({'error': f"Serial number '{payload['serial_number']}' already exists on asset {existing_serial.id}"}), 409

    # Generate deterministic ID: AST-000001 ...
    last_asset = Asset.query.order_by(Asset.id.desc()).first()
    if last_asset and last_asset.id.startswith('AST-'):
        try:
            curr_num = int(last_asset.id.split('-')[1])
            new_id = f"AST-{curr_num + 1:06d}"
        except Exception:
            count = Asset.query.count()
            new_id = f"AST-{count + 1:06d}"
    else:
        new_id = "AST-000001"

    itype = InstrumentType.query.get(payload['instrument_type_id'])
    if not itype:
        return jsonify({'error': 'Invalid instrument_type_id'}), 400

    interval = int(payload.get('calibration_interval', itype.default_interval_months or 6))
    interval_unit = payload.get('interval_unit', 'months')
    tol = float(payload.get('tolerance_limit', itype.default_tolerance or 0.05))

    inst_date_str = payload.get('installation_date', date.today().isoformat())
    installation_date = datetime.strptime(inst_date_str, '%Y-%m-%d').date()

    last_cal_str = payload.get('last_calibration_date')
    if last_cal_str:
        last_cal_date = datetime.strptime(last_cal_str, '%Y-%m-%d').date()
    else:
        last_cal_date = installation_date

    # Plan calculation for next due date
    next_due = calculate_next_due_date(last_cal_date, interval, interval_unit)

    asset = Asset(
        id=new_id,
        name=payload['name'].strip(),
        instrument_type_id=itype.id,
        manufacturer=payload['manufacturer'].strip(),
        model_number=payload['model_number'].strip(),
        serial_number=payload['serial_number'].strip(),
        description=payload.get('description', ''),
        location=payload['location'].strip(),
        department=payload['department'].strip(),
        criticality_level=payload.get('criticality_level', 'MEDIUM'),
        installation_date=installation_date,
        calibration_interval=interval,
        interval_unit=interval_unit,
        tolerance_limit=tol,
        last_calibration_date=last_cal_date,
        next_calibration_due_date=next_due,
        current_status='ACTIVE',
        supplier_id=payload.get('supplier_id'),
        calibration_plan_id=payload.get('calibration_plan_id'),
        created_at=datetime.utcnow()
    )
    db.session.add(asset)
    db.session.flush()

    record_audit(
        entity_type='ASSET',
        entity_id=asset.id,
        action='CREATE',
        previous_value=None,
        new_value=asset.to_dict(),
        user=user,
        reason="New instrument creation"
    )

    db.session.commit()
    return jsonify(asset.to_dict()), 201

@instrument_bp.route('/<id>', methods=['PUT'])
def update_instrument(id):
    asset = Asset.query.get(id)
    if not asset:
        return jsonify({'error': f'Instrument {id} not found'}), 404

    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'ADMIN')
    prev_state = asset.to_dict()

    if 'name' in payload:
        asset.name = payload['name']
    if 'location' in payload:
        asset.location = payload['location']
    if 'department' in payload:
        asset.department = payload['department']
    if 'criticality_level' in payload:
        asset.criticality_level = payload['criticality_level']
    if 'tolerance_limit' in payload:
        asset.tolerance_limit = float(payload['tolerance_limit'])
    if 'current_status' in payload:
        asset.current_status = payload['current_status']
    if 'supplier_id' in payload:
        asset.supplier_id = payload['supplier_id']
    if 'description' in payload:
        asset.description = payload['description']

    record_audit(
        entity_type='ASSET',
        entity_id=asset.id,
        action='UPDATE',
        previous_value=prev_state,
        new_value=asset.to_dict(),
        user=user,
        reason="Instrument update"
    )

    db.session.commit()
    return jsonify(asset.to_dict())

@instrument_bp.route('/types', methods=['GET'])
def get_instrument_types():
    types = InstrumentType.query.all()
    return jsonify([t.to_dict() for t in types])

@instrument_bp.route('/filters/metadata', methods=['GET'])
def get_filter_metadata():
    locations = [r[0] for r in db.session.query(Asset.location).distinct().all() if r[0]]
    departments = [r[0] for r in db.session.query(Asset.department).distinct().all() if r[0]]
    statuses = ['ACTIVE', 'OVERDUE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'RETIRED']
    criticalities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    types = [{'id': t.id, 'name': t.name} for t in InstrumentType.query.all()]
    suppliers = [{'id': s.id, 'name': s.name} for s in Supplier.query.filter_by(status='ACTIVE').all()]

    return jsonify({
        'locations': locations,
        'departments': departments,
        'statuses': statuses,
        'criticalities': criticalities,
        'types': types,
        'suppliers': suppliers
    })
