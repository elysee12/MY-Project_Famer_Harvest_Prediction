"""
+==================================================================+
|   BUGESERA HARVEST PREDICTION SYSTEM - Flask REST API v4.0      |
|   Author  : NTWARI David Danken | UNIVERSITY OF KIGALI          |
|   Units   : ARE (1 ha = 100 are) | Yield: kg/are                |
|   Models  : Gradient Boosting (best), Random Forest, Linear Reg |
+==================================================================+
"""

from flask import Flask, request, jsonify
import sys, pathlib, re
sys.path.insert(0, str(pathlib.Path(__file__).parent))
try:
    from database import (
        get_db, init_db, get_farmer, get_officer, get_user_by_email, get_farms, add_farm,
        register_farmer, register_officer, update_last_login,
        reset_password as db_reset_password, approve_prediction, get_sector_dashboard,
        save_prediction, get_predictions, get_district_stats,
        get_officer_dashboard, get_farmer_stats, get_all_sectors,
        get_sector, save_advice, get_farmer_advice, get_sent_advice, revoke_advice,
        update_user, verify_password, save_report, get_reports_for_officer,
        get_all_users, toggle_user_status, get_system_settings, update_system_settings,
        get_sector_full_details
    )
    DB_ENABLED = init_db()  # Call init_db to check actual connectivity (reloaded)
except ImportError as e:
    DB_ENABLED = False
    print("[exclamation-triangle]️  database.py not found — using in-memory store")

from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import json
import os
import uuid
from datetime import datetime
import base64
from email.mime.text import MIMEText
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
import time
import threading

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ── Weather service ───────────────────────────────────────────────────────────
try:
    from weather_service import get_weather_for_prediction, SECTOR_COORDS
    WEATHER_ENABLED = True
    print("  [check-circle] weather_service.py loaded — Open-Meteo integration active")
except ImportError:
    WEATHER_ENABLED = False
    print("  [exclamation-triangle] weather_service.py not found — using historical averages")

# ── Email configuration (use environment variables in production) ─────────────
BASE_DIR = pathlib.Path(__file__).resolve().parent
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', 'uwimpuhweeliphaz@gmail.com')
SMTP_PASS = os.getenv('SMTP_PASS', 'thub hrof rzlf ckrw')
CONTACT_TO_EMAIL = os.getenv('CONTACT_TO_EMAIL', SMTP_USER)
GMAIL_API_FALLBACK = False  # Use SMTP directly
GMAIL_CREDENTIALS_FILE = os.getenv('GMAIL_CREDENTIALS_FILE', 'credentials.json')
GMAIL_TOKEN_FILE = os.getenv('GMAIL_TOKEN_FILE', 'token.json')

def resolve_path(path: str) -> str:
    if os.path.isabs(path):
        return path
    cwd_candidate = os.path.abspath(path)
    if os.path.dirname(path) or os.path.exists(cwd_candidate):
        return cwd_candidate
    return str(BASE_DIR / path)

GMAIL_CREDENTIALS_FILE = resolve_path(GMAIL_CREDENTIALS_FILE)
GMAIL_TOKEN_FILE = resolve_path(GMAIL_TOKEN_FILE)
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send']

print(f"  [info] SMTP_USER={'set' if SMTP_USER else 'unset'}, SMTP_PASS={'set' if SMTP_PASS else 'unset'}, GMAIL_API_FALLBACK={GMAIL_API_FALLBACK}")
print(f"  [info] Gmail credentials path={GMAIL_CREDENTIALS_FILE}, token path={GMAIL_TOKEN_FILE}")

def normalize_rwanda_phone(value: str) -> str:
    digits = re.sub(r'\D', '', value or '')
    if digits.startswith('250') and len(digits) == 12:
        return f'0{digits[3:]}'
    return digits

def is_valid_rwanda_phone(value: str) -> bool:
    phone = normalize_rwanda_phone(value)
    allowed_prefixes = {'072', '073', '074', '075', '078', '079'}
    return len(phone) == 10 and phone.startswith('07') and phone[:3] in allowed_prefixes

def is_valid_email(value: str) -> bool:
    email = (value or '').strip().lower()
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def is_valid_gmail_address(value: str) -> bool:
    email = (value or '').strip().lower()
    if not is_valid_email(email):
        return False
    return email.endswith('@gmail.com')

def send_email(to_email, subject, body_html, body_text=None):
    """Sends an email using SMTP with retry.

    Returns (sent: bool, error_message: str|None).
    """
    attempts = int(os.getenv('EMAIL_SEND_ATTEMPTS', 3))
    base_delay = float(os.getenv('EMAIL_RETRY_DELAY', 2.0))
    last_err = None

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr(("Bugesera Harvest System", SMTP_USER))
    msg['To'] = to_email

    if not body_text:
        body_text = "Please enable HTML to view this email."

    part1 = MIMEText(body_text, 'plain')
    part2 = MIMEText(body_html, 'html')
    msg.attach(part1)
    msg.attach(part2)

    if not SMTP_USER or not SMTP_PASS:
        if GMAIL_API_FALLBACK:
            print("  [arrow-repeat] SMTP credentials missing, using Gmail API fallback")
            sent, api_err = send_email_via_gmail_api(to_email, subject, body_html, body_text)
            if sent:
                return True, None
            return False, api_err
        return False, 'SMTP credentials are missing and Gmail API fallback is disabled.'

    for attempt in range(1, attempts + 1):
        try:
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_USER, to_email, msg.as_string())

            print(f"  [check-circle] Email successfully sent to {to_email} (attempt {attempt})")
            return True, None
        except Exception as e:
            last_err = str(e)
            print(f"  [x-circle] Failed to send email to {to_email} on attempt {attempt}: {e}")
            if attempt < attempts:
                sleep_time = base_delay * attempt
                print(f"    Retrying in {sleep_time}s...")
                time.sleep(sleep_time)

    if GMAIL_API_FALLBACK:
        print(f"  [arrow-repeat] SMTP failed, attempting Gmail API fallback for {to_email}")
        sent, api_err = send_email_via_gmail_api(to_email, subject, body_html, body_text)
        if sent:
            return True, None
        print(f"  [x-circle] Gmail API fallback failed: {api_err}")
        return False, f"SMTP failed: {last_err}; Gmail API fallback failed: {api_err}"

    return False, last_err


def send_email_async(to_email, subject, body_html, body_text=None):
    """Send email in a background thread to avoid blocking the response.
    
    Returns (sent: bool, error_message: str|None) immediately, 
    but email is sent asynchronously.
    """
    def _send_in_background():
        try:
            success, error = send_email(to_email, subject, body_html, body_text)
            if not success:
                print(f"  [!] Background email send failed for {to_email}: {error}")
            else:
                print(f"  [✓] Background email sent to {to_email}")
        except Exception as e:
            print(f"  [!] Exception in background email send: {e}")
    
    # Start email sending in background thread
    thread = threading.Thread(target=_send_in_background, daemon=True)
    thread.start()
    
    # Return immediately to avoid blocking the HTTP response
    return True, None


