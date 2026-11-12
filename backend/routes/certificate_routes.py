import os
from datetime import datetime, date
from flask import Blueprint, request, jsonify, send_file, current_app
from backend.database import db
from backend.models.certificate import Certificate
from backend.models.calibration_event import CalibrationEvent
from backend.models.asset import Asset
from backend.models.alert import Alert
from backend.services.audit_service import record_audit

certificate_bp = Blueprint('certificates', __name__)

@certificate_bp.route('', methods=['GET'])
def get_certificates():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()
    status = request.args.get('status', '', type=str).strip() # valid, expired, missing, pending, mismatch
    asset_id = request.args.get('asset_id', '', type=str).strip()

    today = date.today()
    query = Certificate.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Certificate.id.ilike(search_filter)) |
            (Certificate.certificate_number.ilike(search_filter)) |
            (Certificate.asset_id.ilike(search_filter)) |
            (Certificate.calibration_id.ilike(search_filter))
        )

    if asset_id:
        query = query.filter(Certificate.asset_id == asset_id)

    if status == 'valid':
        query = query.filter(Certificate.expiry_date >= today, Certificate.verification_status == 'VERIFIED', Certificate.approval_status == 'APPROVED')
    elif status == 'expired':
        query = query.filter(Certificate.expiry_date < today)
    elif status == 'pending':
        query = query.filter(Certificate.approval_status == 'PENDING')
    elif status == 'mismatch':
        query = query.filter(Certificate.verification_status == 'MISMATCH_FLAGGED')

    query = query.order_by(Certificate.issue_date.desc(), Certificate.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Missing certificates count
    missing_count = CalibrationEvent.query.filter(
        CalibrationEvent.pass_fail_result == 'PASS',
        CalibrationEvent.certificate_status == 'MISSING'
    ).count()

    return jsonify({
        'certificates': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'missing_certificates_count': missing_count
    })

@certificate_bp.route('/<id>', methods=['GET'])
def get_certificate_detail(id):
    cert = Certificate.query.get(id)
    if not cert:
        return jsonify({'error': f'Certificate {id} not found'}), 404

    data = cert.to_dict()
    data['calibration_details'] = cert.calibration_event.to_dict() if cert.calibration_event else None
    data['asset_details'] = cert.asset.to_dict() if cert.asset else None
    return jsonify(data)

@certificate_bp.route('/verify/<id>', methods=['POST'])
def verify_certificate(id):
    cert = Certificate.query.get(id)
    if not cert:
        return jsonify({'error': f'Certificate {id} not found'}), 404

    event = cert.calibration_event
    today = date.today()
    issues = []

    # Check 1: Event link exists
    if not event:
        issues.append("Certificate is not linked to any valid Calibration Event.")

    # Check 2: Asset reference mismatch (Edge Case 3)
    if event and cert.asset_id != event.asset_id:
        cert.verification_status = 'MISMATCH_FLAGGED'
        issues.append(f"CRITICAL MISMATCH: Certificate asset {cert.asset_id} differs from Calibration Event asset {event.asset_id}.")
        # Ensure Alert is created
        existing_alert = Alert.query.filter_by(related_event_id=cert.id, issue_type='CERTIFICATE_ASSET_MISMATCH').first()
        if not existing_alert:
            alert_count = Alert.query.count()
            alert = Alert(
                id=f"ALT-2026-{alert_count + 1:06d}",
                asset_id=cert.asset_id,
                related_event_id=cert.id,
                issue_type='CERTIFICATE_ASSET_MISMATCH',
                severity='CRITICAL',
                description=f"Compliance Violation: Certificate {cert.certificate_number} references {cert.asset_id} but event belongs to {event.asset_id}.",
                detection_timestamp=datetime.utcnow(),
                assigned_person='QUALITY_AUDITOR',
                resolution_status='OPEN'
            )
            db.session.add(alert)
    
    # Check 3: Expiry
    if cert.expiry_date < today:
        issues.append(f"Certificate expired on {cert.expiry_date}.")

    if not issues:
        cert.verification_status = 'VERIFIED'
        result_msg = "Certificate verified successfully against calibration records and asset registry."
    else:
        result_msg = "; ".join(issues)

    db.session.commit()
    return jsonify({
        'certificate': cert.to_dict(),
        'verification_status': cert.verification_status,
        'issues': issues,
        'message': result_msg
    })

@certificate_bp.route('/upload', methods=['POST'])
def upload_certificate():
    """
    Handles PDF certificate upload and creates certificate record.
    """
    user = request.headers.get('X-User-Role', 'QUALITY_ENGINEER')
    
    # Check if multipart form or JSON
    if request.is_json:
        data = request.get_json()
        cal_id = data.get('calibration_id')
        asset_id = data.get('asset_id')
        cert_num = data.get('certificate_number')
        issue_date_str = data.get('issue_date', date.today().isoformat())
        expiry_date_str = data.get('expiry_date')
        filename = f"{cert_num or 'CERT'}.pdf"
    else:
        cal_id = request.form.get('calibration_id')
        asset_id = request.form.get('asset_id')
        cert_num = request.form.get('certificate_number')
        issue_date_str = request.form.get('issue_date', date.today().isoformat())
        expiry_date_str = request.form.get('expiry_date')
        file = request.files.get('file')
        filename = file.filename if file else f"{cert_num or 'CERT'}.pdf"

    if not cal_id or not asset_id or not cert_num:
        return jsonify({'error': 'calibration_id, asset_id, and certificate_number are required.'}), 400

    cal_event = CalibrationEvent.query.get(cal_id)
    if not cal_event:
        return jsonify({'error': f'Calibration event {cal_id} not found.'}), 404

    issue_d = datetime.strptime(issue_date_str, '%Y-%m-%d').date()
    if expiry_date_str:
        expiry_d = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
    else:
        expiry_d = cal_event.next_calibration_due_date

    # Validate asset matching
    status = 'VERIFIED'
    if asset_id != cal_event.asset_id:
        status = 'MISMATCH_FLAGGED'

    cert_id = f"CERT-{cal_event.id}"
    existing = Certificate.query.get(cert_id)
    if existing:
        return jsonify({'error': f'Certificate for event {cal_id} already exists.'}), 409

    cert = Certificate(
        id=cert_id,
        calibration_id=cal_event.id,
        asset_id=asset_id,
        certificate_number=cert_num,
        issue_date=issue_d,
        expiry_date=expiry_d,
        supplier_id=cal_event.supplier_id,
        approval_status='APPROVED',
        document_location=f"uploads/certificates/{filename}",
        file_size_kb=150,
        verification_status=status,
        created_at=datetime.utcnow()
    )
    db.session.add(cert)
    
    cal_event.certificate_status = 'VALID' if status == 'VERIFIED' else 'MISMATCH'

    record_audit(
        entity_type='CERTIFICATE',
        entity_id=cert.id,
        action='CREATE',
        previous_value=None,
        new_value=cert.to_dict(),
        user=user,
        reason=f"Uploaded calibration certificate {cert_num}"
    )

    db.session.commit()
    return jsonify(cert.to_dict()), 201

@certificate_bp.route('/<id>/download', methods=['GET'])
def download_certificate(id):
    cert = Certificate.query.get(id)
    if not cert:
        return jsonify({'error': f'Certificate {id} not found'}), 404

    # Return structured certificate data or SVG representation for the browser to view/print
    return jsonify({
        'certificate': cert.to_dict(),
        'calibration_event': cert.calibration_event.to_dict() if cert.calibration_event else None,
        'asset': cert.asset.to_dict() if cert.asset else None,
        'download_url': f"/api/certificates/{id}/raw",
        'ready_to_print': True
    })
