"""
Quick MySQL Connection Test
Run this to diagnose database connection issues
"""

import pymysql

print("=" * 60)
print("MySQL Connection Test")
print("=" * 60)

# Test 1: Can we connect to MySQL at all?
print("\n[1] Testing connection to MySQL server...")
try:
    conn = pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("✅ Connected to MySQL server successfully!")
    
    # Test 2: List all databases
    print("\n[2] Listing all databases...")
    with conn.cursor() as cursor:
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        print(f"Found {len(databases)} databases:")
        for db in databases:
            db_name = list(db.values())[0]
            print(f"  - {db_name}")
            if 'bugesera' in db_name.lower():
                print(f"    👆 This looks like our database!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    print("\nPossible issues:")
    print("  1. XAMPP MySQL is not running")
    print("  2. MySQL password is set (try adding password to config)")
    print("  3. Port 3306 is blocked or in use by another service")
    exit(1)

# Test 3: Try connecting to the specific database
print("\n[3] Testing connection to 'bugesera_harvest' database...")
try:
    conn = pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='',
        database='bugesera_harvest',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("✅ Connected to bugesera_harvest successfully!")
    
    # Test 4: List tables
    print("\n[4] Listing tables in bugesera_harvest...")
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            table_name = list(table.values())[0]
            print(f"  - {table_name}")
    
    conn.close()
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nYour database is working correctly.")
    print("The Flask app should be able to connect.")
    print("\nNext steps:")
    print("1. Make sure Flask is completely stopped (Ctrl+C)")
    print("2. Run: python flask_api.py")
    print("3. Look for: [✓] MySQL connected — 15 sectors found")
    
except pymysql.err.OperationalError as e:
    error_code, error_msg = e.args
    print(f"❌ Failed: {error_msg}")
    
    if error_code == 1049:  # Unknown database
        print("\n⚠️  Database 'bugesera_harvest' does not exist!")
        print("\nFix:")
        print("1. Open phpMyAdmin: http://localhost/phpmyadmin")
        print("2. Click 'New' in the left sidebar")
        print("3. Database name: bugesera_harvest")
        print("4. Collation: utf8mb4_unicode_ci")
        print("5. Click 'Create'")
        print("6. Run this test script again")
    elif error_code == 1045:  # Access denied
        print("\n⚠️  Access denied! Your MySQL has a password set.")
        print("\nFix:")
        print("1. Open backend/database.py")
        print("2. Change: 'password': ''")
        print("3. To: 'password': 'your_mysql_password'")
        print("4. Save and try again")
    else:
        print(f"\n⚠️  Unknown error code: {error_code}")
        
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n" + "=" * 60)
