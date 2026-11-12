import os
import json
import csv
import random
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
import numpy as np

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
from backend.models.audit_record import AuditRecord
from backend.models.ground_truth import GroundTruth
from backend.services.calibration_service import calculate_next_due_date
from backend.services.audit_service import record_audit

FIXED_SEED = 20261022

INSTRUMENT_CATEGORIES = [
    {
        'type_code': 'DIG_CALIPER',
        'name': 'Digital Caliper',
        'category': 'Dimensional',
        'default_interval_months': 6,
        'default_tolerance': 0.02,
        'unit_of_measure': 'mm',
        'description': 'High precision digital Vernier caliper for dimensional inspection',
        'manufacturers': ['Mitutoyo', 'Fowler', 'Starrett', 'Mahr'],
        'models': ['500-196-30', 'Euro-Cal IV', '799A-6/150', '16 EWR']
    },
    {
        'type_code': 'OUT_MICROMETER',
        'name': 'Outside Micrometer',
        'category': 'Dimensional',
        'default_interval_months': 6,
        'default_tolerance': 0.004,
        'unit_of_measure': 'mm',
        'description': 'Precision external micrometer with carbide measuring faces',
        'manufacturers': ['Mitutoyo', 'Starrett', 'Mahr', 'Brown & Sharpe'],
        'models': ['293-340-30', 'T436.1XFL-1', '40 EWR', 'Digit-Cal']
    },
    {
        'type_code': 'PRESS_GAUGE',
        'name': 'Digital Pressure Gauge',
        'category': 'Pressure',
        'default_interval_months': 12,
        'default_tolerance': 0.25,
        'unit_of_measure': 'bar',
        'description': 'Industrial stainless steel hydraulic and pneumatic pressure transmitter',
        'manufacturers': ['WIKA', 'Ashcroft', 'Fluke Calibration', 'Keller'],
        'models': ['CPG1500', 'DG25', '700G08', 'LEO 2']
    },
    {
        'type_code': 'THERMOCOUPLE',
        'name': 'Type K Thermocouple Probe',
        'category': 'Thermal',
        'default_interval_months': 6,
        'default_tolerance': 1.1,
        'unit_of_measure': '°C',
        'description': 'High temperature mineral-insulated thermocouple for heat treating ovens',
        'manufacturers': ['Omega Engineering', 'Fluke', 'Yokogawa', 'Watlow'],
        'models': ['TJ36-CASS', '52-II', 'TX1001', 'XACTEMP']
    },
    {
        'type_code': 'TORQUE_WRENCH',
        'name': 'Digital Torque Wrench',
        'category': 'Mechanical',
        'default_interval_months': 6,
        'default_tolerance': 1.5,
        'unit_of_measure': 'Nm',
        'description': 'Audible and visual torque wrench for critical aerospace assembly',
        'manufacturers': ['Stahlwille', 'Snap-on', 'Norbar', 'CDI'],
        'models': ['MANOSKOP 730D', 'ATECH2CS240', 'ProTronic 100', '2503MFRMH']
    },
    {
        'type_code': 'FLOW_METER',
        'name': 'Electromagnetic Flow Meter',
        'category': 'Pressure',
        'default_interval_months': 12,
        'default_tolerance': 0.5,
        'unit_of_measure': 'L/min',
        'description': 'Inline magnetic inductive flow sensor for chemical dosing lines',
        'manufacturers': ['Endress+Hauser', 'KROHNE', 'Siemens', 'Yokogawa'],
        'models': ['Promag 50P', 'OPTIFLUX 4300', 'MAG 5100 W', 'ADMAG AXG']
    },
    {
        'type_code': 'DIAL_INDICATOR',
        'name': 'Dial Test Indicator',
        'category': 'Dimensional',
        'default_interval_months': 6,
        'default_tolerance': 0.01,
        'unit_of_measure': 'mm',
        'description': 'Plunger type mechanical dial indicator for runout inspection',
        'manufacturers': ['Mitutoyo', 'Starrett', 'Mahr', 'Insize'],
        'models': ['2046S', '25-441J', 'MarCator 810 A', '2308-10A']
    }
]

