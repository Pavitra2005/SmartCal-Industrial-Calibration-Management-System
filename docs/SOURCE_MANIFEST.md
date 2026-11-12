# SmartCal – Source Code Manifest & Architecture Inventory

This document provides a comprehensive inventory and architectural breakdown of all source files, modules, database models, business services, REST API endpoints, and user interface components comprising the **SmartCal – Industrial Calibration & Instrument Management System**.

---

## 1. Project Directory Structure

```
SmartCal – Industrial Calibration Management System/
│
├── backend/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── alert.py
│   │   ├── asset.py
│   │   ├── audit_record.py
│   │   ├── calibration_event.py
│   │   ├── calibration_plan.py
│   │   ├── certificate.py
│   │   ├── ground_truth.py
│   │   ├── instrument_type.py
│   │   ├── production_use.py
│   │   ├── supplier.py
│   │   └── work_order.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── alert_routes.py
│   │   ├── audit_routes.py
│   │   ├── calibration_routes.py
│   │   ├── certificate_routes.py
│   │   ├── dashboard_routes.py
│   │   ├── evaluation_routes.py
│   │   ├── instrument_routes.py
│   │   ├── reports_routes.py
│   │   ├── schedule_routes.py
│   │   ├── settings_routes.py
│   │   ├── supplier_routes.py
│   │   ├── usage_routes.py
│   │   ├── validation_routes.py
│   │   └── work_order_routes.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── alert_service.py
│   │   ├── audit_service.py
│   │   ├── calibration_service.py
│   │   ├── data_generator.py
│   │   ├── evaluation_service.py
│   │   ├── export_service.py
│   │   ├── usage_service.py
│   │   └── validation_service.py
│   │
│   ├── uploads/
│   │   └── (PDF certificates storage)
│   │
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── ground_truth.csv
│   └── ground_truth.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badge.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── TopNavbar.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── AuditTrailPage.jsx
│   │   │   ├── CalibrationsPage.jsx
│   │   │   ├── CertificatesPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InstrumentDetailPage.jsx
│   │   │   ├── InstrumentsPage.jsx
│   │   │   ├── ProductionUsagePage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── SchedulePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── SuppliersPage.jsx
│   │   │   ├── ValidationPage.jsx
│   │   │   └── WorkOrdersPage.jsx
│   │   │
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── dist/
│   │   ├── assets/
│   │   └── index.html
│   │
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── DATA_DICTIONARY.md
│   ├── ER_DIAGRAM.md
│   ├── SOURCE_MANIFEST.md
│   ├── SYNTHETIC_DATA_GENERATOR.md
│   └── VALIDATION_SUMMARY.md
│
├── tests/
│   └── test_smartcal_e2e.py
│
└── README.md
```

---

## 2. Backend Modules & Components

### 2.1 Core Infrastructure
- [`backend/app.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/app.py): Flask application entry point. Registers 14 API blueprints, configures CORS, handles global error responses, and serves the static production SPA build from `frontend/dist`.
- [`backend/config.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/config.py): Configuration class loading environment variables, MySQL database URI (`mysql+pymysql://root:@127.0.0.1:3307/smartcal_db`), upload folders, and token secrets.
- [`backend/database.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/database.py): Initializes the SQLAlchemy database object (`db`).

### 2.2 Relational Models (`backend/models/`)
- [`instrument_type.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/instrument_type.py): Taxonomy for measurement equipment (`CALIPER`, `PRESSURE_GAUGE`, etc.).
- [`supplier.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/supplier.py): Master registry of ISO/IEC 17025 accredited calibration labs and suppliers.
- [`calibration_plan.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/calibration_plan.py): Calibration intervals, tolerances, calculation methods, and responsible departments.
- [`asset.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/asset.py): Physical measuring instruments (`AST-000001` format) with serial numbers, locations, and operational statuses.
- [`calibration_event.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/calibration_event.py): Immutable calibration event records (`CAL-...`) with measured/expected values, tolerances, and pass/fail states.
- [`certificate.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/certificate.py): Calibration certificates (`CERT-...`) with expiry dates, PDF paths, and SHA-256 integrity hashes.
- [`work_order.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/work_order.py): Maintenance work orders (`WO-...`) with downtime tracking, priority, and impact assessments.
- [`production_use.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/production_use.py): Production scanning records (`USE-...`) enforcing zero-trust gating.
- [`alert.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/alert.py): Quality and compliance alerts (`ALT-...`) across 9 anomaly categories with resolution states.
- [`audit_record.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/audit_record.py): Immutable state transition log (`AUD-...`) with previous/new JSON diffs and reasons.
- [`ground_truth.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/models/ground_truth.py): Benchmark ground truth defect registry for automated algorithm evaluation.

