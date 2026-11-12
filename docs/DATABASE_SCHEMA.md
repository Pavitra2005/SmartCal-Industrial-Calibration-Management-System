# SmartCal Database Schema Documentation

## 1. Overview
SmartCal uses a normalized, relational MySQL / MariaDB architecture with explicit primary keys, foreign key constraints, column indices, and domain check rules. All tables use `utf8mb4` character set with `InnoDB` storage engine for ACID transaction guarantees.

Database Name: `smartcal_db`  
Dialect: `MySQL 8.0` / `MariaDB 10.4+`  
ORM: `Flask-SQLAlchemy` (SQLAlchemy 2.x)

---

## 2. Table Specifications

### 2.1 `instrument_types`
Master categorization for measuring equipment, containing physical units, standard intervals, and metrological tolerances.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique type identifier |
| `type_code` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Deterministic code (`DIG_CALIPER`, `PRESS_GAUGE`) |
| `name` | VARCHAR(100) | NOT NULL | Human-readable name |
| `category` | VARCHAR(50) | NOT NULL | Physical domain (Dimensional, Pressure, Thermal, etc.) |
| `default_interval_months`| INT | DEFAULT 6 | Default calibration interval |
| `default_tolerance` | FLOAT | DEFAULT 0.05 | Default tolerance limit (±) |
| `unit_of_measure` | VARCHAR(30) | DEFAULT 'mm' | Engineering unit (mm, bar, °C, Nm) |
| `description` | TEXT | NULLABLE | Equipment category documentation |

### 2.2 `suppliers`
Calibration service providers, testing laboratories, and OEM manufacturers.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique ID (`SUP-0001`...) |
| `name` | VARCHAR(150) | NOT NULL, INDEX | Laboratory / Vendor Name |
| `contact_name` | VARCHAR(100) | NULLABLE | Primary representative |
| `contact_email` | VARCHAR(120) | NULLABLE | Contact email |
| `contact_phone` | VARCHAR(50) | NULLABLE | Phone number |
| `calibration_services` | TEXT | NULLABLE | Scope of accredited services |
| `accreditation_details`| VARCHAR(255)| NULLABLE | E.g. ISO/IEC 17025:2017 A2LA #2491.01 |
| `address` | TEXT | NULLABLE | Facility address |
| `status` | VARCHAR(30) | DEFAULT 'ACTIVE', INDEX | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `created_at` | DATETIME | DEFAULT UTC | Record creation timestamp |
| `updated_at` | DATETIME | ON UPDATE UTC | Last updated timestamp |

### 2.3 `calibration_plans`
Protocol definitions governing recurring calibration frequencies, tolerances, and procedures.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique plan ID (`PLAN-0001`...) |
| `plan_name` | VARCHAR(150) | NOT NULL | Protocol designation |
| `instrument_type_id` | INT | FOREIGN KEY (`instrument_types.id`), INDEX | Targeted equipment category |
| `calibration_interval`| INT | NOT NULL, DEFAULT 6 | Frequency number |
| `interval_unit` | VARCHAR(20) | NOT NULL, DEFAULT 'months'| `days`, `months`, `years` |
| `tolerance_limits` | FLOAT | NOT NULL | Maximum allowable measurement error (±) |
| `due_date_calc_method`| VARCHAR(50) | DEFAULT 'FROM_LAST_CALIBRATION' | Calculation algorithm |
| `responsible_department`|VARCHAR(100)| NOT NULL | Metrology or Quality Assurance team |
| `supplier_id` | VARCHAR(50) | FOREIGN KEY (`suppliers.id`), NULLABLE | Preferred calibration contractor |
| `effective_start_date`| DATE | NOT NULL | Implementation start |
| `effective_end_date` | DATE | NULLABLE | Expiration / revision date |
| `plan_status` | VARCHAR(30) | DEFAULT 'ACTIVE', INDEX | `ACTIVE`, `INACTIVE`, `REVISED` |
| `created_at` | DATETIME | DEFAULT UTC | Timestamp |

