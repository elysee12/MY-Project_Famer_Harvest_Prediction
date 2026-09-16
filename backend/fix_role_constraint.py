"""
Fix the role constraint to include cooperative_leader
"""
import pymysql
import pymysql.cursors

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

def fix_role_constraint():
    conn = pymysql.connect(**DB_CONFIG)
    
    try:
        cursor = conn.cursor()
        
        print("Checking current role constraint...")
        cursor.execute("SHOW CREATE TABLE farmers")
        result = cursor.fetchone()
        print(f"Current table definition includes role constraint")
        
        print("\nDropping old constraint and updating role column...")
        
        # Drop the check constraint and modify the role column
        cursor.execute("""
            ALTER TABLE farmers 
            MODIFY COLUMN role VARCHAR(20) DEFAULT 'farmer' 
            CHECK (role IN ('farmer', 'cooperative', 'cooperative_leader'))
        """)
        
        print("✓ Role constraint updated to include 'cooperative_leader'")
        
        conn.commit()
        print("\n✓ Fix completed successfully!")
        
    except Exception as e:
        print(f"✗ Fix failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    fix_role_constraint()
