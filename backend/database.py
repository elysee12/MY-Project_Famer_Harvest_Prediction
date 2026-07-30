"""
database.py — MySQL database layer for Bugesera Harvest Prediction System
Connects to XAMPP MySQL via PyMySQL
"""

import json
import os
import pymysql
import pymysql.cursors
from datetime import datetime
import secrets
import string

META_PATH = os.path.join(os.path.dirname(__file__), 'model_metadata.json')
MODEL_METADATA = {}
DEFAULT_MODEL_CONFIDENCE = 84.8
try:
    with open(META_PATH) as f:
        MODEL_METADATA = json.load(f)
        DEFAULT_MODEL_CONFIDENCE = round(
            MODEL_METADATA.get('_perf', {}).get(MODEL_METADATA.get('best_model',''), {}).get('r2', MODEL_METADATA.get('r2_score', 0.85)) * 100,
            1
        )
except Exception:
    pass

DB_CONFIG = {
    'host'     : 'localhost',
    'port'     : 3306,
    'user'     : 'root',
    'password' : '',
    'database' : 'bugesera_harvest',
    'charset'  : 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
}


def get_db():
    return pymysql.connect(**DB_CONFIG)


def init_db():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) as cnt FROM sectors")
                row = cur.fetchone()
                print(f"  [check-circle] MySQL connected — {row['cnt']} sectors found")
        ensure_officer_advice_columns()
        return True
    except Exception as e:
        print(f"  [x-circle] MySQL error: {e}")
        return False


def ensure_officer_advice_columns():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SHOW COLUMNS FROM officer_advice LIKE 'recipient_officer_id'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE officer_advice ADD COLUMN recipient_officer_id VARCHAR(255) NULL")
                cur.execute("SHOW COLUMNS FROM officer_advice LIKE 'is_deleted'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE officer_advice ADD COLUMN is_deleted TINYINT(1) DEFAULT 0")
            conn.commit()
    except Exception as e:
        print(f"  [warn] officer_advice schema check skipped: {e}")


def generate_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ─────────────────────────────────────────────────────────────────────────────
# USER & AUTH QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def get_user_by_email(email: str) -> dict | None:
    # Check farmers
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.*, fm.farm_size_are, s.sector_name as sector, fm.sector_id, 
                       ROUND(fm.farm_size_are/100, 2) as farm_size_ha,
                       c.cooperative_name as coop_name, 
                       c.total_members as coop_total_members,
                       cl.cell_name,
                       v.village_name
                FROM farmers f
                LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                LEFT JOIN sectors s ON fm.sector_id = s.sector_id
                LEFT JOIN cooperatives c ON f.cooperative_id = c.cooperative_id
                LEFT JOIN cells cl ON f.cell_id = cl.cell_id
                LEFT JOIN villages v ON f.village_id = v.village_id
                WHERE LOWER(f.email)=LOWER(%s) AND f.is_active=1
                ORDER BY fm.farm_id ASC LIMIT 1
            """, (email,))
            row = cur.fetchone()
            if row:
                row['id'] = row['farmer_id']
                row['name'] = row['full_name']
                # Set role based on is_cooperative_member flag
                if row.get('is_cooperative_member') == 1:
                    row['role'] = 'cooperative'
                    # Ensure cooperative name is available
                    if not row.get('cooperative_name') and row.get('coop_name'):
                        row['cooperative_name'] = row['coop_name']
                else:
                    row['role'] = row.get('role', 'farmer')
                return row
            
            # Check officers
            cur.execute("SELECT * FROM officers WHERE LOWER(email)=LOWER(%s) AND is_active=1", (email,))
            row = cur.fetchone()
            if row:
                row['role'] = row['officer_type'] # 'sector' or 'district'
                row['id'] = row['officer_id']
                if row['sector_id']:
                    cur.execute("SELECT sector_name FROM sectors WHERE sector_id=%s", (row['sector_id'],))
                    sec = cur.fetchone()
                    row['sector_name'] = sec['sector_name'] if sec else ''
                    row['sector'] = row['sector_name']
                return row
    return None

def get_farmer_by_id_or_phone(ident: str, role: str = 'farmer') -> dict | None:
    table = "farmers" if role == "farmer" else "officers"
    id_col = "farmer_id" if role == "farmer" else "officer_id"
    with get_db() as conn:
        with conn.cursor() as cur:
            if role == 'farmer':
                cur.execute(f"""
                    SELECT f.*, fm.farm_size_are, s.sector_name as sector, fm.sector_id, ROUND(fm.farm_size_are/100, 2) as farm_size_ha
                    FROM {table} f
                    LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                    LEFT JOIN sectors s ON fm.sector_id = s.sector_id
                    WHERE (LOWER(f.{id_col})=LOWER(%s) OR f.phone=%s) AND f.is_active=1
                    ORDER BY fm.farm_id ASC LIMIT 1
                """, (ident, ident))
            else:
                cur.execute(f"SELECT * FROM {table} WHERE (LOWER({id_col})=LOWER(%s) OR phone=%s) AND is_active=1", (ident, ident))
            
            row = cur.fetchone()
            if row:
                row['role'] = role if role == 'farmer' else row['officer_type']
                row['id'] = row[id_col]
                row['name'] = row.get('full_name') or row.get('name')
                if role != 'farmer' and row['sector_id']:
                    cur.execute("SELECT sector_name FROM sectors WHERE sector_id=%s", (row['sector_id'],))
                    sec = cur.fetchone()
                    row['sector_name'] = sec['sector_name'] if sec else ''
                    row['sector'] = row['sector_name']
                return row
    return None

def update_user_password(user_id: str, role: str, new_password: str) -> bool:
    """Update password for farmer or officer in the database"""
    table = "farmers" if role == "farmer" else "officers"
    id_col = "farmer_id" if role == "farmer" else "officer_id"
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Update password_hash field (some tables might not have 'password' column)
                cur.execute(f"UPDATE {table} SET password_hash=%s WHERE {id_col}=%s", 
                           (new_password, user_id))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"Error updating password in DB: {e}")
        return False

def check_email_exists(email: str) -> bool:
    """Check if email exists in either farmers or officers table (including inactive)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM farmers WHERE email=%s", (email,))
            if cur.fetchone(): return True
            cur.execute("SELECT 1 FROM officers WHERE email=%s", (email,))
            if cur.fetchone(): return True
    return False