def get_gmail_service():
    creds = None
    if os.path.exists(GMAIL_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_FILE, GMAIL_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(GMAIL_CREDENTIALS_FILE):
                return None, f"Gmail credentials file not found at {GMAIL_CREDENTIALS_FILE}"
            flow = InstalledAppFlow.from_client_secrets_file(GMAIL_CREDENTIALS_FILE, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(GMAIL_TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    service = build('gmail', 'v1', credentials=creds)
    return service, None


def send_email_via_gmail_api(to_email, subject, body_html, body_text=None):
    service, err = get_gmail_service()
    if not service:
        return False, err

    from_email = SMTP_USER or CONTACT_TO_EMAIL or 'no-reply@example.com'
    msg = MIMEMultipart('alternative')
    msg['subject'] = subject
    msg['to'] = to_email
    msg['from'] = from_email

    if not body_text:
        body_text = "Please enable HTML to view this email."
    part1 = MIMEText(body_text, 'plain')
    part2 = MIMEText(body_html, 'html')
    msg.attach(part1)
    msg.attach(part2)

    raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    try:
        send_request = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        print(f"  [check-circle] Gmail API email successfully sent to {to_email}, message ID: {send_request.get('id')}")
        return True, None
    except HttpError as he:
        return False, f"Gmail API error: {he}"
    except Exception as e:
        return False, str(e)


def get_registration_html(name, email, password, role):
    role_name = "Farmer" if role == 'farmer' else "Agricultural Officer"
    return f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2e7d32; margin-bottom: 5px;">Bugesera Harvest System</h1>
            <p style="color: #666; font-size: 14px;">Optimizing Agriculture in Bugesera District</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2e7d32; margin-top: 0;">Welcome, {name}!</h2>
            <p>Your registration as a <strong>{role_name}</strong> has been completed successfully. You can now access the system to manage your farm and predict harvests.</p>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #2e7d32; margin: 20px 0;">
                <p style="margin: 0;"><strong>Your Credentials:</strong></p>
                <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> {password}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:5173/" style="background-color: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access System Now</a>
            </div>
        </div>
        <div style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
            <p>If you did not register for this account, please contact us at {CONTACT_TO_EMAIL}</p>
            <p>&copy; 2024 Bugesera Harvest Prediction System. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

def get_otp_html(name, otp, purpose="password reset"):
    return f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2e7d32; margin-bottom: 5px;">Bugesera Harvest System</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2e7d32; margin-top: 0;">Verification Code</h2>
            <p>Hello {name},</p>
            <p>You have requested a <strong>{purpose}</strong>. Please use the following One-Time Password (OTP) to complete the process:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d32; background-color: #fff; padding: 10px 20px; border: 1px dashed #2e7d32; border-radius: 5px;">{otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
        <div style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
            <p>&copy; 2024 Bugesera Harvest Prediction System. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

# OTP storage: {email: {"otp": "123456", "expires": datetime}}
_otps = {}

def generate_otp():
    import random
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

# ── App setup ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from flask import send_file

BASE = os.path.dirname(os.path.abspath(__file__))

# ── Load ML artifacts ──────────────────────────────────────────────────────────
print("[arrow-repeat] Loading ML artifacts...")
try:
    model   = joblib.load(os.path.join(BASE, 'best_model.pkl'))
    scaler  = joblib.load(os.path.join(BASE, 'scaler.pkl'))
    le_dict = joblib.load(os.path.join(BASE, 'label_encoders.pkl'))
    # Load imputer if available (new training)
    imputer_path = os.path.join(BASE, 'imputer.pkl')
    imputer = joblib.load(imputer_path) if os.path.exists(imputer_path) else None
    print("  [check-circle] best_model.pkl")
    print("  [check-circle] scaler.pkl")
    print("  [check-circle] label_encoders.pkl")
    if imputer:
        print("  [check-circle] imputer.pkl")
except FileNotFoundError as e:
    raise SystemExit(f"[x-circle] Missing artifact: {e}\n   Run train_models.py first.")

# ── Load metadata ──────────────────────────────────────────────────────────────
META_PATH = os.path.join(BASE, 'model_metadata.json')
if not os.path.exists(META_PATH):
    raise SystemExit("[x-circle] model_metadata.json not found. Run the notebook first.")
with open(META_PATH) as f:
    META = json.load(f)
print("  [check-circle] model_metadata.json")

FEATURES = META['features']
CROPS    = META['crops']
SECTORS  = META['sectors']

# Normalise performance metrics
if '_perf' not in META:
    META['_perf'] = {META['best_model']: {'r2': META.get('r2_score', 0.85)}}

# ── Constants ──────────────────────────────────────────────────────────────────
HA_TO_ARE = 100.0   # 1 ha = 100 are
ARE_TO_HA = 0.01    # 1 are = 0.01 ha

CROP_BENCHMARKS = META.get('crop_benchmarks_kg_are', {
    'Beans': 11.91, 'Maize': 23.22, 'Rice': 36.36,
})

DEFAULT_MODEL_CONFIDENCE = round(META['_perf'].get(META['best_model'], {}).get('r2', 0) * 100, 1)

# Soil type → Soil_Health mapping
SOIL_HEALTH_MAP = {
    'Clay'      : 'Fair',
    'Sandy-Clay': 'Fair',
    'Loam'      : 'Good',
    'Sandy'     : 'Poor',
    'Clay-Loam' : 'Good',
    'Sandy Loam': 'Good',
    'Sandy Soil': 'Poor',
    'Clay Soil' : 'Fair',
}

# ── Bugesera monthly climate averages by sector ────────────────────────────────
# Source: Rwanda Meteorological Agency — Bugesera District
BUGESERA_CLIMATE = {
    'January'  : {'temperature': 22.4, 'rainfall': 66,  'humidity': 72, 'sunshine': 7.8, 'wind_speed': 11.2, 'evapotranspiration': 108},
    'February' : {'temperature': 22.8, 'rainfall': 72,  'humidity': 73, 'sunshine': 7.6, 'wind_speed': 11.0, 'evapotranspiration': 110},
    'March'    : {'temperature': 23.1, 'rainfall': 95,  'humidity': 76, 'sunshine': 7.2, 'wind_speed': 10.8, 'evapotranspiration': 112},
    'April'    : {'temperature': 23.5, 'rainfall': 108, 'humidity': 79, 'sunshine': 6.8, 'wind_speed': 10.4, 'evapotranspiration': 106},
    'May'      : {'temperature': 23.2, 'rainfall': 78,  'humidity': 77, 'sunshine': 7.0, 'wind_speed': 10.6, 'evapotranspiration': 104},
    'June'     : {'temperature': 22.9, 'rainfall': 35,  'humidity': 68, 'sunshine': 8.2, 'wind_speed': 12.1, 'evapotranspiration': 116},
    'July'     : {'temperature': 22.5, 'rainfall': 28,  'humidity': 64, 'sunshine': 8.6, 'wind_speed': 12.8, 'evapotranspiration': 120},
    'August'   : {'temperature': 23.0, 'rainfall': 42,  'humidity': 66, 'sunshine': 8.4, 'wind_speed': 12.4, 'evapotranspiration': 118},
    'September': {'temperature': 23.6, 'rainfall': 78,  'humidity': 74, 'sunshine': 7.4, 'wind_speed': 11.6, 'evapotranspiration': 114},
    'October'  : {'temperature': 23.8, 'rainfall': 110, 'humidity': 80, 'sunshine': 6.6, 'wind_speed': 10.2, 'evapotranspiration': 102},
    'November' : {'temperature': 23.4, 'rainfall': 102, 'humidity': 78, 'sunshine': 7.0, 'wind_speed': 10.6, 'evapotranspiration': 105},
    'December' : {'temperature': 22.6, 'rainfall': 85,  'humidity': 74, 'sunshine': 7.5, 'wind_speed': 11.4, 'evapotranspiration': 109},
}

SEASON_MODIFIER = {
    'Season A': {'rainfall_boost': 1.05, 'temp_adj':  0.2},
    'Season B': {'rainfall_boost': 0.95, 'temp_adj': -0.1},
}

# Sector-specific soil data from dataset
SECTOR_SOIL = {
    'Gashora'   : {'pH_Level':6.5,'Organic_Matter_Percent':2.1,'Nitrogen_ppm':49,'Phosphorus_ppm':24,'Potassium_ppm':192},
    'Juru'      : {'pH_Level':6.9,'Organic_Matter_Percent':2.6,'Nitrogen_ppm':48,'Phosphorus_ppm':24,'Potassium_ppm':176},
    'Kamabuye'  : {'pH_Level':7.1,'Organic_Matter_Percent':2.3,'Nitrogen_ppm':41,'Phosphorus_ppm':19,'Potassium_ppm':207},
    'Mareba'    : {'pH_Level':7.1,'Organic_Matter_Percent':3.0,'Nitrogen_ppm':62,'Phosphorus_ppm':12,'Potassium_ppm':236},
    'Mayange'   : {'pH_Level':6.0,'Organic_Matter_Percent':2.8,'Nitrogen_ppm':65,'Phosphorus_ppm':12,'Potassium_ppm':205},
    'Musenyi'   : {'pH_Level':7.1,'Organic_Matter_Percent':2.4,'Nitrogen_ppm':41,'Phosphorus_ppm':14,'Potassium_ppm':255},
    'Mwogo'     : {'pH_Level':6.0,'Organic_Matter_Percent':2.0,'Nitrogen_ppm':68,'Phosphorus_ppm':21,'Potassium_ppm':163},
    'Ngeruka'   : {'pH_Level':7.0,'Organic_Matter_Percent':2.7,'Nitrogen_ppm':74,'Phosphorus_ppm':20,'Potassium_ppm':196},
    'Ntarama'   : {'pH_Level':7.1,'Organic_Matter_Percent':2.9,'Nitrogen_ppm':62,'Phosphorus_ppm':11,'Potassium_ppm':245},
    'Nyamata'   : {'pH_Level':7.1,'Organic_Matter_Percent':3.2,'Nitrogen_ppm':77,'Phosphorus_ppm':24,'Potassium_ppm':253},
    'Nyarugenge': {'pH_Level':6.2,'Organic_Matter_Percent':2.2,'Nitrogen_ppm':40,'Phosphorus_ppm':22,'Potassium_ppm':195},
    'Rilima'    : {'pH_Level':6.1,'Organic_Matter_Percent':2.1,'Nitrogen_ppm':43,'Phosphorus_ppm':16,'Potassium_ppm':213},
    'Ruhuha'    : {'pH_Level':7.0,'Organic_Matter_Percent':2.5,'Nitrogen_ppm':62,'Phosphorus_ppm':18,'Potassium_ppm':186},
    'Rweru'     : {'pH_Level':7.0,'Organic_Matter_Percent':2.6,'Nitrogen_ppm':65,'Phosphorus_ppm':12,'Potassium_ppm':188},
    'Shyara'    : {'pH_Level':6.1,'Organic_Matter_Percent':2.3,'Nitrogen_ppm':56,'Phosphorus_ppm':21,'Potassium_ppm':268},
}

# ── Helper functions ───────────────────────────────────────────────────────────
def get_climate(month: str, season: str) -> dict:
    base = BUGESERA_CLIMATE.get(month, BUGESERA_CLIMATE['October'])
    mod  = SEASON_MODIFIER.get(season, {'rainfall_boost': 1.0, 'temp_adj': 0.0})
    return {
        'temperature'       : round(base['temperature'] + mod['temp_adj'], 1),
        'rainfall'          : round(base['rainfall'] * mod['rainfall_boost'] * 6, 1),  # seasonal
        'humidity'          : base['humidity'],
        'sunshine'          : base['sunshine'],
        'wind_speed'        : base['wind_speed'],
        'evapotranspiration': base['evapotranspiration'] * 6,  # seasonal
    }

def send_sms(phone, message):
    """Simulate sending an SMS (logs to console for demo)."""
    print(f"\n[phone] [SIMULATED SMS SENT] To: {phone}")
    print(f"   [chat-dots] Message: {message}")
    print("   [check-circle] Status: Delivered to Bugesera Network\n")

def _enc(key: str, value: str, fallback: int = 0) -> int:
    """Safely encode a categorical value."""
    if key not in le_dict:
        return fallback
    le = le_dict[key]
    if value in le.classes_:
        return int(le.transform([value])[0])
    # Try case-insensitive match
    for cls in le.classes_:
        if cls.lower() == str(value).lower():
            return int(le.transform([cls])[0])
    print(f"[exclamation-triangle]️  '{value}' not in {key} classes: {le.classes_.tolist()} — using fallback {fallback}")
    return fallback

def build_features(d: dict) -> pd.DataFrame:
    """
    Build model feature vector — v6.0
    Matches exactly the 35 features from Bugesera_Harvest_Dataset_v2.csv
    """
    crop     = d['crop']
    sector   = d['sector']
    season   = d['season']
    month    = d.get('month', 'October')
    farm_are = float(d['farm_size'])
    area_are = float(d.get('area_planted', farm_are * 0.9))

    fertilizer   = d.get('fertilizer_used', 'No')
    irrigation   = d.get('irrigation_used', 'No')
    fert_str     = 'Yes' if (fertilizer is True or str(fertilizer).lower() in ('yes','true','1')) else \
                   'Partial' if str(fertilizer).lower() == 'partial' else 'No'
    irr_str      = 'Yes' if (irrigation is True or str(irrigation).lower() in ('yes','true','1')) else \
                   'Partial' if str(irrigation).lower() == 'partial' else 'No'
    fert_bin     = 1 if fert_str == 'Yes' else 0
    irr_bin      = 1 if irr_str  == 'Yes' else 0

    # Auto climate
    clim        = get_climate(month, season)
    temperature = float(d.get('temperature',        clim['temperature']))
    rainfall    = float(d.get('rainfall',           clim['rainfall']))
    humidity    = float(d.get('humidity',           clim['humidity']))
    sunshine    = float(d.get('sunshine',           clim['sunshine']))
    wind_speed  = float(d.get('wind_speed',         clim['wind_speed']))
    evapotrans  = float(d.get('evapotranspiration', clim['evapotranspiration']))

    # Soil from sector
    soil_data = SECTOR_SOIL.get(sector, SECTOR_SOIL['Gashora'])
    soil_ph   = soil_data['pH_Level']

    # ── All encodings matching LabelEncoder order from training ───────────────
    SECTORS_LIST = ['Gashora','Juru','Kamabuye','Mareba','Mayange','Musenyi',
                    'Mwogo','Ngeruka','Ntarama','Nyamata','Nyarugenge','Rilima',
                    'Ruhuha','Rweru','Shyara']
    sector_enc = SECTORS_LIST.index(sector) if sector in SECTORS_LIST else 0

    # Crop: Beans=0, Maize=1, Rice=2 (alphabetical LabelEncoder)
    crop_enc = {'Beans':0,'Maize':1,'Rice':2}.get(crop, 1)

    # Terrain: Flat=0, Hillside=1, Valley=2
    terrain     = d.get('terrain', 'Flat')
    terrain_enc = {'Flat':0,'Hillside':1,'Valley':2}.get(terrain, 0)

    # Seed variety (alphabetical)
    seed        = d.get('seed_variety', 'Improved (WH507)')
    # Map frontend values to dataset values
    SEED_MAP = {
        'Hybrid':   {'Maize':'Hybrid (H614D)',   'Beans':'Hybrid (MAC 44)',    'Rice':'Hybrid (Komboka)'},
        'Improved': {'Maize':'Improved (WH507)', 'Beans':'Improved (RWR 2245)','Rice':'Improved (IR64 / NERICA)'},
        'Local':    {'Maize':'Local Variety',    'Beans':'Local Variety',       'Rice':'Local Variety'},
    }
    seed_full = SEED_MAP.get(seed, {}).get(crop, seed)
    # Encode: alphabetical order of all seed values
    ALL_SEEDS = sorted(['Hybrid (H614D)','Hybrid (Komboka)','Hybrid (MAC 44)',
                        'Improved (IR64 / NERICA)','Improved (RWR 2245)','Improved (WH507)',
                        'Local Variety'])
    seed_enc = ALL_SEEDS.index(seed_full) if seed_full in ALL_SEEDS else 5  # default Improved WH507

    # Fertilizer Used: No=0, Partial=1, Yes=2
    fert_used_enc = {'No':0,'Partial':1,'Yes':2}.get(fert_str, 0)

    # Fertilizer Type (alphabetical)
    fert_type_raw = d.get('fertilizer_type', 'None')
    FERT_TYPE_MAP = {
        'DAP':     'Inorganic (NPK)',
        'NPK':     'Inorganic (NPK)',
        'Urea':    'Inorganic (NPK)',
        'Organic': 'Organic (Compost)',
        'Mixed':   'Mixed (Organic + Inorganic)',
        'None':    'None',
    }
    fert_type_full = FERT_TYPE_MAP.get(fert_type_raw, fert_type_raw)
    ALL_FERT = sorted(['Inorganic (NPK)','Mixed (Organic + Inorganic)','None','Organic (Compost)'])
    fert_type_enc = ALL_FERT.index(fert_type_full) if fert_type_full in ALL_FERT else 2  # None

    # Fertilizer amount kg/are
    fert_kg_are_input = float(d.get('fertilizer_amount_kg_are', 0) or 0)
    fert_kg_are = fert_kg_are_input if (fert_bin and fert_kg_are_input > 0) else (1.5 if fert_bin else 0.0)

    # Irrigation Used: No=0, Partial=1, Yes=2
    irr_used_enc = {'No':0,'Partial':1,'Yes':2}.get(irr_str, 0)

    # Previous Crop (alphabetical)
    prev_crop = d.get('previous_crop', 'Beans')
    ALL_PREV  = sorted(['Beans','Cassava','Fallow','Maize','Rice'])
    prev_crop_enc = ALL_PREV.index(prev_crop) if prev_crop in ALL_PREV else 0

    # Pest: High=0, Low=1, Medium=2
    pest_str  = d.get('pest_pressure', 'Low')
    pest_enc  = {'High':0,'Low':1,'Medium':2}.get(pest_str, 1)

    # Labor: Adequate=0, Limited=1, Sufficient=2
    labor_enc = {'Adequate':0,'Limited':1,'Sufficient':2}.get(d.get('labor_availability','Adequate'), 0)

    # Extension: No=0, Yes=1
    ext_enc    = 1 if d.get('extension_access','Yes') == 'Yes' else 0

    # Credit: No=0, Yes=1
    credit_enc = 1 if d.get('credit_access','No') == 'Yes' else 0

    # Soil Type (alphabetical)
    SECTOR_SOIL_TYPES = {
        'Gashora':'Loam','Juru':'Sandy Loam','Kamabuye':'Clay Soil',
        'Mareba':'Sandy Loam','Mayange':'Sandy Loam','Musenyi':'Loam',
        'Mwogo':'Sandy Soil','Ngeruka':'Loam','Ntarama':'Sandy Soil',
        'Nyamata':'Clay Soil','Nyarugenge':'Clay Soil','Rilima':'Sandy Soil',
        'Ruhuha':'Sandy Loam','Rweru':'Clay Soil','Shyara':'Sandy Loam',
    }
    soil_type_str = SECTOR_SOIL_TYPES.get(sector, 'Clay Soil')
    ALL_SOIL = sorted(['Clay Soil','Loam','Sandy Loam','Sandy Soil'])
    soil_type_enc = ALL_SOIL.index(soil_type_str) if soil_type_str in ALL_SOIL else 0

    # ── Engineered features ───────────────────────────────────────────────────
    is_season_a   = 1 if season == 'Season A' else 0
    crop_rain_opt = {'Maize':500,'Beans':400,'Rice':650}.get(crop, 500)
    rain_adequacy = min(rainfall / crop_rain_opt, 2.0)
    ph_optimality = max(0.0, 1.0 - abs(soil_ph - 6.5) / 2.0)
    sunshine_score= min(1.0, sunshine / 9.5)
    water_balance = rainfall - evapotrans
    temp_opt      = {'Maize':23,'Beans':22,'Rice':25}.get(crop, 23)
    temp_deviation= abs(temperature - temp_opt)

    # ── Confidence adjustment ─────────────────────────────────────────────────
    conf_adj = 0.0
    if fert_bin:
        conf_adj += 2.5
        opt = {'Maize': 1.5, 'Beans': 0.8, 'Rice': 1.8}.get(crop, 1.5)
        if fert_kg_are <= opt:
            conf_adj += min(1.0, (fert_kg_are / opt) * 1.0)
        else:
            conf_adj += max(0.0, 1.0 - (fert_kg_are - opt) * 0.25)
    if irr_bin:
        conf_adj += 2.0
    if pest_str == 'Low':
        conf_adj += 2.0
    elif pest_str == 'High':
        conf_adj -= 5.0
    if ext_enc == 1:
        conf_adj += 1.0
    if credit_enc == 1:
        conf_adj += 0.8
    if prev_crop in ('Beans','Legume'):
        conf_adj += 1.2
    if labor_enc == 0:
        conf_adj += 0.5
    elif labor_enc == 1:
        conf_adj -= 1.5

    # Climate and soil quality adjustments
    if 0.9 <= rain_adequacy <= 1.2:
        conf_adj += 1.0
    elif rain_adequacy < 0.6:
        conf_adj -= 2.0
    if temp_deviation <= 2:
        conf_adj += 0.8
    elif temp_deviation > 5:
        conf_adj -= 1.2
    if 5.8 <= soil_ph <= 7.0:
        conf_adj += 0.8
    elif soil_ph < 5.2 or soil_ph > 7.3:
        conf_adj -= 1.0

    # Limit adjustment size so the confidence remains realistic
    d['_conf_adj'] = max(-12.0, min(8.0, conf_adj))

    row = {
        'Year'                        : int(d.get('year', 2024)),
        'Is_Season_A'                 : is_season_a,
        'Sector_enc'                  : sector_enc,
        'Crop_Type_enc'               : crop_enc,
        'Farm_Size_Ha'                : farm_are / 100.0,
        'Area_Planted_Are'            : area_are,
        'Terrain_Type_enc'            : terrain_enc,
        'Seed_Variety_enc'            : seed_enc,
        'Fertilizer_Used_enc'         : fert_used_enc,
        'Fertilizer_Type_enc'         : fert_type_enc,
        'Fert_Kg_Are'                 : fert_kg_are,
        'Irrigation_Used_enc'         : irr_used_enc,
        'Previous_Crop_enc'           : prev_crop_enc,
        'Pest_Disease_Pressure_enc'   : pest_enc,
        'Labor_Availability_enc'      : labor_enc,
        'Extension_Service_Access_enc': ext_enc,
        'Credit_Access_enc'           : credit_enc,
        'Market_Distance_km'          : float(d.get('market_distance', 12.0)),
        'Soil_Type_enc'               : soil_type_enc,
        'Soil_pH'                     : soil_ph,
        'Organic_Matter_Pct'          : soil_data['Organic_Matter_Percent'],
        'Nitrogen_ppm'                : soil_data['Nitrogen_ppm'],
        'Phosphorus_ppm'              : soil_data['Phosphorus_ppm'],
        'Potassium_ppm'               : soil_data['Potassium_ppm'],
        'Avg_Temperature_Celsius'     : temperature,
        'Total_Rainfall_mm'           : rainfall,
        'Relative_Humidity_Pct'       : humidity,
        'Sunshine_Hours_per_Day'      : sunshine,
        'Wind_Speed_kmh'              : wind_speed,
        'Evapotranspiration_mm'       : evapotrans,
        'Rain_Adequacy'               : rain_adequacy,
        'pH_Optimality'               : ph_optimality,
        'Sunshine_Score'              : sunshine_score,
        'Water_Balance'               : water_balance,
        'Temp_Deviation'              : temp_deviation,
    }

    X = pd.DataFrame([row]).reindex(columns=FEATURES, fill_value=0)
    return X


def get_recommendations(crop: str, yield_pa: float, sector: str = '') -> list:
    """
    Goal: Provide data-driven agricultural recommendations from harvest predictions
    to help farmers optimize planting schedules, resource use, and harvest planning.
    All cards include bilingual EN/RW messages so farmers can easily understand.
    """
    base = CROP_BENCHMARKS.get(crop, 20.0)
    pct  = (yield_pa - base) / base * 100

    if pct >= 20:
        return [
            {
                'type': 'success',
                'icon': 'bi-trophy',
                'category': 'Excellent Harvest! / Imyaka Myiza Cyane!',
                'message': f'Your predicted yield of {yield_pa:.1f} kg/are is {pct:.0f}% above the district average ({base:.1f} kg/are). Outstanding season! 🎉',
                'message_rw': f'Umusaruro wateganyijwe ni {yield_pa:.1f} kg/are, ni {pct:.0f}% hejuru y\'impuzandengo y\'akarere ({base:.1f} kg/are). Igihe cy\'isarura cyiza cyane! 🎉',
                'goal': 'Confirms excellent performance and encourages the farmer to sustain good practices.',
                'goal_rw': 'Kwemeza umusaruro mwiza cyane no gushishikariza umuhinzi gukomeza gukoresha uburyo bwiza bw\'ubuhinzi.'
            },
            {
                'type': 'success',
                'icon': 'bi-box-seam',
                'category': 'Storage Planning / Gutegura Ububiko bw\'Imyaka',
                'message': 'Prepare hermetic storage bags or silo space now. Seal grain within 48 hours of harvest to prevent aflatoxin and pest damage — this protects 100% of your yield value.',
                'message_rw': 'Tegura imifuko itinjiza umwuka cyangwa ububiko (silo) ubu. Fungira imyaka mu masaha 48 nyuma yo gusarura kugira ngo wirinde aflatoxin n\'udukoko — ibi birinda agaciro k\'umusaruro wawe 100%.',
                'goal': 'Helps farmer plan post-harvest storage to reduce losses (typically 20-30% without proper storage).',
                'goal_rw': 'Gufasha umuhinzi guteganyiriza ububiko nyuma yo gusarura kugira ngo agabanye igihombo (busanzwe kigera kuri 20-30% iyo nta bubiko bwiza buhari).'
            },
            {
                'type': 'success',
                'icon': 'bi-cash-stack',
                'category': 'Market & Sell Smart / Kugurisha ku Isoko mu Buryo Bwenge',
                'message': 'Contact the Bugesera cooperative market before harvest to lock in a fair price. Sell 70% early at market price and store 30% as quality seed for next season.',
                'message_rw': 'Baza isoko rya koperative yo muri Bugesera mbere yo gusarura kugira ngo ubone igiciro cyiza. Gurisha 70% vuba ku giciro cy\'isoko, hanyuma ubike 30% nk\'imbuto nziza y\'igihe gikurikira.',
                'goal': 'Guides the farmer on optimal selling strategy to maximize income and prepare for next planting season.',
                'goal_rw': 'Kuyobora umuhinzi ku buryo bwiza bwo kugurisha kugira ngo yongere inyungu kandi ategure igihe cyo gutera gikurikira.'
            },
            {
                'type': 'success',
                'icon': 'bi-calendar-check',
                'category': 'Next Season Planning / Gutegura Igihe cy\'Ihinga Gikurikira',
                'message': f'Repeat the same fertilizer and soil management practices — they worked! Save the biggest and healthiest {crop} grains from this harvest as seed for next season.',
                'message_rw': f'Komeza gukoresha ifumbire n\'uburyo bwo gufata neza ubutaka — byagize akamaro! Bika imbuto nziza n\'izishishikaritse za {crop} kuva muri aya masarura kugira ngo uzazitere mu gihe gikurikira.',
                'goal': 'Encourages sustainable farming by replicating successful practices and saving good seed for continuity.',
                'goal_rw': 'Gushishikariza ubuhinzi burambye binyuze mu gusubiramo uburyo bwagize akamaro no kubika imbuto nziza.'
            },
            {
                'type': 'success',
                'icon': 'bi-graph-up-arrow',
                'category': 'Reinvest Profits / Gushora Inyungu mu Buhinga',
                'message': 'Use part of this season\'s profit to invest in drip irrigation or expand your planted area next season. This can increase long-term yield by 25–40%.',
                'message_rw': 'Koresha igice cy\'inyungu wungutse uyu munsi mu gushora mu buryo bwo kuhira cyangwa kwagura ubuso bw\'ubutaka uteraho mu gihe gikurikira. Ibi bishobora kongera umusaruro w\'igihe kirekire ku kigero cya 25-40%.',
                'goal': 'Promotes long-term farm productivity growth by reinvesting seasonal profits into infrastructure.',
                'goal_rw': 'Guteza imbere umusaruro w\'igihe kirekire binyuze mu gushora inyungu z\'igihe cy\'isarura mu bikorwa remezo.'
            },
        ]

    if pct > -20:
        return [
            {
                'type': 'info',
                'icon': 'bi-bar-chart-line',
                'category': 'Good Average Harvest / Isarura Nziza Igiranye n\'Impuzandengo',
                'message': f'Your predicted yield of {yield_pa:.1f} kg/are is close to the district average ({base:.1f} kg/are) — a solid season. Small improvements can push you into the excellent category.',
                'message_rw': f'Umusaruro wateganyijwe ni {yield_pa:.1f} kg/are, wegereye impuzandengo y\'akarere ({base:.1f} kg/are) — igihe cy\'isarura cyiza. Impinduka nto zishobora kugushyira mu cyiciro cy\'umusaruro mwiza cyane.',
                'goal': 'Sets realistic expectations and motivates the farmer to aim higher through small improvements.',
                'goal_rw': 'Gushyiraho intego zishoboka no gushishikariza umuhinzi gushaka ibyiza birenzeho binyuze mu mpinduka nto.'
            },
            {
                'type': 'info',
                'icon': 'bi-bug',
                'category': 'Pest Scouting / Kureba udukoko n\'indwara',
                'message': 'Scout your fields for pests every 7 days during the last 4 weeks before harvest. A late pest attack can reduce your yield by 15–20% in just days — early action is key.',
                'message_rw': 'Jya ugenzura udukoko mu mirima yawe buri minsi 7 mu byumweru 4 bya nyuma mbere yo gusarura. Igitero cy\'udukoko kije gutinda gishobora kugabanya umusaruro wawe ku kigero cya 15-20% mu minsi mike — gutangira kare ni ingenzi.',
                'goal': 'Reduces late-season crop losses by building a consistent pest monitoring habit during the critical pre-harvest window.',
                'goal_rw': 'Kugabanya igihombo cy\'imyaka mu gihe cy\'isarura binyuze mu kumenyereza uburyo bwo kugenzura udukoko buri gihe.'
            },
            {
                'type': 'info',
                'icon': 'bi-box-seam',
                'category': 'Storage Preparation / Gutegura Ububiko',
                'message': 'Dry your grain to below 13% moisture content before storing. Use hermetic (airtight) bags to keep quality for 3–6 months and avoid selling at low prices immediately after harvest.',
                'message_rw': 'Yubika imyaka yawe kugeza munsi y\'ubumidure bwa 13% mbere yo kuyibika. Koresha imifuko itinjiza umwuka (hermetic) kugira ngo imyaka igumane umwimerere mu mezi 3-6 kandi wirinde kugurisha ku giciro gito hejuru y\'isarura.',
                'goal': 'Prevents post-harvest losses from moisture and pests, and enables the farmer to sell at better off-season prices.',
                'goal_rw': 'Kukumira igihombo nyuma yo gusarura bivuye ku bumidure n\'udukoko, kandi bigafasha umuhinzi kugurisha ku giciro cyiza mu gihe imyaka yabuze.'
            },
            {
                'type': 'info',
                'icon': 'bi-graph-up',
                'category': 'Improve Next Season / Kunoza Igihe cy\'Ihingasizaho',
                'message': f'To reach the excellent yield category: apply DAP fertilizer (0.5 kg/are) at planting and add compost (20 kg/are) two weeks before. These changes can boost your {crop} yield by 20–30% next season.',
                'message_rw': f'Kugira ngo ugere mu cyiciro cy\'umusaruro mwiza cyane: koresha ifumbire ya DAP (0.5 kg/are) igihe uteye kandi wongereho kompositi (20 kg/are) ibyumweru bibiri mbere. Ibi bishobora kongera umusaruro wa {crop} wawe ku kigero cya 20-30% mu gihe gukurikira.',
                'goal': 'Provides specific, actionable agronomy advice to help the farmer improve their yield in the next growing season.',
                'goal_rw': 'Gutanga inama zifatika z\'ubuhinzi kugira ngo zifashe umuhinzi kongera umusaruro we mu gihe cy\'ihinga gikurikira.'
            },
            {
                'type': 'info',
                'icon': 'bi-cash-stack',
                'category': 'Market Strategy / Ingamba zo ku Isoko',
                'message': 'Sell 60% of your harvest within the first month after harvest when your quality is at its best. Store the remaining 40% in hermetic bags for sale 2–3 months later at higher off-season prices.',
                'message_rw': 'Gurisha 60% by\'isarura ryawe mu kwezi kwa mbere nyuma yo gusarura igihe imyaka ifite umwimerere mwiza. Bika 40% isigaye mu mifuko itinjiza umwuka kugira ngo uzayigurishe nyuma y\'amezi 2-3 ku giciro cyo hejuru igihe isoko rimeze neza.',
                'goal': 'Helps farmer plan optimal selling schedule to maximize income from a good-but-not-peak season.',
                'goal_rw': 'Gufasha umuhinzi guteganya gahunda nziza yo kugurisha kugira ngo yongere inyungu niyo isarura ryaba ritarageze ku rwego rwo hejuru cyane.'
            },
        ]

    return [
        {
            'type': 'warning',
            'icon': 'bi-exclamation-triangle',
            'category': 'Below-Average Harvest / Isarura riri munsi y\'impuzandengo',
            'message': f'Predicted yield of {yield_pa:.1f} kg/are is {abs(pct):.0f}% below the district average ({base:.1f} kg/are). Act now — there is still time to improve outcomes before harvest.',
            'message_rw': f'Umusaruro wateganyijwe ni {yield_pa:.1f} kg/are, uri kuri {abs(pct):.0f}% munsi y\'impuzandengo y\'akarere ({base:.1f} kg/are). Gira icyo ukora ubu — haracyari igihe cyo kunoza isarura mbere y\'uko rirenga.',
            'goal': 'Alerts the farmer early so they can take corrective action before the season ends.',
            'goal_rw': 'Kugaragariza umuhinzi hakiri kare kugira ngo afate ingamba zo gukosora mbere y\'uko igihe cy\'ihinga kirangira.'
        },
        {
            'type': 'warning',
            'icon': 'bi-person-lines-fill',
            'category': 'Contact Extension Officer / Baza Umunyamwuga w\'Ubuhinzi',
            'message': 'Contact the RAB extension officer in your sector this week. Bring your farm records and this prediction report. They can identify the specific cause and give you a free soil or crop rescue plan.',
            'message_rw': 'Baza umunyamwuga w\'ubuhinzi (agronome) wo muri kagari cyangwa umurenge wawe muri iki cyumweru. Jyana amakuru yawe n\'iyi raporo y\'umusaruro wateganyijwe. Ashobora kumenya impamvu nyayo kandi akaguha gahunda y\'ubufasha mu kurokora imyaka yawe.',
            'goal': 'Connects the farmer to free professional support so they can accurately diagnose and address the root cause of low yield.',
            'goal_rw': 'Guhuza umuhinzi n\'ubufasha bw\'abanyamwuga kugira ngo bamusuzumire neza impamvu itera umusaruro muke kandi bayishakire umuti.'
        },
        {
            'type': 'warning',
            'icon': 'bi-eyedropper',
            'category': 'Soil pH Test / Ipimo rya pH y\'Ubutaka',
            'message': f'Schedule a soil pH test as soon as possible. A pH below 5.5 is the most common cause of poor {crop} yields in Bugesera. If pH is low, apply agricultural lime at 2 kg/are — cost is very low but recovery is significant.',
            'message_rw': f'Teganya gupimisha pH y\'ubutaka vuba bishoboka. pH iri munsi ya 5.5 ni yo mpamvu ikunze gutera umusaruro muke wa {crop} muri Bugesera. Niba pH iri hasi, koresha ishwagara y\'ubuhinzi (agricultural lime) ku kigero cya 2kg/are — igiciro ni gito cyane ariko inyungu uzahakura ni nini.',
            'goal': 'Addresses the most common agronomic root cause of below-average yields in the district with a specific, affordable solution.',
            'goal_rw': 'Gukemura impamvu y\'ubuhinzi ikunze gutera umusaruro muke mu karere ukoresheje igisubizo cyihariye kandi gihendutse.'
        },
        {
            'type': 'warning',
            'icon': 'bi-droplet-half',
            'category': 'Water Management / Gucunga Amazi',
            'message': 'If you have irrigation access, add one extra watering session per week during the flowering and grain-fill stage. This single action can recover up to 20% of expected lost yield.',
            'message_rw': 'Niba ufite uburyo bwo kuhira, ongeraho inshuro imwe yo kuhira buri cyumweru mu gihe cy\'uburabyo n\'igihe imyaka ishyira amagara. Iki gikorwa kimwe gishobora kigarura kugeza kuri 20% by\'umusaruro washoboraga guhomba.',
            'goal': 'Provides a simple, high-impact action to partially recover yield loss during the critical crop-fill period.',
            'goal_rw': 'Gutanga igikorwa cyoroshye ariko gifite akamaro kanini mu kugarura igice cy\'umusaruro washoboraga guhomba mu gihe gikomeye cy\'imikure y\'ibihingwa.'
        },
        {
            'type': 'warning',
            'icon': 'bi-clipboard-check',
            'category': 'Next Season Recovery Plan / Gahunda yo Kugarura Umusaruro mu Gihe Gikurikira',
            'message': f'For next season, start strong: apply DAP fertilizer at 0.5 kg/are at planting time, and add 20 kg/are of compost two weeks before planting. Also consider crop rotation — avoid planting {crop} in the same field two seasons in a row.',
            'message_rw': f'Mu gihe cy\'ihinga gikurikira, tangirira ku ntego: koresha ifumbire ya DAP ku kigero cya 0.5kg/are igihe utera, kandi wongereho 20kg/are za kompositi ibyumweru bibiri mbere yo gutera. Nanone tekereza guhinduranya ibihingwa — irinda gutera {crop} mu murima umwe ibihe bibiri bikurikiranye.',
            'goal': 'Gives the farmer a clear, structured recovery plan to significantly improve performance in the following planting season.',
            'goal_rw': 'Guha umuhinzi gahunda isobanutse yo kwiyuburura kugira ngo yongere umusaruro we mu buryo bugaragara mu gihe cy\'ihinga gikurikira.'
        },
    ]


# ── In-memory stores ───────────────────────────────────────────────────────────
_predictions: list = []
_users: dict = {
    "F001": {"id":"F001","name":"Cesalie Uwimpuhwe","phone":"+250782001001", "email":"cesalie@gmail.com",
             "sector":"Gashora","farm_size_ha":0.25,"farm_size_are":25,
             "crops":["Maize","Rice"],"role":"farmer","password":"harvest2024"},
    "F002": {"id":"F002","name":"Jean Pierre Habimana","phone":"+250782002002", "email":"jean@gmail.com",
             "sector":"Gashora","farm_size_ha":1.8,"farm_size_are":180,
             "crops":["Rice"],"role":"farmer","password":"harvest2024"},
    "F003": {"id":"F003","name":"Vestine Mukamana","phone":"+250782003003", "email":"vestine@gmail.com",
             "sector":"Gashora","farm_size_ha":3.2,"farm_size_are":320,
             "crops":["Maize","Rice"],"role":"farmer","password":"harvest2024"},
    "A001": {"id":"A001","name":"Dr. Pascal Nkurunziza","phone":"+250788100100", "email":"pascal@district.gov.rw",
             "sector":"Gashora","department":"Crop Production",
             "role":"officer","password":"harvest2024"},
    "A100": {"id":"A100","name":"District Agri Officer","phone":"+250788000000", "email":"admin@bugesera.gov.rw",
             "sector":"Gashora","department":"Administration",
             "role":"district","password":"harvest2024"},
    "S001": {"id":"S001","name":"Marie Mukaso","phone":"+250788222333", "email":"marie@sector.gov.rw",
             "sector":"Gashora","department":"Extension Services",
             "role":"sector","password":"harvest2024"},
}
_next_farmer = 4


# ═════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═════════════════════════════════════════════════════════════════════════════

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'api'      : 'Bugesera Harvest Prediction API v4.0',
        'status'   : 'running [check-circle]',
        'units'    : 'ARE and kg/are (1 ha = 100 are)',
        'crops'    : CROPS,
        'sectors'  : SECTORS,
        'endpoints': {
            'POST /api/predict'          : 'Make a harvest prediction',
            'GET  /api/health'           : 'API health check',
            'POST /api/login'            : 'Login farmer/officer',
            'POST /api/register'         : 'Register new farmer',
            'GET  /api/predictions'      : 'Get predictions (?farmer_id=F001)',
            'GET  /api/district-stats'   : 'District-level statistics',
            'GET  /api/officer-dashboard': 'Officer dashboard data',
            'GET  /api/model-info'       : 'Model details',
            'GET  /api/crops'            : 'List crops',
            'GET  /api/sectors'          : 'List sectors',
        }
    })


# ── OTP and Password Routes ──────────────────────────────────────────────────

@app.route('/api/forgot-password/request', methods=['POST'])
def forgot_password_request():
    d = request.get_json() or {}
    email = d.get('email', '').strip().lower()
    role = d.get('role', 'farmer')

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    if not is_valid_gmail_address(email):
        return jsonify({'error': 'Email must be a valid Gmail address ending in @gmail.com.'}), 400

    user = None
    if DB_ENABLED:
        try:
            user = get_user_by_email(email)
        except Exception as e:
            print(f"DB error in forgot password request: {e}")
    
    # Fallback in-memory
    if not user:
        user = next((u for u in _users.values() if u.get('email', '').lower() == email and u['role'] == role), None)

    if not user:
        return jsonify({'error': 'No account found with this email address.'}), 404

    otp = generate_otp()
    from datetime import datetime, timedelta
    _otps[email] = {
        'otp': otp,
        'expires': datetime.now() + timedelta(minutes=10),
        'user_id': user.get('id') or user.get('farmer_id') or user.get('officer_id'),
        'role': role
    }

    html_content = get_otp_html(user.get('full_name') or user.get('name', 'User'), otp, "password reset")
    sent, err = send_email(email, "Your Password Reset OTP", html_content)
    if sent:
        return jsonify({'success': True, 'message': 'OTP sent to your email.'})
    else:
        return jsonify({'error': 'Failed to send OTP. Please try again later.', 'email_error': err}), 500

@app.route('/api/forgot-password/verify', methods=['POST'])
def forgot_password_verify():
    d = request.get_json() or {}
    email = d.get('email', '').strip().lower()
    otp = d.get('otp', '').strip()
    new_pw = d.get('new_password', '').strip()

    if not all([email, otp, new_pw]):
        return jsonify({'error': 'Email, OTP, and new password are required.'}), 400

    otp_data = _otps.get(email)
    if not otp_data:
        return jsonify({'error': 'No OTP request found for this email.'}), 400

    from datetime import datetime
    if datetime.now() > otp_data['expires']:
        del _otps[email]
        return jsonify({'error': 'OTP has expired.'}), 400

    if otp_data['otp'] != otp:
        return jsonify({'error': 'Invalid OTP.'}), 400

    # OTP is valid, reset password
    uid = otp_data['user_id']
    role = otp_data['role']

    if DB_ENABLED:
        try:
            from database import update_user_password
            if update_user_password(uid, role, new_pw):
                del _otps[email]
                return jsonify({'success': True, 'message': 'Password reset successfully.'})
        except Exception as e:
            print(f"DB error in forgot password verify: {e}")

    # Fallback in-memory
    user = _users.get(uid)
    if user:
        user['password'] = new_pw
        del _otps[email]
        return jsonify({'success': True, 'message': 'Password reset successfully.'})

    return jsonify({'error': 'Failed to reset password. User not found or database update failed.'}), 400

@app.route('/api/change-password/request-otp', methods=['POST'])
def change_password_request_otp():
    d = request.get_json() or {}
    uid = d.get('user_id')
    role = d.get('role', 'farmer')
    old_pw = d.get('old_password', '').strip()

    if not all([uid, old_pw]):
        return jsonify({'error': 'User ID and current password are required.'}), 400

    user = None
    if DB_ENABLED:
        try:
            from database import verify_password, get_farmer, get_officer
            if verify_password(uid, role, old_pw):
                user = get_farmer(uid) if role == 'farmer' else get_officer(uid)
            else:
                return jsonify({'error': 'Current password is incorrect.'}), 401
        except Exception as e:
            print(f"DB error in change password request: {e}")

    # Fallback in-memory
    if not user:
        mem_user = _users.get(uid)
        if mem_user and mem_user.get('password') == old_pw:
            user = mem_user
        else:
            return jsonify({'error': 'Current password is incorrect.'}), 401

    email = user.get('email')
    if not email:
        return jsonify({'error': 'User email not found.'}), 400

    otp = generate_otp()
    from datetime import datetime, timedelta
    _otps[email] = {
        'otp': otp,
        'expires': datetime.now() + timedelta(minutes=10),
        'user_id': uid,
        'role': role
    }

    html_content = get_otp_html(user.get('full_name') or user.get('name', 'User'), otp, "password change")
    sent, err = send_email(email, "Your Password Change OTP", html_content)
    if sent:
        return jsonify({'success': True, 'message': 'OTP sent to your email.'})
    else:
        return jsonify({'error': 'Failed to send OTP. Please try again later.', 'email_error': err}), 500

@app.route('/api/change-password/verify', methods=['POST'])
def change_password_verify():
    d = request.get_json() or {}
    uid = d.get('user_id')
    role = d.get('role', 'farmer')
    otp = d.get('otp', '').strip()
    new_pw = d.get('new_password', '').strip()

    if not all([uid, otp, new_pw]):
        return jsonify({'error': 'All fields are required.'}), 400

    user = None
    if DB_ENABLED:
        try:
            from database import get_farmer, get_officer
            user = get_farmer(uid) if role == 'farmer' else get_officer(uid)
        except Exception as e:
            print(f"DB error in change password verify: {e}")
    
    if not user:
        user = _users.get(uid)
    
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    email = user.get('email')
    otp_data = _otps.get(email)

    if not otp_data or otp_data['user_id'] != uid:
        return jsonify({'error': 'No OTP request found.'}), 400

    from datetime import datetime
    if datetime.now() > otp_data['expires']:
        del _otps[email]
        return jsonify({'error': 'OTP has expired.'}), 400

    if otp_data['otp'] != otp:
        return jsonify({'error': 'Invalid OTP.'}), 400

    # OTP is valid, update password
    if DB_ENABLED:
        try:
            from database import update_user_password
            if update_user_password(uid, role, new_pw):
                del _otps[email]
                return jsonify({'success': True, 'message': 'Password updated successfully.'})
        except Exception as e:
            print(f"DB error in update password: {e}")

    # Fallback in-memory
    if uid in _users:
        _users[uid]['password'] = new_pw
        del _otps[email]
        return jsonify({'success': True, 'message': 'Password updated successfully.'})

    return jsonify({'error': 'Failed to update password. User not found or database update failed.'}), 400

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get real-time weather for a sector from Open-Meteo."""
    sector = request.args.get('sector', 'Gashora')
    planting_date = request.args.get('date')
    if WEATHER_ENABLED:
        try:
            weather = get_weather_for_prediction(sector, planting_date)
            return jsonify({'success': True, 'weather': weather, 'sector': sector})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    return jsonify({'success': False, 'error': 'Weather service not available'}), 503


@app.route('/api/weather/forecast', methods=['GET'])
def get_weather_forecast():
    """Get 7-day forecast + current conditions for a sector from Open-Meteo."""
    sector = request.args.get('sector', 'Gashora')
    if not WEATHER_ENABLED:
        return jsonify({'success': False, 'error': 'Weather service not available'}), 503
    try:
        import urllib3
        urllib3.disable_warnings()
        coords = SECTOR_COORDS.get(sector, SECTOR_COORDS.get('Gashora', {'lat': -2.03, 'lon': 30.12}))
        lat, lon = coords['lat'], coords['lon']

        import requests as req
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat, "longitude": lon,
            "daily": [
                "precipitation_sum", "temperature_2m_max", "temperature_2m_min",
                "relative_humidity_2m_max", "relative_humidity_2m_min",
                "sunshine_duration", "wind_speed_10m_max", "weathercode"
            ],
            "current_weather": True,
            "timezone": "Africa/Kigali",
            "past_days": 0,
            "forecast_days": 7,
        }
        resp = req.get(url, params=params, timeout=8, verify=False)
        resp.raise_for_status()
        data = resp.json()

        daily = data.get('daily', {})
        current = data.get('current_weather', {})

        # Build 7-day forecast list
        forecast = []
        dates = daily.get('time', [])
        for i, date in enumerate(dates):
            def safe(lst, idx): return lst[idx] if lst and idx < len(lst) and lst[idx] is not None else None
            tmax = safe(daily.get('temperature_2m_max', []), i)
            tmin = safe(daily.get('temperature_2m_min', []), i)
            forecast.append({
                'date':     date,
                'temp_max': tmax,
                'temp_min': tmin,
                'temp_avg': round((tmax + tmin) / 2, 1) if tmax and tmin else None,
                'rain':     safe(daily.get('precipitation_sum', []), i),
                'humidity': round((
                    (safe(daily.get('relative_humidity_2m_max', []), i) or 0) +
                    (safe(daily.get('relative_humidity_2m_min', []), i) or 0)
                ) / 2, 1),
                'sunshine': round((safe(daily.get('sunshine_duration', []), i) or 0) / 3600, 1),
                'wind':     safe(daily.get('wind_speed_10m_max', []), i),
                'code':     safe(daily.get('weathercode', []), i),
            })

        return jsonify({
            'success': True,
            'sector': sector,
            'current': {
                'temperature': current.get('temperature'),
                'wind_speed':  current.get('windspeed'),
                'is_day':      current.get('is_day', 1),
                'weathercode': current.get('weathercode'),
                'time':        current.get('time'),
            },
            'forecast': forecast,
            'source': 'open-meteo-live',
            'fetched_at': datetime.now().isoformat(),
        })
    except Exception as e:
        print(f"  [weather/forecast] Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    best = META['best_model']
    r2   = META['_perf'].get(best, {}).get('r2', 0)
    return jsonify({
        'status'   : 'ok',
        'model'    : best,
        'accuracy' : f"{r2*100:.1f}%",
        'r2_score' : r2,
        'crops'    : CROPS,
        'sectors'  : SECTORS,
        'units'    : 'kg/are  (1 ha = 100 are)',
        'version'  : '4.0.0',
        'timestamp': datetime.now().isoformat(),
    })


@app.route('/api/login', methods=['POST'])
def login():
    d         = request.get_json() or {}
    ident     = d.get('email', '').strip().lower()
    pwd       = d.get('password', '').strip()

    print(f"[DEBUG] Login attempt for ident: '{ident}'")

    if DB_ENABLED:
        try:
            # Flexible lookup: Email, ID, or Phone
            user_row = get_user_by_email(ident)
            if not user_row:
                # Fallback to ID or Phone search in DB if get_user_by_email only does email
                from database import get_farmer_by_id_or_phone
                user_row = get_farmer_by_id_or_phone(ident, 'farmer') or get_farmer_by_id_or_phone(ident, 'officer')

            if user_row:
                print(f"[DEBUG] Found user in DB: {user_row['id']}")
                # Basic password check (assuming cleartext or hash match)
                if user_row.get('password_hash') == pwd or user_row.get('password') == pwd:
                    update_last_login(user_row['id'], user_row['role'])
                    return jsonify({'success': True, 'user': {
                        'id'          : user_row['id'],
                        'name'        : user_row.get('full_name') or user_row.get('name'),
                        'email'       : user_row.get('email'),
                        'phone'       : user_row.get('phone'),
                        'role'        : user_row['role'],
                        'sector'      : user_row.get('sector_name') or user_row.get('sector',''),
                        'sector_id'   : user_row.get('sector_id'),
                        'farm_size_ha': user_row.get('farm_size_ha', 0),
                        'farm_size_are': user_row.get('farm_size_are', 0),
                        'crops'       : user_row.get('crops', []),
                        'farmer_category': user_row.get('farmer_category','Medium'),
                        'cooperative_name': user_row.get('cooperative_name') or user_row.get('coop_name'),
                        'coop_total_members': user_row.get('coop_total_members'),
                        'farmer_id'   : user_row.get('farmer_id'),
                        'cell_name'   : user_row.get('cell_name'),
                        'village_name': user_row.get('village_name'),
                    }})
                else:
                    print(f"[DEBUG] Password mismatch for DB user")
        except Exception as e:
            print(f"DB login error: {e}")

    # Fallback in-memory
    ident_lower = ident.lower()
    user = next((u for u in _users.values() if (
        (u.get('email') and u.get('email').lower() == ident_lower) or 
        (u.get('id') and u.get('id').lower() == ident_lower) or 
        (u.get('phone') == ident)
    ) and u['password'] == pwd), None)
    
    if user:
        print(f"[DEBUG] Found user in-memory: {user['id']}")
        return jsonify({'success': True, 'user': {k:v for k,v in user.items() if k != 'password'}})
    
    print(f"[DEBUG] Login failed for ident: '{ident}'")

    return jsonify({'success': False, 'error': 'Invalid credentials.'}), 401


@app.route('/api/change-password', methods=['POST'])
def change_password():
    d = request.get_json() or {}
    uid = d.get('user_id')
    role = d.get('role', 'farmer')
    old_pwd = d.get('old_password')
    new_pwd = d.get('new_password')

    if not all([uid, old_pwd, new_pwd]):
        return jsonify({'success': False, 'error': 'Missing required fields.'}), 400

    # 1. Verification and Update in DB
    if DB_ENABLED:
        try:
            from database import get_farmer, get_user_by_email, update_user_password
            # Verify old password first
            user_row = None
            if role == 'farmer':
                user_row = get_farmer(uid)
            else:
                # Officers don't have a simple get_officer, but we can find them in _users if needed
                # or just use update directly if we trust the session (but here we check old_pwd)
                pass 

            # Direct check if we can get the user
            if user_row:
                db_pwd = user_row.get('password') or user_row.get('password_hash')
                if db_pwd != old_pwd:
                    return jsonify({'success': False, 'error': 'Current password is incorrect.'}), 401
                
                success = update_user_password(uid, role, new_pwd)
                if success:
                    return jsonify({'success': True, 'message': 'Password updated in database.'})
        except Exception as e:
            print(f"DB change-password error: {e}")

    # 2. Fallback / Update in Memory
    user = _users.get(uid)
    if user:
        if user.get('password') != old_pwd:
            return jsonify({'success': False, 'error': 'Current password is incorrect.'}), 401
        user['password'] = new_pwd
        return jsonify({'success': True, 'message': 'Password updated successfully.'})

    return jsonify({'success': False, 'error': 'User not found.'}), 404

@app.route('/api/check-email', methods=['GET'])
def api_check_email():
    email = request.args.get('email', '').strip().lower()
    if not email:
        return jsonify({'exists': False})
    
    from database import check_email_exists
    exists = check_email_exists(email)
    return jsonify({'exists': exists})

@app.route('/api/register', methods=['POST'])
def register():
    global _next_farmer
    d    = request.get_json() or {}
    role = d.get('role', 'farmer')
    print(f"[REGISTER] incoming request: role={role}, email={d.get('email')}, phone={d.get('phone')}")
    print(f"[REGISTER] full data: {d}")

    required = ['name','email','phone']
    # Department is fixed for sector officers; only sector name required for sector role
    if role != 'farmer':
        if role == 'sector':
            required.append('sector')
        elif role != 'cooperative':  # cooperative members don't need department
            required.append('department')

    for field in required:
        if not d.get(field):
            print(f"[REGISTER] Missing required field: {field}")
            return jsonify({'error': f'Missing field: {field}'}), 400

    email_sent = False
    email_error = None

    phone_val = normalize_rwanda_phone(d.get('phone', ''))
    if not is_valid_rwanda_phone(d.get('phone', '')):
        print(f"[REGISTER] Invalid phone number: {d.get('phone')}")
        return jsonify({'error': 'Phone number must be a valid Rwandan MTN/Tigo number with 10 digits.'}), 400
    d['phone'] = phone_val

    # Email Validation
    email_val = d.get('email', '').strip().lower()
    if role == 'farmer' or role == 'cooperative':
        if not is_valid_gmail_address(email_val):
            print(f"[REGISTER] Invalid email for farmer/cooperative: {email_val}")
            return jsonify({'error': 'Invalid email. Please use a valid Gmail address ending in @gmail.com.'}), 400
    else:
        if not is_valid_email(email_val):
            print(f"[REGISTER] Invalid email format: {email_val}")
            return jsonify({'error': 'Invalid email format. Please use a valid email address.'}), 400
    d['email'] = email_val

    if DB_ENABLED:
        try:
            from database import check_email_exists
            
            email_normalized = d['email'].strip().lower()
            if check_email_exists(email_normalized):
                print(f"[REGISTER] Email already exists: {email_normalized}")
                return jsonify({'error': 'This email is already registered. Please login with your existing account.'}), 400
            
            d['email'] = email_normalized # Ensure normalized email is used for registration
            
            if role == 'farmer' or role == 'cooperative':
                # Use new Gashora-specific registration with location support
                from database import register_farmer_with_location
                print(f"[REGISTER] Registering as {role} with data: name={d.get('name')}, cooperative_id={d.get('cooperative_id')}")
                user = register_farmer_with_location(d)
                user['role'] = d.get('role', 'farmer')  # Can be 'farmer' or 'cooperative'
                
                # Welcome notification (no approval needed anymore)
                try:
                    from database import save_advice
                    generated_pw = user.get('generated_password', 'harvest2024')
                    welcome_subject = "Welcome to Gashora Harvest Predictor!" if d.get('lang') != 'rw' else "Murakaza neza muri Sisitemu y'Imyaka ya Gashora!"
                    
                    # Send email asynchronously
                    html_content = get_registration_html(user.get('full_name'), user['email'], generated_pw, 'farmer')
                    email_sent, email_error = send_email_async(user['email'], welcome_subject, html_content)
                    
                    # Save notification to DB for in-app viewing
                    welcome_msg = f"Hello {user.get('full_name')}, your account has been created. ID: {user['farmer_id']}, PW: {generated_pw}. You can now login immediately."
                    save_advice('A001', {
                        'farmer_id': user['farmer_id'],
                        'subject': welcome_subject,
                        'message': welcome_msg,
                        'advice_type': 'system'
                    })
                    
                except Exception as fe:
                    email_sent = False
                    email_error = str(fe)
                    print(f"[REGISTER] Welcome notification creation failed: {fe}")
            else:
                # Force department to 'Crop Production' for sector officers
                if role == 'sector':
                    d['department'] = 'Crop Production'
                user = register_officer(d)
                # 4. Send Beautiful Email for Officers
                try:
                    gen_pw = user.get('generated_password', 'harvest2024')
                    officer_subject = "Your Agriculture Officer Account" if d.get('lang') != 'rw' else "Konti yawe ya Ofisiye w'Ubuhinzi"
                    html_content = get_registration_html(user.get('full_name') or user.get('name'), user['email'], gen_pw, user['role'])
                    email_sent, email_error = send_email_async(user['email'], officer_subject, html_content)
                except Exception as oe:
                    email_sent = False
                    email_error = str(oe)
                    print(f"[REGISTER] Officer email send failed: {oe}")

            if not email_sent:
                print(f"[REGISTER] Email send failed: {email_error}")
                return jsonify({
                    'success': False,
                    'error': 'Account created, but email delivery failed. Please contact support or try again later.',
                    'email_error': email_error
                }), 500

            print(f"[REGISTER] Successfully registered: {user.get('farmer_id') or user.get('officer_id')}")
            return jsonify({'success': True, 'user': user, 'generated_password': user.get('generated_password'), 'email_sent': email_sent}), 201
        except Exception as e:
            print(f"[REGISTER] DB registration error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Database error: {str(e)}. Please check if MySQL is running.'}), 500

    return jsonify({'error': 'Registration failed. Backend in-memory mode active.'}), 500

@app.route('/api/officers', methods=['GET'])
def list_officers():
    if not DB_ENABLED:
        return jsonify({'success': True, 'officers': []})
    role_filter = request.args.get('role')
    requester_id = request.args.get('requester_id')
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT o.officer_id as id, o.full_name as name, o.email, o.department, o.officer_type as role, s.sector_name as sector, o.sector_id
                    FROM officers o
                    LEFT JOIN sectors s ON o.sector_id = s.sector_id
                    WHERE o.is_active = 1
                """
                params = []

                # If requester is a sector officer, restrict visible officers to the same sector
                if requester_id:
                    try:
                        from database import get_officer
                        req = get_officer(requester_id)
                        if req and req.get('role') == 'sector':
                            query += " AND o.sector_id = %s"
                            params.append(req.get('sector_id'))
                    except Exception:
                        pass

                if role_filter:
                    query += " AND o.officer_type = %s"
                    params.append(role_filter)

                cur.execute(query, tuple(params))
                rows = cur.fetchall()
                # Remove sector_id from response payload
                for r in rows:
                    r.pop('sector_id', None)
                return jsonify({'success': True, 'officers': rows})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/officers/<officer_id>', methods=['GET', 'PUT', 'DELETE'])
def officer_detail_route(officer_id):
    """Get, update or delete a specific officer by ID"""
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    
    if request.method == 'GET':
        try:
            officer = get_officer(officer_id)
            if not officer:
                return jsonify({'error': 'Officer not found'}), 404
            # Clean datetime objects
            clean_officer = {}
            for k, v in officer.items():
                if hasattr(v, 'isoformat'):
                    clean_officer[k] = v.isoformat()
                else:
                    clean_officer[k] = v
            return jsonify({'success': True, 'officer': clean_officer})
        except Exception as e:
            print(f"Get Officer error: {e}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'PUT':
        d = request.get_json() or {}
        try:
            if update_user(officer_id, 'officer', d):
                return jsonify({'success': True})
            return jsonify({'error': 'Update failed'}), 400
        except Exception as e:
            print(f"Update Officer error: {e}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            # Soft delete - set is_active=0
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE officers SET is_active=0 WHERE officer_id=%s", (officer_id,))
                    conn.commit()
                    if cur.rowcount > 0:
                        return jsonify({'success': True})
                    return jsonify({'error': 'Officer not found'}), 404
        except Exception as e:
            print(f"Delete Officer error: {e}")
            return jsonify({'error': str(e)}), 500


@app.route('/api/test-smtp', methods=['POST'])
def test_smtp():
    """Simple endpoint to test SMTP sending. POST JSON { to: optional email }"""
    d = request.get_json() or {}
    to = d.get('to') or SMTP_USER
    subject = d.get('subject') or "Test email from Bugesera Harvest System"
    body = d.get('body') or "This is a test email to verify SMTP settings."

    sent, err = send_email(to, subject, f"<p>{body}</p>")
    if sent:
        return jsonify({'success': True, 'message': f'Test email sent to {to}'})
    return jsonify({'success': False, 'error': err}), 500

@app.route('/api/farms', methods=['GET', 'POST'])
def manage_farms():
    if not DB_ENABLED:
        return jsonify({'error': 'DB essentially required for this feature.'}), 500
    if request.method == 'POST':
        data = request.get_json()
        if not data.get('farmer_id') or not data.get('farm_name'):
            return jsonify({'error': 'Missing required fields'}), 400
        farm = add_farm(data)
        return jsonify({'success': True, 'farm': farm})
    else:
        farmer_id = request.args.get('farmer_id')
        if not farmer_id: return jsonify({'error': 'Missing farmer_id'}), 400
        farms = get_farms(farmer_id)
        return jsonify({'success': True, 'farms': farms})

@app.route('/api/predictions/approve', methods=['POST'])
def approve_pred():
    if not DB_ENABLED: return jsonify({'error': 'DB required'}), 500
    d = request.get_json()
    pid = d.get('prediction_id')
    if approve_prediction(pid):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to approve'}), 400

@app.route('/api/predict', methods=['POST'])
def predict():
    d = request.get_json() or {}

    # Smart Sector Detection
    farmer_id = d.get('farmer_id')
    sector    = d.get('sector')
    
    if not sector and farmer_id and DB_ENABLED:
        try:
            from database import get_farmer
            f = get_farmer(farmer_id)
            if f: 
                sector = f.get('sector')
                print(f"  [search] Smart Sector: Auto-detected {sector} for {farmer_id}")
        except: pass

    # If still no sector, try in-memory fallback
    if not sector and farmer_id and farmer_id in _users:
        sector = _users[farmer_id].get('sector')

    # Validate required fields
    required = ['crop', 'season', 'farm_size']
    for field in required:
        if field not in d:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if not sector:
        return jsonify({'error': 'Sector location is required and could not be auto-detected.'}), 400

    if d['crop'] not in CROPS:
        return jsonify({'error': f"Unknown crop '{d['crop']}'. Valid: {CROPS}"}), 400
    if sector not in SECTORS:
        return jsonify({'error': f"Unknown sector '{sector}'. Valid: {SECTORS}"}), 400

    try:
        month  = d.get('month', 'October')
        season = d['season']
        # Update dict so build_features sees the auto-detected sector
        d['sector'] = sector

        # ── Auto-fetch real weather from Open-Meteo ───────────────────────────
        if WEATHER_ENABLED:
            try:
                live_weather = get_weather_for_prediction(sector, d.get('planting_date'))
                # Only use live data if values are valid
                if live_weather.get('Total_Rainfall_mm') and live_weather['Total_Rainfall_mm'] > 0:
                    d['rainfall']          = live_weather['Total_Rainfall_mm']
                    d['temperature']       = live_weather['Avg_Temperature_Celsius']
                    d['humidity']          = live_weather['Relative_Humidity_Pct']
                    d['sunshine']          = live_weather['Sunshine_Hours_per_Day']
                    d['wind_speed']        = live_weather['Wind_Speed_kmh']
                    d['evapotranspiration']= live_weather['Evapotranspiration_mm']
                    d['_weather_source']   = live_weather.get('source', 'live')
                    print(f"  [weather] Using live data for {sector}: rain={d['rainfall']}mm temp={d['temperature']}°C")
                else:
                    d['_weather_source'] = 'historical-fallback'
            except Exception as we:
                print(f"  [weather] Error: {we} — using historical")
                d['_weather_source'] = 'historical-fallback'
        else:
            d['_weather_source'] = 'historical-constants'

        # Build feature vector
        X = build_features(d)

        # Predict — apply scaler if best model is Ridge/Linear
        best_name = META.get('best_model', '')
        if 'Ridge' in best_name or 'Linear' in best_name or 'Regression' in best_name:
            X_input = scaler.transform(X)
        else:
            X_input = X.values

        # Predict — model outputs kg/are directly
        yield_per_are_raw = float(model.predict(X_input)[0])
        yield_per_are_raw = max(1.0, round(yield_per_are_raw, 2))

        # ── Post-prediction adjustments based on ACTUAL dataset values ─────────
        # All multipliers derived from Bugesera_Agricultural_Dataset_Updated.xlsx
        adj = yield_per_are_raw

        crop   = d.get('crop', 'Maize')
        season = d.get('season', 'Season A')
        pest   = d.get('pest_pressure', 'Low')
        prev   = d.get('previous_crop', 'Beans')
        fert_bin = 1 if d.get('fertilizer_used','No') in ('Yes','yes','true',True) else 0
        irr_bin  = 1 if d.get('irrigation_used','No') in ('Yes','yes','partial','Partial',True) else 0

        # 1. SEED VARIETY — biggest effect after crop type (from dataset)
        # Maize: Hybrid=30.76, Improved=23.36, Local=17.28
        # Beans: Improved=16.17, Hybrid=12.02, Local=8.55
        # Rice:  Improved=43.63, Hybrid=33.54
        seed = d.get('seed_variety', 'Improved')
        SEED_MULT = {
            'Maize': {'Hybrid': 1.32, 'Improved': 1.0, 'Local': 0.74},
            'Beans': {'Improved': 1.36, 'Hybrid': 1.01, 'Local': 0.72},
            'Rice':  {'Improved': 1.22, 'Hybrid': 0.94, 'Local': 0.90},
        }
        seed_mult = SEED_MULT.get(crop, {}).get(seed, 1.0)
        adj = adj * seed_mult

        # 2. TERRAIN — from dataset (Hillside vs Valley)
        # Maize: Hillside=23.65 > Valley=22.38 (+5.7%)
        # Beans: Valley=12.15 > Hillside=11.79 (+3%)
        # Rice:  Hillside=36.63 > Valley=35.84 (+2.2%)
        terrain = d.get('terrain', 'Flat')
        TERRAIN_MULT = {
            'Maize': {'Valley': 0.94, 'Flat': 0.97, 'Hillside': 1.0},
            'Beans': {'Valley': 1.0,  'Flat': 0.97, 'Hillside': 0.97},
            'Rice':  {'Valley': 0.98, 'Flat': 0.99, 'Hillside': 1.0},
        }
        terrain_mult = TERRAIN_MULT.get(crop, {}).get(terrain, 1.0)
        adj = adj * terrain_mult

        # 3. FERTILIZER — from dataset (fertilizer effect varies by crop)
        # Dataset shows fertilizer alone doesn't always help — it's the TYPE that matters
        # Maize: Mixed=23.79 > None=22.94 > NPK=22.62 > Yes=23.13
        # Organic (Compost) is good for all crops
        fert_type = d.get('fertilizer_type', 'None')
        if fert_bin:
            FERT_TYPE_MULT = {
                'Maize': {'Inorganic (NPK)':0.98,'Mixed (Organic + Inorganic)':1.04,
                          'Organic (Compost)':1.03,'DAP':1.01,'NPK':0.98,'Urea':1.00,'Organic':1.03},
                'Beans': {'Inorganic (NPK)':0.98,'Mixed (Organic + Inorganic)':0.96,
                          'Organic (Compost)':1.00,'DAP':0.99,'NPK':0.98,'Urea':0.97,'Organic':1.00},
                'Rice':  {'Inorganic (NPK)':0.94,'Mixed (Organic + Inorganic)':0.98,
                          'Organic (Compost)':0.98,'DAP':0.96,'NPK':0.94,'Urea':0.95,'Organic':0.98},
            }
            fert_mult = FERT_TYPE_MULT.get(crop, {}).get(fert_type, 1.0)
            adj = adj * fert_mult

            # Fertilizer AMOUNT effect (more kg/are = better, up to optimal)
            fert_kg = float(d.get('fertilizer_amount_kg_are', 0) or 0)
            if fert_kg > 0 and fert_type not in ('Organic','Organic (Compost)'):
                # Optimal ~1.5 kg/are for Maize, 0.8 for Beans, 1.8 for Rice
                OPT = {'Maize':1.5,'Beans':0.8,'Rice':1.8}
                opt = OPT.get(crop, 1.5)
                # Below optimal: proportional boost; above: diminishing returns
                if fert_kg <= opt:
                    amount_boost = (fert_kg / opt) * 0.08  # up to +8%
                else:
                    amount_boost = 0.08 - (fert_kg - opt) * 0.02  # diminishing
                adj = adj * (1.0 + max(0, amount_boost))

        # 4. SEASON — from dataset
        # Maize: A=23.86, B=22.59 (-5.3%)
        # Beans: A=12.17, B=11.65 (-4.3%)
        # Rice:  A=37.96, B=34.77 (-8.4%)
        SEASON_MULT = {
            'Maize': {'Season A': 1.0, 'Season B': 0.947},
            'Beans': {'Season A': 1.0, 'Season B': 0.957},
            'Rice':  {'Season A': 1.0, 'Season B': 0.916},
        }
        season_mult = SEASON_MULT.get(crop, {}).get(season, 1.0)
        adj = adj * season_mult

        # 5. PEST PRESSURE — from dataset
        # Maize: Low=23.78, Medium=22.77, High=22.85
        # Rice:  Low=37.14, Medium=36.22, High=35.28
        PEST_MULT = {
            'Maize': {'Low':1.0,'Medium':0.957,'High':0.961},
            'Beans': {'Low':1.0,'Medium':1.021,'High':1.011},
            'Rice':  {'Low':1.0,'Medium':0.976,'High':0.950},
        }
        pest_mult = PEST_MULT.get(crop, {}).get(pest, 1.0)
        adj = adj * pest_mult

        # 6. IRRIGATION — small positive effect
        if irr_bin:
            adj = adj * 1.04  # +4%

        # 7. EXTENSION ACCESS — small positive
        if d.get('extension_access','Yes') == 'Yes':
            adj = adj * 1.02  # +2%

        # 8. PREVIOUS CROP — legume rotation
        if prev in ('Beans','Legume'):
            adj = adj * 1.03  # +3% nitrogen
        elif prev == crop:
            adj = adj * 0.97  # -3% same crop

        # Floor at 1 kg/are
        yield_per_are = max(1.0, round(adj, 2))
        yield_per_ha   = round(yield_per_are * HA_TO_ARE, 1)

        farm_size_are  = float(d['farm_size'])
        farm_size_ha   = round(farm_size_are * ARE_TO_HA, 4)
        area_planted_are = float(d.get('area_planted', farm_size_are * 0.9))
        total_yield_kg = round(yield_per_are * area_planted_are, 1)

        recs = get_recommendations(d['crop'], yield_per_are, d['sector'])

        # Dynamic Confidence Score based on user inputs
        r2   = META['_perf'].get(best, {}).get('r2', 0.85)
        base_conf = min(97.0, max(72.0, (r2 * 100) - 2.0))

        # Use conf_adj computed in build_features (based on all farmer inputs)
        conf_adj = d.get('_conf_adj', 0.0)
        dynamic_conf = max(60.0, min(97.0, round(base_conf + conf_adj, 1)))

        # Get auto climate for display
        auto_clim = get_climate(month, season)

        result = {
            'id'                  : f"PRED-{uuid.uuid4().hex[:6].upper()}",
            'timestamp'           : datetime.now().isoformat(),
            'farmer_id'           : d.get('farmer_id', 'UNKNOWN'),
            'crop'                : d['crop'],
            'sector'              : d['sector'],
            'season'              : d['season'],
            'month'               : month,
            'planting_date'       : d.get('planting_date', ''),
            'farm_size_are'       : farm_size_are,
            'farm_size_ha'        : farm_size_ha,
            'area_planted_are'    : area_planted_are,
            'area_planted_ha'     : round(area_planted_are * ARE_TO_HA, 4),
            'yield_per_are_kg'    : yield_per_are,
            'yield_per_ha_kg'     : yield_per_ha,
            'total_yield_kg'      : total_yield_kg,
            'yield_range'         : f"{round(yield_per_are*0.92,1)}–{round(yield_per_are*1.08,1)} kg/are",
            'confidence_pct'      : dynamic_conf,
            'model_used'          : best,
            'district_avg_kg_are' : CROP_BENCHMARKS.get(d['crop'], 20.0),
            'soil_data'           : SECTOR_SOIL.get(d['sector'], {}),
            'inputs': {
                'temperature'     : auto_clim['temperature'],
                'rainfall'        : round(auto_clim['rainfall'] / 6, 1),  # back to monthly for display
                'humidity'        : auto_clim['humidity'],
                'sunshine'        : auto_clim['sunshine'],
                'fertilizer_used' : d.get('fertilizer_used', False),
                'irrigation_used' : d.get('irrigation_used', False),
                'soil_type'       : d.get('soil_type', 'Clay'),
                'farmer_category' : d.get('farmer_category', 'Medium'),
                'climate_source'  : d.get('_weather_source', 'historical'),
            },
            'recommendations'     : recs,
        }

        _predictions.append(result)
        if DB_ENABLED:
            try:
                db_pred = {
                    'prediction_id'    : result['id'],
                    'farmer_id'        : result.get('farmer_id','UNKNOWN'),
                    'crop_type'        : result.get('crop'),
                    'crop'             : result.get('crop'),
                    'sector'           : result.get('sector'),
                    'season'           : result.get('season'),
                    'month'            : result.get('month'),
                    'planting_date'    : result.get('planting_date') or datetime.now().strftime('%Y-%m-%d'),
                    'year'             : datetime.now().year,
                    'area_planted_are' : result.get('area_planted_are'),
                    'soil_type'        : result.get('inputs',{}).get('soil_type','Clay'),
                    'fertilizer_used'  : 'Yes' if result.get('inputs',{}).get('fertilizer_used') else 'No',
                    'irrigation_used'  : 'Yes' if result.get('inputs',{}).get('irrigation_used') else 'No',
                    'previous_crop'    : d.get('previous_crop','Beans'),
                    'pest_pressure'    : d.get('pest_pressure','Low'),
                    'labor_availability': d.get('labor_availability','Adequate'),
                    'extension_access' : d.get('extension_access','Yes'),
                    'credit_access'    : d.get('credit_access','No'),
                    'yield_per_are_kg' : result.get('yield_per_are_kg'),
                    'yield_per_ha_kg'  : result.get('yield_per_ha_kg'),
                    'total_yield_kg'   : result.get('total_yield_kg'),
                    'yield_range_low'  : round(result.get('yield_per_are_kg',0)*0.92, 4),
                    'yield_range_high' : round(result.get('yield_per_are_kg',0)*1.08, 4),
                    'district_avg_kg_are': result.get('district_avg_kg_are'),
                    'confidence_pct'   : result.get('confidence_pct', DEFAULT_MODEL_CONFIDENCE),
                    'model_used'       : result.get('model_used','Gradient Boosting'),
                    'inputs'           : result.get('inputs',{}),
                    'is_offline'       : False,
                }
                save_prediction(db_pred, result.get('recommendations', []))
                print(f"  [check-circle] Prediction {result['id']} saved to MySQL")
            except Exception as e:
                print(f"  [exclamation-triangle]️  DB save prediction error: {e}")
        return jsonify(result)

    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    fid = request.args.get('farmer_id')
    page = int(request.args.get('page') or 1)
    per_page = int(request.args.get('per_page') or request.args.get('limit') or 10)
    offset = (max(page, 1) - 1) * per_page
    if DB_ENABLED:
        try:
            from database import get_predictions as db_get_predictions
            data = db_get_predictions(farmer_id=fid or None, limit=per_page, offset=offset)
            # Serialize datetime/decimal fields
            import decimal
            clean = []
            for p in data:
                row = {}
                for k,v in p.items():
                    if isinstance(v, decimal.Decimal): row[k] = float(v)
                    elif hasattr(v,'isoformat'):        row[k] = v.isoformat()
                    else:                               row[k] = v
                clean.append(row)
            has_more = len(clean) == per_page
            return jsonify({'count': len(clean), 'predictions': clean, 'page': page, 'per_page': per_page, 'has_more': has_more})
        except Exception as e:
            print(f"DB get_predictions error: {e}")
    # Fallback in-memory
    data = [p for p in _predictions if p.get('farmer_id') == fid] if fid else _predictions
    return jsonify({'count': len(data), 'predictions': data})


@app.route('/api/district-stats', methods=['GET'])
def district_stats():
    if DB_ENABLED:
        try:
            return jsonify(get_district_stats())
        except Exception as e:
            print(f"DB stats error: {e}")
    if not _predictions:
        return jsonify({
            'total_predictions': 0,
            'total_farmers'    : len([u for u in _users.values() if u['role']=='farmer']),
            'crop_stats'       : {c: {'avg_yield_kg_are': CROP_BENCHMARKS[c]} for c in CROPS},
            'sector_stats'     : {},
            'note'             : 'No predictions yet — showing benchmark values',
        })
    df = pd.DataFrame(_predictions)
    return jsonify({
        'total_predictions'   : len(df),
        'total_farmers'       : int(df['farmer_id'].nunique()),
        'avg_yield_per_are'   : round(float(df['yield_per_are_kg'].mean()), 2),
        'avg_yield_per_ha'    : round(float(df['yield_per_are_kg'].mean()) * 100, 1),
        'crop_stats'          : df.groupby('crop').agg(
            count=('yield_per_are_kg','count'),
            avg_yield_kg_are=('yield_per_are_kg','mean'),
            avg_total_kg=('total_yield_kg','mean')
        ).round(2).to_dict('index'),
        'sector_stats'        : df.groupby('sector')['yield_per_are_kg'].mean().round(2).to_dict(),
        'recent_predictions'  : df.tail(5)[['id','farmer_id','crop','sector',
                                            'yield_per_are_kg','total_yield_kg','timestamp']].to_dict('records'),
    })


@app.route('/api/officer-dashboard', methods=['GET'])
def officer_dashboard():
    sector = request.args.get('sector')
    if DB_ENABLED:
        try:
            from database import get_district_stats, get_db, get_predictions as db_preds, get_officer_dashboard, get_sector_dashboard
            import decimal

            def clean_row(d):
                r = {}
                for k,v in d.items():
                    if isinstance(v, decimal.Decimal): r[k] = float(v)
                    elif hasattr(v, 'isoformat'): r[k] = v.isoformat()
                    else: r[k] = v
                if 'crop_type' in r and 'crop' not in r:
                    r['crop'] = r['crop_type']
                return r

            if sector:
                data = get_sector_dashboard(sector)
                clean_farmers = [clean_row(f) for f in data.get('farmers', [])]
                clean_all_preds = [clean_row(p) for p in data.get('all_predictions', [])]

                # Ensure 'crop' field exists (DB returns crop_type)
                for p in clean_all_preds:
                    if 'crop' not in p or not p['crop']:
                        p['crop'] = p.get('crop_type', '')

                # Derive crop stats for this sector
                crop_stats = {}
                for p in clean_all_preds:
                    c = p.get('crop') or p.get('crop_type')
                    if not c: continue
                    if c not in crop_stats: crop_stats[c] = []
                    v = p.get('yield_per_are_kg', 0)
                    if v: crop_stats[c].append(float(v))

                final_crop_data = {}
                for c, yields in crop_stats.items():
                    final_crop_data[c] = {
                        'avg_yield_kg_are': round(sum(yields) / len(yields), 2) if yields else 0,
                        'prediction_count': len(yields)
                    }

                return jsonify({
                    'success': True,
                    'farmer_count': data.get('total_farmers', 0),
                    'total_predictions': data.get('total_predictions', len(clean_all_preds)),
                    'farmer_list': clean_farmers,
                    'recent_preds': clean_all_preds[:5],
                    'crop_data': final_crop_data,
                    'all_predictions': clean_all_preds,
                    'pending_predictions': [clean_row(p) for p in data.get('pending_predictions', [])],
                    'seasons': data.get('seasons', []),
                    'is_sector_level': True,
                    'sector_name': sector
                })

            db_data = get_officer_dashboard()
            dist = get_district_stats()
            
            # Map seasons from district stats
            seasons_data = dist.get('seasons', [])

            # crop_data
            crop_data = {}
            for row in dist.get('by_crop', []):
                crop = row.get('crop_type','')
                crop_data[crop] = {
                    'prediction_count': int(row.get('total_predictions',0)),
                    'avg_yield_kg_are': float(row.get('avg_yield_kg_are') or CROP_BENCHMARKS.get(crop,20)),
                    'benchmark_kg_are': CROP_BENCHMARKS.get(crop, 20),
                }

            # sector_data
            sector_data = {}
            for row in dist.get('sector_ranking', []):
                sec = row.get('sector_name','')
                sector_data[sec] = {
                    'prediction_count': int(row.get('total_predictions') or 0),
                    'avg_yield_kg_are': float(row.get('avg_yield_kg_are') or 0),
                    'farmer_count'    : 0,
                }

            # recent predictions
            recent_clean = [clean_row(p) for p in db_preds(limit=10)]

            # farmers list with prediction counts
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT f.farmer_id as id, f.full_name as name, "
                        "s.sector_name as sector, "
                        "ROUND(fm.farm_size_are/100,2) as farm_size_ha, "
                        "fm.farm_size_are, "
                        "COUNT(p.prediction_id) as prediction_count, "
                        "ROUND(AVG(p.yield_per_are_kg),2) as avg_yield "
                        "FROM farmers f "
                        "LEFT JOIN farms fm ON f.farmer_id=fm.farmer_id "
                        "LEFT JOIN sectors s ON fm.sector_id=s.sector_id "
                        "LEFT JOIN predictions p ON f.farmer_id=p.farmer_id "
                        "WHERE f.is_active=1 "
                        "GROUP BY f.farmer_id "
                        "ORDER BY prediction_count DESC"
                    )
                    farmers_list = [clean_row(dict(r)) for r in cur.fetchall()]

            return jsonify({
                'summary': {
                    'total_farmers'     : db_data.get('total_farmers', 0),
                    'total_predictions' : db_data.get('total_predictions', 0),
                    'registered_sectors': 15,
                    'model_accuracy'    : f"{META['_perf'].get(META['best_model'],{}).get('r2',0)*100:.1f}%",
                    'db_status': 'connected',
                    'db_error': None
                },
                'crop_data'   : crop_data,
                'sector_data' : sector_data,
                'recent_preds': recent_clean,
                'farmers'     : farmers_list,
                'seasons'     : seasons_data,
                'db_connected': True
            })
        except Exception as e:
            import traceback
            print(f"DB dashboard error: {e}")
            traceback.print_exc()
            db_error = str(e)
    
    # --- FALLBACK / MERGE MODE ---
    db_error = db_error if 'db_error' in locals() else None
    farmers = [u for u in _users.values() if u['role'] == 'farmer']
    preds   = _predictions

    # Sector yield summary
    sector_data = {}
    for sec in SECTORS[:12]: # Limit for dashboard view
        sec_preds = [p for p in preds if p.get('sector') == sec]
        sector_data[sec] = {
            'prediction_count' : len(sec_preds),
            'avg_yield_kg_are' : round(float(np.mean([p['yield_per_are_kg'] for p in sec_preds])), 2) if sec_preds else 0,
            'farmer_count'     : len([f for f in farmers if f.get('sector') == sec]),
        }

    # Crop performance from predictions
    crop_data = {}
    for crop in CROPS:
        cp = [p for p in preds if p.get('crop') == crop]
        crop_data[crop] = {
            'prediction_count' : len(cp),
            'avg_yield_kg_are' : round(float(np.mean([p['yield_per_are_kg'] for p in cp])), 2) if cp else CROP_BENCHMARKS[crop],
            'benchmark_kg_are' : CROP_BENCHMARKS[crop],
        }

    return jsonify({
        'summary': {
            'total_farmers'     : len(farmers),
            'total_predictions' : len(preds),
            'registered_sectors': len(SECTORS),
            'model_accuracy'    : f"{META['_perf'].get(META['best_model'],{}).get('r2',0)*100:.1f}%",
            'db_status': 'error' if db_error else 'offline',
            'db_error': db_error
        },
        'sector_data' : sector_data,
        'crop_data'   : crop_data,
        'recent_preds': preds[-10:][::-1] if preds else [],
        'farmers'     : [{'id':f['id'],'name':f['name'],'sector':f.get('sector',''),
                          'farm_size_ha':f.get('farm_size_ha',0),
                          'farm_size_are':f.get('farm_size_are',0)} for f in farmers],
        'db_connected': False
    })


@app.route('/api/sector/analytics', methods=['GET'])
def sector_analytics():
    """
    Activity Analytics endpoint for Sector Officers
    Returns comprehensive analytics data filtered by location, crop, and farmer type
    """
    cell_id = request.args.get('cell_id')
    village_id = request.args.get('village_id')
    crop = request.args.get('crop')
    farmer_type = request.args.get('farmer_type')  # 'all', 'individual', 'cooperative'
    
    if not DB_ENABLED:
        return jsonify({
            'success': False,
            'error': 'Database not available'
        }), 500
    
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Base query for farmers and predictions
                where_clauses = ["f.is_active = 1"]
                params = []
                
                # Filter by cell
                if cell_id and cell_id != 'all':
                    where_clauses.append("c.cell_id = %s")
                    params.append(cell_id)
                
                # Filter by village
                if village_id and village_id != 'all':
                    where_clauses.append("v.village_id = %s")
                    params.append(village_id)
                
                # Filter by farmer type
                if farmer_type and farmer_type != 'all':
                    if farmer_type == 'cooperative':
                        where_clauses.append("f.is_cooperative_member = 1")
                    elif farmer_type == 'individual':
                        where_clauses.append("f.is_cooperative_member = 0")
                
                where_sql = " AND ".join(where_clauses)
                
                # Build crop filter for predictions
                crop_filter_sql = ""
                crop_params = []
                if crop and crop != 'all':
                    crop_filter_sql = "AND p.crop_type = %s"
                    crop_params = [crop]
                
                # Summary statistics
                summary_query = f"""
                    SELECT 
                        COUNT(DISTINCT f.farmer_id) as total_farmers,
                        COUNT(DISTINCT CASE WHEN f.is_cooperative_member = 0 THEN f.farmer_id END) as individual_farmers,
                        COUNT(DISTINCT CASE WHEN f.is_cooperative_member = 1 THEN f.farmer_id END) as cooperative_members,
                        COALESCE(SUM(p.total_yield_kg), 0) as total_yield,
                        COALESCE(AVG(p.yield_per_are_kg), 0) as average_yield,
                        COUNT(DISTINCT CASE WHEN p.yield_per_are_kg >= 25 THEN f.farmer_id END) as top_performers,
                        COUNT(DISTINCT CASE WHEN p.yield_per_are_kg < 15 THEN f.farmer_id END) as underperformers
                    FROM farmers f
                    LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                    LEFT JOIN villages v ON fm.village_id = v.village_id
                    LEFT JOIN cells c ON v.cell_id = c.cell_id
                    LEFT JOIN predictions p ON f.farmer_id = p.farmer_id {crop_filter_sql}
                    WHERE {where_sql}
                """
                
                cur.execute(summary_query, params + crop_params)
                summary_row = cur.fetchone()
                
                summary = {
                    'totalFarmers': int(summary_row['total_farmers'] or 0),
                    'individualFarmers': int(summary_row['individual_farmers'] or 0),
                    'cooperativeMembers': int(summary_row['cooperative_members'] or 0),
                    'totalYield': float(summary_row['total_yield'] or 0),
                    'averageYield': float(summary_row['average_yield'] or 0),
                    'topPerformers': int(summary_row['top_performers'] or 0),
                    'underperformers': int(summary_row['underperformers'] or 0)
                }
                
                # Cell-level data
                cell_where = "1=1"
                cell_params = crop_params.copy()
                if cell_id and cell_id != 'all':
                    cell_where = "c.cell_id = %s"
                    cell_params.append(cell_id)
                
                cell_query = f"""
                    SELECT 
                        c.cell_name as name,
                        COUNT(DISTINCT f.farmer_id) as totalFarmers,
                        COUNT(DISTINCT CASE WHEN f.is_cooperative_member = 0 THEN f.farmer_id END) as individualFarmers,
                        COUNT(DISTINCT CASE WHEN f.is_cooperative_member = 1 THEN f.farmer_id END) as cooperativeMembers,
                        COALESCE(AVG(p.yield_per_are_kg), 0) as avgYield,
                        CASE 
                            WHEN AVG(p.yield_per_are_kg) >= 25 THEN 'excellent'
                            WHEN AVG(p.yield_per_are_kg) >= 20 THEN 'good'
                            WHEN AVG(p.yield_per_are_kg) >= 15 THEN 'average'
                            ELSE 'poor'
                        END as performance
                    FROM cells c
                    LEFT JOIN villages v ON c.cell_id = v.cell_id
                    LEFT JOIN farms fm ON v.village_id = fm.village_id
                    LEFT JOIN farmers f ON fm.farmer_id = f.farmer_id AND f.is_active = 1
                    LEFT JOIN predictions p ON f.farmer_id = p.farmer_id {crop_filter_sql}
                    WHERE {cell_where}
                    GROUP BY c.cell_id, c.cell_name
                    ORDER BY avgYield DESC
                """
                
                cur.execute(cell_query, cell_params)
                cell_data = [dict(row) for row in cur.fetchall()]
                
                # Recent activities with farmer type
                activities_query = f"""
                    SELECT 
                        f.full_name as farmerName,
                        CASE WHEN f.is_cooperative_member = 1 THEN 'cooperative' ELSE 'individual' END as farmerType,
                        p.crop_type as crop,
                        CONCAT(c.cell_name, ', ', v.village_name) as location,
                        CONCAT('Predicted ', ROUND(p.yield_per_are_kg, 1), ' kg/are yield') as action,
                        DATE_FORMAT(p.created_at, '%%b %%d, %%Y') as timestamp
                    FROM predictions p
                    JOIN farmers f ON p.farmer_id = f.farmer_id
                    LEFT JOIN farms fm ON f.farmer_id = fm.farmer_id
                    LEFT JOIN villages v ON fm.village_id = v.village_id
                    LEFT JOIN cells c ON v.cell_id = c.cell_id
                    WHERE {where_sql} {crop_filter_sql}
                    ORDER BY p.created_at DESC
                    LIMIT 20
                """
                
                cur.execute(activities_query, params + crop_params)
                activities = [dict(row) for row in cur.fetchall()]
                
                return jsonify({
                    'success': True,
                    'analytics': {
                        'summary': summary,
                        'cellData': cell_data,
                        'villageData': [],  # Can be expanded later
                        'cropData': [],     # Can be expanded later
                        'recentActivities': activities,
                        'yieldTrends': []   # Can be expanded later
                    }
                })
                
    except Exception as e:
        import traceback
        print(f"Analytics endpoint error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/model-info', methods=['GET'])
def model_info():
    # Compute feature importance from best model
    feature_importance = []
    try:
        if hasattr(model, 'feature_importances_'):
            fi = sorted(
                zip(FEATURES, model.feature_importances_),
                key=lambda x: x[1], reverse=True
            )
            feature_importance = [
                {'feature': f.replace('_enc','').replace('_',' '), 'importance': round(float(v)*100, 2)}
                for f, v in fi[:12]
            ]
    except Exception:
        pass

    # Confusion matrix for regression — bin predictions into yield grades
    confusion = {}
    try:
        if DB_ENABLED:
            from database import get_all_predictions_flat
            preds = get_all_predictions_flat()
            if preds:
                import pandas as _pd
                pdf = _pd.DataFrame(preds)
                benchmarks = CROP_BENCHMARKS

                def grade(val, crop):
                    b = benchmarks.get(crop, 17)
                    pct = (val / b) * 100 if b else 0
                    if pct >= 115: return 'Excellent'
                    if pct >= 90:  return 'Good'
                    if pct >= 70:  return 'Average'
                    return 'Below Average'

                if 'yield_per_are_kg' in pdf.columns and 'crop_type' in pdf.columns:
                    pdf['grade'] = pdf.apply(
                        lambda r: grade(float(r['yield_per_are_kg'] or 0), r['crop_type'] or 'Maize'), axis=1
                    )
                    counts = pdf['grade'].value_counts().to_dict()
                    total  = len(pdf)
                    confusion = {
                        g: {'count': int(counts.get(g, 0)),
                            'pct':   round(counts.get(g, 0) / total * 100, 1) if total else 0}
                        for g in ['Excellent', 'Good', 'Average', 'Below Average']
                    }
    except Exception as e:
        print(f"Confusion matrix error: {e}")

    return jsonify({
        'best_model'       : META['best_model'],
        'features'         : FEATURES,
        'feature_count'    : len(FEATURES),
        'target'           : META['target'],
        'units'            : META.get('units', {}),
        'crops'            : CROPS,
        'sectors'          : SECTORS,
        'metrics'          : META.get('model_comparison', META['_perf']),
        'benchmarks_kg_are': CROP_BENCHMARKS,
        'yield_stats'      : META.get('yield_stats', {}),
        'feature_importance': feature_importance,
        'confusion_matrix' : confusion,
        'dataset_info'     : {
            'total_rows' : META.get('dataset_rows', 2502),
            'train_rows' : META.get('train_rows', 2001),
            'test_rows'  : META.get('test_rows', 501),
            'r2_score'   : META.get('r2_score', 0.9724),
            'mae'        : META.get('mae', 0.979),
        }
    })


@app.route('/api/crops', methods=['GET'])
def get_crops():
    return jsonify(CROPS)


@app.route('/api/farmer/<farmer_id>/advice', methods=['GET'])
def get_advice(farmer_id):
    if DB_ENABLED:
        try:
            from database import get_farmer_advice
            advice = get_farmer_advice(farmer_id)
            return jsonify({'success': True, 'advice': list(advice)})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'success': True, 'advice': []})

@app.route('/api/sectors', methods=['GET'])
def get_sectors():
    return jsonify(SECTORS)


@app.route('/api/farmer-stats/<farmer_id>', methods=['GET'])
def farmer_stats(farmer_id):
    if DB_ENABLED:
        try:
            return jsonify(get_farmer_stats(farmer_id))
        except Exception as e:
            print(f"DB farmer stats error: {e}")
    farmer = _users.get(farmer_id)
    if not farmer:
        return jsonify({'error': 'Farmer not found'}), 404
    preds = [p for p in _predictions if p.get('farmer_id') == farmer_id]
    summary = {
        'total_predictions': len(preds),
        'avg_yield_kg_are' : round(float(np.mean([p['yield_per_are_kg'] for p in preds])), 2) if preds else 0,
    }
    return jsonify({
        'farmer'           : {k:v for k,v in farmer.items() if k != 'password'},
        'stats'            : summary,
        'summary'          : summary,
        'recent_predictions': preds[:5],
    })



@app.route('/api/save-prediction', methods=['POST'])
def save_pred_endpoint():
    """Save a prediction directly from frontend (used for offline predictions too)."""
    d = request.get_json() or {}
    if not d.get('prediction_id') or not d.get('farmer_id'):
        return jsonify({'error': 'prediction_id and farmer_id required'}), 400
    if DB_ENABLED:
        try:
            db_pred = {
                'prediction_id'    : d['prediction_id'],
                'farmer_id'        : d['farmer_id'],
                'crop_type'        : d.get('crop_type','Maize'),
                'crop'             : d.get('crop_type','Maize'),
                'sector'           : d.get('sector','Gashora'),
                'season'           : d.get('season','Season A'),
                'month'            : d.get('month','October'),
                'planting_date'    : d.get('planting_date') or datetime.now().strftime('%Y-%m-%d'),
                'year'             : datetime.now().year,
                'area_planted_are' : float(d.get('area_planted_are', 0)),
                'soil_type'        : d.get('soil_type','Clay'),
                'fertilizer_used'  : d.get('fertilizer_used','No'),
                'irrigation_used'  : d.get('irrigation_used','No'),
                'previous_crop'    : d.get('previous_crop','Beans'),
                'pest_pressure'    : d.get('pest_pressure','Low'),
                'labor_availability': d.get('labor_availability','Adequate'),
                'extension_access' : d.get('extension_access','Yes'),
                'credit_access'    : d.get('credit_access','No'),
                'yield_per_are_kg' : float(d.get('yield_per_are_kg', 0)),
                'yield_per_ha_kg'  : float(d.get('yield_per_ha_kg', 0)),
                'total_yield_kg'   : float(d.get('total_yield_kg', 0)),
                'yield_range_low'  : float(d.get('yield_per_are_kg', 0)) * 0.92,
                'yield_range_high' : float(d.get('yield_per_are_kg', 0)) * 1.08,
                'district_avg_kg_are': float(d.get('district_avg_kg_are', 20)),
                'confidence_pct'   : float(d.get('confidence_pct', DEFAULT_MODEL_CONFIDENCE)),
                'model_used'       : d.get('model_used','Gradient Boosting'),
                'inputs'           : {},
                'is_offline'       : d.get('is_offline', False),
            }
            save_prediction(db_pred, d.get('recommendations', []))
            return jsonify({'success': True, 'prediction_id': d['prediction_id']})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'success': True, 'message': 'Saved in-memory only (DB not available)'})


