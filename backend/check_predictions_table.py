#!/usr/bin/env python3
"""
Check Predictions Table Structure
================================

Check if the predictions table exists and has the right structure.
"""

import pymysql
from database import get_db

def check_predictions_table():
    """Check the predictions table structure"""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Check if table exists
                cur.execute("SHOW TABLES LIKE 'predictions'")
                if not cur.fetchone():
                    print("❌ predictions table does not exist!")
                    return False
                
                print("✅ predictions table exists")
                
                # Check table structure
                cur.execute("DESCRIBE predictions")
                columns = cur.fetchall()
                
                print("\n=== Table Structure ===")
                required_fields = [
                    'prediction_id', 'farmer_id', 'sector_id', 'crop_type',
                    'season', 'planting_date', 'year', 'area_planted_are',
                    'yield_per_are_kg', 'yield_grade', 'model_used'
                ]
                
                existing_fields = [col['Field'] for col in columns]
                
                for field in required_fields:
                    if field in existing_fields:
                        print(f"✅ {field}")
                    else:
                        print(f"❌ {field} - MISSING!")
                
                print(f"\n=== All Columns ({len(existing_fields)}) ===")
                for col in columns:
                    print(f"  {col['Field']} - {col['Type']} - {col['Null']} - {col['Key']} - {col['Default']}")
                
                # Check current data
                cur.execute("SELECT COUNT(*) as count FROM predictions")
                count = cur.fetchone()['count']
                print(f"\n=== Current Data ===")
                print(f"Total predictions: {count}")
                
                if count > 0:
                    cur.execute("SELECT prediction_id, farmer_id, crop_type, yield_per_are_kg, created_at FROM predictions ORDER BY created_at DESC LIMIT 5")
                    recent = cur.fetchall()
                    print("\nRecent predictions:")
                    for pred in recent:
                        print(f"  {pred['prediction_id']} - {pred['farmer_id']} - {pred['crop_type']} - {pred['yield_per_are_kg']} kg/are")
                
                return True
                
    except Exception as e:
        print(f"❌ Error checking table: {e}")
        return False

if __name__ == "__main__":
    check_predictions_table()