<<<<<<< HEAD
# SmartCal – Industrial Calibration & Instrument Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Validation Suite](https://img.shields.io/badge/validation-19%2F19%20checks%20passed-success.svg)]()
[![Benchmark Detection](https://img.shields.io/badge/benchmark%20recall-100%25-blue.svg)]()
[![Python](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)]()
[![React](https://img.shields.io/badge/react-18.x-cyan.svg)]()
[![MySQL](https://img.shields.io/badge/database-MySQL%20%7C%20MariaDB-orange.svg)]()

> **SmartCal** is a complete, production-grade, enterprise web application designed for manufacturing plants, aerospace facilities, automotive assembly lines, and metrology calibration laboratories to manage measuring instruments, automated calibration schedules, traceable digital certificates, maintenance work orders, point-of-use production safety gating, compliance alerts, and 21 CFR Part 11 auditable history.

---

## Table of Contents
1. [Key Features & Capabilities](#key-features--capabilities)
2. [Technology Stack](#technology-stack)
3. [Enterprise UI/UX Design System](#enterprise-uiux-design-system)
4. [Application Modules (13 Navigation Sections)](#application-modules-13-navigation-sections)
5. [The 4 Injected Edge Cases & Benchmark Targets](#the-4-injected-edge-cases--benchmark-targets)
6. [Synthetic Data Generation Engine](#synthetic-data-generation-engine)
7. [Automated Validation Suite & Benchmark Metrics](#automated-validation-suite--benchmark-metrics)
8. [Installation & Getting Started](#installation--getting-started)
9. [Running Tests](#running-tests)
10. [REST API Documentation](#rest-api-documentation)
11. [Project Documentation Directory](#project-documentation-directory)

---

## 1. Key Features & Capabilities

- **Real Relational Persistence:** Fully backed by MySQL/MariaDB (`smartcal_db`) using strict foreign keys, cascading rules, unique serial constraints, and indexed lookups. Zero reliance on `localStorage` for business records.
- **Deterministic Asset & Event Formatting:** Clean enterprise ID naming conventions:
  - Assets: `AST-000001` to `AST-999999`
  - Calibration Events: `CAL-<asset_id>-2026-000001`
  - Certificates: `CERT-<cal_id>`
  - Work Orders: `WO-2026-000001`
  - Production Scans: `USE-<asset_id>-<timestamp>`
  - Alerts: `ALT-2026-000001`
  - Audit Ledger: `AUD-2026-000001`
- **Metrology Inspection Logic:** Automatic calculation of measurement error `(measured - expected)` with 4-decimal precision, tolerance comparisons, automatic PASS/FAIL classification, and deterministic next due date projection based on active calibration plans.
- **Fail-Safe Corrective Action Automation:** Out-of-tolerance calibrations automatically generate high-priority corrective maintenance work orders, mark instruments out-of-service, and mandate Quality containment impact assessments.
- **Zero-Trust Production Point-of-Use Safety Gate:** Prevents expired, uncalibrated, or quarantined instruments from inspecting manufacturing production lots. Blocked usage attempts are logged as permanent auditable events and trigger critical compliance alarms.
- **Cryptographic & Traceable Certificate Vault:** Upload, view, and inspect digital calibration certificates with SHA-256 anti-tamper hashes and automatic cross-asset mismatch verification.
- **19-Point Automated Relational & Quality Validation Suite:** Comprehensive integrity verification spanning database relations, metrology formulas, and regulatory compliance.
- **Ground-Truth Benchmark Scoring:** Built-in evaluation engine calculating Confusion Matrices, Precision, Recall, and F1 scores against synthetic defect injection targets with a verified **100% anomaly detection rate**.

---

## 2. Technology Stack

### Frontend Architecture
- **Framework:** React 18 with Vite for lightning-fast HMR and optimized production bundling
- **Styling:** Tailwind CSS with custom enterprise industrial design tokens
- **Icons:** Lucide React icons for clean, modern iconography
- **Charts:** Recharts for responsive, interactive manufacturing analytics
- **Routing:** React Router v6 for single-page client routing across all 13 modules
- **API Layer:** Axios with centralized interceptors, error handling, and toast alerts

### Backend Architecture
- **Runtime:** Python 3.11+ / Python 3.13
- **Framework:** Flask with modular Blueprints (14 route blueprints)
- **ORM:** Flask-SQLAlchemy with PyMySQL driver
- **CORS:** Flask-CORS with configurable origins
- **Analytics & Data Generation:** Pandas, NumPy, and Cryptography
- **Database Engine:** MySQL 8.0+ / MariaDB 10.4+ on port 3307/3306

---

## 3. Enterprise UI/UX Design System

The SmartCal interface is crafted following modern industrial SaaS guidelines (Siemens, Rockwell Automation, Honeywell, SAP Fiori):

- **Primary Color:** Deep Navy Blue (`#142B4A`) representing metrology precision and stability.
- **Secondary Color:** Royal Blue (`#2563EB`) for interactive buttons, tabs, and focus rings.
- **Background:** Industrial Light Gray (`#F5F7FB`) providing high contrast and minimal eye fatigue.
- **Cards & Surfaces:** Clean White (`#FFFFFF`) with subtle border lines (`#E2E8F0`) and soft shadows (`shadow-sm`).
- **Semantic Indicators:**
  - Success / Pass: Emerald Green (`#059669` / `#10B981`)
  - Warning / Due Soon: Amber (`#D97706` / `#F59E0B`)
  - Critical / Failed / Blocked: Crimson Red (`#DC2626` / `#EF4444`)
  - Informational: Indigo (`#4F46E5`)
- **Typography:** Modern clean sans-serif typography (`Inter`, `system-ui`) with clear typographic hierarchy.
- **Interactions:** Subtle hover states, smooth transitions, keyboard escape handling on modals, accessible ARIA labels, loading skeletons, and zero cluttered or oversized elements.

---

## 4. Application Modules (13 Navigation Sections)

The sidebar provides direct access to all 13 operational modules:

1. **Overview Dashboard (`/`):**
   - **8 Live KPI Metric Cards:** Total Instruments, Active Instruments, Overdue Instruments, Due Within 30 Days, Failed Calibrations, Valid Certificates, Open Work Orders, Active Alerts.
   - **6 Interactive Visual Analytics Charts:** Calibration Pass/Fail Distribution (Pie), Monthly Calibration Trends (Bar), Fleet Status Breakdown (Donut), Overdue Instruments by Equipment Type (Bar), Production Usage Scans & Violations (Area), and Work Order Status Breakdown (Bar).
   - **Real-Time Tables:** Recent activities log, upcoming calibration schedule preview, and critical alert notices.
2. **Instrument Management (`/instruments` & `/instruments/:id`):**
   - Comprehensive equipment registry with search, status filters (`ACTIVE`, `OVERDUE`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE`), type filters, and location filters.
   - New instrument registration with strict duplicate serial number checks.
   - **360-Degree Asset Detail View:** Dedicated tabbed history showing past calibration inspections, issued certificates, corrective work orders, and production usage events.
3. **Calibration Schedule (`/schedule`):**
   - Upcoming calibration agenda, overdue inspections list, and filters for "Due This Week" and "Due This Month".
   - Plan-driven due date calculations.
   - Formal rescheduling action requiring recorded business justifications and immutable audit entries.
   - Active calibration governance plans table.
4. **Calibration History (`/calibrations`):**
   - Historical log of calibration events.
   - Interactive modal to record new calibrations with live measurement error calculation, tolerance comparison, pass/fail tagging, and auto-dispatch of corrective work orders upon failure.
5. **Certificates (`/certificates`):**
   - Repository of digital metrology certificates.
   - PDF upload modal with automatic SHA-256 hashing.
   - Filter by status (`APPROVED`, `PENDING`, `REJECTED`).
   - Cross-asset mismatch detection banner alerting users if a certificate references an unintended asset.
6. **Work Orders (`/work-orders`):**
   - Corrective and preventive maintenance tracking with priority tagging (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Downtime hours calculator and chronological date sequencing.
   - Quality containment impact assessment workflow.
7. **Production Usage (`/production-usage`):**
   - Interactive Point-of-Use Safety Gate simulator: scan an instrument barcode and batch number to determine if tool is authorized for production inspection.
   - Complete scan log distinguishing `ALLOWED` from `BLOCKED` attempts.
   - Exception authorization verification for emergency waivers.
8. **Alerts & Exceptions (`/alerts`):**
   - Unified compliance alarm center across 9 distinct non-compliance vectors.
   - Severity filters (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Action workflows: Acknowledge alert, assign quality engineer, and resolve with documented CAPA notes.
9. **Suppliers (`/suppliers`):**
   - Directory of internal metrology labs and ISO/IEC 17025 accredited calibration vendors.
   - Scope of accreditation details, vendor approval statuses, and direct links to executed calibrations.
10. **Audit Trail (`/audit-trail`):**
    - 21 CFR Part 11 compliant immutable log of system state transitions.
    - Interactive modal showing formatted JSON state diffs (before vs after values).
11. **Reports & Analytics (`/reports`):**
    - Quality performance scorecards: Calibration Pass Rate (%), Calibration On-Time Compliance Rate (%), Average Work Order Closure Time (Hours), and Certificate Coverage (%).
    - One-click export of data to CSV spreadsheets.
    - One-click export of the complete database to raw MySQL SQL seed dumps.
12. **Data Validation (`/validation`):**
    - Visual execution runner for the 19-point automated integrity verification suite.
    - Ground-truth benchmark scorecard displaying Confusion Matrix, Precision, Recall, and F1 metrics.
    - Export validation results to JSON and CSV formats.
13. **Settings (`/settings`):**
    - Live MySQL connection status and engine telemetry.
    - Role-Based Access Control persona selector (`Quality Engineer`, `Production Operator`, `Calibration Planner`, `Plant Admin`).
    - Synthetic Data Generator controls allowing on-demand re-seeding between `starter` (100 assets) and `full` (2,000 assets) scales.

---

## 5. The 4 Injected Edge Cases & Benchmark Targets

To evaluate quality compliance algorithms, the synthetic generator embeds 4 intentional anomalies:

| Anomaly Key | Description | Target Record | Expected Alert Type | Severity | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DUE_DATE_MISMATCH`** | Stored asset next calibration due date differs from plan formula. | `AST-000015` | `INCORRECT_CALIBRATION_DUE_DATE` | `HIGH` | Automated validation check #10 and #16 re-calculate formula and flag divergence. |
| **`EXPIRED_USAGE`** | Point-of-use scan executed on an expired asset without approved waiver. | `USE-AST-000022-...` | `EXPIRED_INSTRUMENT_USAGE` | `CRITICAL` | Usage service blocks the scan (`BLOCKED`), writes usage record, and fires critical alert. |
| **`CERTIFICATE_ASSET_MISMATCH`**| Certificate document references Asset A but is linked to Asset B's calibration. | `CERT-CAL-AST-000045-...` | `CERTIFICATE_ASSET_MISMATCH` | `CRITICAL` | Certificate audit check flags mismatched foreign keys `certificate.asset_id != event.asset_id`. |
| **`MISSING_IMPACT_ASSESSMENT`** | Instrument failed calibration, but corrective work order impact assessment is pending. | `CAL-AST-000088-...` | `MISSING_IMPACT_ASSESSMENT` | `HIGH` | Work order scanner detects unresolved quality containment risk for out-of-spec tool. |

---

## 6. Synthetic Data Generation Engine

The system contains an enterprise synthetic data generation engine in [`backend/services/data_generator.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/data_generator.py):

- **Fixed Seeds:** Initialized with `seed=20261022` using both `random.seed(20261022)` and `numpy.random.seed(20261022)` for 100% deterministic reproducibility.
- **Configurable Scales:**
  - **Starter Scale:** 100 instruments, 250 calibration events, 5,000 production usage scans (~2.5 sec ingestion).
  - **Full Scale:** 2,000 instruments, 5,000 calibration events, 100,000 production usage scans (~45 sec ingestion).
- **Relational Sequence:** Master tables (`instrument_types` -> `suppliers` -> `calibration_plans` -> `assets`) seeded first, followed by dependent transaction tables (`calibration_events` -> `certificates` -> `work_orders` -> `production_uses` -> `alerts` -> `audit_records` -> `ground_truth`).
- **Benchmark Artifacts:** Automatically exports ground-truth defect targets to `backend/ground_truth.json` and `backend/ground_truth.csv`.

---

## 7. Automated Validation Suite & Benchmark Metrics

The automated test and evaluation suite provides verifiable proof of system correctness:

### Validation Suite Results (19 Rules)
- **Rules Evaluated:** 19
- **Rules Passed Cleanly:** 16 (100% schema, foreign keys, math, and date sequencing integrity)
- **Rules with Warnings:** 3 (Corresponds exactly to the 3 intentional ground-truth benchmark defects: Edge Cases 1, 3, and 4)
- **Fatal Database Failures:** 0

### Benchmark Anomaly Detection Scorecard
- **True Positives (TP):** 4
- **False Positives (FP):** 0
- **False Negatives (FN):** 0
- **Precision:** **1.0000 (100.0%)**
- **Recall (Sensitivity):** **1.0000 (100.0%)**
- **F1 Score:** **1.0000 (100.0%)**
- **Detection Rate:** **100.0%**

---

## 8. Installation & Getting Started

### Prerequisites
- **Python 3.11+** (Tested on Python 3.13)
- **Node.js 18+ & npm** (For frontend assets)
- **MySQL 8.0+ or MariaDB 10.4+**

### Step 1: Database Setup
Start your MySQL or MariaDB instance and create the database:
```sql
CREATE DATABASE smartcal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure your connection string in `backend/.env` or `backend/config.py`:
```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/smartcal_db
SECRET_KEY=smartcal-super-secret-key-2026
UPLOAD_FOLDER=uploads
```

### Step 2: Backend Setup & Seeding
Install backend Python packages:
```bash
pip install flask flask-cors flask-sqlalchemy pymysql cryptography pandas numpy python-dotenv
```

Seed the database with deterministic synthetic data (Starter Scale):
```bash
python -c "from backend.app import app; from backend.database import db; from backend.services.data_generator import seed_database; app.app_context().push(); seed_database(scale='starter', seed=20261022)"
```

### Step 3: Frontend Build
Build the production frontend single-page application:
```bash
cd frontend
npm install
npm run build
cd ..
```
The compiled assets will be placed in `frontend/dist/`.

### Step 4: Run Application
Start the Flask backend server. When running in production mode, Flask automatically serves the compiled React application directly from `frontend/dist/`:
```bash
python backend/app.py
```
Open your web browser to:
```
http://127.0.0.1:5000/
```

*Note: For frontend hot-reloading development, run `npm run dev` in `frontend/` to run Vite on `http://127.0.0.1:5173/`, which proxies API requests to port 5000.*

---

## 9. Running Tests

Execute the comprehensive automated end-to-end test suite:
```bash
python tests/test_smartcal_e2e.py
```

### Test Coverage:
- `test_01_database_and_models`: Schema structure and row counts across all 11 tables.
- `test_02_synthetic_data_generator`: Reproducibility with seed `20261022`.
- `test_03_edge_case_1_due_date_mismatch`: Due date discrepancy detection.
- `test_04_edge_case_2_expired_usage_blocked`: Zero-trust production point-of-use blocking.
- `test_05_edge_case_3_cert_asset_mismatch`: Certificate cross-asset discrepancy detection.
- `test_06_edge_case_4_missing_impact_assessment`: Containment alert verification for failed calibrations.
- `test_07_validation_service_integrity`: 19-point automated validation runner.
- `test_08_evaluation_service_benchmark`: Benchmark scoring and 100% recall verification.
- `test_09_calibration_workflow_and_work_order`: Fail-safe corrective work order generation.
- `test_10_production_usage_service`: Real-time scanning gate evaluation.
- `test_11_exports_csv_and_sql`: CSV spreadsheet and MySQL SQL seed dump streaming.

---

## 10. REST API Documentation

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Service health and database ping. |
| **Dashboard** | `GET` | `/api/dashboard/stats` | 8 live operational KPI metric values. |
| | `GET` | `/api/dashboard/charts` | Aggregated data series for 6 charts. |
| | `GET` | `/api/dashboard/recent-activities` | Recent operational activities. |
| | `GET` | `/api/dashboard/critical-alerts` | Active high-priority non-compliance alarms. |
| | `GET` | `/api/dashboard/upcoming-schedule`| Upcoming calibration preview. |
| **Instruments**| `GET` | `/api/instruments` | Filterable list of all equipment. |
| | `POST` | `/api/instruments` | Register new instrument with unique serial. |
| | `GET` | `/api/instruments/:id` | Full instrument detail and 360 history. |
| | `PUT` | `/api/instruments/:id` | Update instrument specifications. |
| **Schedule** | `GET` | `/api/schedule/upcoming` | Calibrations due within 30 days. |
| | `GET` | `/api/schedule/overdue` | Overdue calibrations list. |
| | `POST` | `/api/schedule/reschedule` | Reschedule due date with audit reason. |
| | `GET` | `/api/schedule/plans` | Governance calibration plans. |
| **Calibrations**| `GET` | `/api/calibrations` | Calibration events history. |
| | `POST` | `/api/calibrations` | Record new inspection; auto-creates work order on fail. |
| **Certificates**| `GET` | `/api/certificates` | Calibration certificates list. |
| | `POST` | `/api/certificates/upload` | Upload PDF certificate with SHA-256 hash. |
| | `GET` | `/api/certificates/download/:id` | Securely download certificate file. |
| | `PUT` | `/api/certificates/:id/approve` | Quality approval sign-off. |
| **Work Orders** | `GET` | `/api/work-orders` | Maintenance work orders list. |
| | `PUT` | `/api/work-orders/:id/status`| Transition status (`IN_PROGRESS`, `COMPLETED`, etc.). |
| | `PUT` | `/api/work-orders/:id/impact-assessment` | Submit quality containment assessment. |
| **Usage** | `POST` | `/api/usage/validate` | Point-of-use gate evaluation (`ALLOWED` vs `BLOCKED`). |
| | `GET` | `/api/usage/history` | Historical production scanning records. |
| **Alerts** | `GET` | `/api/alerts` | Compliance alerts inbox. |
| | `PUT` | `/api/alerts/:id/acknowledge`| Acknowledge alert. |
| | `PUT` | `/api/alerts/:id/assign` | Assign quality engineer to alert. |
| | `PUT` | `/api/alerts/:id/resolve` | Resolve alert with CAPA remarks. |
| **Suppliers** | `GET` | `/api/suppliers` | Accredited laboratories and vendors. |
| **Audit Trail**| `GET` | `/api/audit-trail` | 21 CFR Part 11 immutable state change ledger. |
| **Reports** | `GET` | `/api/reports/kpis` | Aggregated compliance rates and closure times. |
| | `GET` | `/api/reports/export/:entity`| Download CSV spreadsheet export. |
| | `GET` | `/api/reports/export-sql-dump` | Download complete MySQL SQL seed dump. |
| **Validation** | `GET` | `/api/validation/run` | Execute 19-point validation suite. |
| | `GET` | `/api/validation/export` | Download validation suite results (JSON/CSV). |
| **Evaluation** | `GET` | `/api/evaluation/benchmark` | Confusion Matrix and evaluation metrics against ground truth. |
| **Settings** | `GET` | `/api/settings/status` | Database engine and connection info. |
| | `POST` | `/api/settings/reseed` | Trigger synthetic data re-seeding (`starter`/`full`). |

---

## 11. Project Documentation Directory

Detailed architectural and engineering documentation is available in the [`docs/`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/) directory:

- [ER_DIAGRAM.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/ER_DIAGRAM.md): Mermaid Entity-Relationship diagram showing PKs, FKs, constraints, and cardinalities.
- [DATABASE_SCHEMA.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/DATABASE_SCHEMA.md): Complete relational database schema specifications and indexing strategies.
- [DATA_DICTIONARY.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/DATA_DICTIONARY.md): Complete definitions for all columns, enums, units of measure, and validation rules.
- [SYNTHETIC_DATA_GENERATOR.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/SYNTHETIC_DATA_GENERATOR.md): Comprehensive guide to the reproducible synthetic data engine and injected anomalies.
- [VALIDATION_SUMMARY.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/VALIDATION_SUMMARY.md): 19-point validation rules analysis and benchmark evaluation report.
- [SOURCE_MANIFEST.md](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/docs/SOURCE_MANIFEST.md): Complete file-by-file inventory of every backend model, service, route, and frontend component.

---
*Developed with enterprise metrology compliance standards (ISO 9001 / IATF 16949 / AS9100 / ISO/IEC 17025 / FDA 21 CFR Part 11).*
=======
# SmartCal-Industrial-Calibration-Management-System
>>>>>>> 9a989e656cd4ca42739e528babacde74c7246140
