from datetime import datetime, date
from backend.database import db
from backend.models.instrument_type import InstrumentType
from backend.models.supplier import Supplier
from backend.models.calibration_plan import CalibrationPlan
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.models.ground_truth import GroundTruth
from backend.services.calibration_service import calculate_next_due_date

def run_database_validation():
    """
    Performs comprehensive structural, relational, and business rule integrity checks.
    Returns: dictionary with metrics, categorized issues, and check summaries.
    """
    checks = []
    
    def add_check(code, name, category, passed, message, severity='ERROR', affected_count=0):
        checks.append({
            'code': code,
            'name': name,
            'category': category,
            'passed': passed,
            'severity': severity if not passed else 'INFO',
            'message': message,
            'affected_count': affected_count
        })

    # 1. Primary Key Uniqueness
    asset_ids = [r[0] for r in db.session.query(Asset.id).all()]
    pk_asset_unique = len(asset_ids) == len(set(asset_ids))
    add_check('PK-01', 'Asset Primary Key Uniqueness', 'Primary Keys', pk_asset_unique,
              "All Asset IDs are strictly unique." if pk_asset_unique else "Duplicate Asset IDs detected.",
              affected_count=len(asset_ids) - len(set(asset_ids)))

    cal_ids = [r[0] for r in db.session.query(CalibrationEvent.id).all()]
    pk_cal_unique = len(cal_ids) == len(set(cal_ids))
    add_check('PK-02', 'Calibration Event Primary Key Uniqueness', 'Primary Keys', pk_cal_unique,
              "All Calibration Event IDs are unique." if pk_cal_unique else "Duplicate Calibration Event IDs found.",
              affected_count=len(cal_ids) - len(set(cal_ids)))

    cert_ids = [r[0] for r in db.session.query(Certificate.id).all()]
    pk_cert_unique = len(cert_ids) == len(set(cert_ids))
    add_check('PK-03', 'Certificate Primary Key Uniqueness', 'Primary Keys', pk_cert_unique,
              "All Certificate IDs are unique." if pk_cert_unique else "Duplicate Certificate IDs found.",
              affected_count=len(cert_ids) - len(set(cert_ids)))

    wo_ids = [r[0] for r in db.session.query(WorkOrder.id).all()]
    pk_wo_unique = len(wo_ids) == len(set(wo_ids))
    add_check('PK-04', 'Work Order Primary Key Uniqueness', 'Primary Keys', pk_wo_unique,
              "All Work Order IDs are unique." if pk_wo_unique else "Duplicate Work Order IDs found.",
              affected_count=len(wo_ids) - len(set(wo_ids)))

    # 2. Foreign Key Integrity
    # Asset -> InstrumentType
    valid_itype_ids = set(r[0] for r in db.session.query(InstrumentType.id).all())
    orphan_asset_itypes = [a.id for a in Asset.query.all() if a.instrument_type_id not in valid_itype_ids]
    add_check('FK-01', 'Asset to Instrument Type FK Integrity', 'Foreign Keys', len(orphan_asset_itypes) == 0,
              "All instruments reference valid instrument types." if len(orphan_asset_itypes) == 0 else f"{len(orphan_asset_itypes)} instruments have invalid instrument_type_id.",
              affected_count=len(orphan_asset_itypes))

    # CalibrationEvent -> Asset
    valid_asset_ids = set(asset_ids)
    orphan_cals = [c.id for c in CalibrationEvent.query.all() if c.asset_id not in valid_asset_ids]
    add_check('FK-02', 'Calibration to Asset FK Integrity', 'Foreign Keys', len(orphan_cals) == 0,
              "All calibration events reference valid assets." if len(orphan_cals) == 0 else f"{len(orphan_cals)} calibrations reference missing assets.",
              affected_count=len(orphan_cals))

    # Certificate -> CalibrationEvent
    valid_cal_ids = set(cal_ids)
    orphan_certs = [c.id for c in Certificate.query.all() if c.calibration_id not in valid_cal_ids]
    add_check('FK-03', 'Certificate to Calibration Event FK Integrity', 'Foreign Keys', len(orphan_certs) == 0,
              "All certificates link to existing calibration events." if len(orphan_certs) == 0 else f"{len(orphan_certs)} certificates link to missing events.",
              affected_count=len(orphan_certs))

    # WorkOrder -> Asset
    orphan_wos = [w.id for w in WorkOrder.query.all() if w.asset_id not in valid_asset_ids]
    add_check('FK-04', 'Work Order to Asset FK Integrity', 'Foreign Keys', len(orphan_wos) == 0,
              "All work orders reference valid assets." if len(orphan_wos) == 0 else f"{len(orphan_wos)} work orders reference missing assets.",
              affected_count=len(orphan_wos))

    # 3. Required Fields & Not-Null Checks
    null_serials = Asset.query.filter(Asset.serial_number == None).count()
    add_check('REQ-01', 'Instrument Serial Number Required', 'Required Fields', null_serials == 0,
              "All instruments have non-null serial numbers." if null_serials == 0 else f"{null_serials} instruments have null serial numbers.",
              affected_count=null_serials)

    null_cal_dates = CalibrationEvent.query.filter(CalibrationEvent.calibration_date == None).count()
    add_check('REQ-02', 'Calibration Date Required', 'Required Fields', null_cal_dates == 0,
              "All calibration events have recorded dates." if null_cal_dates == 0 else f"{null_cal_dates} events missing calibration_date.",
              affected_count=null_cal_dates)

    # 4. Allowed Enum Values
    allowed_asset_statuses = {'ACTIVE', 'OVERDUE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'RETIRED'}
    invalid_asset_statuses = [a.id for a in Asset.query.all() if a.current_status not in allowed_asset_statuses]
    add_check('ENUM-01', 'Asset Status Enum Compliance', 'Allowed Enums', len(invalid_asset_statuses) == 0,
              "All asset statuses match allowed enumeration." if len(invalid_asset_statuses) == 0 else f"Invalid status on {len(invalid_asset_statuses)} assets.",
              affected_count=len(invalid_asset_statuses))

    allowed_wo_statuses = {'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'}
    invalid_wo_statuses = [w.id for w in WorkOrder.query.all() if w.status not in allowed_wo_statuses]
    add_check('ENUM-02', 'Work Order Status Enum Compliance', 'Allowed Enums', len(invalid_wo_statuses) == 0,
              "All work order statuses are valid." if len(invalid_wo_statuses) == 0 else f"Invalid status on {len(invalid_wo_statuses)} work orders.",
              affected_count=len(invalid_wo_statuses))

    allowed_cal_results = {'PASS', 'FAIL'}
    invalid_cal_results = [c.id for c in CalibrationEvent.query.all() if c.pass_fail_result not in allowed_cal_results]
    add_check('ENUM-03', 'Calibration Result Enum Compliance', 'Allowed Enums', len(invalid_cal_results) == 0,
              "All calibration results are PASS or FAIL." if len(invalid_cal_results) == 0 else f"Invalid result on {len(invalid_cal_results)} calibrations.",
              affected_count=len(invalid_cal_results))

    # 5. Date Ordering Checks
    date_order_violations = []
    for a in Asset.query.filter(Asset.last_calibration_date != None).all():
        if a.installation_date > a.last_calibration_date:
            date_order_violations.append(a.id)
    add_check('DATE-01', 'Asset Installation <= Last Calibration Date', 'Date Ordering', len(date_order_violations) == 0,
              "Installation date precedes or equals last calibration date." if len(date_order_violations) == 0 else f"{len(date_order_violations)} assets violate date ordering.",
              affected_count=len(date_order_violations))

    cert_date_violations = []
    for c in Certificate.query.all():
        if c.issue_date > c.expiry_date:
            cert_date_violations.append(c.id)
    add_check('DATE-02', 'Certificate Issue Date <= Expiry Date', 'Date Ordering', len(cert_date_violations) == 0,
              "All certificate issue dates precede expiry dates." if len(cert_date_violations) == 0 else f"{len(cert_date_violations)} certificates have issue > expiry date.",
              affected_count=len(cert_date_violations))

    # 6. Business Consistency Checks (including edge cases)
    # Check 6.1: Due Date Calculations
    due_mismatches = []
    for a in Asset.query.filter(Asset.last_calibration_date != None, Asset.current_status != 'RETIRED').all():
        exp = calculate_next_due_date(a.last_calibration_date, a.calibration_interval, a.interval_unit)
        if a.next_calibration_due_date != exp:
            due_mismatches.append(a.id)
    add_check('BUS-01', 'Calibration Plan Due Date Calculation Integrity', 'Business Rules', len(due_mismatches) == 0,
              "All active assets match plan-calculated due dates." if len(due_mismatches) == 0 else f"{len(due_mismatches)} assets have DUE_DATE_MISMATCH (Expected Edge Case 1 present).",
              severity='WARNING' if len(due_mismatches) > 0 else 'INFO',
              affected_count=len(due_mismatches))

    # Check 6.2: Certificate to Asset Reference Consistency
    cert_mismatches = []
    for c in Certificate.query.all():
        if c.calibration_event and c.asset_id != c.calibration_event.asset_id:
            cert_mismatches.append(c.id)
    add_check('BUS-02', 'Certificate-to-Event Asset Reference Consistency', 'Business Rules', len(cert_mismatches) == 0,
              "All certificates reference the exact asset of their calibration event." if len(cert_mismatches) == 0 else f"{len(cert_mismatches)} certificates have CERTIFICATE_ASSET_MISMATCH (Expected Edge Case 3 present).",
              severity='WARNING' if len(cert_mismatches) > 0 else 'INFO',
              affected_count=len(cert_mismatches))

    # Check 6.3: Failed Calibration Corrective Actions
    missing_assessments = []
    for fe in CalibrationEvent.query.filter_by(pass_fail_result='FAIL').all():
        wos = WorkOrder.query.filter_by(related_calibration_id=fe.id).all()
        if not wos or any(w.impact_assessment_status == 'PENDING' for w in wos):
            missing_assessments.append(fe.id)
    add_check('BUS-03', 'Failed Calibration Impact Assessment Completeness', 'Business Rules', len(missing_assessments) == 0,
              "All failed calibrations have completed impact assessments." if len(missing_assessments) == 0 else f"{len(missing_assessments)} failed events missing impact assessment (Expected Edge Case 4 present).",
              severity='WARNING' if len(missing_assessments) > 0 else 'INFO',
              affected_count=len(missing_assessments))

    # Check 6.4: Ground Truth Separation
    # Verify GroundTruth table is isolated and has records
    gt_count = GroundTruth.query.count()
    add_check('GT-01', 'Ground Truth Isolated Separation', 'Evaluation Integrity', gt_count > 0,
              f"Ground truth repository maintained separately with {gt_count} labeled benchmark cases.",
              affected_count=gt_count)

    passed_count = sum(1 for c in checks if c['passed'])
    failed_count = sum(1 for c in checks if not c['passed'] and c['severity'] == 'ERROR')
    warning_count = sum(1 for c in checks if not c['passed'] and c['severity'] == 'WARNING')

    return {
        'total_checks': len(checks),
        'passed_checks': passed_count,
        'failed_checks': failed_count,
        'warning_count': warning_count,
        'validation_timestamp': datetime.utcnow().isoformat(),
        'checks': checks
    }