@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    d = request.get_json() or {}
    uid = d.get('user_id')
    role = d.get('role', 'farmer')
    if not uid: return jsonify({'error': 'user_id required'}), 400
    
    if DB_ENABLED:
        try:
            from database import update_user, get_farmer, get_officer, check_email_exists

            if 'email' in d:
                email_val = d['email'].strip().lower()
                if not is_valid_gmail_address(email_val):
                    return jsonify({'error': 'Email must be a valid Gmail address ending in @gmail.com.'}), 400
                d['email'] = email_val

                current_user = get_farmer(uid) if role == 'farmer' else get_officer(uid)
                if current_user and current_user.get('email', '').lower() != email_val and check_email_exists(email_val):
                    return jsonify({'error': 'Email already exists. Please use another email address.'}), 400

            if 'phone' in d:
                phone_val = normalize_rwanda_phone(d['phone'])
                if not is_valid_rwanda_phone(d['phone']):
                    return jsonify({'error': 'Phone number must be a valid Rwandan MTN/Tigo number with 10 digits.'}), 400
                d['phone'] = phone_val

            if update_user(uid, role, d):
                # Fetch updated user info to return to frontend
                user_row = get_farmer(uid) if role == 'farmer' else get_officer(uid)
                if user_row:
                    return jsonify({
                        'success': True, 
                        'user': {
                            'id'          : user_row['id'],
                            'name'        : user_row.get('full_name'),
                            'email'       : user_row.get('email'),
                            'phone'       : user_row.get('phone'),
                            'role'        : user_row['role'],
                            'sector'      : user_row.get('sector_name') or user_row.get('sector',''),
                            'farm_size_ha': user_row.get('farm_size_ha', 0),
                            'farm_size_are': user_row.get('farm_size_are', 0),
                            'crops'       : user_row.get('crops', []),
                            'farmer_category': user_row.get('farmer_category','Medium'),
                        }
                    })
            return jsonify({'error': 'Failed to update profile'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'success': True, 'message': 'Simulated profile update'})