### 2.3 Business Services (`backend/services/`)
- [`calibration_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/calibration_service.py): Automatic error computation, tolerance checking, due date math, and auto-dispatch of corrective work orders upon failure.
- [`usage_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/usage_service.py): Point-of-use gatekeeper rejecting expired or uncalibrated tools, persisting blocked attempts with full auditability.
- [`alert_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/alert_service.py): 9-point rule scanner generating alerts across all compliance vectors.
- [`audit_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/audit_service.py): Ledger service logging immutable state changes across the application.
- [`data_generator.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/data_generator.py): Reproducible synthetic data generation engine (`seed=20261022`) supporting `starter` (100 assets) and `full` (2,000 assets) scales with 4 injected benchmark edge cases.
- [`validation_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/validation_service.py): 19-point automated validation engine across Schema, Business Logic, and Anomaly tiers.
- [`evaluation_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/evaluation_service.py): Automated benchmark scoring (Confusion Matrix, Precision, Recall, F1, Detection Rate).
- [`export_service.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/services/export_service.py): High-performance streaming exports for CSV files and raw MySQL SQL seed dumps.

### 2.4 REST API Routes (`backend/routes/`)
- [`dashboard_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/dashboard_routes.py): `/api/dashboard/stats`, `/charts`, `/recent-activities`, `/critical-alerts`, `/upcoming-schedule`.
- [`instrument_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/instrument_routes.py): CRUD for assets, detailed history query, serial validation.
- [`schedule_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/schedule_routes.py): Upcoming/overdue schedule views, rescheduling with audit reason, calibration plans.
- [`calibration_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/calibration_routes.py): Log calibration event, recalculate error, auto-trigger corrective action.
- [`certificate_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/certificate_routes.py): PDF certificate upload, download, approval workflow, asset mismatch scanner.
- [`work_order_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/work_order_routes.py): Work order lifecycle, impact assessment submission, downtime hours tracking.
- [`usage_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/usage_routes.py): Point-of-use scan validation, blocked scan tracking, batch queries.
- [`alert_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/alert_routes.py): Alert center list, acknowledge, assign, resolve workflow.
- [`supplier_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/supplier_routes.py): Supplier registry CRUD, accreditation tracking, event linkages.
- [`audit_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/audit_routes.py): Filterable audit trail log, JSON snapshot inspection.
- [`reports_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/reports_routes.py): Quality KPI aggregations, CSV downloads, MySQL SQL dump generation.
- [`validation_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/validation_routes.py): Run 19-point validation suite, JSON/CSV export.
- [`evaluation_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/evaluation_routes.py): Ground truth evaluation, confusion matrix calculation.
- [`settings_routes.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/backend/routes/settings_routes.py): Database status, engine information, re-seed trigger endpoint.

---

## 3. Frontend Architecture & Components

### 3.1 Context & State Management
- [`AuthContext.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/context/AuthContext.jsx): Enterprise Role-Based Access Control (RBAC) simulating 4 industrial personas:
  - `Quality Engineer` (default)
  - `Production Operator`
  - `Calibration Planner`
  - `Plant Admin`
- [`ToastContext.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/context/ToastContext.jsx): Industrial notification dispatch system (Success, Error, Warning, Info).

