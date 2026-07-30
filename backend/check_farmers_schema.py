"""
Check complete farmers table schema and identify missing columns
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

def check_schema():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Checking farmers table schema...")
        
        # Get current structure
        cursor.execute("DESCRIBE farmers")
        columns = cursor.fetchall()
        
        print("\n📋 Current farmers table columns:")
        existing_cols = {}
        for col in columns:
            print(f"   - {col[0]:20s} {col[1]:20s} {col[2]:5s} {col[3]:5s}")
            existing_cols[col[0]] = col[1]
        
        # Check for required columns for cooperative registration
        required = {
            'role': 'VARCHAR(20)',
            'cooperative_id': 'VARCHAR(50)',
        }
        
        missing = []
        for col_name, col_type in required.items():
            if col_name not in existing_cols:
                missing.append((col_name, col_type))
        
        if missing:
            print(f"\n⚠️  Missing columns: {[c[0] for c in missing]}")
            print("🔧 Adding missing columns...")
            
            for col_name, col_type in missing:
                if col_name == 'cooperative_id':
                    cursor.execute(f"""
                        ALTER TABLE farmers 
                        ADD COLUMN {col_name} INT NULL,
                        ADD CONSTRAINT fk_farmer_cooperative 
                        FOREIGN KEY ({col_name}) REFERENCES cooperatives(cooperative_id) 
                        ON DELETE SET NULL
                    """)
                    print(f"   ✅ Added {col_name} ({col_type}) with FK constraint")
                else:
                    cursor.execute(f"ALTER TABLE farmers ADD COLUMN {col_name} {col_type} NULL")
                    print(f"   ✅ Added {col_name} ({col_type})")
            
            conn.commit()
            
            # Verify
            cursor.execute("DESCRIBE farmers")
            columns = cursor.fetchall()
            print("\n📋 Updated farmers table:")
            for col in columns:
                print(f"   - {col[0]:20s} {col[1]:20s}")
        else:
            print("\n✅ All required columns exist!")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Schema check complete!")
        
    except pymysql.err.OperationalError as e:
        print(f"❌ Database connection error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    check_schema()
