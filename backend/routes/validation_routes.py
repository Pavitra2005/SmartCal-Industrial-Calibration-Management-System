import io
import csv
import json
from datetime import datetime, date
from flask import Blueprint, jsonify, Response, request
from backend.services.validation_service import run_database_validation

validation_bp = Blueprint('validation', __name__)

@validation_bp.route('', methods=['GET'])
def get_validation_report():
    report = run_database_validation()
    return jsonify(report)

@validation_bp.route('/export', methods=['GET'])
def export_validation_report():
    fmt = request.args.get('format', 'json').lower()
    report = run_database_validation()

    if fmt == 'csv':
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=['code', 'name', 'category', 'passed', 'severity', 'affected_count', 'message'])
        writer.writeheader()
        for c in report['checks']:
            writer.writerow(c)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment;filename=smartcal_validation_report_{date.today().isoformat()}.csv"}
        )
    else:
        return Response(
            json.dumps(report, indent=2),
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment;filename=smartcal_validation_report_{date.today().isoformat()}.json"}
        )