def get_farmer(farmer_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.*, 
                       c.cooperative_name as coop_name, 
                       c.total_members as coop_total_members,
                       cl.cell_name,
                       v.village_name
                FROM farmers f
                LEFT JOIN cooperatives c ON f.cooperative_id = c.cooperative_id
                LEFT JOIN cells cl ON f.cell_id = cl.cell_id
                LEFT JOIN villages v ON f.village_id = v.village_id
                WHERE f.farmer_id = %s AND f.is_active = 1
            """, (farmer_id,))
            row = cur.fetchone()
            if not row: return None
            
            row['farms'] = get_farms(farmer_id)
            row['id'] = farmer_id
            row['name'] = row.get('full_name')
            
            # Set role based on is_cooperative_member flag
            if row.get('is_cooperative_member') == 1:
                row['role'] = 'cooperative'
                # Ensure cooperative name is available
                if not row.get('cooperative_name') and row.get('coop_name'):
                    row['cooperative_name'] = row['coop_name']
            else:
                row['role'] = row.get('role', 'farmer')
            return row

def register_farmer(data: dict) -> dict:
    password = generate_password()
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT MAX(CAST(SUBSTRING(farmer_id, 2) AS UNSIGNED)) as current_max FROM farmers")
            row = cur.fetchone()
            current_max = row['current_max'] if row and row['current_max'] else 0
            farmer_id = f"F{current_max + 1:03d}"

            cur.execute("""
                INSERT INTO farmers (farmer_id, full_name, email, phone, password_hash)
                VALUES (%s,%s,%s,%s,%s)
            """, (farmer_id, data['name'], data['email'], data.get('phone'), password))
            conn.commit()
            
    res = get_farmer(farmer_id)
    res['generated_password'] = password
    return res


def register_officer(data: dict) -> dict:
    password = generate_password()
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT MAX(CAST(SUBSTRING(officer_id, 2) AS UNSIGNED)) as current_max FROM officers")
            row = cur.fetchone()
            current_max = row['current_max'] if row and row['current_max'] else 0
            
            officer_type = data.get('role', 'district')
            prefix = 'S' if officer_type == 'sector' else 'A'
            officer_id = f"{prefix}{current_max + 1:03d}"

            sector_id = None
            if officer_type == 'sector':
                cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (data.get('sector', 'Bugesera'),))
                sec = cur.fetchone()
                sector_id = sec['sector_id'] if sec else 1

            cur.execute("""
                INSERT INTO officers (officer_id, full_name, email, phone, department, officer_type, sector_id, password_hash)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (officer_id, data['name'], data['email'], data.get('phone'), data.get('department','General'), officer_type, sector_id, password))
            conn.commit()
            
    res = get_user_by_email(data['email'])
    res['generated_password'] = password
    return res


def get_officer(officer_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM officers WHERE officer_id = %s AND is_active = 1", (officer_id,))
            row = cur.fetchone()
            if not row: return None
            row['id'] = officer_id
            row['role'] = row['officer_type']
            if row['sector_id']:
                cur.execute("SELECT sector_name FROM sectors WHERE sector_id=%s", (row['sector_id'],))
                sec = cur.fetchone()
                row['sector_name'] = sec['sector_name'] if sec else ''
                row['sector'] = row['sector_name']
            return row

def update_last_login(user_id: str, role: str):
    table  = 'farmers'  if role == 'farmer'  else 'officers'
    id_col = 'farmer_id' if role == 'farmer' else 'officer_id'
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {table} SET last_login=%s WHERE {id_col}=%s", (datetime.now(), user_id))
            conn.commit()

def reset_password(identifier: str, new_password: str, role: str) -> bool:
    table  = 'farmers'  if role == 'farmer'  else 'officers'
    id_col = 'farmer_id' if role == 'farmer' else 'officer_id'
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {table} SET password_hash=%s WHERE ({id_col}=%s OR email=%s) AND is_active=1",
                (new_password, identifier, identifier)
            )
            affected = cur.rowcount
            if affected > 0:
                cur.execute("INSERT INTO password_resets (user_id, user_role, completed_at, is_used) VALUES (%s,%s,%s,1)", 
                            (identifier, role, datetime.now()))
                conn.commit()
            return affected > 0

