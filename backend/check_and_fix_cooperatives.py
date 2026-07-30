"""
Check and fix cooperatives table structure
"""

import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
}

def check_and_fix():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Checking cooperatives table structure...")
        
        # Check current structure
        cursor.execute("DESCRIBE cooperatives")
        columns = cursor.fetchall()
        
        print("\n📋 Current columns:")
        existing_cols = set()
        for col in columns:
            print(f"   - {col[0]} ({col[1]})")
            existing_cols.add(col[0])
        
        # Check for missing columns
        missing = []
        if 'contact_phone' not in existing_cols:
            missing.append('contact_phone')
        if 'contact_email' not in existing_cols:
            missing.append('contact_email')
        
        if not missing:
            print("\n✅ All required columns exist!")
            cursor.close()
            conn.close()
            return
        
        print(f"\n⚠️  Missing columns: {', '.join(missing)}")
        print("🔧 Adding missing columns...")
        
        # Add missing columns
        if 'contact_phone' in missing:
            cursor.execute("ALTER TABLE cooperatives ADD COLUMN contact_phone VARCHAR(20) NULL")
            print("   ✅ Added contact_phone")
        
        if 'contact_email' in missing:
            cursor.execute("ALTER TABLE cooperatives ADD COLUMN contact_email VARCHAR(100) NULL")
            print("   ✅ Added contact_email")
        
        conn.commit()
        
        # Verify
        cursor.execute("DESCRIBE cooperatives")
        columns = cursor.fetchall()
        print("\n📋 Updated columns:")
        for col in columns:
            print(f"   - {col[0]} ({col[1]})")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Cooperatives table structure fixed!")
        
    except pymysql.err.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print(f"   Make sure XAMPP MySQL is running.")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    check_and_fix()
