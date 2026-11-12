# SmartCal – Entity-Relationship (ER) Diagram

The following diagram illustrates the relational data model of the **SmartCal – Industrial Calibration & Instrument Management System**, showing primary keys, foreign keys, and cardinalities.

```mermaid
erDiagram
    INSTRUMENT_TYPES ||--o{ ASSETS : "categorizes"
    INSTRUMENT_TYPES ||--o{ CALIBRATION_PLANS : "governs"
    SUPPLIERS ||--o{ ASSETS : "calibrates/supplies"
    SUPPLIERS ||--o{ CALIBRATION_PLANS : "contracted_for"
    SUPPLIERS ||--o{ CALIBRATION_EVENTS : "executes"
    SUPPLIERS ||--o{ CERTIFICATES : "issues"
    CALIBRATION_PLANS ||--o{ ASSETS : "schedules"
    ASSETS ||--o{ CALIBRATION_EVENTS : "history_of"
    ASSETS ||--o{ CERTIFICATES : "certified_by"
    ASSETS ||--o{ WORK_ORDERS : "serviced_under"
    ASSETS ||--o{ PRODUCTION_USES : "scanned_in"
    ASSETS ||--o{ ALERTS : "monitored_by"
    CALIBRATION_EVENTS ||--o| CERTIFICATES : "conforms_to"
    CALIBRATION_EVENTS ||--o{ WORK_ORDERS : "triggers_corrective"

    INSTRUMENT_TYPES {
        int id PK
        string type_code UK
        string name
        string category
        int default_interval_months
        float default_tolerance
        string unit_of_measure
        text description
    }

    SUPPLIERS {
        string id PK
        string name
        string contact_name
        string contact_email
        string contact_phone
        text calibration_services
        string accreditation_details
        text address
        string status
        datetime created_at
        datetime updated_at
    }

    CALIBRATION_PLANS {
        string id PK
        string plan_name
        int instrument_type_id FK
        int calibration_interval
        string interval_unit
        float tolerance_limits
        string due_date_calc_method
        string responsible_department
        string supplier_id FK
        date effective_start_date
        date effective_end_date
        string plan_status
        datetime created_at
    }

    ASSETS {
        string id PK "AST-000001..."
        string name
        int instrument_type_id FK
        string manufacturer
        string model_number
        string serial_number UK
        text description
        string location
        string department
        string criticality_level
        date installation_date
        int calibration_interval
        string interval_unit
        float tolerance_limit
        date last_calibration_date
        date next_calibration_due_date
        string current_status
        string supplier_id FK
        string calibration_plan_id FK
        datetime created_at
        datetime updated_at
    }

    CALIBRATION_EVENTS {
        string id PK "CAL-AST-000001-2026-000001..."
        string asset_id FK
        date calibration_date
        string technician
        string supplier_id FK
        string reference_standard
        float measured_value
        float expected_value
        float measurement_error
        float tolerance
        string pass_fail_result
        text calibration_remarks
        string certificate_status
        date next_calibration_due_date
        datetime created_at
    }

    CERTIFICATES {
        string id PK "CERT-CAL-..."
        string calibration_id FK,UK
        string asset_id FK
        string certificate_number UK
        date issue_date
        date expiry_date
        string supplier_id FK
        string approval_status
        string document_location
        int file_size_kb
        string verification_status
        datetime created_at
    }

    WORK_ORDERS {
        string id PK "WO-2026-000001..."
        string asset_id FK
        string related_calibration_id FK
        string work_order_type
        string priority
        text description
        string assigned_technician
        date created_date
        date planned_start_date
        date actual_start_date
        date completion_date
        float downtime_hours
        string status
        text corrective_action
        string impact_assessment_status
        text impact_assessment_notes
        string responsible_engineer
        datetime created_at
        datetime updated_at
    }

    PRODUCTION_USES {
        string id PK "USE-AST-000001-..."
        string asset_id FK
        string production_batch_id
        string production_line
        string operator
        datetime usage_timestamp
        string calibration_status_at_usage
        string exception_approval_id
        string usage_decision
        string issue_type
        text notes
    }

    ALERTS {
        string id PK "ALT-2026-000001..."
        string asset_id FK
        string related_event_id
        string issue_type
        string severity
        text description
        datetime detection_timestamp
        string assigned_person
        string resolution_status
        text resolution_remarks
        datetime resolved_at
        string resolved_by
    }

    AUDIT_RECORDS {
        int id PK
        string audit_id UK "AUD-2026-000001..."
        string entity_type
        string entity_id
        string action
        text previous_value
        text new_value
        string user
        datetime timestamp
        text reason
    }

    GROUND_TRUTH {
        int id PK
        string issue_id UK "GT-0001..."
        string entity_id
        string entity_type
        string issue_type
        string expected_decision
        string expected_severity
        text description
        string injected_case_label
        datetime created_at
    }
```