# ─────────────────────────────────────────────────────────────────────────────
# FARM QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def get_farms(farmer_id: str) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.*, s.sector_name, s.soil_type, ROUND(f.farm_size_are/100, 2) as farm_size_ha
                FROM farms f
                JOIN sectors s ON f.sector_id = s.sector_id
                WHERE f.farmer_id = %s
            """, (farmer_id,))
            return cur.fetchall()

def add_farm(data: dict) -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (data.get('sector'),))
            sec = cur.fetchone()
            sector_id = sec['sector_id'] if sec else 1
            
            cur.execute("""
                INSERT INTO farms (farmer_id, farm_name, sector_id, farm_size_are)
                VALUES (%s,%s,%s,%s)
            """, (data['farmer_id'], data['farm_name'], sector_id, float(data['farm_size_are'])))
            conn.commit()
            farm_id = cur.lastrowid
            
            cur.execute("SELECT f.*, s.sector_name, s.soil_type, ROUND(f.farm_size_are/100, 2) as farm_size_ha FROM farms f JOIN sectors s ON f.sector_id=s.sector_id WHERE f.farm_id=%s", (farm_id,))
            return cur.fetchone()

# ─────────────────────────────────────────────────────────────────────────────
# PREDICTION QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def save_prediction(pred: dict, recs: list) -> str:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (pred.get('sector',''),))
            sec = cur.fetchone()
            sector_id = sec['sector_id'] if sec else 1
            pid = pred['prediction_id']

            cur.execute("""
                INSERT INTO predictions (
                    prediction_id, farmer_id, farm_id, sector_id, crop_type, season,
                    planting_date, planting_month, year, area_planted_are,
                    soil_type, fertilizer_used, irrigation_used, previous_crop,
                    pest_pressure, labor_availability, extension_access, credit_access,
                    avg_temperature, total_rainfall_mm, humidity_pct, sunshine_hrs,
                    yield_per_are_kg, yield_per_ha_kg, total_yield_kg,
                    yield_range_low, yield_range_high, district_avg_kg_are,
                    pct_vs_average, yield_grade, confidence_pct, model_used, is_offline, is_approved
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0
                ) ON DUPLICATE KEY UPDATE yield_per_are_kg=VALUES(yield_per_are_kg)
            """, (
                pid,
                pred.get('farmer_id'),
                pred.get('farm_id'),
                sector_id,
                pred.get('crop_type') or pred.get('crop'),
                pred.get('season'),
                pred.get('planting_date'),
                pred.get('month'),
                pred.get('year', datetime.now().year),
                pred.get('area_planted_are'),
                pred.get('soil_type') or pred.get('soil'),
                pred.get('fertilizer_used', 'No'),
                pred.get('irrigation_used', 'No'),
                pred.get('previous_crop', 'Beans'),
                pred.get('pest_pressure', 'Low'),
                pred.get('labor_availability', 'Adequate'),
                pred.get('extension_access', 'Yes'),
                pred.get('credit_access', 'No'),
                pred.get('inputs', {}).get('temperature'),
                pred.get('inputs', {}).get('rainfall'),
                pred.get('inputs', {}).get('humidity'),
                pred.get('inputs', {}).get('sunshine'),
                pred.get('yield_per_are_kg'),
                pred.get('yield_per_ha_kg'),
                pred.get('total_yield_kg'),
                pred.get('yield_range_low'),
                pred.get('yield_range_high'),
                pred.get('district_avg_kg_are'),
                pred.get('pct_vs_average'),
                pred.get('yield_grade'),
                pred.get('confidence_pct', DEFAULT_MODEL_CONFIDENCE),
                pred.get('model_used', 'Gradient Boosting'),
                1 if pred.get('is_offline') else 0,
            ))

            for i, rec in enumerate(recs):
                cur.execute("""
                    INSERT INTO recommendations
                        (prediction_id, rec_type, category, message, display_order)
                    VALUES (%s,%s,%s,%s,%s)
                """, (pid, rec.get('type','info'), rec.get('category',''), rec.get('message',''), i))
            conn.commit()
    return pid

def get_predictions(farmer_id: str = None, limit: int = 50, offset: int = 0, sector_id: int = None, unapproved_only: bool = False) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT p.*, s.sector_name, f.full_name as farmer_name, frm.farm_name
                FROM predictions p
                JOIN sectors s ON p.sector_id = s.sector_id
                JOIN farmers f ON p.farmer_id = f.farmer_id
                LEFT JOIN farms frm ON p.farm_id = frm.farm_id
                WHERE 1=1
            """
            params = []
            if farmer_id:
                query += " AND p.farmer_id = %s"
                params.append(farmer_id)
            if sector_id:
                query += " AND p.sector_id = %s"
                params.append(sector_id)
            if unapproved_only:
                query += " AND p.is_approved = 0"
                
            query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
            params.append(limit)
            params.append(offset)
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            
            result = []
            for r in rows:
                d = {}
                for k, v in r.items():
                    d[k] = float(v) if hasattr(v, '__float__') and not isinstance(v, (int, str, bool, type(None))) else v
                    if hasattr(v, 'strftime'):
                        d[k] = v.isoformat()
                result.append(d)
            return result

def approve_prediction(prediction_id: str) -> bool:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE predictions SET is_approved=1 WHERE prediction_id=%s", (prediction_id,))
            conn.commit()
            return cur.rowcount > 0

def update_actual_yield(prediction_id: str, actual_yield: float, harvest_date: str = None) -> bool:
    with get_db() as conn:
        with conn.cursor() as cur:
            h_date = harvest_date or datetime.now().strftime('%Y-%m-%d')
            cur.execute("""
                UPDATE predictions 
                SET actual_yield_kg_are=%s, actual_harvest_date=%s 
                WHERE prediction_id=%s
            """, (actual_yield, h_date, prediction_id))
            conn.commit()
            return cur.rowcount > 0

def get_district_stats() -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            # Per-crop stats (all predictions)
            cur.execute("""
                SELECT crop_type, season,
                       COUNT(*) AS total_predictions,
                       ROUND(AVG(yield_per_are_kg),2) AS avg_yield_kg_are,
                       ROUND(MIN(yield_per_are_kg),2) AS min_yield,
                       ROUND(MAX(yield_per_are_kg),2) AS max_yield,
                       ROUND(SUM(total_yield_kg),1)   AS total_yield_kg,
                       COUNT(DISTINCT farmer_id)       AS unique_farmers
                FROM predictions
                GROUP BY crop_type, season
            """)
            stats = cur.fetchall()

            # Sector ranking with per-crop averages (all predictions)
            cur.execute("""
                SELECT s.sector_name,
                       s.soil_type, s.soil_health,
                       COUNT(p.prediction_id) AS total_predictions,
                       ROUND(AVG(p.yield_per_are_kg),2) AS avg_yield_kg_are,
                       ROUND(SUM(p.total_yield_kg),1)   AS total_yield_kg,
                       ROUND(AVG(CASE WHEN p.crop_type='Maize' THEN p.yield_per_are_kg END),2) AS maize_avg,
                       ROUND(AVG(CASE WHEN p.crop_type='Beans' THEN p.yield_per_are_kg END),2) AS beans_avg,
                       ROUND(AVG(CASE WHEN p.crop_type='Rice'  THEN p.yield_per_are_kg END),2) AS rice_avg
                FROM sectors s
                LEFT JOIN farms fm ON s.sector_id = fm.sector_id
                LEFT JOIN predictions p ON fm.farmer_id = p.farmer_id
                GROUP BY s.sector_id
                ORDER BY avg_yield_kg_are DESC
            """)
            sector_rank = cur.fetchall()

            # Overall totals (all predictions)
            cur.execute("""
                SELECT COUNT(*) as total_preds,
                       COUNT(DISTINCT farmer_id) as total_farmers,
                       ROUND(AVG(yield_per_are_kg),2) as avg_yield,
                       ROUND(SUM(total_yield_kg),1) as total_yield
                FROM predictions
            """)
            totals = cur.fetchone()

            cur.execute("""
                SELECT season, ROUND(AVG(yield_per_are_kg),2) as avg_yield, COUNT(*) as count
                FROM predictions
                GROUP BY season
            """)
            seasons = cur.fetchall()

            # Serialize decimals/dates
            def clean(rows):
                result = []
                for r in (rows if isinstance(rows, list) else [rows]):
                    d = {}
                    for k, v in r.items():
                        if hasattr(v, '__float__') and not isinstance(v, (int, str, bool, type(None))):
                            d[k] = float(v)
                        elif hasattr(v, 'isoformat'):
                            d[k] = v.isoformat()
                        else:
                            d[k] = v
                    result.append(d)
                return result

            return {
                'totals': clean([totals])[0] if totals else {},
                'by_crop': clean(list(stats)),
                'sector_ranking': clean(list(sector_rank)),
                'seasons': clean(list(seasons)),
            }

