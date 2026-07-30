"""
Add role column to farmers table for cooperative member support
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

def fix_farmers_table():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Checking farmers table for 'role' column...")
        
        # Check if role column exists
        cursor.execute("DESCRIBE farmers")
        columns = cursor.fetchall()
        
        existing_cols = [col[0] for col in columns]
        
        if 'role' in existing_cols:
            print("   ✅ 'role' column already exists!")
            cursor.close()
            conn.close()
            return
        
        print("   ⚠️  'role' column missing")
        print("🔧 Adding 'role' column to farmers table...")
        
        # Add role column (defaults to 'farmer')
        cursor.execute("""
            ALTER TABLE farmers 
            ADD COLUMN role VARCHAR(20) DEFAULT 'farmer' 
            AFTER password_hash
        """)
        conn.commit()
        
        print("   ✅ Added 'role' column")
        
        # Verify
        cursor.execute("DESCRIBE farmers")
        columns = cursor.fetchall()
        print("\n📋 Updated farmers table columns:")
        for col in columns:
            print(f"   - {col[0]} ({col[1]})")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Farmers table structure fixed!")
        print("   Farmers can now register as:")
        print("   - role='farmer' (regular farmer)")
        print("   - role='cooperative' (cooperative member)")
        
    except pymysql.err.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print(f"   Make sure XAMPP MySQL is running.")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    fix_farmers_table()