@app.route('/api/change-password', methods=['POST'])
def change_password_api():
    d = request.get_json() or {}
    uid = d.get('user_id')
    old_pw = d.get('old_password')
    new_pw = d.get('new_password')
    role = d.get('role', 'farmer')
    
    if not all([uid, old_pw, new_pw]):
        return jsonify({'error': 'Missing fields'}), 400
        
    if DB_ENABLED:
        try:
            from database import verify_password, update_user
            # Verify old password
            if verify_password(uid, role, old_pw):
                if update_user(uid, role, {'password': new_pw}):
                    return jsonify({'success': True})
                return jsonify({'error': 'Failed to update password'}), 500
            return jsonify({'error': 'Incorrect current password'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'success': True})

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    d          = request.get_json() or {}
    identifier = d.get('identifier','').strip()
    new_pw     = d.get('new_password','')
    role       = d.get('role','farmer')

    if not identifier or not new_pw:
        return jsonify({'error': 'identifier and new_password are required'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user = next((u for u in _users.values()
                 if (u['id'] == identifier or
                     u.get('email', '').lower() == identifier.lower() or
                     u.get('phone','').replace(' ','') == identifier.replace(' ',''))
                 and u['role'] == role), None)

    if DB_ENABLED:
        try:
            from database import reset_password as db_reset_password
            ok = db_reset_password(identifier, new_pw, role)
            if ok:
                return jsonify({'success': True, 'message': 'Password reset successfully'})
        except Exception as e:
            print(f"DB reset error: {e}")

    if not user:
        return jsonify({'success': False, 'message': 'No account found with that email, phone, or ID'}), 404
    user['password'] = new_pw
    return jsonify({'success': True, 'message': 'Password reset successfully', 'id': user.get('id','')})






@app.route('/api/officer-notifications/<officer_id>', methods=['GET'])
def get_officer_notifications(officer_id):
    """Get messages sent to a sector officer from district admin."""
    if not DB_ENABLED:
        return jsonify({'success': False, 'messages': []}), 200
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.advice_id, a.subject, a.message, a.advice_type,
                           a.created_at, a.is_deleted,
                           o.full_name as sender_name, o.officer_type as sender_type
                    FROM officer_advice a
                    JOIN officers o ON a.officer_id = o.officer_id
                    WHERE a.recipient_officer_id = %s
                      AND (a.is_deleted IS NULL OR a.is_deleted = 0)
                    ORDER BY a.created_at DESC
                    LIMIT 20
                """, (officer_id,))
                rows = cur.fetchall()
                clean = []
                for r in rows:
                    d = {}
                    for k, v in r.items():
                        d[k] = v.isoformat() if hasattr(v, 'isoformat') else v
                    clean.append(d)
                return jsonify({'success': True, 'messages': clean})
    except Exception as e:
        print(f"Officer notifications error: {e}")
        return jsonify({'success': False, 'messages': [], 'error': str(e)}), 500


@app.route('/api/send-advice', methods=['POST'])
def send_advice_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    officer_id = d.get('officer_id')
    if not officer_id:
        return jsonify({'error': 'officer_id required'}), 400

    try:
        # Get officer role and enforce routing rules
        sender = get_officer(officer_id)
        if not sender:
            return jsonify({'error': 'Invalid officer_id'}), 404

        officer_type = sender.get('officer_type') or sender.get('role')
        recipient_officer_id = d.get('recipient_officer_id')
        target = d.get('target_group', '')
        subject = d.get('subject', 'Advisory')
        message = d.get('message', '')

        if officer_type == 'district':
            # District officers may only send advice to sector officers
            if d.get('farmer_id') or d.get('sector_id') or target == 'All Farmers':
                return jsonify({'error': 'District officers can only send advice to sector officers'}), 403

            recipients = []
            if target == 'all_officers':
                recipients = []
                try:
                    with get_db() as conn:
                        with conn.cursor() as cur:
                            cur.execute("SELECT officer_id, full_name, email, officer_type FROM officers WHERE officer_type='sector' AND is_active=1")
                            recipients = cur.fetchall()
                except Exception as e:
                    print(f"District advice recipient lookup error: {e}")
                    recipients = []
                if not recipients:
                    return jsonify({'error': 'No active sector officers found to receive advice'}), 404
            elif recipient_officer_id or target:
                recipient_id = recipient_officer_id or target
                with get_db() as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT officer_id, full_name, email, officer_type FROM officers WHERE officer_id=%s AND is_active=1", (recipient_id,))
                        recipient = cur.fetchone()
                if not recipient or recipient.get('officer_type') != 'sector':
                    return jsonify({'error': 'Target must be an active sector officer'}), 400
                recipients = [recipient]
            else:
                return jsonify({'error': 'No recipient officer specified'}), 400

            advice_ids = []
            for recipient in recipients:
                data = {
                    'recipient_officer_id': recipient['officer_id'],
                    'subject': subject,
                    'message': message,
                    'advice_type': d.get('advice_type', 'general')
                }
                advice_ids.append(save_advice(officer_id, data))

            # Send email notifications to sector officers
            for recipient in recipients:
                try:
                    subject_line = f"Agriculture Advisory: {subject}"
                    body_text = f"Hello {recipient['full_name']},\n\n{message}\n\nBest regards,\nDistrict Agricultural Office"
                    body_html = f"<h2>District Agriculture Advisory</h2><p>Hello {recipient['full_name']},</p><p>{message}</p><br><p>Best regards,<br>District Agricultural Office</p>"
                    sent, err = send_email(recipient['email'], subject_line, body_html, body_text)
                    if not sent:
                        print(f"District advice email failed: {err}")
                except Exception as oe:
                    print(f"District advice email failed: {oe}")
        # Sector officers may only send advice to farmers within their sector
        if officer_type == 'sector':
            # Validate direct farmer sends
            if d.get('farmer_id'):
                with get_db() as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT fm.sector_id, f.email, f.full_name FROM farmers f JOIN farms fm ON f.farmer_id = fm.farmer_id WHERE f.farmer_id=%s AND f.is_active=1", (d.get('farmer_id'),))
                        farmer = cur.fetchone()
                if not farmer or farmer.get('sector_id') != sender.get('sector_id'):
                    return jsonify({'error': 'Sector officers can only send advice to farmers in their sector'}), 403

            # Always scope broadcasts to the sender's sector
            d['sector_id'] = sender.get('sector_id')
            d['farmer_id'] = d.get('farmer_id')
            d['recipient_officer_id'] = None
            advice_id = save_advice(officer_id, d)

            # Email farmers in the sender's sector or the direct farmer
            if DB_ENABLED:
                try:
                    with get_db() as conn:
                        with conn.cursor() as cur:
                            query = "SELECT f.full_name, f.email FROM farmers f JOIN farms fm ON f.farmer_id = fm.farmer_id WHERE f.is_active=1 AND fm.sector_id=%s"
                            params = [sender.get('sector_id')]
                            if d.get('farmer_id'):
                                query += " AND f.farmer_id=%s"
                                params.append(d.get('farmer_id'))
                            cur.execute(query, tuple(params))
                            recipients = cur.fetchall()
                            print(f"  [broadcast] Sending advice to {len(recipients)} farmers in sector {sender.get('sector')}...")
                            for r in recipients:
                                subject_line = f"Agriculture Advice: {subject}"
                                body_text = f"Hello {r['full_name']},\n\n{message}\n\nBest regards,\nSector Agricultural Office"
                                body_html = f"<h2>Agriculture Advice</h2><p>Hello {r['full_name']},</p><p>{message}</p><br><p>Best regards,<br>Sector Agricultural Office</p>"
                                sent, err = send_email(r['email'], subject_line, body_html, body_text)
                                if not sent:
                                    print(f"Sector broadcast email failed for {r['email']}: {err}")
                except Exception as e:
                    print(f"Sector broadcast email error: {e}")

            return jsonify({'success': True, 'advice_id': advice_id})

        # Fallback for unknown officer type
        return jsonify({'error': 'Only district and sector officers may send advice'}), 403
    except Exception as e:
        print(f"Send Advice error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sent-advice', methods=['GET'])
def get_sent_advice_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    officer_id = request.args.get('officer_id')
    if not officer_id:
        return jsonify({'error': 'officer_id required'}), 400
    try:
        advice = get_sent_advice(officer_id)
        return jsonify({'success': True, 'advice': advice})
    except Exception as e:
        print(f"Get sent advice error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/revoke-advice', methods=['POST'])
def revoke_advice_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    officer_id = d.get('officer_id')
    advice_id = d.get('advice_id')
    if not officer_id or not advice_id:
        return jsonify({'error': 'officer_id and advice_id required'}), 400
    try:
        if revoke_advice(officer_id, advice_id):
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Advice not found or not owned by sender'}), 404
    except Exception as e:
        print(f"Revoke advice error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions/record-actual', methods=['POST'])
def record_actual_yield():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    pid = d.get('prediction_id')
    actual = d.get('actual_yield')
    h_date = d.get('harvest_date')
    
    if not pid or actual is None:
        return jsonify({'error': 'prediction_id and actual_yield required'}), 400
    
    try:
        from database import update_actual_yield
        if update_actual_yield(pid, float(actual), h_date):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to update record'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/officer/underperforming-farms', methods=['GET'])
def get_underperforming_farms_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    sector_id = request.args.get('sector_id')
    try:
        from database import get_underperforming_farms
        farms = get_underperforming_farms(sector_id)
        return jsonify({'success': True, 'farms': farms})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/notifications/<farmer_id>', methods=['GET'])
def get_notifications_route(farmer_id):
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        data = get_farmer_advice(farmer_id)
        # Serialize datetime fields
        clean = []
        for row in data:
            r = {}
            for k,v in row.items():
                if hasattr(v, 'isoformat'): r[k] = v.isoformat()
                else: r[k] = v
            clean.append(r)
        return jsonify({'success': True, 'advice': clean})
    except Exception as e:
        print(f"Get Notifications error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/send-report', methods=['POST'])
def submit_report_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    sender_id = d.get('sender_id')
    if not sender_id:
        return jsonify({'error': 'sender_id required'}), 400
    try:
        report_id = save_report(sender_id, d)
        return jsonify({'success': True, 'report_id': report_id})
    except Exception as e:
        print(f"Submit Report error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    officer_id = request.args.get('officer_id')
    role = request.args.get('role')
    if not officer_id or not role:
        return jsonify({'error': 'officer_id and role required'}), 400
    try:
        data = get_reports_for_officer(officer_id, role)
        clean = []
        for row in data:
            r = {}
            for k,v in row.items():
                if hasattr(v, 'isoformat'): r[k] = v.isoformat()
                else: r[k] = v
            clean.append(r)
        return jsonify({'success': True, 'reports': clean})
    except Exception as e:
        print(f"Get Reports error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-district-pdf', methods=['GET'])
def generate_district_pdf():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    
    try:
        # 1. Fetch data
        stats = get_district_stats()
        totals = stats.get('totals', {})
        by_crop = stats.get('by_crop', [])
        ranking = stats.get('sector_ranking', [])

        # 2. Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        elements = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=1, spaceAfter=20)
        sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=12, alignment=1, spaceAfter=30, textColor=colors.grey)
        sec_style = ParagraphStyle('Sec', parent=styles['Heading2'], fontSize=14, spaceBefore=20, spaceAfter=10, color=colors.HexColor('#22c55e'))

        # Header
        elements.append(Paragraph("BUGESERA HARVEST PREDICTION SYSTEM", title_style))
        elements.append(Paragraph(f"District Agricultural Report - {datetime.now().strftime('%d %B %Y')}", sub_style))

        # Dashboard Summary
        elements.append(Paragraph("DASHBOARD SUMMARY", sec_style))
        summary_data = [
            ["Total Farmers Registered", f"{int(totals.get('total_farmers') or 0):,}"],
            ["Total Yield Predicted (kg)", f"{float(totals.get('total_yield') or 0):,}"],
            ["Average Yield (kg/are)", f"{float(totals.get('avg_yield') or 0):.2f}"],
            ["Total Predictions Made", f"{int(totals.get('total_preds') or 0):,}"],
        ]
        t_summary = Table(summary_data, colWidths=[250, 200])
        t_summary.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('PADDING', (0,0), (-1,-1), 8),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ]))
        elements.append(t_summary)
        elements.append(Spacer(1, 20))

        # Crop Performance Table
        elements.append(Paragraph("CROP PERFORMANCE", sec_style))
        crop_data = [["Crop Type", "Total Predictions", "Avg Yield (kg/are)", "Total Yield (kg)"]]
        for row in by_crop:
            crop_data.append([
                row.get('crop_type'),
                f"{int(row.get('total_predictions') or 0):,}",
                f"{float(row.get('avg_yield_kg_are') or 0):.2f}",
                f"{float(row.get('total_yield_kg') or 0):,}"
            ])
        t_crop = Table(crop_data, colWidths=[120, 110, 110, 110])
        t_crop.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#22c55e')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_crop)
        elements.append(Spacer(1, 20))

        # Sector Rankings
        elements.append(Paragraph("SECTOR PERFORMANCE RANKINGS", sec_style))
        sec_data = [["Rank", "Sector Name", "Avg Yield (kg/are)", "Total Forecast (kg)"]]
        for i, row in enumerate(ranking):
            sec_data.append([
                i+1,
                row.get('sector_name'),
                f"{float(row.get('avg_yield_kg_are') or 0):.2f}",
                f"{float(row.get('total_yield_kg') or 0):,}"
            ])
        t_sec = Table(sec_data, colWidths=[50, 180, 110, 110])
        t_sec.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sec)

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        filename = f"Bugesera_District_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        import traceback
        print(f"PDF Gen Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        data = get_all_users()
        clean = []
        for row in data:
            r = {}
            for k,v in row.items():
                if hasattr(v, 'isoformat'): r[k] = v.isoformat()
                else: r[k] = v
            clean.append(r)
        return jsonify({'success': True, 'users': clean})
    except Exception as e:
        print(f"Admin Get Users error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/toggle-status', methods=['POST'])
def admin_toggle_status():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    uid = d.get('user_id')
    u_role = d.get('role')
    status = d.get('status') # 1 for active, 0 for inactive
    if uid is None or u_role is None or status is None:
        return jsonify({'error': 'Missing data'}), 400
    try:
        res = toggle_user_status(uid, u_role == 'farmer', int(status))
        return jsonify({'success': res})
    except Exception as e:
        print(f"Admin Toggle Status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/settings', methods=['GET', 'POST'])
def admin_settings_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    if request.method == 'POST':
        d = request.get_json() or {}
        try:
            update_system_settings(d)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        try:
            data = get_system_settings()
            return jsonify({'success': True, 'settings': data})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/admin/sector-details/<int:sector_id>', methods=['GET'])
def admin_sector_details(sector_id):
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        data = get_sector_full_details(sector_id)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        print(f"Sector Details error: {e}")
        return jsonify({'error': str(e)}), 500

# ── Gashora Location Endpoints ────────────────────────────────────────────────
@app.route('/api/cells', methods=['GET'])
def get_cells_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        from database import get_cells
        cells = get_cells()
        return jsonify({'success': True, 'cells': cells})
    except Exception as e:
        print(f"Get Cells error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/villages', methods=['GET'])
def get_villages_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    cell_id = request.args.get('cell_id')
    if not cell_id:
        return jsonify({'error': 'cell_id required'}), 400
    try:
        from database import get_villages_by_cell
        villages = get_villages_by_cell(int(cell_id))
        return jsonify({'success': True, 'villages': villages})
    except Exception as e:
        print(f"Get Villages error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/locations', methods=['GET'])
def get_all_locations_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        from database import get_all_gashora_locations
        locations = get_all_gashora_locations()
        return jsonify({'success': True, 'locations': locations})
    except Exception as e:
        print(f"Get Locations error: {e}")
        return jsonify({'error': str(e)}), 500

# ── Cooperative Endpoints ─────────────────────────────────────────────────────
@app.route('/api/cooperatives', methods=['GET', 'POST'])
def cooperatives_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    
    if request.method == 'GET':
        try:
            from database import get_all_cooperatives
            cooperatives = get_all_cooperatives()
            return jsonify({'success': True, 'cooperatives': cooperatives})
        except Exception as e:
            print(f"Get Cooperatives error: {e}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        d = request.get_json() or {}
        if not d.get('name'):
            return jsonify({'error': 'Cooperative name required'}), 400
        try:
            from database import create_cooperative
            coop = create_cooperative(d)
            return jsonify({'success': True, 'cooperative': coop})
        except Exception as e:
            print(f"Create Cooperative error: {e}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/cooperatives/<cooperative_id>', methods=['PUT', 'DELETE'])
def cooperative_detail_route(cooperative_id):
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    
    if request.method == 'PUT':
        d = request.get_json() or {}
        try:
            from database import update_cooperative
            if update_cooperative(cooperative_id, d):
                return jsonify({'success': True})
            return jsonify({'error': 'Update failed'}), 400
        except Exception as e:
            print(f"Update Cooperative error: {e}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            from database import delete_cooperative
            if delete_cooperative(cooperative_id):
                return jsonify({'success': True})
            return jsonify({'error': 'Cannot delete cooperative with active members'}), 400
        except Exception as e:
            print(f"Delete Cooperative error: {e}")
            return jsonify({'error': str(e)}), 500

# ── Admin Farmer Management Endpoints ─────────────────────────────────────────
@app.route('/api/admin/all-farmers', methods=['GET'])
def admin_all_farmers_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        from database import get_all_farmers
        farmers = get_all_farmers()
        # Clean datetime objects
        clean = []
        for row in farmers:
            r = {}
            for k, v in row.items():
                if hasattr(v, 'isoformat'):
                    r[k] = v.isoformat()
                else:
                    r[k] = v
            clean.append(r)
        return jsonify({'success': True, 'farmers': clean})
    except Exception as e:
        print(f"Admin Get All Farmers error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/pending-farmers', methods=['GET'])
def admin_pending_farmers_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    try:
        from database import get_pending_farmers
        farmers = get_pending_farmers()
        # Clean datetime objects
        clean = []
        for row in farmers:
            r = {}
            for k, v in row.items():
                if hasattr(v, 'isoformat'):
                    r[k] = v.isoformat()
                else:
                    r[k] = v
            clean.append(r)
        return jsonify({'success': True, 'farmers': clean})
    except Exception as e:
        print(f"Admin Get Pending Farmers error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/approve-farmer', methods=['POST'])
def admin_approve_farmer_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    farmer_id = d.get('farmer_id')
    if not farmer_id:
        return jsonify({'error': 'farmer_id required'}), 400
    try:
        from database import approve_farmer
        if approve_farmer(farmer_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Approval failed'}), 400
    except Exception as e:
        print(f"Admin Approve Farmer error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reject-farmer', methods=['POST'])
def admin_reject_farmer_route():
    if not DB_ENABLED:
        return jsonify({'error': 'Database not enabled'}), 503
    d = request.get_json() or {}
    farmer_id = d.get('farmer_id')
    if not farmer_id:
        return jsonify({'error': 'farmer_id required'}), 400
    try:
        from database import reject_farmer
        if reject_farmer(farmer_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Rejection failed'}), 400
    except Exception as e:
        print(f"Admin Reject Farmer error: {e}")
        return jsonify({'error': str(e)}), 500

# ── Init database on startup ──────────────────────────────────────────────────
if DB_ENABLED:
    try:
        init_db()
        print("  [check-circle] MySQL database ready (bugesera_harvest)")
    except Exception as e:
        print(f"  [exclamation-triangle]️  DB init error: {e} — falling back to in-memory")
        DB_ENABLED = False

# =============================================================================
if __name__ == '__main__':
    best = META['best_model']
    r2   = META['_perf'].get(best, {}).get('r2', 0)
    mc   = META.get('model_comparison', {})
    print("\n" + "=" * 55)
    print("[tree]  Bugesera Harvest Prediction API  v4.0")
    print("=" * 55)
    print(f"   Best Model  : {best}")
    print(f"   R2 Score    : {r2:.4f}  ({r2*100:.1f}% accuracy)")
    if mc:
        for name, m in mc.items():
            r2  = m.get('r2_test', m.get('r2', 0))
            acc = m.get('accuracy', r2*100)
            print(f"   {name:22s}: R2={r2:.4f}  Acc={acc:.1f}%")
    print(f"   Crops       : {CROPS}")
    print(f"   Sectors     : {len(SECTORS)} sectors")
    print(f"   Units       : ARE and kg/are  (1 ha = 100 are)")
    print(f"   Target      : {META['target']}  <- model outputs kg/are directly")
    print(f"   Benchmarks  : Beans={CROP_BENCHMARKS['Beans']:.2f}, Maize={CROP_BENCHMARKS['Maize']:.2f}, Rice={CROP_BENCHMARKS['Rice']:.2f} kg/are")
    print(f"   Running     : http://localhost:5000")
    print("=" * 55 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