def get_sector_dashboard_by_id(sector_id: int) -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as pending FROM predictions WHERE sector_id=%s AND is_approved=0", (sector_id,))
            pending_count = cur.fetchone()['pending']
            
            cur.execute("""
                SELECT COUNT(*) as total_preds, ROUND(AVG(yield_per_are_kg),2) as avg_yield
                FROM predictions WHERE sector_id=%s AND is_approved=1
            """, (sector_id,))
            stats = cur.fetchone()
            return {
                'pending_count': pending_count,
                'stats': stats,
            }

def get_all_sectors() -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM sectors ORDER BY sector_name")
            return cur.fetchall()

def verify_password(user_id: str, role: str, password: str) -> bool:
    table  = 'farmers'  if role == 'farmer'  else 'officers'
    id_col = 'farmer_id' if role == 'farmer' else 'officer_id'
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT password_hash FROM {table} WHERE {id_col}=%s", (user_id,))
            row = cur.fetchone()
            return row and row['password_hash'] == password

# --- Restored Functions ---

def update_user(user_id: str, role: str, data: dict) -> bool:
    table  = 'farmers'  if role == 'farmer'  else 'officers'
    id_col = 'farmer_id' if role == 'farmer' else 'officer_id'
    
    with get_db() as conn:
        with conn.cursor() as cur:
            if role == 'farmer':
                # Update farmers table
                updates = []
                params = []
                if 'name' in data:
                    updates.append("full_name = %s")
                    params.append(data['name'])
                if 'email' in data:
                    updates.append("email = %s")
                    params.append(data['email'])
                if 'phone' in data:
                    updates.append("phone = %s")
                    params.append(data['phone'])
                
                if updates:
                    params.append(user_id)
                    cur.execute(f"UPDATE {table} SET {', '.join(updates)} WHERE {id_col}=%s", tuple(params))
                
                # Update farms table (Primary farm)
                new_sector = data.get('sector')
                new_size_ha = data.get('farm_size_ha')
                
                if new_sector or new_size_ha is not None:
                    farm_updates = []
                    farm_params = []
                    
                    if new_sector:
                        cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (new_sector,))
                        sec = cur.fetchone()
                        sector_id = sec['sector_id'] if sec else 1
                        farm_updates.append("sector_id = %s")
                        farm_params.append(sector_id)
                    
                    if new_size_ha is not None:
                        farm_updates.append("farm_size_are = %s")
                        farm_params.append(float(new_size_ha) * 100)
                    
                    if farm_updates:
                        farm_params.append(user_id)
                        cur.execute(f"UPDATE farms SET {', '.join(farm_updates)} WHERE farmer_id=%s", tuple(farm_params))
            else:
                # Update officer table
                updates = []
                params = []
                if 'name' in data:
                    updates.append("full_name = %s")
                    params.append(data['name'])
                if 'email' in data:
                    updates.append("email = %s")
                    params.append(data['email'])
                if 'phone' in data:
                    updates.append("phone = %s")
                    params.append(data['phone'])
                if 'department' in data:
                    updates.append("department = %s")
                    params.append(data['department'])
                
                if updates:
                    params.append(user_id)
                    cur.execute(f"UPDATE {table} SET {', '.join(updates)} WHERE {id_col}=%s", tuple(params))
            
            conn.commit()
            return True

def get_farmer_stats(farmer_id: str) -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            # Fetch farmer basic info
            cur.execute("""
                SELECT f.*, fm.farm_size_are, s.sector_name, ROUND(fm.farm_size_are/100, 2) as farm_size_ha
                FROM farmers f
                LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                LEFT JOIN sectors s ON fm.sector_id = s.sector_id
                WHERE f.farmer_id = %s AND f.is_active = 1
                LIMIT 1
            """, (farmer_id,))
            farmer = cur.fetchone() or {}
            
            # We don't have v_farmer_summary anymore, let's build it dynamically
            cur.execute("""
                SELECT COUNT(p.prediction_id) as total_predictions,
                       ROUND(AVG(p.yield_per_are_kg),2) as avg_yield_kg_are,
                       ROUND(SUM(p.total_yield_kg),1) as total_yield_ever_kg
                FROM predictions p WHERE p.farmer_id=%s
            """, (farmer_id,))
            summary = cur.fetchone() or {}
            
            cur.execute("""
                SELECT crop_type, season, yield_per_are_kg, total_yield_kg, yield_grade, created_at, is_approved
                FROM predictions WHERE farmer_id=%s ORDER BY created_at DESC LIMIT 50
            """, (farmer_id,))
            recent = cur.fetchall()
            return {
                'farmer': farmer,
                'stats': summary,
                'summary': summary, 
                'recent_predictions': list(recent)
            }

def get_officer_dashboard() -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM farmers WHERE is_active=1")
            farmer_count = cur.fetchone()['cnt']
            cur.execute("SELECT COUNT(*) as cnt FROM predictions")
            pred_count = cur.fetchone()['cnt']
            cur.execute("""
                SELECT s.sector_name, ROUND(AVG(p.yield_per_are_kg),2) as avg_yield, COUNT(*) as pred_count
                FROM predictions p
                JOIN farms fm ON p.farmer_id = fm.farmer_id
                JOIN sectors s ON fm.sector_id = s.sector_id
                GROUP BY fm.sector_id HAVING avg_yield < 15
            """)
            alerts = cur.fetchall()
            return {
                'total_farmers': farmer_count,
                'total_predictions': pred_count,
                'accuracy_pct': DEFAULT_MODEL_CONFIDENCE,
                'low_yield_alerts': list(alerts),
            }

