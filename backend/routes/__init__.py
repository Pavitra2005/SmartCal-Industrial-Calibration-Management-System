from backend.routes.dashboard_routes import dashboard_bp
from backend.routes.instrument_routes import instrument_bp
from backend.routes.schedule_routes import schedule_bp
from backend.routes.calibration_routes import calibration_bp
from backend.routes.certificate_routes import certificate_bp
from backend.routes.work_order_routes import work_order_bp
from backend.routes.usage_routes import usage_bp
from backend.routes.alert_routes import alert_bp
from backend.routes.supplier_routes import supplier_bp
from backend.routes.audit_routes import audit_bp
from backend.routes.reports_routes import reports_bp
from backend.routes.validation_routes import validation_bp
from backend.routes.evaluation_routes import evaluation_bp
from backend.routes.settings_routes import settings_bp

def register_routes(app):
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(instrument_bp, url_prefix='/api/instruments')
    app.register_blueprint(schedule_bp, url_prefix='/api/schedule')
    app.register_blueprint(calibration_bp, url_prefix='/api/calibrations')
    app.register_blueprint(certificate_bp, url_prefix='/api/certificates')
    app.register_blueprint(work_order_bp, url_prefix='/api/work-orders')
    app.register_blueprint(usage_bp, url_prefix='/api/usage')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(supplier_bp, url_prefix='/api/suppliers')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(validation_bp, url_prefix='/api/validation')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluation')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
