import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smartcal-enterprise-secret-key-2026')
    
    # Primary MySQL connection string
    MYSQL_HOST = os.environ.get('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3307))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'smartcal_db')
    
    # Full database URI (defaults to MySQL)
    DEFAULT_MYSQL_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', DEFAULT_MYSQL_URI)
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'certificates')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max certificate size
    
    # Ground truth files
    GROUND_TRUTH_PATH = os.path.join(BASE_DIR, 'ground_truth.json')
    GROUND_TRUTH_CSV_PATH = os.path.join(BASE_DIR, 'ground_truth.csv')