def get_sector_dashboard(sector_name: str) -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (sector_name,))
            sec = cur.fetchone()
            sec_id = sec['sector_id'] if sec else 1

            # Farmers who have a farm in this sector
            cur.execute("""
                SELECT COUNT(DISTINCT f.farmer_id) as cnt 
                FROM farmers f
                JOIN farms fm ON f.farmer_id = fm.farmer_id
                WHERE fm.sector_id=%s AND f.is_active=1
            """, (sec_id,))
            farmer_count = cur.fetchone()['cnt']

            # Get farmer_ids in this sector (via farms table)
            cur.execute("""
                SELECT DISTINCT fm.farmer_id
                FROM farms fm
                WHERE fm.sector_id=%s
            """, (sec_id,))
            farmer_ids = [r['farmer_id'] for r in cur.fetchall()]

            if not farmer_ids:
                return {
                    'total_farmers': farmer_count,
                    'total_predictions': 0,
                    'pending_predictions': [],
                    'farmers': [],
                    'all_predictions': [],
                    'seasons': [],
                }

            fmt = ','.join(['%s'] * len(farmer_ids))

            cur.execute(f"SELECT COUNT(*) as cnt FROM predictions WHERE farmer_id IN ({fmt})", tuple(farmer_ids))
            pred_count = cur.fetchone()['cnt']

            cur.execute(f"""
                SELECT p.prediction_id, p.farmer_id, f.full_name as farmer_name, p.crop_type, 
                       p.yield_per_are_kg, p.total_yield_kg, p.created_at, p.is_approved
                FROM predictions p
                JOIN farmers f ON p.farmer_id = f.farmer_id
                WHERE p.farmer_id IN ({fmt}) AND p.is_approved = 0
                ORDER BY p.created_at DESC
            """, tuple(farmer_ids))
            pending = cur.fetchall()

            cur.execute(f"""
                SELECT f.farmer_id as id, f.full_name as name, f.email, f.phone, 
                       fm.farm_size_are, ROUND(fm.farm_size_are/100, 2) as farm_size_ha
                FROM farmers f
                JOIN farms fm ON f.farmer_id = fm.farmer_id
                WHERE fm.sector_id=%s AND f.is_active=1
                ORDER BY f.created_at DESC
            """, (sec_id,))
            farmers = cur.fetchall()

            cur.execute(f"""
                SELECT p.prediction_id, p.farmer_id, f.full_name as farmer_name, 
                       p.crop_type as crop, %s as sector,
                       p.yield_per_are_kg, p.total_yield_kg, p.created_at as timestamp,
                       p.is_approved, p.season, p.yield_grade
                FROM predictions p
                JOIN farmers f ON p.farmer_id = f.farmer_id
                WHERE p.farmer_id IN ({fmt})
                ORDER BY p.created_at DESC
            """, (sector_name, *farmer_ids))
            all_preds = cur.fetchall()

            cur.execute(f"""
                SELECT season, ROUND(AVG(yield_per_are_kg),2) as avg_yield, COUNT(*) as count
                FROM predictions
                WHERE farmer_id IN ({fmt})
                GROUP BY season
            """, tuple(farmer_ids))
            seasons = cur.fetchall()

            return {
                'total_farmers': farmer_count,
                'total_predictions': pred_count,
                'pending_predictions': list(pending),
                'farmers': list(farmers),
                'all_predictions': list(all_preds),
                'seasons': list(seasons),
            }

def get_all_predictions_flat() -> list:
    """Return all predictions with crop_type and yield for confusion matrix."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT prediction_id, crop_type, yield_per_are_kg,
                           sector_id, created_at
                    FROM predictions
                    WHERE yield_per_are_kg IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 5000
                """)
                rows = cur.fetchall()
                return [dict(r) for r in rows]
    except Exception as e:
        print(f"get_all_predictions_flat error: {e}")
        return []

def get_underperforming_farms(sector_id: int = None) -> list:
    """
    Returns farms where the PREDICTED yield is below 80% of the crop benchmark.
    Does NOT require actual_yield_kg_are — works on predictions alone.
    Benchmarks: Maize=17.01, Beans=9.70, Rice=25.60 kg/are
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT f.farmer_id, f.full_name as name, s.sector_name,
                       p.crop_type,
                       p.yield_per_are_kg as predicted,
                       p.actual_yield_kg_are as actual,
                       ROUND(
                           CASE p.crop_type
                               WHEN 'Maize' THEN 17.01
                               WHEN 'Beans' THEN 9.70
                               WHEN 'Rice'  THEN 25.60
                               ELSE 17.01
                           END, 2
                       ) as benchmark,
                       ROUND(
                           (1 - p.yield_per_are_kg / 
                               CASE p.crop_type
                                   WHEN 'Maize' THEN 17.01
                                   WHEN 'Beans' THEN 9.70
                                   WHEN 'Rice'  THEN 25.60
                                   ELSE 17.01
                               END
                           ) * 100, 1
                       ) as gap_pct
                FROM predictions p
                JOIN farmers f ON p.farmer_id = f.farmer_id
                JOIN sectors s ON p.sector_id = s.sector_id
                WHERE p.yield_per_are_kg < (
                    CASE p.crop_type
                        WHEN 'Maize' THEN 17.01 * 0.80
                        WHEN 'Beans' THEN 9.70  * 0.80
                        WHEN 'Rice'  THEN 25.60 * 0.80
                        ELSE 17.01 * 0.80
                    END
                )
                AND p.yield_per_are_kg IS NOT NULL
            """
            params = []
            if sector_id:
                query += " AND p.sector_id = %s"
                params.append(sector_id)

            # Latest prediction per farmer only
            query = f"""
                SELECT t.farmer_id as id, t.name, t.sector_name, t.crop_type,
                       t.predicted, t.actual, t.benchmark, t.gap_pct
                FROM ({query}) t
                ORDER BY t.gap_pct DESC
                LIMIT 20
            """
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            result = []
            for r in rows:
                d = {}
                for k, v in r.items():
                    d[k] = float(v) if hasattr(v, '__float__') and not isinstance(v, str) else v
                result.append(d)
            return result

