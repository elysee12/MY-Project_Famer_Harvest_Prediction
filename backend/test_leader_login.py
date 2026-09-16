"""
Test cooperative leader login after password fix
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

def test_leader_login():
    conn = pymysql.connect(**DB_CONFIG)
    
    try:
        cursor = conn.cursor()
        
        print("=" * 60)
        print("TESTING COOPERATIVE LEADER LOGIN")
        print("=" * 60)
        print()
        
        # Find all cooperative leaders
        cursor.execute("""
            SELECT farmer_id, full_name, email, password_hash, role
            FROM farmers 
            WHERE role = 'cooperative_leader'
        """)
        leaders = cursor.fetchall()
        
        if not leaders:
            print("❌ No cooperative leaders found in database.")
            print()
            print("Create a cooperative first to generate a leader account.")
            return
        
        print(f"Found {len(leaders)} cooperative leader(s):")
        print()
        
        for leader in leaders:
            print(f"Leader ID: {leader['farmer_id']}")
            print(f"Name: {leader['full_name']}")
            print(f"Email: {leader['email']}")
            print(f"Password: {leader['password_hash']}")
            print(f"Role: {leader['role']}")
            
            # Test password
            test_password = 'harvest2024'
            if leader['password_hash'] == test_password:
                print(f"✅ Password matches '{test_password}' - LOGIN WILL WORK!")
            else:
                print(f"❌ Password is: '{leader['password_hash']}' - NEEDS FIX")
            
            print()
        
        print("=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)
        print()
        print("To login use:")
        print(f"  Email: {leaders[0]['email']}")
        print(f"  Password: harvest2024")
        print()
        
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    test_leader_login()
