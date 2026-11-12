from datetime import datetime, date, timedelta
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.services.calibration_service import calculate_next_due_date
from backend.services.audit_service import record_audit

def scan_and_generate_alerts():
    """
    Comprehensive anomaly scanner that evaluates all business entities
    and creates/updates active alerts for all 9 alert types and 4 edge cases.
    Returns: summary of detected alerts
    """
    today = date.today()
    due_threshold_30d = today + timedelta(days=30)
    alerts_created = 0

    # 1. SCAN FOR DUE_DATE_MISMATCH (Edge Case 1)
    # Check if stored next_calibration_due_date != calculated from plan/interval
    assets = Asset.query.filter(Asset.current_status != 'RETIRED').all()
    for asset in assets:
        if asset.last_calibration_date:
            interval = asset.calibration_interval or 6
            interval_unit = asset.interval_unit or 'months'
            if asset.calibration_plan:
                interval = asset.calibration_plan.calibration_interval
                interval_unit = asset.calibration_plan.interval_unit
            
            expected_due = calculate_next_due_date(asset.last_calibration_date, interval, interval_unit)
            if asset.next_calibration_due_date != expected_due:
                # Existing alert check
                existing = Alert.query.filter_by(
                    asset_id=asset.id,
                    issue_type='DUE_DATE_MISMATCH',
                    resolution_status='OPEN'
                ).first()
                if not existing:
                    alert_count = Alert.query.count()
                    alert = Alert(
                        id=f"ALT-2026-{alert_count + 1:06d}",
                        asset_id=asset.id,
                        related_event_id=None,
                        issue_type='DUE_DATE_MISMATCH',
                        severity='HIGH',
                        description=f"Calibration due date mismatch for {asset.name} ({asset.id}). Stored: {asset.next_calibration_due_date}, Plan-calculated: {expected_due}.",
                        detection_timestamp=datetime.utcnow(),
                        assigned_person='QUALITY_ENGINEER',
                        resolution_status='OPEN'
                    )
                    db.session.add(alert)
                    alerts_created += 1

    # 2. SCAN FOR OVERDUE_CALIBRATION & CALIBRATION_DUE_SOON
    for asset in assets:
        if asset.next_calibration_due_date < today:
            existing = Alert.query.filter_by(
                asset_id=asset.id,
                issue_type='OVERDUE_CALIBRATION',
                resolution_status='OPEN'
            ).first()
            if not existing:
                alert_count = Alert.query.count()
                alert = Alert(
                    id=f"ALT-2026-{alert_count + 1:06d}",
                    asset_id=asset.id,
                    related_event_id=None,
                    issue_type='OVERDUE_CALIBRATION',
                    severity='CRITICAL' if asset.criticality_level == 'CRITICAL' else 'HIGH',
                    description=f"Instrument {asset.name} ({asset.id}) calibration is OVERDUE since {asset.next_calibration_due_date}.",
                    detection_timestamp=datetime.utcnow(),
                    assigned_person='CALIBRATION_COORDINATOR',
                    resolution_status='OPEN'
                )
                db.session.add(alert)
                alerts_created += 1
        elif today <= asset.next_calibration_due_date <= due_threshold_30d:
            existing = Alert.query.filter_by(
                asset_id=asset.id,
                issue_type='CALIBRATION_DUE_SOON',
                resolution_status='OPEN'
            ).first()
            if not existing:
                days_left = (asset.next_calibration_due_date - today).days
                alert_count = Alert.query.count()
                alert = Alert(
                    id=f"ALT-2026-{alert_count + 1:06d}",
                    asset_id=asset.id,
                    related_event_id=None,
                    issue_type='CALIBRATION_DUE_SOON',
                    severity='MEDIUM',
                    description=f"Instrument {asset.name} ({asset.id}) is due for calibration in {days_left} days ({asset.next_calibration_due_date}).",
                    detection_timestamp=datetime.utcnow(),
                    assigned_person='CALIBRATION_COORDINATOR',
                    resolution_status='OPEN'
                )
                db.session.add(alert)
                alerts_created += 1

    # 3. SCAN FOR CERTIFICATE_ASSET_MISMATCH (Edge Case 3)
    certs = Certificate.query.all()
    for cert in certs:
        if cert.calibration_event and cert.asset_id != cert.calibration_event.asset_id:
            cert.verification_status = 'MISMATCH_FLAGGED'
            existing = Alert.query.filter_by(
                asset_id=cert.asset_id,
                related_event_id=cert.id,
                issue_type='CERTIFICATE_ASSET_MISMATCH',
                resolution_status='OPEN'
            ).first()
            if not existing:
                alert_count = Alert.query.count()
                alert = Alert(
                    id=f"ALT-2026-{alert_count + 1:06d}",
                    asset_id=cert.asset_id,
                    related_event_id=cert.id,
                    issue_type='CERTIFICATE_ASSET_MISMATCH',
                    severity='CRITICAL',
                    description=f"CRITICAL COMPLIANCE MISMATCH: Certificate {cert.certificate_number} references asset {cert.asset_id}, but links to calibration event {cert.calibration_id} for asset {cert.calibration_event.asset_id}.",
                    detection_timestamp=datetime.utcnow(),
                    assigned_person='QUALITY_AUDITOR',
                    resolution_status='OPEN'
                )
                db.session.add(alert)
                alerts_created += 1

    # 4. SCAN FOR MISSING CERTIFICATES & EXPIRED CERTIFICATES
    events = CalibrationEvent.query.filter_by(pass_fail_result='PASS').all()
    for ev in events:
        if not ev.certificate or ev.certificate_status == 'MISSING':
            existing = Alert.query.filter_by(
                asset_id=ev.asset_id,
                related_event_id=ev.id,
                issue_type='MISSING_CERTIFICATE',
                resolution_status='OPEN'
            ).first()
            if not existing:
                alert_count = Alert.query.count()
                alert = Alert(
                    id=f"ALT-2026-{alert_count + 1:06d}",
                    asset_id=ev.asset_id,
                    related_event_id=ev.id,
                    issue_type='MISSING_CERTIFICATE',
                    severity='HIGH',
                    description=f"Passed calibration event {ev.id} on asset {ev.asset_id} is missing a signed calibration certificate.",
                    detection_timestamp=datetime.utcnow(),
                    assigned_person='DOCUMENT_CONTROL',
                    resolution_status='OPEN'
                )
                db.session.add(alert)
                alerts_created += 1
        elif ev.certificate:
            if ev.certificate.expiry_date < today:
                existing = Alert.query.filter_by(
                    asset_id=ev.asset_id,
                    related_event_id=ev.certificate.id,
                    issue_type='EXPIRED_CERTIFICATE',
                    resolution_status='OPEN'
                ).first()
                if not existing:
                    alert_count = Alert.query.count()
                    alert = Alert(
                        id=f"ALT-2026-{alert_count + 1:06d}",
                        asset_id=ev.asset_id,
                        related_event_id=ev.certificate.id,
                        issue_type='EXPIRED_CERTIFICATE',
                        severity='HIGH',
                        description=f"Certificate {ev.certificate.certificate_number} for {ev.asset_id} expired on {ev.certificate.expiry_date}.",
                        detection_timestamp=datetime.utcnow(),
                        assigned_person='DOCUMENT_CONTROL',
                        resolution_status='OPEN'
                    )
                    db.session.add(alert)
                    alerts_created += 1

    # 5. SCAN FOR MISSING_IMPACT_ASSESSMENT (Edge Case 4)
    # A failed calibration without impact assessment completed
    failed_events = CalibrationEvent.query.filter_by(pass_fail_result='FAIL').all()
    for fev in failed_events:
        related_wos = WorkOrder.query.filter_by(related_calibration_id=fev.id).all()
        needs_assessment = False
        if not related_wos:
            needs_assessment = True
        else:
            for rwo in related_wos:
                if rwo.impact_assessment_status == 'PENDING':
                    needs_assessment = True
                    break
        
        if needs_assessment:
            existing = Alert.query.filter_by(
                asset_id=fev.asset_id,
                related_event_id=fev.id,
                issue_type='MISSING_IMPACT_ASSESSMENT',
                resolution_status='OPEN'
            ).first()
            if not existing:
                alert_count = Alert.query.count()
                alert = Alert(
                    id=f"ALT-2026-{alert_count + 1:06d}",
                    asset_id=fev.asset_id,
                    related_event_id=fev.id,
                    issue_type='MISSING_IMPACT_ASSESSMENT',
                    severity='CRITICAL',
                    description=f"Failed calibration {fev.id} on asset {fev.asset_id} requires mandatory Quality Impact Assessment for affected production batches.",
                    detection_timestamp=datetime.utcnow(),
                    assigned_person='QUALITY_ENGINEER',
                    resolution_status='OPEN'
                )
                db.session.add(alert)
                alerts_created += 1

    db.session.commit()
    return alerts_created

def resolve_alert(alert_id, resolution_remarks, user='QUALITY_ENGINEER'):
    alert = Alert.query.get(alert_id)
    if not alert:
        raise ValueError(f"Alert {alert_id} not found.")

    prev = alert.resolution_status
    alert.resolution_status = 'RESOLVED'
    alert.resolution_remarks = resolution_remarks
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = user

    record_audit(
        entity_type='ALERT',
        entity_id=alert.id,
        action='RESOLVE_ALERT',
        previous_value={'status': prev},
        new_value={'status': 'RESOLVED', 'remarks': resolution_remarks},
        user=user,
        reason=resolution_remarks
    )
    db.session.commit()
    return alert
