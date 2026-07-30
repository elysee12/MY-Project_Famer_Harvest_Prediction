"""
Run cooperatives database migration
Adds cooperatives table and updates farmers table with cooperative_id FK
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
        sql_file = os.path.join(os.path.dirname(__file__), 'fix_cooperatives_schema.sql')
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Connect to database
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔧 Running cooperatives migration...")
        
        # Split SQL by semicolons and execute each statement
        statements = []
        current = []
        in_delimiter = False
        
        for line in sql_content.split('\n'):
            line = line.strip()
            
            # Skip comments and empty lines
            if line.startswith('--') or not line:
                continue
            
            # Handle DELIMITER changes
            if line.startswith('DELIMITER'):
                in_delimiter = not in_delimiter
                continue
            
            current.append(line)
            
            # Check for statement end
            if not in_delimiter and line.endswith(';'):
                stmt = '\n'.join(current)
                statements.append(stmt)
                current = []
        
        # Execute each statement
        success_count = 0
        error_count = 0
        
        for stmt in statements:
            if not stmt.strip():
                continue
            
            try:
                # Skip CALL and DROP PROCEDURE for multi-statement execution
                if 'CALL add_cooperative_column' in stmt or 'CALL add_location_columns' in stmt:
                    # Execute stored procedure
                    cursor.execute(stmt)
                    conn.commit()
                elif 'DROP PROCEDURE' in stmt:
                    # Drop procedure
                    cursor.execute(stmt)
                    conn.commit()
                else:
                    cursor.execute(stmt)
                    conn.commit()
                success_count += 1
            except pymysql.err.OperationalError as e:
                if 'already exists' in str(e) or 'Duplicate' in str(e):
                    print(f"⚠️  Skipped (already exists): {stmt[:60]}...")
                else:
                    print(f"❌ Error executing: {stmt[:60]}...")
                    print(f"   Error: {e}")
                    error_count += 1
            except Exception as e:
                print(f"❌ Error executing: {stmt[:60]}...")
                print(f"   Error: {e}")
                error_count += 1
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Migration completed!")
        print(f"   Success: {success_count} statements")
        print(f"   Errors: {error_count} statements")
        
        if error_count == 0:
            print(f"\n✅ Cooperatives table is ready to use!")
        else:
            print(f"\n⚠️  Some statements failed. Check the errors above.")
        
    except FileNotFoundError:
        print(f"❌ SQL file not found: {sql_file}")
    except pymysql.err.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print(f"   Make sure XAMPP MySQL is running and database 'bugesera_harvest' exists.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")


if __name__ == '__main__':
    run_migration()
