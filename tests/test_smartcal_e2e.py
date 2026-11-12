import sys
import unittest
import json
from datetime import datetime, date, timedelta

sys.path.insert(0, '.')
from backend.app import create_app
from backend.database import db
from backend.models.asset import Asset
from backend.models.calibration_event import CalibrationEvent
from backend.models.certificate import Certificate
from backend.models.work_order import WorkOrder
from backend.models.production_use import ProductionUse
from backend.models.alert import Alert
from backend.models.ground_truth import GroundTruth
from backend.services.data_generator import generate_synthetic_data
from backend.services.validation_service import run_database_validation
from backend.services.evaluation_service import run_evaluation_metrics

class SmartCalE2ETestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            # Seed test database with starter dataset
            generate_synthetic_data(scale='starter')

    def test_01_health_check(self):
        """Verify server and database health"""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')

    def test_02_dashboard_kpis_and_charts(self):
        """Verify dashboard KPIs and charts calculate live from MySQL"""
        res = self.client.get('/api/dashboard/stats')
        self.assertEqual(res.status_code, 200)
        stats = res.get_json()
        self.assertGreater(stats['total_instruments'], 0)
        self.assertGreater(stats['active_instruments'], 0)

        charts_res = self.client.get('/api/dashboard/charts')
        self.assertEqual(charts_res.status_code, 200)
        charts = charts_res.get_json()
        self.assertIn('pass_fail_distribution', charts)
        self.assertIn('monthly_trends', charts)
        self.assertIn('instrument_status_distribution', charts)
        self.assertIn('overdue_by_type', charts)

    def test_03_edge_case_1_due_date_mismatch(self):
        """EDGE CASE 1: Stored due date differs from calibration plan calculation -> Flag DUE_DATE_MISMATCH"""
        with self.app.app_context():
            gt = GroundTruth.query.filter_by(issue_type='DUE_DATE_MISMATCH').first()
            self.assertIsNotNone(gt, "Ground Truth for EDGE_CASE_1 must exist")
            
            # Check alert table
            alert = Alert.query.filter_by(asset_id=gt.entity_id, issue_type='DUE_DATE_MISMATCH').first()
            self.assertIsNotNone(alert, "System must generate DUE_DATE_MISMATCH alert")
            self.assertIn("mismatch", alert.description.lower())

    def test_04_edge_case_2_expired_usage_blocked(self):
        """EDGE CASE 2: Expired instrument used without exception -> BLOCKED and flag EXPIRED_USAGE"""
        with self.app.app_context():
            gt = GroundTruth.query.filter_by(issue_type='EXPIRED_USAGE').first()
            self.assertIsNotNone(gt, "Ground Truth for EDGE_CASE_2 must exist")

            usage = ProductionUse.query.get(gt.entity_id)
            self.assertIsNotNone(usage, "Blocked usage record must exist")
            self.assertEqual(usage.usage_decision, 'BLOCKED', "Usage must be BLOCKED")
            self.assertEqual(usage.issue_type, 'EXPIRED_USAGE')

    def test_05_edge_case_3_certificate_asset_mismatch(self):
        """EDGE CASE 3: Certificate references another asset -> Flag CERTIFICATE_ASSET_MISMATCH"""
        with self.app.app_context():
            gt = GroundTruth.query.filter_by(issue_type='CERTIFICATE_ASSET_MISMATCH').first()
            self.assertIsNotNone(gt, "Ground Truth for EDGE_CASE_3 must exist")

            cert = Certificate.query.get(gt.entity_id)
            self.assertIsNotNone(cert)
            self.assertNotEqual(cert.asset_id, cert.calibration_event.asset_id, "Certificate asset must differ from event asset")
            self.assertEqual(cert.verification_status, 'MISMATCH_FLAGGED')

            # Verify alert created
            alert = Alert.query.filter_by(related_event_id=cert.id, issue_type='CERTIFICATE_ASSET_MISMATCH').first()
            self.assertIsNotNone(alert)
            self.assertEqual(alert.severity, 'CRITICAL')

    def test_06_edge_case_4_missing_impact_assessment(self):
        """EDGE CASE 4: Failed calibration without impact assessment -> Flag MISSING_IMPACT_ASSESSMENT"""
        with self.app.app_context():
            gt = GroundTruth.query.filter_by(issue_type='MISSING_IMPACT_ASSESSMENT').first()
            self.assertIsNotNone(gt, "Ground Truth for EDGE_CASE_4 must exist")

            event = CalibrationEvent.query.get(gt.entity_id)
            self.assertEqual(event.pass_fail_result, 'FAIL')

            # Work order must have impact_assessment_status == PENDING
            wo = WorkOrder.query.filter_by(related_calibration_id=event.id).first()
            self.assertIsNotNone(wo)
            self.assertEqual(wo.impact_assessment_status, 'PENDING')

            # System alert must exist
            alert = Alert.query.filter_by(related_event_id=event.id, issue_type='MISSING_IMPACT_ASSESSMENT').first()
            self.assertIsNotNone(alert)

    def test_07_evaluation_benchmark_metrics(self):
        """Verify ground truth evaluation engine computes precision, recall, F1, and confusion matrix"""
        res = self.client.get('/api/evaluation')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        
        # All 4 edge cases must be True Positives!
        self.assertEqual(data['confusion_matrix']['true_positives'], 4)
        self.assertEqual(data['confusion_matrix']['false_negatives'], 0)
        self.assertEqual(data['performance_metrics']['recall'], 1.0)
        self.assertEqual(data['performance_metrics']['detection_rate'], 100.0)

    def test_08_data_validation_suite(self):
        """Verify data validation checks return 0 hard failures"""
        res = self.client.get('/api/validation')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['failed_checks'], 0, "No integrity check failures permitted")
        self.assertGreater(data['passed_checks'], 10)

    def test_09_calibration_execution_api(self):
        """Test executing calibration through REST API with tolerance logic"""
        # Test a PASS calibration
        payload_pass = {
            'asset_id': 'AST-000005',
            'calibration_date': date.today().isoformat(),
            'technician': 'Dr. Test Metrologist',
            'reference_standard': 'NIST Gauge Block Standard #1120',
            'measured_value': 25.002,
            'expected_value': 25.000,
            'tolerance': 0.020,
            'calibration_remarks': 'Unit test pass verification'
        }
        res_pass = self.client.post('/api/calibrations', json=payload_pass)
        self.assertEqual(res_pass.status_code, 201)
        self.assertEqual(res_pass.get_json()['calibration_event']['pass_fail_result'], 'PASS')

        # Test a FAIL calibration (triggers corrective work order)
        payload_fail = {
            'asset_id': 'AST-000006',
            'calibration_date': date.today().isoformat(),
            'technician': 'Dr. Test Metrologist',
            'reference_standard': 'NIST Gauge Block Standard #1120',
            'measured_value': 25.090,
            'expected_value': 25.000,
            'tolerance': 0.020, # error 0.090 > 0.020 -> FAIL
            'calibration_remarks': 'Unit test fail verification'
        }
        res_fail = self.client.post('/api/calibrations', json=payload_fail)
        self.assertEqual(res_fail.status_code, 201)
        data_fail = res_fail.get_json()
        self.assertEqual(data_fail['calibration_event']['pass_fail_result'], 'FAIL')
        self.assertIsNotNone(data_fail['corrective_work_order'], "Corrective Work Order must be created on FAIL")
        self.assertEqual(data_fail['corrective_work_order']['impact_assessment_status'], 'PENDING')

    def test_10_production_usage_safety_gate(self):
        """Test production usage safety gate blocking out-of-service tool"""
        payload = {
            'asset_id': 'AST-000006', # Quarantined from test_09 failure!
            'production_batch_id': 'BATCH-TEST-SAFE-01',
            'production_line': 'Line 1 - CNC Milling',
            'operator': 'Tester'
        }
        res = self.client.post('/api/usage', json=payload)
        self.assertEqual(res.status_code, 403, "Must block usage of failed tool")
        self.assertEqual(res.get_json()['decision'], 'BLOCKED')

    def test_11_exports_csv_and_sql(self):
        """Verify CSV and SQL export endpoints return valid file data"""
        res_csv = self.client.get('/api/reports/export/csv?entity=instruments')
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn('text/csv', res_csv.headers['Content-Type'])
        self.assertIn('AST-000001', res_csv.get_data(as_text=True))

        res_sql = self.client.get('/api/reports/export/sql')
        self.assertEqual(res_sql.status_code, 200)
        self.assertIn('INSERT INTO assets', res_sql.get_data(as_text=True))

if __name__ == '__main__':
    unittest.main()