### 2.4 `assets` (Instruments)
The central instrument registry representing individual physical calibrated tools.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Deterministic ID (`AST-000001`, `AST-000002`...) |
| `name` | VARCHAR(150) | NOT NULL, INDEX | Instrument name |
| `instrument_type_id` | INT | FOREIGN KEY (`instrument_types.id`), INDEX | Category reference |
| `manufacturer` | VARCHAR(100) | NOT NULL | E.g. Mitutoyo, Fluke, WIKA |
| `model_number` | VARCHAR(100) | NOT NULL | Model identifier |
| `serial_number` | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | Physical device serial number |
| `description` | TEXT | NULLABLE | Operational context & location |
| `location` | VARCHAR(100) | NOT NULL, INDEX | Facility bay, cleanroom, or bench |
| `department` | VARCHAR(100) | NOT NULL, INDEX | Responsible operating group |
| `criticality_level` | VARCHAR(20) | DEFAULT 'MEDIUM', INDEX | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `installation_date` | DATE | NOT NULL | Facility commissioning date |
| `calibration_interval`| INT | NOT NULL, DEFAULT 6 | Interval duration |
| `interval_unit` | VARCHAR(20) | NOT NULL, DEFAULT 'months'| Unit of interval |
| `tolerance_limit` | FLOAT | NOT NULL | Permissible deviation (±) |
| `last_calibration_date`|DATE | NULLABLE | Date of most recent calibration |
| `next_calibration_due_date`| DATE| NOT NULL, INDEX | Deterministically calculated due date |
| `current_status` | VARCHAR(30) | DEFAULT 'ACTIVE', INDEX | `ACTIVE`, `OVERDUE`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE`, `RETIRED` |
| `supplier_id` | VARCHAR(50) | FOREIGN KEY (`suppliers.id`), NULLABLE | Assigned calibration lab |
| `calibration_plan_id`| VARCHAR(50) | FOREIGN KEY (`calibration_plans.id`), NULLABLE | Associated plan |
| `created_at` | DATETIME | DEFAULT UTC | Commissioning record timestamp |
| `updated_at` | DATETIME | ON UPDATE UTC | Profile modification timestamp |

### 2.5 `calibration_events`
Historical metrological execution records. Never overwritten.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(80) | PRIMARY KEY | Deterministic ID (`CAL-<asset-id>-2026-000001`...) |
| `asset_id` | VARCHAR(50) | FOREIGN KEY (`assets.id`), INDEX | Subject instrument |
| `calibration_date` | DATE | NOT NULL, INDEX | Date metrology was executed |
| `technician` | VARCHAR(100) | NOT NULL | Performing technician / metrologist |
| `supplier_id` | VARCHAR(50) | FOREIGN KEY (`suppliers.id`), NULLABLE | Performing lab |
| `reference_standard` | VARCHAR(150) | NOT NULL | NIST traceable standard identifier |
| `measured_value` | FLOAT | NOT NULL | Observed reading on standard |
| `expected_value` | FLOAT | NOT NULL | Reference standard nominal value |
| `measurement_error` | FLOAT | NOT NULL | `measured_value - expected_value` |
| `tolerance` | FLOAT | NOT NULL | Allowable tolerance threshold |
| `pass_fail_result` | VARCHAR(10) | NOT NULL, INDEX | `PASS` or `FAIL` |
| `calibration_remarks`| TEXT | NULLABLE | Uncertainty notes, ambient temp/humidity |
| `certificate_status` | VARCHAR(30) | DEFAULT 'PENDING_APPROVAL', INDEX | `VALID`, `MISSING`, `EXPIRED`, `PENDING_APPROVAL`, `MISMATCH` |
| `next_calibration_due_date`| DATE | NOT NULL | Auto-computed next calibration date |
| `created_at` | DATETIME | DEFAULT UTC | Record creation timestamp |

### 2.6 `certificates`
Conformity documents and digital certificate records linked to calibration events.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(120)| PRIMARY KEY | Format: `CERT-<calibration-id>` |
| `calibration_id` | VARCHAR(80) | FOREIGN KEY (`calibration_events.id`), UNIQUE, INDEX | One-to-one link with calibration event |
| `asset_id` | VARCHAR(50) | FOREIGN KEY (`assets.id`), INDEX | Referenced asset (checked for mismatch) |
| `certificate_number`| VARCHAR(100)| NOT NULL, INDEX | Official paper/digital certificate number |
| `issue_date` | DATE | NOT NULL | Date of signoff |
| `expiry_date` | DATE | NOT NULL, INDEX | Valid through date |
| `supplier_id` | VARCHAR(50) | FOREIGN KEY (`suppliers.id`), NULLABLE | Issuing metrology lab |
| `approval_status` | VARCHAR(30) | DEFAULT 'APPROVED', INDEX | `APPROVED`, `PENDING`, `REJECTED` |
| `document_location` | VARCHAR(255)| NOT NULL | File storage location or URL |
| `file_size_kb` | INT | DEFAULT 150 | Digital file size |
| `verification_status`| VARCHAR(30)| DEFAULT 'VERIFIED', INDEX | `VERIFIED`, `MISMATCH_FLAGGED`, `MISSING_FLAGGED` |
| `created_at` | DATETIME | DEFAULT UTC | Upload timestamp |

### 2.7 `work_orders`
Maintenance, corrective actions, tool quarantine, and engineering impact assessments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique ID (`WO-2026-000001`...) |
| `asset_id` | VARCHAR(50) | FOREIGN KEY (`assets.id`), INDEX | Target instrument |
| `related_calibration_id`| VARCHAR(80)| FOREIGN KEY (`calibration_events.id`), NULLABLE | Failure event that triggered this job |
| `work_order_type` | VARCHAR(50) | NOT NULL, DEFAULT 'CORRECTIVE_CALIBRATION' | `CORRECTIVE_CALIBRATION`, `PREVENTATIVE_MAINTENANCE`, `REPAIR` |
| `priority` | VARCHAR(20) | DEFAULT 'HIGH', INDEX | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `description` | TEXT | NOT NULL | Scope of work |
| `assigned_technician`| VARCHAR(100)| NULLABLE | Lead maintenance technician |
| `created_date` | DATE | NOT NULL, INDEX | Job open date |
| `planned_start_date` | DATE | NULLABLE | Scheduled start |
| `actual_start_date` | DATE | NULLABLE | Actual work commencement |
| `completion_date` | DATE | NULLABLE | Job signoff date |
| `downtime_hours` | FLOAT | DEFAULT 0.0 | Cumulative tool downtime |
| `status` | VARCHAR(30) | DEFAULT 'OPEN', INDEX | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `corrective_action` | TEXT | NULLABLE | Remediation steps executed |
| `impact_assessment_status`|VARCHAR(30)| DEFAULT 'PENDING', INDEX | `PENDING`, `COMPLETED`, `NOT_REQUIRED` |
| `impact_assessment_notes` | TEXT | NULLABLE | Engineering lot review notes |
| `responsible_engineer`| VARCHAR(100)| NULLABLE | Signing Quality Assurance Engineer |
| `created_at` | DATETIME | DEFAULT UTC | Timestamp |
| `updated_at` | DATETIME | ON UPDATE UTC | Timestamp |

### 2.8 `production_uses`
Tool checkout attempts during production batch runs. Both allowed and blocked uses are persisted.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(80) | PRIMARY KEY | Deterministic ID (`USE-<asset-id>-<epoch>`) |
| `asset_id` | VARCHAR(50) | FOREIGN KEY (`assets.id`), INDEX | Tool scanned |
| `production_batch_id`| VARCHAR(80)| NOT NULL, INDEX | Batch lot code |
| `production_line` | VARCHAR(100)| NOT NULL, INDEX | Factory line |
| `operator` | VARCHAR(100)| NOT NULL | Scanner operator |
| `usage_timestamp` | DATETIME | NOT NULL, INDEX | Scan timestamp |
| `calibration_status_at_usage`|VARCHAR(30)| NOT NULL | `CALIBRATED`, `OVERDUE`, `FAILED`, `UNAVAILABLE` |
| `exception_approval_id`| VARCHAR(80)| NULLABLE | Quality exception authorization ID |
| `usage_decision` | VARCHAR(30) | NOT NULL, INDEX | `ALLOWED`, `BLOCKED`, `ALLOWED_WITH_EXCEPTION` |
| `issue_type` | VARCHAR(50) | NULLABLE, INDEX | `EXPIRED_USAGE`, `FAILED_CALIBRATION_USAGE`, `NONE` |
| `notes` | TEXT | NULLABLE | Validation reasoning |

### 2.9 `alerts`
Quality alarms and non-conformance events requiring review or investigation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique ID (`ALT-2026-000001`...) |
| `asset_id` | VARCHAR(50) | FOREIGN KEY (`assets.id`), INDEX | Affected instrument |
| `related_event_id` | VARCHAR(80) | NULLABLE, INDEX | Calibration, certificate, or usage ID |
| `issue_type` | VARCHAR(50) | NOT NULL, INDEX | 9 standard categories (see Data Dictionary) |
| `severity` | VARCHAR(20) | NOT NULL, INDEX | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `description` | TEXT | NOT NULL | Detailed finding |
| `detection_timestamp`| DATETIME | DEFAULT UTC, INDEX | Automated scanner detection time |
| `assigned_person` | VARCHAR(100)| NULLABLE | Current assignee |
| `resolution_status` | VARCHAR(30) | DEFAULT 'OPEN', INDEX | `OPEN`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED` |
| `resolution_remarks`| TEXT | NULLABLE | Documented RCA and corrective action |
| `resolved_at` | DATETIME | NULLABLE | Resolution timestamp |
| `resolved_by` | VARCHAR(100)| NULLABLE | User resolving the alarm |

