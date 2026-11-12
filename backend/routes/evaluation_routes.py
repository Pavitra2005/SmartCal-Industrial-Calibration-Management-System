from flask import Blueprint, jsonify
from backend.services.evaluation_service import run_evaluation_metrics
from backend.models.ground_truth import GroundTruth

evaluation_bp = Blueprint('evaluation', __name__)

@evaluation_bp.route('', methods=['GET'])
def get_evaluation_metrics():
    metrics = run_evaluation_metrics()
    return jsonify(metrics)

@evaluation_bp.route('/ground-truth', methods=['GET'])
def get_ground_truth_records():
    records = GroundTruth.query.all()
    return jsonify([r.to_dict() for r in records])
