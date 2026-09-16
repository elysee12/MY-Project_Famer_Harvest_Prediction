"""
Fix existing cooperative leader passwords to plain text
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

def fix_leader_passwords():
    conn = pymysql.connect(**DB_CONFIG)
    
    try:
        cursor = conn.cursor()
        
        print("=" * 60)
        print("FIXING COOPERATIVE LEADER PASSWORDS")
        print("=" * 60)
        print()
        
        # Find all cooperative leaders
        cursor.execute("""
            SELECT farmer_id, email, password_hash 
            FROM farmers 
            WHERE role = 'cooperative_leader'
        """)
        leaders = cursor.fetchall()
        
        if not leaders:
            print("No cooperative leaders found in database.")
            return
        
        print(f"Found {len(leaders)} cooperative leader(s):")
        print()
        
        for leader in leaders:
            farmer_id = leader['farmer_id']
            email = leader['email']
            current_password = leader['password_hash']
            
            # Check if password is hashed
            is_hashed = current_password and (
                current_password.startswith('$2b$') or 
                current_password.startswith('pbkdf2:') or
                len(current_password) > 50
            )
            
            if is_hashed:
                print(f"Leader: {farmer_id} ({email})")
                print(f"  Current: [HASHED PASSWORD]")
                print(f"  Updating to: harvest2024 (plain text)")
                
                # Update to plain text password
                cursor.execute("""
                    UPDATE farmers 
                    SET password_hash = 'harvest2024'
                    WHERE farmer_id = %s
                """, (farmer_id,))
                
                print(f"  ✅ Updated!")
                print()
            else:
                print(f"Leader: {farmer_id} ({email})")
                print(f"  Password: {current_password}")
                print(f"  ✅ Already plain text, no change needed")
                print()
        
        conn.commit()
        
        print("=" * 60)
        print("✅ ALL LEADER PASSWORDS FIXED!")
        print("=" * 60)
        print()
        print("All cooperative leaders can now login with:")
        print("  Password: harvest2024")
        print()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    fix_leader_passwords()
