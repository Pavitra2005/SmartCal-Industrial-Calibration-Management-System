# SmartCal – Data Dictionary & Field Specifications

This document provides a comprehensive data dictionary for the **SmartCal – Industrial Calibration & Instrument Management System**. It details all database tables, columns, data types, constraints, default values, permitted enumeration values, units of measure, and associated business validation rules.

---

## Table of Contents
1. [instrument_types](#1-instrument_types)
2. [suppliers](#2-suppliers)
3. [calibration_plans](#3-calibration_plans)
4. [assets](#4-assets)
5. [calibration_events](#5-calibration_events)
6. [certificates](#6-certificates)
7. [work_orders](#7-work_orders)
8. [production_uses](#8-production_uses)
9. [alerts](#9-alerts)
10. [audit_records](#10-audit_records)
11. [ground_truth](#11-ground_truth)

---

## 1. `instrument_types`
Master taxonomy table categorizing industrial measuring instruments, their default calibration intervals, tolerances, and engineering units.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto-Increment | **PK** | Surrogate primary key. |
| `type_code` | `VARCHAR(32)` | NO | None | **UK** | Unique alphanumeric mnemonic (e.g., `CALIPER`, `MICROMETER`, `PRESSURE_GAUGE`, `TORQUE_WRENCH`, `THERMOCOUPLE`, `MULTIMETER`). Required, uppercase. |
| `name` | `VARCHAR(128)` | NO | None | None | Human-readable name of instrument category (e.g., "Digital Vernier Caliper"). |
| `category` | `VARCHAR(64)` | NO | None | None | High-level engineering category: `Dimensional`, `Pressure`, `Electrical`, `Thermal`, `Torque`, `Optical`, `Chemical`. |
| `default_interval_months` | `INT` | NO | 12 | None | Default calibration period in months. Must be > 0 (typically 3, 6, 12, 24). |
| `default_tolerance` | `FLOAT` | NO | 0.05 | None | Default allowable process tolerance limit (absolute tolerance). |
| `unit_of_measure` | `VARCHAR(32)` | NO | None | None | Standard engineering unit symbol: `mm`, `psi`, `bar`, `°C`, `Nm`, `V`, `mA`, `µm`. |
| `description` | `TEXT` | YES | NULL | None | Detailed specifications and scope of application. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Audit timestamp when record was created. |

---

## 2. `suppliers`
Master registry of internal metrology calibration laboratories and accredited third-party commercial calibration suppliers (ISO/IEC 17025).

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic business key (e.g., `SUP-001`, `SUP-002`, `SUP-INT-001`). Matches regex `^SUP-[A-Z0-9-]+$`. |
| `name` | `VARCHAR(128)` | NO | None | None | Legal company or laboratory name (e.g., "Mitutoyo Metrology Lab Services", "Fluke Precision Calibration"). |
| `contact_name` | `VARCHAR(128)` | YES | NULL | None | Primary point of contact / lead metrologist. |
| `contact_email` | `VARCHAR(128)` | YES | NULL | None | Valid email address for calibration certificates and quotes. |
| `contact_phone` | `VARCHAR(64)` | YES | NULL | None | Telephone contact number with international dialing code. |
| `calibration_services` | `TEXT` | YES | NULL | None | Text or JSON listing of accredited parameters (e.g., "Dimensional, Force, Pressure, Electrical"). |
| `accreditation_details` | `VARCHAR(255)` | YES | NULL | None | Accreditation body and standard (e.g., "ISO/IEC 17025:2017 Accredited by A2LA #1428.01"). |
| `address` | `TEXT` | YES | NULL | None | Physical shipping/laboratory address for instrument send-out. |
| `status` | `VARCHAR(32)` | NO | 'ACTIVE' | None | Vendor approval status. Enum: `ACTIVE`, `INACTIVE`, `PENDING_AUDIT`, `DISQUALIFIED`. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Creation timestamp. |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Last modification timestamp. |

---

## 3. `calibration_plans`
Quality master plans that govern calibration intervals, tolerances, calculation methods, and responsible departments for each instrument type.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic identifier (e.g., `PLAN-CALIPER-001`, `PLAN-PRESS-002`). |
| `plan_name` | `VARCHAR(128)` | NO | None | None | Descriptive name of calibration program (e.g., "Semi-Annual Vernier Caliper Inspection"). |
| `instrument_type_id` | `INT` | NO | None | **FK** | Foreign key referencing `instrument_types(id)`. |
| `calibration_interval` | `INT` | NO | 6 | None | Positive integer duration (e.g., 6, 12, 365). |
| `interval_unit` | `VARCHAR(16)` | NO | 'months' | None | Time unit enum: `days`, `weeks`, `months`, `years`. |
| `tolerance_limits` | `FLOAT` | NO | 0.05 | None | Permissible error threshold. Calibration passes if `\|error\| <= tolerance_limits`. |
| `calculation_method` | `VARCHAR(64)` | NO | 'FIXED_INTERVAL' | None | Due date computation rule: `FIXED_INTERVAL` (last cal + interval), `END_OF_MONTH` (last cal + interval rounded to month-end). |
| `responsible_dept` | `VARCHAR(64)` | NO | 'Quality Control'| None | Plant department overseeing execution: `Quality Assurance`, `Quality Control`, `Metrology`, `Maintenance`. |
| `supplier_id` | `VARCHAR(32)` | YES | NULL | **FK** | Preferred calibration vendor referencing `suppliers(id)`. |
| `effective_start_date`| `DATE` | NO | None | None | First calendar date when this calibration policy becomes active. |
| `effective_end_date` | `DATE` | YES | NULL | None | Date when plan expires or is superseded. Must be `>= effective_start_date` if populated. |
| `plan_status` | `VARCHAR(32)` | NO | 'ACTIVE' | None | Policy lifecycle state: `ACTIVE`, `DRAFT`, `SUPERSEDED`, `RETIRED`. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Audit timestamp. |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Audit timestamp. |

---

## 4. `assets`
The core physical measuring instruments and metrology assets deployed across manufacturing production lines.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic asset barcode ID formatted as `AST-000001` through `AST-999999`. Must match regex `^AST-\d{6}$`. |
| `instrument_name` | `VARCHAR(128)` | NO | None | None | Asset title (e.g., "Mitutoyo 500-196-30 AOS Digimatic Caliper"). |
| `instrument_type_id` | `INT` | NO | None | **FK** | Links to `instrument_types(id)`. |
| `manufacturer` | `VARCHAR(64)` | NO | None | None | OEM manufacturer (e.g., "Mitutoyo", "Fluke", "WIKA", "Starrett", "Instron"). |
| `model_number` | `VARCHAR(64)` | NO | None | None | OEM product model identifier (e.g., "CD-6\" CSX", "789 ProcessMeter"). |
| `serial_number` | `VARCHAR(64)` | NO | None | **UK** | OEM physical chassis serial number. Guaranteed strictly unique per instrument. |
| `asset_description` | `TEXT` | YES | NULL | None | Asset operational details, special accessories, range limitations. |
| `location` | `VARCHAR(64)` | NO | None | None | Physical location: `Building A - Machining`, `Building B - Cleanroom`, `QA Metrology Lab`, `Assembly Bay 2`. |
| `department` | `VARCHAR(64)` | NO | None | None | Asset owner department: `Machining`, `Assembly`, `Metrology`, `Quality Control`, `Tooling`. |
| `criticality_level` | `VARCHAR(16)` | NO | 'MEDIUM' | None | Quality risk impact enum: `CRITICAL` (direct flight/safety product impact), `HIGH`, `MEDIUM`, `LOW`. |
| `installation_date` | `DATE` | NO | None | None | Commissioning date on the production floor. |
| `calibration_interval`| `INT` | NO | 6 | None | Active interval number of units. |
| `interval_unit` | `VARCHAR(16)` | NO | 'months' | None | Time unit enum: `days`, `weeks`, `months`, `years`. |
| `last_calibration_date`| `DATE` | YES | NULL | None | Date of most recent completed calibration. Must be `<= next_calibration_due_date`. |
| `next_calibration_due_date`| `DATE` | YES | NULL | None | Target expiration date calculated deterministically from active plan. |
| `current_status` | `VARCHAR(32)` | NO | 'ACTIVE' | None | Operational status enum: `ACTIVE` (calibrated & ready), `OVERDUE` (calibration expired), `OUT_OF_SERVICE` (failed or decommissioned), `UNDER_MAINTENANCE` (active work order), `DECOMMISSIONED`. |
| `supplier_id` | `VARCHAR(32)` | YES | NULL | **FK** | Assigned servicing laboratory referencing `suppliers(id)`. |
| `calibration_plan_id`| `VARCHAR(32)` | YES | NULL | **FK** | Associated governance plan referencing `calibration_plans(id)`. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Record creation timestamp. |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Record modification timestamp. |

---

## 5. `calibration_events`
Immutable historical records of every calibration execution event performed on an asset. Previous calibration records are never updated or overwritten.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | NO | None | **PK** | Deterministic event key formatted as `CAL-<asset_id>-2026-000001`. Matches regex `^CAL-AST-\d{6}-\d{4}-\d{6}$`. |
| `asset_id` | `VARCHAR(32)` | NO | None | **FK** | References calibrated asset in `assets(id)`. |
| `calibration_date` | `DATE` | NO | None | None | Date calibration inspection occurred. |
| `technician` | `VARCHAR(64)` | NO | None | None | Name of certified calibration technician or metrology engineer. |
| `supplier_id` | `VARCHAR(32)` | YES | NULL | **FK** | References calibration vendor in `suppliers(id)`. |
| `reference_standard` | `VARCHAR(128)` | NO | None | None | Traceable calibration standard equipment (e.g., "Grade 0 Gage Block Set NIST #821/276412"). |
| `measured_value` | `FLOAT` | NO | None | None | Physical reading obtained during inspection. |
| `expected_value` | `FLOAT` | NO | None | None | True nominal reference standard target. |
| `measurement_error` | `FLOAT` | NO | None | None | Calculated error: `round(measured_value - expected_value, 4)`. |
| `tolerance` | `FLOAT` | NO | None | None | Permissible error threshold from plan/type. |
| `pass_fail_result` | `VARCHAR(16)` | NO | None | None | Metrological outcome enum: `PASS` if `\|error\| <= tolerance`, else `FAIL`. |
| `calibration_remarks`| `TEXT` | YES | NULL | None | Metrologist observations, ambient temperature/humidity, drift notes. |
| `certificate_status` | `VARCHAR(32)` | NO | 'PENDING' | None | Certificate attachment status: `VALID`, `PENDING`, `MISSING`, `EXPIRED`, `REJECTED`. |
| `next_calibration_due_date`| `DATE` | NO | None | None | Recalibrated expiration date calculated deterministically from plan. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Immutable record timestamp. |

---

## 6. `certificates`
Official calibration certificates issued by accredited laboratories verifying traceable metrological measurement results.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | NO | None | **PK** | Deterministic identifier formatted as `CERT-<calibration_id>`. |
| `calibration_id` | `VARCHAR(64)` | NO | None | **FK, UK** | Exactly 1-to-1 linkage with `calibration_events(id)`. |
| `asset_id` | `VARCHAR(32)` | NO | None | **FK** | Cross-referenced asset identifier. Must match `calibration_events(asset_id)`. |
| `certificate_number` | `VARCHAR(64)` | NO | None | **UK** | Formal laboratory serial number (e.g., `CERT-MIT-2026-90412`). |
| `issue_date` | `DATE` | NO | None | None | Date calibration certificate was signed and certified. |
| `expiry_date` | `DATE` | NO | None | None | Validity end date. Must match calibration event's next due date. |
| `supplier_id` | `VARCHAR(32)` | YES | NULL | **FK** | Issuing calibration lab referencing `suppliers(id)`. |
| `approval_status` | `VARCHAR(32)` | NO | 'PENDING' | None | QA sign-off status enum: `APPROVED`, `PENDING`, `REJECTED`. |
| `document_location` | `VARCHAR(255)` | YES | NULL | None | Server disk storage path or secure URL to electronic PDF document. |
| `file_hash` | `VARCHAR(64)` | YES | NULL | None | SHA-256 cryptographic digest of PDF document for anti-tamper compliance. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Upload timestamp. |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Audit timestamp. |

---

## 7. `work_orders`
Corrective and preventive maintenance work orders generated for out-of-tolerance instruments, repairs, or re-calibrations.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic work order ID formatted as `WO-2026-000001`. Matches regex `^WO-\d{4}-\d{6}$`. |
| `asset_id` | `VARCHAR(32)` | NO | None | **FK** | Instrument under maintenance referencing `assets(id)`. |
| `related_calibration_id`| `VARCHAR(64)`| YES| NULL | **FK** | Direct foreign key referencing failed `calibration_events(id)`. |
| `work_order_type` | `VARCHAR(32)` | NO | 'CORRECTIVE' | None | Purpose enum: `CORRECTIVE` (triggered by failed cal), `PREVENTIVE`, `RECALIBRATION`, `REPAIR`. |
| `priority` | `VARCHAR(16)` | NO | 'MEDIUM' | None | Urgency enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`. |
| `description` | `TEXT` | NO | None | None | Detailed work scope and defect symptoms. |
| `assigned_technician`| `VARCHAR(64)` | YES | NULL | None | Quality or maintenance engineer assigned to execute repair. |
| `created_date` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Dispatch timestamp. |
| `planned_start_date` | `DATE` | YES | NULL | None | Scheduled start date. |
| `actual_start_date` | `DATE` | YES | NULL | None | Actual work start date. |
| `completion_date` | `DATE` | YES | NULL | None | Work sign-off date. Must be `>= actual_start_date`. |
| `downtime_hours` | `FLOAT` | NO | 0.0 | None | Cumulative manufacturing line downtime caused by instrument failure. |
| `status` | `VARCHAR(32)` | NO | 'OPEN' | None | Workflow state enum: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`. |
| `corrective_action` | `TEXT` | YES | NULL | None | Detailed engineering remediation performed (e.g., mechanical zero adjust, optical realignment). |
| `impact_assessment_status`| `VARCHAR(32)`| NO | 'PENDING'| None | Quality quarantine evaluation enum: `PENDING`, `COMPLETED`, `NOT_REQUIRED`. Required for all failed calibrations. |
| `impact_assessment_notes`| `TEXT` | YES | NULL | None | Evaluation of whether out-of-tolerance instrument contaminated past production lots. |
| `responsible_engineer`| `VARCHAR(64)`| YES | NULL | None | Lead quality engineer signing off on product containment. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Record creation timestamp. |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Record modification timestamp. |

---

## 8. `production_uses`
High-volume industrial usage log capturing every digital point-of-use scan before an instrument is allowed to inspect parts on a production line.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | NO | None | **PK** | Deterministic ID formatted as `USE-<asset_id>-<timestamp>`. |
| `asset_id` | `VARCHAR(32)` | NO | None | **FK** | Scanned measuring instrument referencing `assets(id)`. |
| `production_batch_id` | `VARCHAR(64)` | NO | None | None | Manufacturing work order / lot identifier (e.g., `BATCH-2026-A109`). |
| `production_line` | `VARCHAR(64)` | NO | None | None | Assembly line code (e.g., `Line 1 - CNC Milling`, `Line 3 - Cleanroom`). |
| `operator` | `VARCHAR(64)` | NO | None | None | Employee badge or name of line operator scanning instrument. |
| `usage_timestamp` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Exact timestamp of instrument scan. |
| `calibration_status_at_usage`| `VARCHAR(32)`| NO | None | None | Live state at scan time: `VALID`, `OVERDUE`, `FAILED_CALIBRATION`, `OUT_OF_SERVICE`. |
| `exception_approval_id`| `VARCHAR(64)`| YES | NULL | None | Deviation authorization number if run under Quality waiver (e.g., `EXC-QA-2026-081`). |
| `usage_decision` | `VARCHAR(32)` | NO | None | None | Automated gate decision: `ALLOWED`, `BLOCKED`, `ALLOWED_WITH_EXCEPTION`. |
| `issue_type` | `VARCHAR(64)` | YES | NULL | None | Root cause reason if blocked: `CALIBRATION_EXPIRED`, `UNAPPROVED_STATUS`, `CRITICAL_OVERDUE`. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Record creation timestamp. |

---

## 9. `alerts`
Centralized compliance alarm engine tracking regulatory and quality anomalies with lifecycle resolution states.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic identifier formatted as `ALT-2026-000001`. Matches regex `^ALT-\d{4}-\d{6}$`. |
| `asset_id` | `VARCHAR(32)` | NO | None | **FK** | Impacted asset referencing `assets(id)`. |
| `related_event_id` | `VARCHAR(64)` | YES | NULL | None | Correlated event ID (`CAL-...`, `CERT-...`, `WO-...`, `USE-...`). |
| `issue_type` | `VARCHAR(64)` | NO | None | None | Anomaly classification enum: `OVERDUE_CALIBRATION`, `CALIBRATION_DUE_SOON`, `FAILED_CALIBRATION`, `MISSING_CERTIFICATE`, `EXPIRED_CERTIFICATE`, `CERTIFICATE_ASSET_MISMATCH`, `EXPIRED_INSTRUMENT_USAGE`, `MISSING_IMPACT_ASSESSMENT`, `INCORRECT_CALIBRATION_DUE_DATE`. |
| `severity` | `VARCHAR(16)` | NO | 'MEDIUM' | None | Severity level enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`. |
| `description` | `TEXT` | NO | None | None | Detailed factual narrative of non-compliance condition. |
| `detection_timestamp`| `DATETIME` | NO | CURRENT_TIMESTAMP | None | System timestamp when condition was first detected. |
| `assigned_person` | `VARCHAR(64)` | YES | NULL | None | Assigned quality engineer or metrology manager. |
| `resolution_status` | `VARCHAR(32)` | NO | 'ACTIVE' | None | Alert state enum: `ACTIVE`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`. |
| `resolution_remarks`| `TEXT` | YES | NULL | None | CAPA resolution notes provided by quality team upon closure. |
| `resolved_at` | `DATETIME` | YES | NULL | None | Exact timestamp when alert was closed. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Audit timestamp. |

---

## 10. `audit_records`
Cryptographically auditable and immutable change ledger recording all critical system transitions, updates, and user overrides.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | NO | None | **PK** | Deterministic record ID formatted as `AUD-2026-000001`. Matches regex `^AUD-\d{4}-\d{6}$`. |
| `entity_type` | `VARCHAR(64)` | NO | None | None | Entity class: `Asset`, `CalibrationEvent`, `Certificate`, `WorkOrder`, `ProductionUse`, `Alert`, `CalibrationPlan`. |
| `entity_id` | `VARCHAR(64)` | NO | None | None | Primary key of modified entity. |
| `action` | `VARCHAR(32)` | NO | None | None | Operation enum: `CREATE`, `UPDATE`, `STATUS_CHANGE`, `SCHEDULE_RESCHEDULE`, `USAGE_BLOCKED`, `ALERT_RESOLVED`, `CERTIFICATE_UPLOAD`. |
| `previous_value` | `TEXT` | YES | NULL | None | JSON snapshot of record state prior to modification. |
| `new_value` | `TEXT` | YES | NULL | None | JSON snapshot of record state following modification. |
| `user` | `VARCHAR(64)` | NO | 'SYSTEM' | None | User username, email, or persona responsible for action. |
| `timestamp` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Immutable wall-clock execution timestamp. |
| `reason` | `TEXT` | YES | NULL | None | Mandatory business justification for critical edits (e.g., reschedule justifications). |

---

## 11. `ground_truth`
Benchmark evaluation table storing known synthetic defects and anomalies injected during data generation for automated testing and algorithm scoring.

| Column Name | Data Type | Nullable | Default | PK/FK/UK | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto-Increment | **PK** | Surrogate identifier. |
| `edge_case_type` | `VARCHAR(64)` | NO | None | None | Edge case category enum: `DUE_DATE_MISMATCH`, `EXPIRED_USAGE`, `CERTIFICATE_ASSET_MISMATCH`, `MISSING_IMPACT_ASSESSMENT`. |
| `entity_type` | `VARCHAR(64)` | NO | None | None | Target table: `Asset`, `ProductionUse`, `Certificate`, `CalibrationEvent`. |
| `entity_id` | `VARCHAR(64)` | NO | None | None | Specific primary key of injected anomaly. |
| `expected_alert_type`| `VARCHAR(64)`| NO | None | None | Correlated alert type that anomaly detection engine must flag. |
| `description` | `TEXT` | NO | None | None | Technical narrative of intentional discrepancy for auditing. |
| `detected` | `TINYINT(1)` | NO | 0 | None | Boolean flag (1=True, 0=False) indicating successful system detection. |
| `detection_alert_id` | `VARCHAR(32)` | YES | NULL | None | References `alerts(id)` generated by automated detection engine. |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | None | Ingestion timestamp. |
