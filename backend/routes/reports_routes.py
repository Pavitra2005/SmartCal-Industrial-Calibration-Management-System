from datetime import datetime, date
from flask import Blueprint, request, jsonify, Response
from backend.services.export_service import export_entity_to_csv, export_database_to_sql
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/summary', methods=['GET'])
def get_reports_summary():
    total_assets = Asset.query.count()
    active_assets = Asset.query.filter_by(current_status='ACTIVE').count()
    total_cals = CalibrationEvent.query.count()
    passed_cals = CalibrationEvent.query.filter_by(pass_fail_result='PASS').count()
    total_certs = Certificate.query.count()
    verified_certs = Certificate.query.filter_by(verification_status='VERIFIED').count()
    total_wos = WorkOrder.query.count()
    completed_wos = WorkOrder.query.filter_by(status='COMPLETED').count()
    total_usages = ProductionUse.query.count()
    blocked_usages = ProductionUse.query.filter_by(usage_decision='BLOCKED').count()

    pass_rate = round((passed_cals / total_cals * 100), 2) if total_cals > 0 else 0
    cert_compliance = round((verified_certs / total_certs * 100), 2) if total_certs > 0 else 0
    wo_resolution_rate = round((completed_wos / total_wos * 100), 2) if total_wos > 0 else 0

    return jsonify({
        'instruments': {
            'total': total_assets,
            'active': active_assets,
            'utilization_rate': round(active_assets / total_assets * 100, 2) if total_assets > 0 else 0
        },
        'calibration_quality': {
            'total_events': total_cals,
            'passed': passed_cals,
            'failed': total_cals - passed_cals,
            'pass_rate': pass_rate
        },
        'certificates': {
            'total_issued': total_certs,
            'verified': verified_certs,
            'compliance_rate': cert_compliance
        },
        'maintenance_work_orders': {
            'total_work_orders': total_wos,
            'completed': completed_wos,
            'resolution_rate': wo_resolution_rate
        },
        'production_safety': {
            'total_usage_checks': total_usages,
            'blocked_unsafe_attempts': blocked_usages,
            'block_rate': round(blocked_usages / total_usages * 100, 2) if total_usages > 0 else 0
        }
    })

@reports_bp.route('/export/csv', methods=['GET'])
def export_csv_endpoint():
    entity = request.args.get('entity', 'instruments').strip().lower()
    try:
        csv_data = export_entity_to_csv(entity)
        today_str = date.today().isoformat()
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment;filename=smartcal_{entity}_{today_str}.csv"}
        )
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400

@reports_bp.route('/export/sql', methods=['GET'])
def export_sql_endpoint():
    sql_data = export_database_to_sql()
    today_str = date.today().isoformat()
    return Response(
        sql_data,
        mimetype="application/sql",
        headers={"Content-Disposition": f"attachment;filename=smartcal_seed_{today_str}.sql"}
    )