DEPARTMENTS = [
    'CNC Machining',
    'Assembly Line 1',
    'Assembly Line 2',
    'Quality Metrology Lab',
    'Thermal Processing',
    'Chemical Formulation',
    'Packaging & Shipping'
]

LOCATIONS = [
    'Building A - Bay 1',
    'Building A - Bay 3',
    'Building B - Cleanroom 101',
    'Building B - QA Lab',
    'Building C - Furnace Area',
    'Building D - Final Test'
]

SUPPLIERS_DATA = [
    {
        'id': 'SUP-0001',
        'name': 'Apex Metrology Services Corp',
        'contact_name': 'Dr. Robert Vance',
        'contact_email': 'rvance@apexmetrology.com',
        'contact_phone': '+1 (555) 234-8901',
        'calibration_services': 'ISO/IEC 17025 accredited dimensional, thermal, and torque calibration',
        'accreditation_details': 'A2LA Certificate #2491.01 (Exp: 2028-06-30)',
        'address': '450 Precision Way, Detroit, MI 48201',
        'status': 'ACTIVE'
    },
    {
        'id': 'SUP-0002',
        'name': 'National Calibration Laboratories (NCL)',
        'contact_name': 'Eleanor Davies',
        'contact_email': 'edavies@natcal-labs.org',
        'contact_phone': '+1 (555) 789-1234',
        'calibration_services': 'Primary standard pressure, vacuum, and fluid dynamics calibration',
        'accreditation_details': 'NVLAP Lab Code 200845-0',
        'address': '1200 Standards Blvd, Gaithersburg, MD 20877',
        'status': 'ACTIVE'
    },
    {
        'id': 'SUP-0003',
        'name': 'Mitutoyo Industrial Calibration Center',
        'contact_name': 'Kenji Takahashi',
        'contact_email': 'calibration@mitutoyo-service.com',
        'contact_phone': '+1 (555) 987-6543',
        'calibration_services': 'OEM factory certified linear, CMM, and optical calibration',
        'accreditation_details': 'JAB Accreditation #CAL-0042',
        'address': '965 Corporate Blvd, Aurora, IL 60502',
        'status': 'ACTIVE'
    },
    {
        'id': 'SUP-0004',
        'name': 'Endress+Hauser Metrology Support',
        'contact_name': 'Sarah Lindstrom',
        'contact_email': 'service.na@endress.com',
        'contact_phone': '+1 (555) 345-6789',
        'calibration_services': 'Gravimetric and Coriolis fluid flow rig calibrations',
        'accreditation_details': 'DAkkS Calibration Laboratory D-K-15024-01-00',
        'address': '2350 Endress Place, Greenwood, IN 46143',
        'status': 'ACTIVE'
    },
    {
        'id': 'SUP-0005',
        'name': 'Fluke Metrology & Test Lab',
        'contact_name': 'Marcus Brody',
        'contact_email': 'mbrody@flukecal.com',
        'contact_phone': '+1 (555) 432-1098',
        'calibration_services': 'Electrical, temperature, and RF secondary reference standards',
        'accreditation_details': 'CLAS Certificate 2011-04',
        'address': '6920 Seaway Blvd, Everett, WA 98203',
        'status': 'ACTIVE'
    }
]

