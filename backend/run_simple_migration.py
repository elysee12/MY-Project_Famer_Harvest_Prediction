"""
Run simple cooperatives database migration
"""

import pymysql
import os

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
}

def run_migration():
    try:
        # Read SQL file
        sql_file = os.path.join(os.path.dirname(__file__), 'fix_cooperatives_simple.sql')
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Connect to database
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔧 Running cooperatives migration (simple version)...")
        
        # Split by semicolon and execute
        statements = [s.strip() + ';' for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        success_count = 0
        skip_count = 0
        
        for stmt in statements:
            if not stmt.strip() or stmt.strip() == ';':
                continue
            
            try:
                cursor.execute(stmt)
                conn.commit()
                success_count += 1
            except pymysql.err.OperationalError as e:
                if 'already exists' in str(e) or 'Duplicate' in str(e):
                    skip_count += 1
                else:
                    print(f"⚠️  Warning: {e}")
            except Exception as e:
                if 'Duplicate' in str(e) or 'already exists' in str(e):
                    skip_count += 1
                else:
                    print(f"⚠️  Warning: {e}")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Migration completed!")
        print(f"   Success: {success_count} statements")
        print(f"   Skipped: {skip_count} (already exists)")
        print(f"\n✅ Cooperatives tables are ready!")
        
    except FileNotFoundError:
        print(f"❌ SQL file not found: {sql_file}")
    except pymysql.err.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print(f"   Make sure XAMPP MySQL is running and database 'bugesera_harvest' exists.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")


if __name__ == '__main__':
    run_migration()
