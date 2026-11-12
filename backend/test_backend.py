import sys
sys.path.insert(0, '.')
from backend.app import create_app
from backend.database import db
from backend.services.data_generator import generate_synthetic_data
from backend.services.validation_service import run_database_validation
from backend.services.evaluation_service import run_evaluation_metrics

app = create_app()
with app.app_context():
    print('Testing MySQL connection and seeding...')
    res = generate_synthetic_data(scale='starter')
    print('Generation summary:', res)
    
    val = run_database_validation()
    print(f"Validation: {val['passed_checks']}/{val['total_checks']} passed, {val['warning_count']} warnings, {val['failed_checks']} failures.")
    
    eval_m = run_evaluation_metrics()
    print('Confusion matrix:', eval_m['confusion_matrix'])
    print('Performance metrics:', eval_m['performance_metrics'])
    print('Operational KPIs:', eval_m['operational_kpis'])