### 3.2 UI Components (`frontend/src/components/`)
- [`Sidebar.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/Sidebar.jsx): Enterprise sidebar with deep navy theme (`#142B4A`), badge counters for overdue instruments and active alerts, and links to all 13 modules.
- [`TopNavbar.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/TopNavbar.jsx): Global quick-search input, real-time alert bell with dropdown notifications, user profile switcher with role selection.
- [`DataTable.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/DataTable.jsx): Universal enterprise data table supporting multi-column sorting, debounced search, custom filters, pagination, export triggers, and loading/empty states.
- [`StatCard.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/StatCard.jsx): Metric card showing KPI numbers, percentage change, and status colors.
- [`Modal.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/Modal.jsx): Accessible dialog modal with backdrop blur, keyboard escape listener, and smooth enter transitions.
- [`Badge.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/components/Badge.jsx): Status badge pill with color coding for `ACTIVE`, `OVERDUE`, `CRITICAL`, `PASS`, `FAIL`, `BLOCKED`, etc.

### 3.3 Application Pages (`frontend/src/pages/`)
1. [`DashboardPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/DashboardPage.jsx): 8 live KPI cards, 6 interactive Recharts charts (Pass/Fail distribution, Monthly trends, Status distribution, Overdue by type, Usage violations, Work order statuses), Recent Activities table, Upcoming Schedule preview, and Critical Alerts pane.
2. [`InstrumentsPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/InstrumentsPage.jsx): Full instrument fleet inventory with filters by status, location, and type, new instrument registration modal, and inline actions.
3. [`InstrumentDetailPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/InstrumentDetailPage.jsx): Detailed 360-degree view of an individual asset with tabbed calibration history, certificates, work orders, and production usage events.
4. [`SchedulePage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/SchedulePage.jsx): Upcoming calibrations, overdue items, calendar view tabs, reschedule modal with mandatory audit reason, and calibration plans table.
5. [`CalibrationsPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/CalibrationsPage.jsx): Calibration event log, new inspection execution modal with live error calculation and tolerance comparison, and historical records.
6. [`CertificatesPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/CertificatesPage.jsx): Calibration certificates repository with PDF upload modal, validity filters, asset mismatch detection banner, and approval sign-off.
7. [`WorkOrdersPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/WorkOrdersPage.jsx): Maintenance work orders table, status transition controls, downtime tracking, and impact assessment quarantine submission modal.
8. [`ProductionUsagePage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/ProductionUsagePage.jsx): Production usage scanner interface with interactive point-of-use gate simulator, scan log with `ALLOWED` vs `BLOCKED` badges, and exception tracking.
9. [`AlertsPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/AlertsPage.jsx): Compliance alert inbox with severity filtering, acknowledge/assign modal, and resolution workflow recording CAPA remarks.
10. [`SuppliersPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/SuppliersPage.jsx): ISO/IEC 17025 accredited vendor directory, lab scope of accreditation, and associated calibration records.
11. [`AuditTrailPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/AuditTrailPage.jsx): 21 CFR Part 11 compliant immutable audit log with JSON state diff viewer, entity filtering, and user attribution.
12. [`ReportsPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/ReportsPage.jsx): Calibration pass rate metrics, on-time compliance rate, average work order closure hours, and one-click CSV and raw MySQL SQL seed dump export buttons.
13. [`ValidationPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/ValidationPage.jsx): Visual 19-point automated integrity verification runner, ground truth benchmark scorecards, and JSON/CSV report downloads.
14. [`SettingsPage.jsx`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/frontend/src/pages/SettingsPage.jsx): Database health status, active MySQL engine telemetry, RBAC persona selection, and synthetic data reseed controls (`starter` vs `full`).

---

## 4. End-to-End Test Suite

- [`tests/test_smartcal_e2e.py`](file:///c:/CandidateWorkspace/SmartCal%20%E2%80%93%20Industrial%20Calibration%20Management%20System/tests/test_smartcal_e2e.py): Comprehensive Python test suite executing 11 sequential test cases:
  1. `test_01_database_and_models`: Verifies database connection and initial row counts across all 11 tables.
  2. `test_02_synthetic_data_generator`: Tests re-seeding with fixed seed `20261022` and deterministic row creation.
  3. `test_03_edge_case_1_due_date_mismatch`: Confirms detection of intentional due date mismatch.
  4. `test_04_edge_case_2_expired_usage_blocked`: Confirms zero-trust production blocking of expired instruments.
  5. `test_05_edge_case_3_cert_asset_mismatch`: Confirms detection of cross-asset certificate mismatches.
  6. `test_06_edge_case_4_missing_impact_assessment`: Confirms alert generation for un-assessed failed calibrations.
  7. `test_07_validation_service_integrity`: Executes the 19-point validation suite and confirms 0 fatal failures.
  8. `test_08_evaluation_service_benchmark`: Verifies 100% Precision, Recall, and F1 detection score on injected anomalies.
  9. `test_09_calibration_workflow_and_work_order`: Executes end-to-end failed calibration triggering corrective work order.
  10. `test_10_production_usage_service`: Validates active tool allowed scan vs expired tool blocked scan.
  11. `test_11_exports_csv_and_sql`: Verifies CSV reports and MySQL `.sql` dump generation.