def generate_synthetic_data(scale='starter', seed=FIXED_SEED, target_dir=None):
    """
    Generate synthetic data for SmartCal.
    scale: 'starter' (100 instruments, 250 cal events, 5,000 usages)
           'full' (2,000 instruments, 5,000 cal events, 100,000 usages)
    """
    random.seed(seed)
    np.random.seed(seed)

    if scale == 'full':
        num_assets = 2000
        num_calibrations = 5000
        num_usages = 100000
    else:
        num_assets = 100
        num_calibrations = 250
        num_usages = 5000

    print(f"Generating synthetic dataset (scale={scale}, seed={seed})...")
    print(f"Targets: {num_assets} instruments, {num_calibrations} calibrations, {num_usages} usages.")

    # 1. Clear existing database tables
    db.drop_all()
    db.create_all()

    ground_truth_records = []

    # 2. Insert Instrument Types
    inst_type_objs = []
    for cat in INSTRUMENT_CATEGORIES:
        itype = InstrumentType(
            type_code=cat['type_code'],
            name=cat['name'],
            category=cat['category'],
            default_interval_months=cat['default_interval_months'],
            default_tolerance=cat['default_tolerance'],
            unit_of_measure=cat['unit_of_measure'],
            description=cat['description']
        )
        db.session.add(itype)
        inst_type_objs.append(itype)
    db.session.flush()

    # 3. Insert Suppliers
    supplier_objs = []
    for sup in SUPPLIERS_DATA:
        s = Supplier(
            id=sup['id'],
            name=sup['name'],
            contact_name=sup['contact_name'],
            contact_email=sup['contact_email'],
            contact_phone=sup['contact_phone'],
            calibration_services=sup['calibration_services'],
            accreditation_details=sup['accreditation_details'],
            address=sup['address'],
            status=sup['status'],
            created_at=datetime(2025, 1, 15, 8, 0, 0)
        )
        db.session.add(s)
        supplier_objs.append(s)
    db.session.flush()

    # 4. Insert Calibration Plans
    plan_objs = []
    for i, itype in enumerate(inst_type_objs):
        plan = CalibrationPlan(
            id=f"PLAN-{i+1:04d}",
            plan_name=f"Standard {itype.name} Calibration Protocol",
            instrument_type_id=itype.id,
            calibration_interval=itype.default_interval_months,
            interval_unit='months',
            tolerance_limits=itype.default_tolerance,
            due_date_calc_method='FROM_LAST_CALIBRATION',
            responsible_department='Quality Metrology Lab',
            supplier_id=supplier_objs[i % len(supplier_objs)].id,
            effective_start_date=date(2025, 1, 1),
            plan_status='ACTIVE',
            created_at=datetime(2025, 1, 1, 9, 0, 0)
        )
        db.session.add(plan)
        plan_objs.append(plan)
    db.session.flush()

    # 5. Insert Assets (AST-000001 ...)
    asset_objs = []
    base_date = date(2025, 1, 1)
    
    for i in range(1, num_assets + 1):
        asset_id = f"AST-{i:06d}"
        type_idx = i % len(inst_type_objs)
        itype = inst_type_objs[type_idx]
        cat_info = INSTRUMENT_CATEGORIES[type_idx]
        plan = plan_objs[type_idx]

        mfg = random.choice(cat_info['manufacturers'])
        model = random.choice(cat_info['models'])
        serial = f"SN-2025-{itype.type_code[:3]}-{i:05d}"
        
        # Installation date between Jan 2025 and July 2025
        inst_day_offset = random.randint(0, 180)
        installation_date = base_date + timedelta(days=inst_day_offset)
        
        # Last calibration: within 1 to 6 months after installation
        cal_offset = random.randint(30, 240)
        last_cal_date = installation_date + timedelta(days=cal_offset)

        # Standard next due date: last_cal + interval months
        next_due_date = calculate_next_due_date(last_cal_date, plan.calibration_interval, plan.interval_unit)

        # Status: mostly ACTIVE, some OVERDUE, some OUT_OF_SERVICE
        today = date.today()
        if next_due_date < today:
            status = 'OVERDUE'
        else:
            status = 'ACTIVE'

        criticality = 'CRITICAL' if i % 5 == 0 else ('HIGH' if i % 3 == 0 else 'MEDIUM')
        dept = DEPARTMENTS[i % len(DEPARTMENTS)]
        loc = LOCATIONS[i % len(LOCATIONS)]
        sup = supplier_objs[i % len(supplier_objs)]

        asset = Asset(
            id=asset_id,
            name=f"{mfg} {itype.name} #{i:04d}",
            instrument_type_id=itype.id,
            manufacturer=mfg,
            model_number=model,
            serial_number=serial,
            description=f"{itype.name} deployed at {loc} for {dept}",
            location=loc,
            department=dept,
            criticality_level=criticality,
            installation_date=installation_date,
            calibration_interval=plan.calibration_interval,
            interval_unit=plan.interval_unit,
            tolerance_limit=plan.tolerance_limits,
            last_calibration_date=last_cal_date,
            next_calibration_due_date=next_due_date,
            current_status=status,
            supplier_id=sup.id,
            calibration_plan_id=plan.id,
            created_at=datetime.combine(installation_date, datetime.min.time())
        )
        db.session.add(asset)
        asset_objs.append(asset)

    db.session.flush()

    # 6. INJECT EDGE CASE 1: DUE_DATE_MISMATCH
    # Stored due date differs from plan calculation
    edge_case_1_asset = asset_objs[0] # AST-000001
    correct_calc_due = calculate_next_due_date(edge_case_1_asset.last_calibration_date, edge_case_1_asset.calibration_interval, edge_case_1_asset.interval_unit)
    corrupted_due = correct_calc_due + timedelta(days=45) # Deliberately 45 days off!
    edge_case_1_asset.next_calibration_due_date = corrupted_due
    
    gt_ec1 = {
        'issue_id': 'GT-EC1-001',
        'entity_id': edge_case_1_asset.id,
        'entity_type': 'ASSET',
        'issue_type': 'DUE_DATE_MISMATCH',
        'expected_decision': 'FLAG_DUE_DATE_MISMATCH',
        'expected_severity': 'HIGH',
        'description': f"Asset {edge_case_1_asset.id} stored due date {corrupted_due} differs from calculated {correct_calc_due}",
        'injected_case_label': 'EDGE_CASE_1'
    }
    ground_truth_records.append(gt_ec1)

    # 7. Generate Calibration Events & Certificates & Work Orders
    cal_event_objs = []
    cert_objs = []
    work_order_objs = []

    technicians = ['Marcus Vance', 'Sarah Jenkins', 'David Chen', 'Elena Rostova', 'James Wilson']
    
    cal_counter = 0
    for i in range(num_calibrations):
        cal_counter += 1
        asset = asset_objs[i % len(asset_objs)]
        event_id = f"CAL-{asset.id}-2026-{cal_counter:06d}"

        cal_date = asset.last_calibration_date or (date(2025, 6, 1) + timedelta(days=i % 150))
        tech = technicians[i % len(technicians)]
        sup = asset.supplier or supplier_objs[0]
        
        tol = asset.tolerance_limit
        expected_val = 100.0 if 'bar' in asset.instrument_type.unit_of_measure else 25.0
        
        # 92% PASS, 8% FAIL
        is_fail = (i % 12 == 11)
        if is_fail:
            # Error exceeds tolerance
            error_magnitude = tol * (1.2 + (i % 5) * 0.2)
            measured_val = expected_val + error_magnitude
            pass_fail = 'FAIL'
            remarks = f"Out of tolerance: measured error {error_magnitude:.4f} > tolerance ±{tol:.4f}"
            cert_status = 'MISSING'
        else:
            # Error within tolerance
            error_magnitude = (random.random() * 0.8) * tol
            sign = 1 if (i % 2 == 0) else -1
            measured_val = expected_val + (sign * error_magnitude)
            pass_fail = 'PASS'
            remarks = "In tolerance calibration verified with NIST-traceable standards."
            cert_status = 'VALID'

        measurement_error = round(measured_val - expected_val, 5)
        next_due = calculate_next_due_date(cal_date, asset.calibration_interval, asset.interval_unit)

        event = CalibrationEvent(
            id=event_id,
            asset_id=asset.id,
            calibration_date=cal_date,
            technician=tech,
            supplier_id=sup.id,
            reference_standard=f"NIST Standard Block Set #{88200 + (i % 50)}",
            measured_value=round(measured_val, 4),
            expected_value=expected_val,
            measurement_error=measurement_error,
            tolerance=tol,
            pass_fail_result=pass_fail,
            calibration_remarks=remarks,
            certificate_status=cert_status,
            next_calibration_due_date=next_due,
            created_at=datetime.combine(cal_date, datetime.min.time())
        )
        db.session.add(event)
        cal_event_objs.append(event)

        # Create certificate for PASS events (except deliberate gap)
        if pass_fail == 'PASS' and (i % 20 != 19): # 5% missing cert gap
            cert_id = f"CERT-{event.id}"
            cert = Certificate(
                id=cert_id,
                calibration_id=event.id,
                asset_id=asset.id,
                certificate_number=f"CERT-2026-{i+1000:05d}",
                issue_date=cal_date,
                expiry_date=next_due,
                supplier_id=sup.id,
                approval_status='APPROVED',
                document_location=f"uploads/certificates/CERT-2026-{i+1000:05d}.pdf",
                file_size_kb=120 + (i % 80),
                verification_status='VERIFIED',
                created_at=datetime.combine(cal_date, datetime.min.time())
            )
            db.session.add(cert)
            cert_objs.append(cert)
        elif pass_fail == 'PASS' and (i % 20 == 19):
            event.certificate_status = 'MISSING'

        # Work orders for FAIL events or routine PM
        if pass_fail == 'FAIL':
            wo_id = f"WO-2026-{len(work_order_objs) + 1:06d}"
            wo = WorkOrder(
                id=wo_id,
                asset_id=asset.id,
                related_calibration_id=event.id,
                work_order_type='CORRECTIVE_CALIBRATION',
                priority='CRITICAL' if asset.criticality_level == 'CRITICAL' else 'HIGH',
                description=f"Corrective Action: Calibration failure on {asset.id}. Error {measurement_error} vs tol {tol}.",
                assigned_technician=tech,
                created_date=cal_date,
                planned_start_date=cal_date,
                actual_start_date=cal_date + timedelta(days=1),
                completion_date=cal_date + timedelta(days=3),
                downtime_hours=random.choice([4.5, 8.0, 12.0, 16.5]),
                status='COMPLETED',
                corrective_action="Optical sensor recalibrated, mechanical gibs adjusted, cleanroom re-inspected.",
                impact_assessment_status='COMPLETED',
                impact_assessment_notes="Reviewed batches produced during prior shift. No out-of-spec products detected.",
                responsible_engineer="Dr. H. Brewster",
                created_at=datetime.combine(cal_date, datetime.min.time())
            )
            db.session.add(wo)
            work_order_objs.append(wo)

    db.session.flush()

    # 8. INJECT EDGE CASE 3: CERTIFICATE_ASSET_MISMATCH
    # Certificate references another asset ID
    if len(cert_objs) >= 2:
        target_cert = cert_objs[0]
        mismatched_asset = asset_objs[1] # different asset!
        target_cert.asset_id = mismatched_asset.id # Deliberate mismatch!
        target_cert.verification_status = 'MISMATCH_FLAGGED'
        
        gt_ec3 = {
            'issue_id': 'GT-EC3-001',
            'entity_id': target_cert.id,
            'entity_type': 'CERTIFICATE',
            'issue_type': 'CERTIFICATE_ASSET_MISMATCH',
            'expected_decision': 'FLAG_MISMATCH',
            'expected_severity': 'CRITICAL',
            'description': f"Certificate {target_cert.id} linked to event {target_cert.calibration_id} for asset {target_cert.calibration_event.asset_id} but points to asset {mismatched_asset.id}",
            'injected_case_label': 'EDGE_CASE_3'
        }
        ground_truth_records.append(gt_ec3)

    # 9. INJECT EDGE CASE 4: MISSING_IMPACT_ASSESSMENT
    # Failed calibration event with NO impact assessment completed
    edge_case_4_asset = asset_objs[2]
    ec4_event_id = f"CAL-{edge_case_4_asset.id}-2026-999994"
    ec4_event = CalibrationEvent(
        id=ec4_event_id,
        asset_id=edge_case_4_asset.id,
        calibration_date=date(2026, 2, 1),
        technician='Marcus Vance',
        supplier_id=supplier_objs[0].id,
        reference_standard='High-Precision Reference #9910',
        measured_value=25.09,
        expected_value=25.00,
        measurement_error=0.09,
        tolerance=edge_case_4_asset.tolerance_limit,
        pass_fail_result='FAIL',
        calibration_remarks='Severe drift detected. Instrument locked out.',
        certificate_status='MISSING',
        next_calibration_due_date=date(2026, 8, 1),
        created_at=datetime(2026, 2, 1, 10, 0, 0)
    )
    db.session.add(ec4_event)

    ec4_wo_id = f"WO-2026-999994"
    ec4_wo = WorkOrder(
        id=ec4_wo_id,
        asset_id=edge_case_4_asset.id,
        related_calibration_id=ec4_event.id,
        work_order_type='CORRECTIVE_CALIBRATION',
        priority='CRITICAL',
        description=f"CRITICAL: Calibration failure on {edge_case_4_asset.id}. Requires mandatory impact assessment.",
        assigned_technician='Marcus Vance',
        created_date=date(2026, 2, 1),
        status='IN_PROGRESS',
        downtime_hours=24.0,
        impact_assessment_status='PENDING', # DELIBERATELY PENDING!
        impact_assessment_notes=None,
        responsible_engineer=None,
        created_at=datetime(2026, 2, 1, 10, 5, 0)
    )
    db.session.add(ec4_wo)

    gt_ec4 = {
        'issue_id': 'GT-EC4-001',
        'entity_id': ec4_event.id,
        'entity_type': 'CALIBRATION',
        'issue_type': 'MISSING_IMPACT_ASSESSMENT',
        'expected_decision': 'CREATE_CORRECTIVE_WO',
        'expected_severity': 'CRITICAL',
        'description': f"Failed calibration {ec4_event.id} without required engineering impact assessment",
        'injected_case_label': 'EDGE_CASE_4'
    }
    ground_truth_records.append(gt_ec4)

    # 10. Generate Production Usage Events
    usage_objs = []
    lines = [f"Line {k} - {sub}" for k, sub in enumerate(['CNC Milling', 'Stamping', 'Heat Treat', 'Final Assembly', 'Inspection Bay'], 1)]
    operators = ['John Doe', 'Alice Smith', 'Carlos Mendez', 'Fatima Al-Sayed', 'Lars Lindqvist', 'Priya Sharma']
    
    start_time = datetime(2025, 7, 1, 8, 0, 0)
    
    for u in range(num_usages):
        asset = asset_objs[u % len(asset_objs)]
        batch_id = f"BATCH-2026-B{1000 + (u % 450)}"
        line = lines[u % len(lines)]
        operator = operators[u % len(operators)]
        
        # Incremental timestamps over several months
        usage_time = start_time + timedelta(minutes=u * 15 + (u % 11))
        usage_date = usage_time.date()

        # Decision validation logic
        if asset.current_status in ('OUT_OF_SERVICE', 'UNDER_MAINTENANCE'):
            cal_status = 'FAILED'
            if u % 50 == 0:
                decision = 'ALLOWED_WITH_EXCEPTION'
                exc_id = f"EXC-2026-{u+1:04d}"
                issue_type = 'NONE'
            else:
                decision = 'BLOCKED'
                exc_id = None
                issue_type = 'FAILED_CALIBRATION_USAGE'
        elif usage_date > asset.next_calibration_due_date:
            cal_status = 'OVERDUE'
            if u % 35 == 0:
                decision = 'ALLOWED_WITH_EXCEPTION'
                exc_id = f"EXC-2026-{u+1:04d}"
                issue_type = 'NONE'
            else:
                decision = 'BLOCKED'
                exc_id = None
                issue_type = 'EXPIRED_USAGE'
        else:
            cal_status = 'CALIBRATED'
            decision = 'ALLOWED'
            exc_id = None
            issue_type = 'NONE'

        epoch_sec = int(usage_time.timestamp())
        usage_id = f"USE-{asset.id}-{epoch_sec}-{u}"

        p_use = ProductionUse(
            id=usage_id,
            asset_id=asset.id,
            production_batch_id=batch_id,
            production_line=line,
            operator=operator,
            usage_timestamp=usage_time,
            calibration_status_at_usage=cal_status,
            exception_approval_id=exc_id,
            usage_decision=decision,
            issue_type=issue_type if issue_type != 'NONE' else None,
            notes="Routine in-line check" if decision == 'ALLOWED' else f"Usage decision: {decision}"
        )
        usage_objs.append(p_use)

    # Bulk insert production usage for fast execution
    db.session.bulk_save_objects(usage_objs)
    db.session.flush()

    # 11. INJECT EDGE CASE 2: EXPIRED_USAGE
    # Production usage event AFTER calibration expiry with NO exception -> BLOCKED
    edge_case_2_asset = asset_objs[3]
    ec2_expired_date = edge_case_2_asset.next_calibration_due_date + timedelta(days=14)
    ec2_usage_time = datetime.combine(ec2_expired_date, datetime.min.time()) + timedelta(hours=14, minutes=30)
    ec2_usage_id = f"USE-{edge_case_2_asset.id}-999999"

    ec2_usage = ProductionUse(
        id=ec2_usage_id,
        asset_id=edge_case_2_asset.id,
        production_batch_id="BATCH-2026-CRITICAL-99",
        production_line="Line 1 - CNC Milling",
        operator="Carlos Mendez",
        usage_timestamp=ec2_usage_time,
        calibration_status_at_usage='OVERDUE',
        exception_approval_id=None, # DELIBERATELY NO EXCEPTION
        usage_decision='BLOCKED',
        issue_type='EXPIRED_USAGE',
        notes="CRITICAL SAFETY VIOLATION: Instrument calibration expired. Usage blocked by system."
    )
    db.session.add(ec2_usage)

    gt_ec2 = {
        'issue_id': 'GT-EC2-001',
        'entity_id': ec2_usage.id,
        'entity_type': 'PRODUCTION_USE',
        'issue_type': 'EXPIRED_USAGE',
        'expected_decision': 'BLOCK_USAGE',
        'expected_severity': 'CRITICAL',
        'description': f"Usage attempt of expired asset {edge_case_2_asset.id} without exception at {ec2_usage_time}",
        'injected_case_label': 'EDGE_CASE_2'
    }
    ground_truth_records.append(gt_ec2)

    # 12. Save Ground Truth records to DB and to JSON / CSV files
    for gt in ground_truth_records:
        rec = GroundTruth(
            issue_id=gt['issue_id'],
            entity_id=gt['entity_id'],
            entity_type=gt['entity_type'],
            issue_type=gt['issue_type'],
            expected_decision=gt['expected_decision'],
            expected_severity=gt['expected_severity'],
            description=gt['description'],
            injected_case_label=gt['injected_case_label'],
            created_at=datetime.utcnow()
        )
        db.session.add(rec)

    db.session.commit()

    # 13. Write Ground Truth JSON and CSV to disk
    if target_dir is None:
        target_dir = os.path.dirname(os.path.dirname(__file__))

    json_path = os.path.join(target_dir, 'ground_truth.json')
    csv_path = os.path.join(target_dir, 'ground_truth.csv')

    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(ground_truth_records, jf, indent=2)

    with open(csv_path, 'w', newline='', encoding='utf-8') as cf:
        writer = csv.DictWriter(cf, fieldnames=['issue_id', 'entity_id', 'entity_type', 'issue_type', 'expected_decision', 'expected_severity', 'description', 'injected_case_label'])
        writer.writeheader()
        writer.writerows(ground_truth_records)

    # 14. Run the alert scanner to populate active alerts & audit records
    from backend.services.alert_service import scan_and_generate_alerts
    alerts_count = scan_and_generate_alerts()

    # Record initial audit entry
    record_audit(
        entity_type='SYSTEM',
        entity_id='SYNTHETIC_DATA_GEN',
        action='GENERATE_DATASET',
        previous_value=None,
        new_value={
            'scale': scale,
            'seed': seed,
            'num_assets': num_assets,
            'num_calibrations': num_calibrations,
            'num_usages': num_usages,
            'ground_truth_count': len(ground_truth_records)
        },
        user='ADMIN',
        reason="Initial synthetic database seeding"
    )
    db.session.commit()

    summary = {
        'scale': scale,
        'seed': seed,
        'instruments': num_assets,
        'calibrations': num_calibrations,
        'certificates': len(cert_objs),
        'work_orders': len(work_order_objs) + 1,
        'usages': num_usages + 1,
        'alerts': alerts_count,
        'ground_truth_count': len(ground_truth_records),
        'ground_truth_json': json_path,
        'ground_truth_csv': csv_path
    }
    print("Synthetic data generation finished successfully:", summary)
    return summary
