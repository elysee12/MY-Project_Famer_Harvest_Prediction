"""
Database Fix Script
This will create the correct database or identify the issue
"""

import pymysql

print("=" * 60)
print("Database Fix Script")
print("=" * 60)

try:
    # Connect to MySQL server (not a specific database)
    conn = pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='',
        charset='utf8mb4'
    )
    
    with conn.cursor() as cursor:
        # Get all databases and their exact names
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        
        print("\n[1] Checking existing databases...")
        bugesera_found = False
        exact_name = None
        
        for db in databases:
            db_name = db[0]
            # Check for any bugesera database
            if 'bugesera' in db_name.lower():
                print(f"Found: '{db_name}' (length: {len(db_name)} chars)")
                bugesera_found = True
                exact_name = db_name
                
                # Check for spaces or special characters
                if db_name != 'bugesera_harvest':
                    print(f"  ⚠️  Name mismatch!")
                    print(f"  Expected: 'bugesera_harvest'")
                    print(f"  Got:      '{db_name}'")
                    
                    # Show character by character
                    print(f"  Characters: {[c for c in db_name]}")
        
        if bugesera_found and exact_name != 'bugesera_harvest':
            print(f"\n[2] Dropping incorrect database: '{exact_name}'")
            cursor.execute(f"DROP DATABASE `{exact_name}`")
            print("  ✅ Dropped")
        
        # Create the correct database
        print(f"\n[3] Creating database: 'bugesera_harvest'")
        cursor.execute("""
            CREATE DATABASE IF NOT EXISTS bugesera_harvest 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        """)
        print("  ✅ Created successfully")
        
        # Verify it was created
        cursor.execute("SHOW DATABASES LIKE 'bugesera_harvest'")
        result = cursor.fetchone()
        
        if result:
            print(f"\n[4] Verification: Database exists as '{result[0]}'")
            
            # Try to use it
            cursor.execute("USE bugesera_harvest")
            print("  ✅ Can access the database")
            
            # Create a test table to verify permissions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS _test_connection (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("DROP TABLE _test_connection")
            print("  ✅ Can create/drop tables")
            
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ DATABASE IS READY!")
    print("=" * 60)
    print("\nNow restart your Flask server:")
    print("  1. Press Ctrl+C to stop Flask")
    print("  2. Run: python flask_api.py")
    print("  3. Look for: [✓] MySQL connected — 15 sectors found")
    print("\n" + "=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