### 2.10 `audit_records`
Immutable chronological ledger recording all state mutations across the application.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Sequence number |
| `audit_id` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Unique ID (`AUD-2026-000001`...) |
| `entity_type` | VARCHAR(50) | NOT NULL, INDEX | `ASSET`, `CALIBRATION`, `CERTIFICATE`, `WORK_ORDER`, `PRODUCTION_USE`, `ALERT`, `CALIBRATION_PLAN` |
| `entity_id` | VARCHAR(80) | NOT NULL, INDEX | Primary key of mutated entity |
| `action` | VARCHAR(50) | NOT NULL, INDEX | `CREATE`, `UPDATE`, `STATUS_CHANGE`, `CALIBRATE`, `RESCHEDULE`, `APPROVE_EXCEPTION`, `RESOLVE_ALERT`, `RECORD_USAGE` |
| `previous_value` | TEXT | NULLABLE | Serialized JSON snapshot of prior state |
| `new_value` | TEXT | NULLABLE | Serialized JSON snapshot of new state |
| `user` | VARCHAR(100)| NOT NULL, INDEX | Active actor / user role |
| `timestamp` | DATETIME | DEFAULT UTC, INDEX | Audit timestamp |
| `reason` | TEXT | NULLABLE | Justification entered by operator |

### 2.11 `ground_truth`
Isolated benchmark repository of known injected anomalies used for evaluation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Auto ID |
| `issue_id` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Benchmark ID (`GT-EC1-001`...) |
| `entity_id` | VARCHAR(80) | NOT NULL, INDEX | Entity carrying the defect |
| `entity_type` | VARCHAR(50) | NOT NULL | Type of entity |
| `issue_type` | VARCHAR(50) | NOT NULL, INDEX | Expected detected issue type |
| `expected_decision` | VARCHAR(50) | NOT NULL | Expected system action |
| `expected_severity` | VARCHAR(20) | NOT NULL | Expected severity level |
| `description` | TEXT | NOT NULL | Defect injection description |
| `injected_case_label`| VARCHAR(50)| NOT NULL, INDEX | `EDGE_CASE_1`, `EDGE_CASE_2`, `EDGE_CASE_3`, `EDGE_CASE_4` |
| `created_at` | DATETIME | DEFAULT UTC | Generation timestamp |
