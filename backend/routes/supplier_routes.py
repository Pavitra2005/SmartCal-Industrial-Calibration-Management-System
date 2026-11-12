from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.supplier import Supplier
from backend.services.audit_service import record_audit

supplier_bp = Blueprint('suppliers', __name__)

@supplier_bp.route('', methods=['GET'])
def get_suppliers():
    status = request.args.get('status', '', type=str).strip()
    query = Supplier.query
    if status:
        query = query.filter_by(status=status)
    suppliers = query.order_by(Supplier.name.asc()).all()
    return jsonify([s.to_dict() for s in suppliers])

@supplier_bp.route('/<id>', methods=['GET'])
def get_supplier_detail(id):
    s = Supplier.query.get(id)
    if not s:
        return jsonify({'error': f'Supplier {id} not found'}), 404

    data = s.to_dict()
    events = [e.to_dict() for e in s.calibration_events.order_by(db.desc('calibration_date')).limit(50).all()]
    data['associated_calibration_events'] = events
    return jsonify(data)

@supplier_bp.route('', methods=['POST'])
def create_supplier():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'ADMIN')

    name = payload.get('name')
    if not name:
        return jsonify({'error': 'Supplier name is required'}), 400

    count = Supplier.query.count()
    sup_id = f"SUP-{count + 1:04d}"

    s = Supplier(
        id=sup_id,
        name=name.strip(),
        contact_name=payload.get('contact_name'),
        contact_email=payload.get('contact_email'),
        contact_phone=payload.get('contact_phone'),
        calibration_services=payload.get('calibration_services'),
        accreditation_details=payload.get('accreditation_details'),
        address=payload.get('address'),
        status=payload.get('status', 'ACTIVE'),
        created_at=datetime.utcnow()
    )
    db.session.add(s)
    db.session.flush()

    record_audit(
        entity_type='SUPPLIER',
        entity_id=s.id,
        action='CREATE',
        previous_value=None,
        new_value=s.to_dict(),
        user=user,
        reason="Added calibration service vendor"
    )

    db.session.commit()
    return jsonify(s.to_dict()), 201

@supplier_bp.route('/<id>', methods=['PUT'])
def update_supplier(id):
    s = Supplier.query.get(id)
    if not s:
        return jsonify({'error': f'Supplier {id} not found'}), 404

    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'ADMIN')
    prev = s.to_dict()

    for k in ['name', 'contact_name', 'contact_email', 'contact_phone', 'calibration_services', 'accreditation_details', 'address', 'status']:
        if k in payload:
            setattr(s, k, payload[k])

    record_audit(
        entity_type='SUPPLIER',
        entity_id=s.id,
        action='UPDATE',
        previous_value=prev,
        new_value=s.to_dict(),
        user=user,
        reason="Updated vendor profile"
    )

    db.session.commit()
    return jsonify(s.to_dict())
