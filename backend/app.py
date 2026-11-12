import os
from flask import Flask, jsonify, send_from_directory
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
from backend.config import Config
from backend.database import db
from backend.routes import register_routes
from backend.models import *

def create_app(config_class=Config):
    # Detect frontend build dist folder
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    static_folder = frontend_dist if os.path.exists(frontend_dist) else None

    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config.from_object(config_class)

    # Enable CORS for all routes and frontend origins
    if CORS is not None:
        CORS(app, resources={r"/api/*": {"origins": "*"}})
    else:
        @app.before_request
        def handle_preflight():
            from flask import request, Response
            if request.method == "OPTIONS":
                response = Response()
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
                response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
                return response

        @app.after_request
        def add_cors_headers(response):
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
            return response

    # Initialize SQLAlchemy
    db.init_app(app)

    # Register all API Blueprints
    register_routes(app)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "connected"
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception as e:
            db_status = f"error: {str(e)}"
        return jsonify({
            'status': 'healthy',
            'app': 'SmartCal Industrial Calibration Management System',
            'database': db_status
        })

    # Serve React Frontend SPA
    if static_folder:
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_spa(path):
            if path != "" and os.path.exists(os.path.join(static_folder, path)):
                return send_from_directory(static_folder, path)
            else:
                return send_from_directory(static_folder, 'index.html')

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    return app

def ensure_database_running():
    import socket
    import subprocess
    import time
    
    port = int(os.environ.get('MYSQL_PORT', 3307))
    host = os.environ.get('MYSQL_HOST', '127.0.0.1')
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1.0)
    try:
        sock.connect((host, port))
        sock.close()
        return True
    except Exception:
        try:
            sock.close()
        except Exception:
            pass
    
    mysqld_paths = [
        r"C:\xampp\mysql\bin\mysqld.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
    ]
    started = False
    for path in mysqld_paths:
        if os.path.exists(path):
            print(f"[*] MariaDB/MySQL is offline on port {port}. Starting daemon from {path}...")
            ini_file = os.path.join(os.path.dirname(path), 'my.ini')
            cmd = [path, f'--port={port}', '--console']
            if os.path.exists(ini_file):
                cmd.insert(1, f'--defaults-file={ini_file}')
            try:
                flags = 0
                if hasattr(subprocess, 'CREATE_NEW_PROCESS_GROUP') and hasattr(subprocess, 'DETACHED_PROCESS'):
                    flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
                subprocess.Popen(
                    cmd,
                    creationflags=flags,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                started = True
                break
            except Exception as e:
                print(f"[!] Warning: failed to auto-start mysql daemon: {e}")
    
    if started:
        print("[*] Waiting for database service to become ready...")
        for _ in range(15):
            time.sleep(1)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.0)
            try:
                sock.connect((host, port))
                sock.close()
                print(f"[*] Database daemon connected successfully on {host}:{port}.")
                return True
            except Exception:
                try:
                    sock.close()
                except Exception:
                    pass
    
    return False

if __name__ == '__main__':
    ensure_database_running()
    app = create_app()
    with app.app_context():
        # Ensure database tables exist
        db.create_all()
        # Seed if empty
        from backend.models.asset import Asset
        if Asset.query.count() == 0:
            print("Database empty. Initializing synthetic dataset (starter scale)...")
            from backend.services.data_generator import generate_synthetic_data
            generate_synthetic_data(scale='starter')
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting SmartCal Enterprise Server on http://127.0.0.1:{port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
