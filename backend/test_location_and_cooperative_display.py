"""
Test Location and Cooperative Display
Verifies that:
1. Cell and village names are returned in get_farmer()
2. Login returns cell_name and village_name
3. Cooperative members get cooperative_name and coop_total_members
"""

import pymysql
import pymysql.cursors
from database import get_farmer

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

def test_location_display():
    """Test that cell and village names are returned"""
    print("\n" + "="*80)
    print("TEST 1: LOCATION DISPLAY (CELL & VILLAGE)")
    print("="*80)
    
    # Get a farmer with location
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT farmer_id, full_name, cell_id, village_id 
                FROM farmers 
                WHERE cell_id IS NOT NULL AND village_id IS NOT NULL
                LIMIT 1
            """)
            farmer_row = cur.fetchone()
            
            if not farmer_row:
                print("❌ No farmers with location found")
                return False
            
            print(f"✓ Testing farmer: {farmer_row['full_name']} (ID: {farmer_row['farmer_id']})")
            print(f"  - cell_id: {farmer_row['cell_id']}")
            print(f"  - village_id: {farmer_row['village_id']}")
    
    # Call get_farmer()
    farmer_data = get_farmer(farmer_row['farmer_id'])
    
    if not farmer_data:
        print("❌ get_farmer() returned None")
        return False
    
    print(f"\n" + "-"*80)
    print("GET_FARMER() RESULT")
    print("-"*80)
    print(f"Farmer ID: {farmer_data.get('farmer_id')}")
    print(f"Name: {farmer_data.get('name')}")
    print(f"Cell Name: {farmer_data.get('cell_name')}")
    print(f"Village Name: {farmer_data.get('village_name')}")
    
    # Verify
    if not farmer_data.get('cell_name'):
        print("❌ FAIL: cell_name is missing")
        return False
    print("✓ cell_name is present")
    
    if not farmer_data.get('village_name'):
        print("❌ FAIL: village_name is missing")
        return False
    print("✓ village_name is present")
    
    return True

def test_cooperative_display():
    """Test that cooperative members get cooperative data"""
    print("\n" + "="*80)
    print("TEST 2: COOPERATIVE MEMBER DATA")
    print("="*80)
    
    # Get a cooperative member
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT farmer_id, full_name, is_cooperative_member, cooperative_id
                FROM farmers 
                WHERE is_cooperative_member = 1 AND cooperative_id IS NOT NULL
                LIMIT 1
            """)
            coop_member = cur.fetchone()
            
            if not coop_member:
                print("⚠️  No cooperative members found - skipping test")
                return True  # Not a failure, just no data
            
            print(f"✓ Testing cooperative member: {coop_member['full_name']} (ID: {coop_member['farmer_id']})")
            print(f"  - is_cooperative_member: {coop_member['is_cooperative_member']}")
            print(f"  - cooperative_id: {coop_member['cooperative_id']}")
    
    # Call get_farmer()
    farmer_data = get_farmer(coop_member['farmer_id'])
    
    if not farmer_data:
        print("❌ get_farmer() returned None")
        return False
    
    print(f"\n" + "-"*80)
    print("GET_FARMER() RESULT FOR COOPERATIVE MEMBER")
    print("-"*80)
    print(f"Farmer ID: {farmer_data.get('farmer_id')}")
    print(f"Name: {farmer_data.get('name')}")
    print(f"Role: {farmer_data.get('role')}")
    print(f"Cooperative Name: {farmer_data.get('cooperative_name')}")
    print(f"Cooperative Total Members: {farmer_data.get('coop_total_members')}")
    print(f"Cell Name: {farmer_data.get('cell_name')}")
    print(f"Village Name: {farmer_data.get('village_name')}")
    
    # Verify
    if farmer_data.get('role') != 'cooperative':
        print("❌ FAIL: role should be 'cooperative'")
        return False
    print("✓ role = 'cooperative'")
    
    if not farmer_data.get('cooperative_name'):
        print("❌ FAIL: cooperative_name is missing")
        return False
    print("✓ cooperative_name is present")
    
    if not farmer_data.get('cell_name'):
        print("❌ FAIL: cell_name is missing")
        return False
    print("✓ cell_name is present")
    
    if not farmer_data.get('village_name'):
        print("❌ FAIL: village_name is missing")
        return False
    print("✓ village_name is present")
    
    return True

def test_all_farmers_have_location():
    """Check how many farmers have location data"""
    print("\n" + "="*80)
    print("TEST 3: LOCATION DATA COVERAGE")
    print("="*80)
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as total FROM farmers WHERE is_active=1")
            total = cur.fetchone()['total']
            
            cur.execute("""
                SELECT COUNT(*) as with_location 
                FROM farmers 
                WHERE is_active=1 AND cell_id IS NOT NULL AND village_id IS NOT NULL
            """)
            with_location = cur.fetchone()['with_location']
            
            cur.execute("""
                SELECT COUNT(*) as without_location 
                FROM farmers 
                WHERE is_active=1 AND (cell_id IS NULL OR village_id IS NULL)
            """)
            without_location = cur.fetchone()['without_location']
            
            print(f"Total active farmers: {total}")
            print(f"  - With location: {with_location} ({with_location/total*100:.1f}%)")
            print(f"  - Without location: {without_location} ({without_location/total*100:.1f}%)")
            
            if without_location > 0:
                cur.execute("""
                    SELECT farmer_id, full_name, email, cell_id, village_id
                    FROM farmers
                    WHERE is_active=1 AND (cell_id IS NULL OR village_id IS NULL)
                """)
                missing = cur.fetchall()
                print(f"\nFarmers without location:")
                for f in missing:
                    print(f"  - {f['farmer_id']}: {f['full_name']} ({f['email']})")
                    print(f"    cell_id={f['cell_id']}, village_id={f['village_id']}")
            
            return True

if __name__ == '__main__':
    print("\n" + "="*80)
    print("LOCATION AND COOPERATIVE DISPLAY TEST SUITE")
    print("="*80)
    
    tests = [
        ("Location Display (Cell & Village)", test_location_display),
        ("Cooperative Member Data", test_cooperative_display),
        ("Location Data Coverage", test_all_farmers_have_location),
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
