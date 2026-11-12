from datetime import datetime, date
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.models.ground_truth import GroundTruth

def run_evaluation_metrics():
    """
    Compares actual system decisions and anomaly detections against ground truth benchmark records.
    Computes confusion matrix (TP, FP, TN, FN), Precision, Recall, F1-Score, Detection Rate,
    and operational industrial calibration KPIs.
    """
    # 1. Fetch Ground Truth anomalies
    gt_records = GroundTruth.query.all()
    gt_map = {gt.entity_id: gt for gt in gt_records}
    target_anomaly_types = {'DUE_DATE_MISMATCH', 'EXPIRED_USAGE', 'CERTIFICATE_ASSET_MISMATCH', 'MISSING_IMPACT_ASSESSMENT'}

    # 2. Fetch System Alerts and Blocked Usage
    active_alerts = Alert.query.all()
    blocked_usages = ProductionUse.query.filter_by(usage_decision='BLOCKED').all()

    # Map detected issues by entity_id
    detected_entities = {}
    for a in active_alerts:
        detected_entities[a.asset_id] = a.issue_type
        if a.related_event_id:
            detected_entities[a.related_event_id] = a.issue_type

    for bu in blocked_usages:
        detected_entities[bu.id] = bu.issue_type or 'EXPIRED_USAGE'

    # Compute Confusion Matrix specifically for the benchmark anomaly evaluation
    tp = 0
    fn = 0
    fp = 0
    evaluated_cases = []

    for gt in gt_records:
        detected_type = detected_entities.get(gt.entity_id)
        if detected_type is not None:
            tp += 1
            evaluated_cases.append({
                'issue_id': gt.issue_id,
                'entity_id': gt.entity_id,
                'expected_issue': gt.issue_type,
                'detected_issue': detected_type,
                'status': 'TRUE_POSITIVE',
                'severity': gt.expected_severity,
                'injected_label': gt.injected_case_label,
                'description': gt.description
            })
        else:
            fn += 1
            evaluated_cases.append({
                'issue_id': gt.issue_id,
                'entity_id': gt.entity_id,
                'expected_issue': gt.issue_type,
                'detected_issue': None,
                'status': 'FALSE_NEGATIVE',
                'severity': gt.expected_severity,
                'injected_label': gt.injected_case_label,
                'description': gt.description
            })

    # For benchmark anomalies, check if any non-ground-truth entity was flagged with those 4 specific anomaly types
    for ent_id, issue in detected_entities.items():
        if issue in target_anomaly_types and ent_id not in gt_map:
            fp += 1

    total_assets = Asset.query.count()
    total_cals = CalibrationEvent.query.count()
    total_usages = ProductionUse.query.count()
    total_certs = Certificate.query.count()
    total_wos = WorkOrder.query.count()

    total_evaluated_population = total_assets + total_cals + total_certs + min(total_usages, 5000)
    tn = max(0, total_evaluated_population - (tp + fp + fn))

    # Metrics
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 1.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 1.0
    f1_score = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
    detection_rate = round((tp / len(gt_records)) * 100, 2) if len(gt_records) > 0 else 100.0

    # 3. Operational KPIs
    passed_cals = CalibrationEvent.query.filter_by(pass_fail_result='PASS').count()
    failed_cals = CalibrationEvent.query.filter_by(pass_fail_result='FAIL').count()
    pass_rate = round((passed_cals / total_cals * 100), 2) if total_cals > 0 else 0.0

    today = date.today()
    overdue_count = Asset.query.filter(Asset.next_calibration_due_date < today, Asset.current_status != 'RETIRED').count()
    overdue_pct = round((overdue_count / total_assets * 100), 2) if total_assets > 0 else 0.0

    events_with_cert = db.session.query(CalibrationEvent.id).join(Certificate, CalibrationEvent.id == Certificate.calibration_id).filter(CalibrationEvent.pass_fail_result == 'PASS').count()
    cert_completeness = round((events_with_cert / passed_cals * 100), 2) if passed_cals > 0 else 0.0

    blocked_count = ProductionUse.query.filter_by(usage_decision='BLOCKED').count()

    completed_wos = WorkOrder.query.filter_by(status='COMPLETED').count()
    wo_completion_rate = round((completed_wos / total_wos * 100), 2) if total_wos > 0 else 0.0

    wos_with_closure = WorkOrder.query.filter(WorkOrder.completion_date != None, WorkOrder.created_date != None).all()
    if wos_with_closure:
        closure_days = [(w.completion_date - w.created_date).days for w in wos_with_closure]
        avg_closure_days = round(sum(closure_days) / len(closure_days), 2)
    else:
        avg_closure_days = 0.0

    return {
        'confusion_matrix': {
            'true_positives': tp,
            'false_positives': fp,
            'true_negatives': tn,
            'false_negatives': fn,
        },
        'performance_metrics': {
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'detection_rate': detection_rate,
        },
        'operational_kpis': {
            'calibration_pass_rate': pass_rate,
            'overdue_instrument_percentage': overdue_pct,
            'certificate_completeness_rate': cert_completeness,
            'blocked_invalid_usage_count': blocked_count,
            'corrective_action_completion_rate': wo_completion_rate,
            'avg_work_order_closure_days': avg_closure_days,
            'total_instruments': total_assets,
            'total_calibrations': total_cals,
            'total_certificates': total_certs,
            'total_work_orders': total_wos,
            'total_production_usages': total_usages,
            'active_alerts_count': len(active_alerts)
        },
        'evaluated_cases': evaluated_cases
    }
