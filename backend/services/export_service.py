import io
import csv
import json
from datetime import datetime, date
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.models.audit_record import AuditRecord
from backend.models.supplier import Supplier
from backend.models.calibration_plan import CalibrationPlan
from backend.models.ground_truth import GroundTruth

def export_entity_to_csv(entity_name):
    """
    Exports a table entity to CSV string buffer.
    """
    output = io.StringIO()

    if entity_name == 'instruments':
        items = Asset.query.all()
    elif entity_name == 'calibrations':
        items = CalibrationEvent.query.all()
    elif entity_name == 'certificates':
        items = Certificate.query.all()
    elif entity_name == 'work_orders':
        items = WorkOrder.query.all()
    elif entity_name == 'production_usage':
        items = ProductionUse.query.limit(5000).all()
    elif entity_name == 'alerts':
        items = Alert.query.all()
    elif entity_name == 'suppliers':
        items = Supplier.query.all()
    elif entity_name == 'audit_trail':
        items = AuditRecord.query.order_by(AuditRecord.timestamp.desc()).limit(1000).all()
    elif entity_name == 'ground_truth':
        items = GroundTruth.query.all()
    else:
        raise ValueError(f"Unknown entity: {entity_name}")

    if not items:
        return ""

    fieldnames = list(items[0].to_dict().keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for item in items:
        writer.writerow(item.to_dict())

    return output.getvalue()

def export_database_to_sql():
    """
    Generates an ANSI-compliant MySQL SQL dump of the SmartCal dataset.
    """
    sql_lines = [
        "-- SmartCal – Industrial Calibration & Instrument Management System",
        f"-- SQL Seed Export generated at {datetime.utcnow().isoformat()}",
        "-- Target Dialect: MySQL 8.0 / MariaDB 10.4+",
        "SET FOREIGN_KEY_CHECKS=0;",
        ""
    ]

    # Suppliers
    sql_lines.append("-- Table: suppliers")
    for s in Supplier.query.all():
        sql_lines.append(
            f"INSERT INTO suppliers (id, name, contact_name, contact_email, contact_phone, accreditation_details, status) "
            f"VALUES ('{s.id}', '{s.name}', '{s.contact_name or ''}', '{s.contact_email or ''}', '{s.contact_phone or ''}', '{s.accreditation_details or ''}', '{s.status}') "
            f"ON DUPLICATE KEY UPDATE name=VALUES(name);"
        )

    # Assets
    sql_lines.append("\n-- Table: assets")
    for a in Asset.query.all():
        last_cal = f"'{a.last_calibration_date}'" if a.last_calibration_date else "NULL"
        sup_id = f"'{a.supplier_id}'" if a.supplier_id else "NULL"
        plan_id = f"'{a.calibration_plan_id}'" if a.calibration_plan_id else "NULL"
        sql_lines.append(
            f"INSERT INTO assets (id, name, instrument_type_id, manufacturer, model_number, serial_number, location, department, criticality_level, installation_date, calibration_interval, interval_unit, tolerance_limit, last_calibration_date, next_calibration_due_date, current_status, supplier_id, calibration_plan_id) "
            f"VALUES ('{a.id}', '{a.name}', {a.instrument_type_id}, '{a.manufacturer}', '{a.model_number}', '{a.serial_number}', '{a.location}', '{a.department}', '{a.criticality_level}', '{a.installation_date}', {a.calibration_interval}, '{a.interval_unit}', {a.tolerance_limit}, {last_cal}, '{a.next_calibration_due_date}', '{a.current_status}', {sup_id}, {plan_id}) "
            f"ON DUPLICATE KEY UPDATE name=VALUES(name);"
        )

    # Calibrations
    sql_lines.append("\n-- Table: calibration_events")
    for c in CalibrationEvent.query.all():
        sup_id = f"'{c.supplier_id}'" if c.supplier_id else "NULL"
        sql_lines.append(
            f"INSERT INTO calibration_events (id, asset_id, calibration_date, technician, supplier_id, reference_standard, measured_value, expected_value, measurement_error, tolerance, pass_fail_result, certificate_status, next_calibration_due_date) "
            f"VALUES ('{c.id}', '{c.asset_id}', '{c.calibration_date}', '{c.technician}', {sup_id}, '{c.reference_standard}', {c.measured_value}, {c.expected_value}, {c.measurement_error}, {c.tolerance}, '{c.pass_fail_result}', '{c.certificate_status}', '{c.next_calibration_due_date}') "
            f"ON DUPLICATE KEY UPDATE pass_fail_result=VALUES(pass_fail_result);"
        )

    sql_lines.append("\nSET FOREIGN_KEY_CHECKS=1;")
    return "\n".join(sql_lines)
