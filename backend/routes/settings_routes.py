from flask import Blueprint, request, jsonify, current_app
from backend.services.data_generator import generate_synthetic_data, FIXED_SEED
from backend.services.alert_service import scan_and_generate_alerts
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.production_use import ProductionUse

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('', methods=['GET'])
def get_settings():
    db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
    masked_uri = db_uri
    if '@' in db_uri:
        prefix, rest = db_uri.split('@', 1)
        scheme = prefix.split('://')[0]
        masked_uri = f"{scheme}://***:***@{rest}"

    return jsonify({
        'system_name': 'SmartCal – Industrial Calibration & Instrument Management System',
        'version': '2.4.0-ENTERPRISE',
        'database_uri': masked_uri,
        'database_engine': 'MySQL / MariaDB Relational Engine',
        'default_seed': FIXED_SEED,
        'roles_available': [
            {'role': 'PLANT_OPERATOR', 'label': 'Plant Operator', 'permissions': ['View Instruments', 'Record Production Usage']},
            {'role': 'QUALITY_ENGINEER', 'label': 'Quality Engineer', 'permissions': ['Manage Plans', 'Execute Calibration', 'Manage Certificates', 'Resolve Alerts', 'Impact Assessment']},
            {'role': 'PRODUCTION_PLANNER', 'label': 'Production Planner', 'permissions': ['View Schedules', 'Track Downtime', 'Manage Work Orders']},
            {'role': 'ADMIN', 'label': 'System Administrator', 'permissions': ['Full System Administration', 'Policy Configuration', 'Data Generation & Reseed']}
        ],
        'current_counts': {
            'instruments': Asset.query.count(),
            'calibrations': CalibrationEvent.query.count(),
            'production_usages': ProductionUse.query.count(),
        }
    })

@settings_bp.route('/reseed', methods=['POST'])
def reseed_database():
    payload = request.get_json() or {}
    scale = payload.get('scale', 'starter').lower() # starter or full
    seed = payload.get('seed', FIXED_SEED)
    try:
        seed = int(seed)
    except Exception:
        seed = FIXED_SEED

    if scale not in ('starter', 'full'):
        scale = 'starter'

    try:
        summary = generate_synthetic_data(scale=scale, seed=seed)
        return jsonify({
            'message': f"Synthetic data generation completed ({scale} scale, seed {seed}).",
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': f"Failed generating synthetic data: {str(e)}"}), 500