def get_sector(sector_name: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM sectors WHERE sector_name=%s", (sector_name,))
            return cur.fetchone()

def save_advice(officer_id: str, data: dict) -> int:
    with get_db() as conn:
        with conn.cursor() as cur:
            # Get officer type and sector_id
            cur.execute("SELECT officer_type, sector_id FROM officers WHERE officer_id=%s", (officer_id,))
            off = cur.fetchone()
            
            recipient_officer_id = data.get('recipient_officer_id')
            farmer_id = data.get('farmer_id')
            prediction_id = data.get('prediction_id')
            subject = data.get('subject', 'Advisory')
            message = data.get('message', '')
            advice_type = data.get('advice_type', 'general')

            # Use officer's sector if it's a sector officer sending farmer advice
            sector_id = None
            if off and off['officer_type'] == 'sector':
                sector_id = off['sector_id']
            if data.get('sector_id'):
                sector_id = data.get('sector_id')
            elif data.get('sector'):
                cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (data.get('sector',''),))
                sec = cur.fetchone()
                if sec: sector_id = sec['sector_id']

            cur.execute("""
                INSERT INTO officer_advice (officer_id, recipient_officer_id, farmer_id, prediction_id, sector_id, subject, message, advice_type, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                officer_id,
                recipient_officer_id,
                farmer_id,
                prediction_id,
                sector_id,
                subject,
                message,
                advice_type,
                0
            ))
            conn.commit()
            return cur.lastrowid


def get_sent_advice(officer_id: str) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.*, o.full_name as sender_name, o.officer_type as sender_type,
                       ro.full_name as recipient_name, ro.officer_type as recipient_type,
                       s.sector_name as sector_name
                FROM officer_advice a
                JOIN officers o ON a.officer_id = o.officer_id
                LEFT JOIN officers ro ON a.recipient_officer_id = ro.officer_id
                LEFT JOIN sectors s ON a.sector_id = s.sector_id
                WHERE a.officer_id=%s AND a.is_deleted=0
                ORDER BY a.created_at DESC
            """, (officer_id,))
            return cur.fetchall()


def revoke_advice(officer_id: str, advice_id: int) -> bool:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE officer_advice SET is_deleted=1 WHERE advice_id=%s AND officer_id=%s AND is_deleted=0",
                (advice_id, officer_id)
            )
            conn.commit()
            return cur.rowcount > 0


def get_farmer_advice(farmer_id: str) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Get farmer's sector_id from farms
            cur.execute("""
                SELECT fm.sector_id 
                FROM farms fm 
                WHERE fm.farmer_id=%s LIMIT 1
            """, (farmer_id,))
            res = cur.fetchone()
            sector_id = res['sector_id'] if res else None

            # 2. Get advice: directed to them, or broadcast to all, or broadcast to their sector
            cur.execute("""
                SELECT a.*, o.full_name as officer_name, o.officer_type, s.sector_name as officer_sector
                FROM officer_advice a
                JOIN officers o ON a.officer_id = o.officer_id
                LEFT JOIN sectors s ON o.sector_id = s.sector_id
                WHERE a.is_deleted=0
                  AND (
                        a.farmer_id=%s 
                     OR (a.farmer_id IS NULL AND a.sector_id IS NULL)
                     OR (a.farmer_id IS NULL AND a.sector_id=%s)
                  )
                ORDER BY a.created_at DESC LIMIT 20
            """, (farmer_id, sector_id))
            return cur.fetchall()

def save_report(sender_id: str, data: dict) -> int:
    with get_db() as conn:
        with conn.cursor() as cur:
            # Resolve sector_id if sector_name provided
            sec_id = None
            if data.get('sector_name'):
                cur.execute("SELECT sector_id FROM sectors WHERE sector_name=%s", (data['sector_name'],))
                res = cur.fetchone()
                if res: sec_id = res['sector_id']
            
            # If no receiver_id, find the first available district officer
            receiver_id = data.get('receiver_id')
            if not receiver_id:
                cur.execute("SELECT officer_id FROM officers WHERE officer_type='district' LIMIT 1")
                res = cur.fetchone()
                if res: receiver_id = res['officer_id']

            cur.execute("""
                INSERT INTO reports (sender_id, receiver_id, sector_id, title, content)
                VALUES (%s,%s,%s,%s,%s)
            """, (sender_id, receiver_id, sec_id, data.get('title', 'Sector Report'), data.get('content', '')))
            conn.commit()
            return cur.lastrowid

def get_reports_for_officer(officer_id: str, role: str) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            if role == 'district':
                # District sees all reports or reports sent to them
                cur.execute("""
                    SELECT r.*, o.full_name as sender_name, s.sector_name
                    FROM reports r
                    JOIN officers o ON r.sender_id = o.officer_id
                    LEFT JOIN sectors s ON r.sector_id = s.sector_id
                    ORDER BY r.created_at DESC
                """)
            else:
                # Sector officer sees reports they sent
                cur.execute("""
                    SELECT r.*, o.full_name as sender_name, s.sector_name
                    FROM reports r
                    JOIN officers o ON r.sender_id = o.officer_id
                    LEFT JOIN sectors s ON r.sector_id = s.sector_id
                    WHERE r.sender_id=%s
                    ORDER BY r.created_at DESC
                """, (officer_id,))
            return cur.fetchall()

def get_all_users() -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            # Get Officers
            cur.execute("""
                SELECT officer_id as id, full_name as name, email, officer_type as role, 
                       department, is_active, last_login, created_at, 'officer' as type
                FROM officers
            """)
            officers = cur.fetchall()
            
            # Get Farmers
            cur.execute("""
                SELECT farmer_id as id, full_name as name, email, 'farmer' as role, 
                       'Farming' as department, is_active, last_login, created_at, 'farmer' as type
                FROM farmers
            """)
            farmers = cur.fetchall()
            
            return list(officers) + list(farmers)

def toggle_user_status(user_id: str, is_farmer: bool, status: int) -> bool:
    table  = 'farmers'  if is_farmer else 'officers'
    id_col = 'farmer_id' if is_farmer else 'officer_id'
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {table} SET is_active=%s WHERE {id_col}=%s", (status, user_id))
            conn.commit()
            return cur.rowcount > 0

def get_system_settings() -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT setting_key, setting_value FROM system_settings")
            rows = cur.fetchall()
            return {r['setting_key']: r['setting_value'] for r in rows}

