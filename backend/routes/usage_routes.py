from flask import Blueprint, request, jsonify
from backend.models.production_use import ProductionUse
from backend.services.usage_service import validate_production_usage, record_production_usage

usage_bp = Blueprint('usage', __name__)

@usage_bp.route('', methods=['GET'])
def get_production_usages():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '', type=str).strip()
    decision = request.args.get('decision', '', type=str).strip() # ALLOWED, BLOCKED, ALLOWED_WITH_EXCEPTION
    asset_id = request.args.get('asset_id', '', type=str).strip()
    batch_id = request.args.get('batch_id', '', type=str).strip()
    line = request.args.get('line', '', type=str).strip()

    query = ProductionUse.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (ProductionUse.id.ilike(search_filter)) |
            (ProductionUse.asset_id.ilike(search_filter)) |
            (ProductionUse.production_batch_id.ilike(search_filter)) |
            (ProductionUse.operator.ilike(search_filter))
        )

    if decision:
        query = query.filter(ProductionUse.usage_decision == decision)
    if asset_id:
        query = query.filter(ProductionUse.asset_id == asset_id)
    if batch_id:
        query = query.filter(ProductionUse.production_batch_id.ilike(f"%{batch_id}%"))
    if line:
        query = query.filter(ProductionUse.production_line.ilike(f"%{line}%"))

    query = query.order_by(ProductionUse.usage_timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'usages': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    })

@usage_bp.route('/validate', methods=['POST'])
def validate_usage_check():
    """
    Pre-flight safety check without persisting record.
    """
    payload = request.get_json() or {}
    asset_id = payload.get('asset_id')
    usage_time = payload.get('usage_timestamp')
    exc_id = payload.get('exception_approval_id')

    if not asset_id:
        return jsonify({'error': 'asset_id is required'}), 400

    decision, cal_status, issue_type, reason = validate_production_usage(asset_id, usage_time, exc_id)
    return jsonify({
        'asset_id': asset_id,
        'usage_decision': decision,
        'calibration_status_at_usage': cal_status,
        'issue_type': issue_type,
        'reason': reason,
        'is_safe_to_use': decision in ('ALLOWED', 'ALLOWED_WITH_EXCEPTION')
    })

@usage_bp.route('', methods=['POST'])
def record_usage():
    payload = request.get_json() or {}
    user = request.headers.get('X-User-Role', 'PLANT_OPERATOR')

    required = ['asset_id', 'production_batch_id', 'production_line', 'operator']
    for r in required:
        if not payload.get(r):
            return jsonify({'error': f"Missing required field: {r}"}), 400

    try:
        usage, decision, reason = record_production_usage(
            asset_id=payload['asset_id'],
            batch_id=payload['production_batch_id'],
            line=payload['production_line'],
            operator=payload['operator'],
            usage_timestamp=payload.get('usage_timestamp'),
            exception_approval_id=payload.get('exception_approval_id'),
            notes=payload.get('notes'),
            user=user
        )

        status_code = 201 if decision != 'BLOCKED' else 403
        return jsonify({
            'usage_event': usage.to_dict(),
            'decision': decision,
            'reason': reason,
            'message': f"Production usage recorded with decision: {decision}"
        }), status_code

    except Exception as e:
        return jsonify({'error': f"Error recording production usage: {str(e)}"}), 500
