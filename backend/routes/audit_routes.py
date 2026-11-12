from flask import Blueprint, request, jsonify
from backend.models.audit_record import AuditRecord

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('', methods=['GET'])
def get_audit_trail():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    entity_type = request.args.get('entity_type', '', type=str).strip()
    entity_id = request.args.get('entity_id', '', type=str).strip()
    action = request.args.get('action', '', type=str).strip()
    user = request.args.get('user', '', type=str).strip()

    query = AuditRecord.query

    if entity_type:
        query = query.filter(AuditRecord.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditRecord.entity_id.ilike(f"%{entity_id}%"))
    if action:
        query = query.filter(AuditRecord.action == action)
    if user:
        query = query.filter(AuditRecord.user.ilike(f"%{user}%"))

    query = query.order_by(AuditRecord.timestamp.desc(), AuditRecord.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'audit_records': [a.to_dict() for a in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    })