def update_system_settings(settings: dict) -> bool:
    with get_db() as conn:
        with conn.cursor() as cur:
            for k, v in settings.items():
                cur.execute("""
                    INSERT INTO system_settings (setting_key, setting_value) 
                    VALUES (%s, %s) ON DUPLICATE KEY UPDATE setting_value=%s
                """, (k, v, v))
            conn.commit()
            return True

def get_sector_full_details(sector_id: int) -> dict:
    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Fetch sector info
            cur.execute("SELECT * FROM sectors WHERE sector_id=%s", (sector_id,))
            sector = cur.fetchone()
            if not sector: return {}

            # 2. Fetch farmers who have a farm in this sector
            cur.execute("""
                SELECT DISTINCT f.*
                FROM farmers f
                JOIN farms fm ON f.farmer_id = fm.farmer_id
                WHERE fm.sector_id = %s AND f.is_active = 1
            """, (sector_id,))
            farmers = cur.fetchall()

            # 3. Get farmer_ids in this sector
            farmer_ids = [f['farmer_id'] for f in farmers]

            # 4. Fetch ALL predictions by those farmers
            predictions = []
            if farmer_ids:
                fmt = ','.join(['%s'] * len(farmer_ids))
                cur.execute(f"""
                    SELECT p.*, f.full_name as farmer_name
                    FROM predictions p
                    JOIN farmers f ON p.farmer_id = f.farmer_id
                    WHERE p.farmer_id IN ({fmt})
                    ORDER BY p.created_at DESC
                """, tuple(farmer_ids))
                predictions = cur.fetchall()

            # 5. Serialize
            clean_preds = []
            for r in predictions:
                d = {}
                for k, v in r.items():
                    if hasattr(v, 'isoformat'): d[k] = v.isoformat()
                    elif hasattr(v, '__float__') and not isinstance(v, (int, str, bool, type(None))): d[k] = float(v)
                    else: d[k] = v
                clean_preds.append(d)

            return {
                'sector': sector,
                'farmers': list(farmers),
                'predictions': clean_preds
            }

if __name__ == '__main__':
    print("[tree] Testing MySQL connection...")
    init_db()


# ─────────────────────────────────────────────────────────────────────────────
# GASHORA LOCATION QUERIES (Cell & Village hierarchy)
# ─────────────────────────────────────────────────────────────────────────────

def get_cells() -> list:
    """Get all cells in Gashora sector"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT cell_id, cell_name 
                FROM cells 
                WHERE sector_id = (SELECT sector_id FROM sectors WHERE sector_name='Gashora')
                ORDER BY cell_name
            """)
            return cur.fetchall()


def get_villages_by_cell(cell_id: int) -> list:
    """Get all villages for a specific cell"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT village_id, village_name 
                FROM villages 
                WHERE cell_id = %s
                ORDER BY village_name
            """, (cell_id,))
            return cur.fetchall()


def get_all_gashora_locations() -> dict:
    """Get complete location hierarchy for Gashora"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.cell_id, c.cell_name, v.village_id, v.village_name
                FROM cells c
                LEFT JOIN villages v ON c.cell_id = v.cell_id
                WHERE c.sector_id = (SELECT sector_id FROM sectors WHERE sector_name='Gashora')
                ORDER BY c.cell_name, v.village_name
            """)
            rows = cur.fetchall()
            
            # Group by cell
            locations = {}
            for row in rows:
                cell_name = row['cell_name']
                if cell_name not in locations:
                    locations[cell_name] = {
                        'cell_id': row['cell_id'],
                        'cell_name': cell_name,
                        'villages': []
                    }
                if row['village_id']:
                    locations[cell_name]['villages'].append({
                        'village_id': row['village_id'],
                        'village_name': row['village_name']
                    })
            
            return list(locations.values())


def register_farmer_with_location(data: dict) -> dict:
    """
    Register farmer with Gashora-specific location (cell/village) and cooperative support.
    Now sets is_active=1 by default (no approval needed).
    """
    # Use user-provided password or generate one
    password = data.get('password') or generate_password()
    
    with get_db() as conn:
        with conn.cursor() as cur:
            # Generate farmer ID
            cur.execute("SELECT MAX(CAST(SUBSTRING(farmer_id, 2) AS UNSIGNED)) as current_max FROM farmers")
            row = cur.fetchone()
            current_max = row['current_max'] if row and row['current_max'] else 0
            farmer_id = f"F{current_max + 1:03d}"
            
            # Determine role (farmer or cooperative)
            role = data.get('role', 'farmer')
            cooperative_id = int(data.get('cooperative_id')) if data.get('cooperative_id') else None
            is_cooperative_member = 1 if role == 'cooperative' and cooperative_id else 0
            
            # Get cooperative name if cooperative_id provided
            cooperative_name = None
            if cooperative_id:
                cur.execute("SELECT cooperative_name FROM cooperatives WHERE cooperative_id=%s", (cooperative_id,))
                coop = cur.fetchone()
                cooperative_name = coop['cooperative_name'] if coop else None
            
            # Convert cell_id and village_id to integers (may come as strings from frontend)
            cell_id = None
            village_id = None
            try:
                if data.get('cell_id'):
                    cell_id = int(data.get('cell_id'))
            except (ValueError, TypeError):
                print(f"[WARN] Invalid cell_id: {data.get('cell_id')}")
            
            try:
                if data.get('village_id'):
                    village_id = int(data.get('village_id'))
            except (ValueError, TypeError):
                print(f"[WARN] Invalid village_id: {data.get('village_id')}")

            # Insert farmer (is_active=1 means immediate access)
            cur.execute("""
                INSERT INTO farmers (
                    farmer_id, full_name, email, phone, password_hash, 
                    cooperative_id, cooperative_name, is_cooperative_member, role, 
                    cell_id, village_id, is_active
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1)
            """, (farmer_id, data['name'], data['email'], data.get('phone'), password, 
                  cooperative_id, cooperative_name, is_cooperative_member, role,
                  cell_id, village_id))
            
            # Get Gashora sector_id
            cur.execute("SELECT sector_id FROM sectors WHERE sector_name='Gashora'")
            sec = cur.fetchone()
            sector_id = sec['sector_id'] if sec else 1
            
            # Calculate farm size in are
            farm_size_are = float(data.get('farm_size_ha', 0)) * 100 if data.get('farm_size_ha') else 100.0
            
            # Insert farm with cell and village
            cur.execute("""
                INSERT INTO farms (farmer_id, farm_name, sector_id, cell_id, village_id, farm_size_are)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (farmer_id, f"{data['name']}'s Farm", sector_id, cell_id, village_id, farm_size_are))
            
            conn.commit()
            
    res = get_farmer(farmer_id)
    res['generated_password'] = password
    return res


# ─────────────────────────────────────────────────────────────────────────────
# COOPERATIVE QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def get_all_cooperatives() -> list:
    """Get all active cooperatives in Gashora"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.*, s.sector_name, cl.cell_name,
                       COUNT(DISTINCT f.farmer_id) as member_count,
                       ROUND(SUM(fm.farm_size_are)/100, 2) as total_farm_ha
                FROM cooperatives c
                LEFT JOIN sectors s ON c.sector_id = s.sector_id
                LEFT JOIN cells cl ON c.cell_id = cl.cell_id
                LEFT JOIN farmers f ON c.cooperative_id = f.cooperative_id
                LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                GROUP BY c.cooperative_id
                ORDER BY c.cooperative_name
            """)
            return cur.fetchall()


def create_cooperative(data: dict) -> dict:
    """Create a new cooperative"""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Generate cooperative ID (auto-increment INT)
            cur.execute("SELECT MAX(cooperative_id) as current_max FROM cooperatives")
            row = cur.fetchone()
            current_max = row['current_max'] if row and row['current_max'] else 0
            coop_id = current_max + 1
            
            # Get Gashora sector_id
            cur.execute("SELECT sector_id FROM sectors WHERE sector_name='Gashora'")
            sec = cur.fetchone()
            sector_id = sec['sector_id'] if sec else 1
            
            # Get cell_id if provided
            cell_id = None
            if data.get('cell_name'):
                cur.execute("SELECT cell_id FROM cells WHERE cell_name=%s AND sector_id=%s", 
                           (data['cell_name'], sector_id))
                cell_row = cur.fetchone()
                cell_id = cell_row['cell_id'] if cell_row else None
            
            cur.execute("""
                INSERT INTO cooperatives 
                (cooperative_id, cooperative_name, sector_id, cell_id, contact_phone, contact_email, total_members)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (coop_id, data['name'], sector_id, cell_id, 
                  data.get('contact_phone'), data.get('contact_email'), 0))
            conn.commit()
            
            # Return created cooperative
            cur.execute("SELECT * FROM cooperatives WHERE cooperative_id=%s", (coop_id,))
            return cur.fetchone()


