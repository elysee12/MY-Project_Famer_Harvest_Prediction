"""
Test Cooperative Member Registration and Dashboard
Tests the complete flow:
1. Register as cooperative member with cell/village
2. Verify database flags are set correctly
3. Login and verify role is set to 'cooperative'
4. Verify cooperative name and member count are available
"""

import pymysql
import pymysql.cursors
from database import register_farmer_with_location, get_farmer

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def test_cooperative_registration():
    """Test cooperative member registration"""
    print("\n" + "="*80)
    print("TEST 1: COOPERATIVE MEMBER REGISTRATION")
    print("="*80)
    
    # First, get a valid cooperative_id
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT cooperative_id, cooperative_name FROM cooperatives LIMIT 1")
            coop = cur.fetchone()
            if not coop:
                print("❌ No cooperatives found in database!")
                return False
            print(f"✓ Using cooperative: {coop['cooperative_name']} (ID: {coop['cooperative_id']})")
            
            # Get a valid cell and village
            cur.execute("SELECT cell_id, cell_name FROM cells WHERE sector_id=1 LIMIT 1")
            cell = cur.fetchone()
            cur.execute("SELECT village_id, village_name FROM villages WHERE cell_id=%s LIMIT 1", (cell['cell_id'],))
            village = cur.fetchone()
            
            if not cell or not village:
                print("❌ No cell/village found!")
                return False
            print(f"✓ Using cell: {cell['cell_name']} (ID: {cell['cell_id']})")
            print(f"✓ Using village: {village['village_name']} (ID: {village['village_id']})")
    
    # Test data for cooperative member
    test_data = {
        'name': 'Test Cooperative Member',
        'email': 'test_coop_member@gmail.com',
        'phone': '0789123456',
        'password': 'TestPass123',
        'role': 'cooperative',
        'sector': 'Gashora',
        'cell_id': cell['cell_id'],
        'village_id': village['village_id'],
        'cooperative_id': coop['cooperative_id'],
        'farm_size_ha': 0.5
    }
    
    # Delete existing test user if exists
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM farmers WHERE email=%s", (test_data['email'],))
            conn.commit()
            print(f"✓ Cleaned up existing test user")
    
    # Register the cooperative member
    try:
        result = register_farmer_with_location(test_data)
        print(f"✓ Registration successful! Farmer ID: {result['farmer_id']}")
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Verify database flags
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT farmer_id, full_name, email, role, 
                       is_cooperative_member, cooperative_id, cooperative_name,
                       cell_id, village_id
                FROM farmers 
                WHERE farmer_id=%s
            """, (result['farmer_id'],))
            farmer = cur.fetchone()
            
            print("\n" + "-"*80)
            print("DATABASE VERIFICATION")
            print("-"*80)
            print(f"Farmer ID: {farmer['farmer_id']}")
            print(f"Name: {farmer['full_name']}")
            print(f"Email: {farmer['email']}")
            print(f"Role: {farmer['role']}")
            print(f"Is Cooperative Member: {farmer['is_cooperative_member']}")
            print(f"Cooperative ID: {farmer['cooperative_id']}")
            print(f"Cooperative Name: {farmer['cooperative_name']}")
            print(f"Cell ID: {farmer['cell_id']}")
            print(f"Village ID: {farmer['village_id']}")
            
            # Assertions
            if farmer['is_cooperative_member'] != 1:
                print("❌ FAIL: is_cooperative_member should be 1")
                return False
            print("✓ is_cooperative_member = 1")
            
            if farmer['role'] != 'cooperative':
                print("❌ FAIL: role should be 'cooperative'")
                return False
            print("✓ role = 'cooperative'")
            
            if not farmer['cooperative_id']:
                print("❌ FAIL: cooperative_id should not be NULL")
                return False
            print("✓ cooperative_id is set")
            
            if not farmer['cooperative_name']:
                print("❌ FAIL: cooperative_name should not be NULL")
                return False
            print("✓ cooperative_name is set")
            
            if not farmer['cell_id']:
                print("❌ FAIL: cell_id should not be NULL")
                return False
            print("✓ cell_id is set")
            
            if not farmer['village_id']:
                print("❌ FAIL: village_id should not be NULL")
                return False
            print("✓ village_id is set")
    
    return True

def test_get_farmer_function():
    """Test that get_farmer() returns correct role"""
    print("\n" + "="*80)
    print("TEST 2: GET_FARMER FUNCTION")
    print("="*80)
    
    # Get the test cooperative member
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT farmer_id FROM farmers 
                WHERE email='test_coop_member@gmail.com'
                LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                print("❌ Test user not found!")
                return False
            farmer_id = row['farmer_id']
    
    # Call get_farmer()
    farmer = get_farmer(farmer_id)
    
    print("\n" + "-"*80)
    print("GET_FARMER() RESULT")
    print("-"*80)
    print(f"Farmer ID: {farmer.get('farmer_id')}")
    print(f"Name: {farmer.get('name')}")
    print(f"Role: {farmer.get('role')}")
    print(f"Cooperative Name: {farmer.get('cooperative_name')}")
    print(f"Cooperative Total Members: {farmer.get('coop_total_members')}")
    
    # Assertions
    if farmer.get('role') != 'cooperative':
        print("❌ FAIL: get_farmer() should return role='cooperative'")
        return False
    print("✓ get_farmer() returns role='cooperative'")
    
    if not farmer.get('cooperative_name'):
        print("❌ FAIL: cooperative_name should be available")
        return False
    print("✓ cooperative_name is available")
    
    return True

def test_standard_farmer():
    """Test standard farmer registration (not cooperative)"""
    print("\n" + "="*80)
    print("TEST 3: STANDARD FARMER REGISTRATION")
    print("="*80)
    
    # Get cell and village
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT cell_id FROM cells WHERE sector_id=1 LIMIT 1")
            cell = cur.fetchone()
            cur.execute("SELECT village_id FROM villages WHERE cell_id=%s LIMIT 1", (cell['cell_id'],))
            village = cur.fetchone()
    
    test_data = {
        'name': 'Test Standard Farmer',
        'email': 'test_standard_farmer@gmail.com',
        'phone': '0789123457',
        'password': 'TestPass123',
        'role': 'farmer',
        'sector': 'Gashora',
        'cell_id': cell['cell_id'],
        'village_id': village['village_id'],
        'cooperative_id': None,
        'farm_size_ha': 0.8
    }
    
    # Delete existing test user
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM farmers WHERE email=%s", (test_data['email'],))
            conn.commit()
    
    # Register
    try:
        result = register_farmer_with_location(test_data)
        print(f"✓ Registration successful! Farmer ID: {result['farmer_id']}")
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return False
    
    # Verify
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT farmer_id, role, is_cooperative_member, 
                       cooperative_id, cell_id, village_id
                FROM farmers 
                WHERE farmer_id=%s
            """, (result['farmer_id'],))
            farmer = cur.fetchone()
            
            print("\n" + "-"*80)
            print("DATABASE VERIFICATION")
            print("-"*80)
            print(f"Role: {farmer['role']}")
            print(f"Is Cooperative Member: {farmer['is_cooperative_member']}")
            print(f"Cooperative ID: {farmer['cooperative_id']}")
            print(f"Cell ID: {farmer['cell_id']}")
            print(f"Village ID: {farmer['village_id']}")
            
            if farmer['is_cooperative_member'] != 0:
                print("❌ FAIL: is_cooperative_member should be 0 for standard farmer")
                return False
            print("✓ is_cooperative_member = 0")
            
            if farmer['role'] != 'farmer':
                print("❌ FAIL: role should be 'farmer'")
                return False
            print("✓ role = 'farmer'")
            
            if not farmer['cell_id']:
                print("❌ FAIL: cell_id should not be NULL")
                return False
            print("✓ cell_id is set")
            
            if not farmer['village_id']:
                print("❌ FAIL: village_id should not be NULL")
                return False
            print("✓ village_id is set")
    
    # Test get_farmer() returns correct role
    farmer = get_farmer(result['farmer_id'])
    if farmer.get('role') != 'farmer':
        print("❌ FAIL: get_farmer() should return role='farmer'")
        return False
    print("✓ get_farmer() returns role='farmer'")
    
    return True

if __name__ == '__main__':
    print("\n" + "="*80)
    print("COOPERATIVE MEMBER REGISTRATION AND DASHBOARD TEST SUITE")
    print("="*80)
    
    tests = [
        ("Cooperative Member Registration", test_cooperative_registration),
        ("Get Farmer Function", test_get_farmer_function),
        ("Standard Farmer Registration", test_standard_farmer),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ TEST FAILED WITH EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for name, result in results:
        status = "✓ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! 🎉")
    else:
        print("\n⚠️  SOME TESTS FAILED")
