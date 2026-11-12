from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.calibration_plan import CalibrationPlan
from backend.models.work_order import WorkOrder
from backend.models.alert import Alert
from backend.services.audit_service import record_audit

def calculate_next_due_date(base_date, interval, interval_unit='months'):
    """
    Deterministically calculate next due date based on calibration plan interval.
    Example: 2026-01-10 + 6 months -> 2026-07-10
    """
    if isinstance(base_date, str):
        base_date = datetime.strptime(base_date, '%Y-%m-%d').date()
    elif isinstance(base_date, datetime):
        base_date = base_date.date()

    interval = int(interval)
    unit = interval_unit.lower()

    if 'day' in unit:
        return base_date + relativedelta(days=interval)
    elif 'month' in unit:
        return base_date + relativedelta(months=interval)
    elif 'year' in unit:
        return base_date + relativedelta(years=interval)
    else:
        return base_date + relativedelta(months=interval)

def execute_calibration(asset_id, calibration_date, technician, supplier_id, reference_standard, 
                        measured_value, expected_value, tolerance=None, remarks='', user='QUALITY_ENGINEER'):
    """
    Executes a calibration event, performs tolerance check, records event, 
    and triggers corrective workflow if failed.
    """
    asset = Asset.query.get(asset_id)
    if not asset:
        raise ValueError(f"Asset with ID {asset_id} not found.")

    if isinstance(calibration_date, str):
        cal_date = datetime.strptime(calibration_date, '%Y-%m-%d').date()
    else:
        cal_date = calibration_date

    # Determine tolerance
    if tolerance is None:
        tolerance = asset.tolerance_limit if asset.tolerance_limit else 0.05
    tolerance = float(tolerance)
    measured_val = float(measured_value)
    expected_val = float(expected_value)

    # Error calculation
    measurement_error = round(measured_val - expected_val, 5)
    abs_error = abs(measurement_error)

    # Documented pass/fail evaluation rule
    is_pass = abs_error <= tolerance
    result = 'PASS' if is_pass else 'FAIL'

    # Next due date calculation
    interval = asset.calibration_interval or 6
    interval_unit = asset.interval_unit or 'months'
    if asset.calibration_plan:
        interval = asset.calibration_plan.calibration_interval
        interval_unit = asset.calibration_plan.interval_unit

    next_due = calculate_next_due_date(cal_date, interval, interval_unit)

    # Generate calibration ID: CAL-<asset-id>-2026-000001
    existing_count = CalibrationEvent.query.filter_by(asset_id=asset.id).count()
    event_id = f"CAL-{asset.id}-2026-{existing_count + 1:06d}"

    event = CalibrationEvent(
        id=event_id,
        asset_id=asset.id,
        calibration_date=cal_date,
        technician=technician,
        supplier_id=supplier_id or asset.supplier_id,
        reference_standard=reference_standard,
        measured_value=measured_val,
        expected_value=expected_val,
        measurement_error=measurement_error,
        tolerance=tolerance,
        pass_fail_result=result,
        calibration_remarks=remarks,
        certificate_status='PENDING_APPROVAL' if result == 'PASS' else 'MISSING',
        next_calibration_due_date=next_due,
        created_at=datetime.utcnow()
    )
    db.session.add(event)

    prev_asset_state = {
        'current_status': asset.current_status,
        'last_calibration_date': asset.last_calibration_date.isoformat() if asset.last_calibration_date else None,
        'next_calibration_due_date': asset.next_calibration_due_date.isoformat() if asset.next_calibration_due_date else None,
    }

    corrective_wo = None
    if result == 'PASS':
        asset.last_calibration_date = cal_date
        asset.next_calibration_due_date = next_due
        asset.current_status = 'ACTIVE'
    else:
        # FAILED CALIBRATION WORKFLOW
        # 1. Mark instrument unavailable for normal use according to policy
        asset.current_status = 'OUT_OF_SERVICE'
        asset.last_calibration_date = cal_date
        
        # 2. Automatically create a corrective work order
        wo_count = WorkOrder.query.count()
        wo_id = f"WO-2026-{wo_count + 1:06d}"
        corrective_wo = WorkOrder(
            id=wo_id,
            asset_id=asset.id,
            related_calibration_id=event.id,
            work_order_type='CORRECTIVE_CALIBRATION',
            priority='CRITICAL' if asset.criticality_level == 'CRITICAL' else 'HIGH',
            description=f"Automated Corrective Work Order: Calibration failure on {asset.name} ({asset.id}). Measured error {measurement_error} exceeds tolerance ±{tolerance}.",
            assigned_technician=technician,
            created_date=cal_date,
            planned_start_date=cal_date,
            status='OPEN',
            downtime_hours=0.0,
            impact_assessment_status='PENDING',
            impact_assessment_notes='Pending engineering review of production lots measured with this tool.',
            responsible_engineer=user,
            created_at=datetime.utcnow()
        )
        db.session.add(corrective_wo)

        # 3. Create Alert
        alert_count = Alert.query.count()
        alert_id = f"ALT-2026-{alert_count + 1:06d}"
        fail_alert = Alert(
            id=alert_id,
            asset_id=asset.id,
            related_event_id=event.id,
            issue_type='FAILED_CALIBRATION',
            severity='CRITICAL' if asset.criticality_level == 'CRITICAL' else 'HIGH',
            description=f"Calibration failed for {asset.name} ({asset.id}). Measured error {measurement_error} exceeds tolerance {tolerance}. Instrument locked OUT_OF_SERVICE.",
            detection_timestamp=datetime.utcnow(),
            assigned_person=user,
            resolution_status='OPEN'
        )
        db.session.add(fail_alert)

    db.session.flush()

    # Record audit trail
    record_audit(
        entity_type='CALIBRATION',
        entity_id=event.id,
        action='CALIBRATE',
        previous_value=prev_asset_state,
        new_value={
            'pass_fail': result,
            'measurement_error': measurement_error,
            'next_due': next_due.isoformat(),
            'asset_status': asset.current_status,
            'work_order_created': corrective_wo.id if corrective_wo else None
        },
        user=user,
        reason=f"Calibration execution: {result}"
    )

    db.session.commit()
    return event, corrective_wo