def update_cooperative(cooperative_id: str, data: dict) -> bool:
    """Update cooperative details"""
    with get_db() as conn:
        with conn.cursor() as cur:
            updates = []
            params = []
            
            if 'name' in data:
                updates.append("cooperative_name = %s")
                params.append(data['name'])
            if 'contact_phone' in data:
                updates.append("contact_phone = %s")
                params.append(data['contact_phone'])
            if 'contact_email' in data:
                updates.append("contact_email = %s")
                params.append(data['contact_email'])
            if 'cell_name' in data:
                # Get cell_id from cell_name
                cur.execute("SELECT cell_id FROM cells WHERE cell_name=%s", (data['cell_name'],))
                cell_row = cur.fetchone()
                if cell_row:
                    updates.append("cell_id = %s")
                    params.append(cell_row['cell_id'])
            
            if updates:
                params.append(cooperative_id)
                cur.execute(f"UPDATE cooperatives SET {', '.join(updates)} WHERE cooperative_id=%s", tuple(params))
                conn.commit()
                return cur.rowcount > 0
    return False


def delete_cooperative(cooperative_id: str) -> bool:
    """Delete a cooperative (hard delete if no members, otherwise fail)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Check if any farmers are members
            cur.execute("SELECT COUNT(*) as cnt FROM farmers WHERE cooperative_id=%s", (cooperative_id,))
            count = cur.fetchone()['cnt']
            
            if count > 0:
                return False  # Cannot delete cooperative with active members
            
            # Hard delete since we don't have is_active column
            cur.execute("DELETE FROM cooperatives WHERE cooperative_id=%s", (cooperative_id,))
            conn.commit()
            return cur.rowcount > 0


# ─────────────────────────────────────────────────────────────────────────────
# FARMER APPROVAL QUERIES (Admin Management)
# ─────────────────────────────────────────────────────────────────────────────

def get_pending_farmers() -> list:
    """Get all farmers pending approval (is_active=0)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.*, fm.farm_size_are, s.sector_name, c.cell_name, v.village_name,
                       ROUND(fm.farm_size_are/100, 2) as farm_size_ha
                FROM farmers f
                LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                LEFT JOIN sectors s ON fm.sector_id = s.sector_id
                LEFT JOIN cells c ON fm.cell_id = c.cell_id
                LEFT JOIN villages v ON fm.village_id = v.village_id
                WHERE f.is_active=0
                ORDER BY f.created_at DESC
            """)
            return cur.fetchall()


def get_all_farmers() -> list:
    """Get all farmers (active and inactive) for admin view"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.*, fm.farm_size_are, s.sector_name, c.cell_name, v.village_name,
                       co.cooperative_name,
                       ROUND(fm.farm_size_are/100, 2) as farm_size_ha
                FROM farmers f
                LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                LEFT JOIN sectors s ON fm.sector_id = s.sector_id
                LEFT JOIN cells c ON fm.cell_id = c.cell_id
                LEFT JOIN villages v ON fm.village_id = v.village_id
                LEFT JOIN cooperatives co ON f.cooperative_id = co.cooperative_id
                ORDER BY f.created_at DESC
            """)
            return cur.fetchall()


def approve_farmer(farmer_id: str) -> bool:
    """Approve a pending farmer (set is_active=1)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE farmers SET is_active=1 WHERE farmer_id=%s", (farmer_id,))
            conn.commit()
            return cur.rowcount > 0


def reject_farmer(farmer_id: str) -> bool:
    """Reject a pending farmer (permanently delete)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Delete associated farms first
            cur.execute("DELETE FROM farms WHERE farmer_id=%s", (farmer_id,))
            # Delete farmer
            cur.execute("DELETE FROM farmers WHERE farmer_id=%s", (farmer_id,))
            conn.commit()
            return cur.rowcount > 0
