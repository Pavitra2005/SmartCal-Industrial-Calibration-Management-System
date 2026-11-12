from datetime import datetime, date
from backend.database import db
from backend.models.asset import Asset
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.services.audit_service import record_audit

def validate_production_usage(asset_id, usage_timestamp=None, exception_approval_id=None):
    """
    Validates instrument calibration and readiness before allowing production usage.
    Returns: (decision, calibration_status_at_usage, issue_type, reason)
    decision: 'ALLOWED', 'BLOCKED', 'ALLOWED_WITH_EXCEPTION'
    """
    asset = Asset.query.get(asset_id)
    if not asset:
        return 'BLOCKED', 'UNKNOWN', 'INVALID_ASSET', f"Asset ID {asset_id} does not exist."

    if usage_timestamp is None:
        usage_time = datetime.utcnow()
    elif isinstance(usage_timestamp, str):
        try:
            usage_time = datetime.fromisoformat(usage_timestamp.replace('Z', '+00:00'))
        except Exception:
            usage_time = datetime.strptime(usage_timestamp, '%Y-%m-%d %H:%M:%S')
    else:
        usage_time = usage_timestamp

    usage_date = usage_time.date() if isinstance(usage_time, datetime) else usage_time

    # 1. Check if instrument has ever been calibrated
    if not asset.last_calibration_date:
        if exception_approval_id:
            return 'ALLOWED_WITH_EXCEPTION', 'UNAVAILABLE', 'NONE', "Never calibrated, but approved exception provided."
        return 'BLOCKED', 'UNAVAILABLE', 'UNCALIBRATED_ASSET', "Instrument has never been calibrated."

    # 2. Check if instrument has failed calibration / out of service
    if asset.current_status in ('OUT_OF_SERVICE', 'UNDER_MAINTENANCE'):
        if exception_approval_id:
            return 'ALLOWED_WITH_EXCEPTION', 'FAILED', 'NONE', f"Instrument is {asset.current_status}, but authorized exception {exception_approval_id} provided."
        return 'BLOCKED', 'FAILED', 'FAILED_CALIBRATION_USAGE', f"Instrument status is {asset.current_status}. Normal production usage is strictly prohibited."

    # 3. Check if calibration has expired at the usage timestamp
    is_overdue = usage_date > asset.next_calibration_due_date
    if is_overdue:
        if exception_approval_id:
            return 'ALLOWED_WITH_EXCEPTION', 'OVERDUE', 'NONE', f"Calibration overdue since {asset.next_calibration_due_date}, authorized with exception {exception_approval_id}."
        return 'BLOCKED', 'OVERDUE', 'EXPIRED_USAGE', f"Calibration expired on {asset.next_calibration_due_date}. Usage attempt at {usage_time} is overdue."

    # 4. Check if instrument status is not active
    if asset.current_status != 'ACTIVE':
        if exception_approval_id:
            return 'ALLOWED_WITH_EXCEPTION', asset.current_status, 'NONE', f"Asset status {asset.current_status}, approved with exception {exception_approval_id}."
        return 'BLOCKED', asset.current_status, 'INACTIVE_STATUS', f"Instrument status is {asset.current_status}."

    # All validations passed
    return 'ALLOWED', 'CALIBRATED', 'NONE', "Instrument is active and calibration is valid."


def record_production_usage(asset_id, batch_id, line, operator, usage_timestamp=None, 
                             exception_approval_id=None, notes=None, user='PLANT_OPERATOR'):
    """
    Validates and persists a production usage event.
    Blocked attempts are stored and trigger audit/alert events.
    """
    if usage_timestamp is None:
        usage_time = datetime.utcnow()
    elif isinstance(usage_timestamp, str):
        try:
            usage_time = datetime.fromisoformat(usage_timestamp.replace('Z', '+00:00'))
        except Exception:
            usage_time = datetime.strptime(usage_timestamp, '%Y-%m-%d %H:%M:%S')
    else:
        usage_time = usage_timestamp

    decision, cal_status, issue_type, reason = validate_production_usage(asset_id, usage_time, exception_approval_id)

    # Generate deterministic usage ID: USE-<asset-id>-<epoch_timestamp>
    epoch_sec = int(usage_time.timestamp())
    usage_id = f"USE-{asset_id}-{epoch_sec}"

    # Ensure uniqueness in case of same second usage
    dup = ProductionUse.query.get(usage_id)
    if dup:
        usage_id = f"{usage_id}-{int(datetime.utcnow().microsecond / 1000)}"

    usage = ProductionUse(
        id=usage_id,
        asset_id=asset_id,
        production_batch_id=batch_id,
        production_line=line,
        operator=operator,
        usage_timestamp=usage_time,
        calibration_status_at_usage=cal_status,
        exception_approval_id=exception_approval_id,
        usage_decision=decision,
        issue_type=issue_type if issue_type != 'NONE' else None,
        notes=f"{notes or ''} [Validation: {reason}]".strip()
    )
    db.session.add(usage)

    # If usage is blocked or had an expired usage attempt, record alert
    if decision == 'BLOCKED' or issue_type == 'EXPIRED_USAGE':
        alert_count = Alert.query.count()
        alert_id = f"ALT-2026-{alert_count + 1:06d}"
        alert = Alert(
            id=alert_id,
            asset_id=asset_id,
            related_event_id=usage.id,
            issue_type=issue_type if issue_type in ['EXPIRED_USAGE', 'FAILED_CALIBRATION_USAGE'] else 'EXPIRED_USAGE',
            severity='CRITICAL' if decision == 'BLOCKED' else 'HIGH',
            description=f"Production Usage Violation on Line {line} for Batch {batch_id}. Decision: {decision}. Reason: {reason}",
            detection_timestamp=datetime.utcnow(),
            assigned_person='QUALITY_MANAGER',
            resolution_status='OPEN'
        )
        db.session.add(alert)

    # Immutable audit record
    record_audit(
        entity_type='PRODUCTION_USE',
        entity_id=usage.id,
        action='RECORD_USAGE',
        previous_value=None,
        new_value={
            'asset_id': asset_id,
            'batch_id': batch_id,
            'decision': decision,
            'cal_status': cal_status,
            'issue_type': issue_type,
            'operator': operator
        },
        user=user,
        reason=f"Production usage decision: {decision} ({reason})"
    )

    db.session.commit()
    return usage, decision, reason
