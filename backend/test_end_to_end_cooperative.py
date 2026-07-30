"""
End-to-End Test: Cooperative Member Registration → Login → Dashboard Data
Simulates the complete user journey from registration to dashboard display
"""

import json
import requests

BASE_URL = "http://localhost:5000"

def test_registration():
    """Test cooperative member registration via API"""
    print("\n" + "="*80)
    print("STEP 1: REGISTER AS COOPERATIVE MEMBER")
    print("="*80)
    
    # Get available cooperatives
    resp = requests.get(f"{BASE_URL}/api/cooperatives")
    cooperatives = resp.json().get('cooperatives', [])
    if not cooperatives:
        print("❌ No cooperatives available")
        return None
    
    coop = cooperatives[0]
    print(f"✓ Using cooperative: {coop['cooperative_name']} (ID: {coop['cooperative_id']})")
    
    # Get cells
    resp = requests.get(f"{BASE_URL}/api/cells")
    cells = resp.json().get('cells', [])
    if not cells:
        print("❌ No cells available")
        return None
    
    cell = cells[0]
    print(f"✓ Using cell: {cell['cell_name']} (ID: {cell['cell_id']})")
    
    # Get villages for this cell
    resp = requests.get(f"{BASE_URL}/api/villages?cell_id={cell['cell_id']}")
    villages = resp.json().get('villages', [])
    if not villages:
        print("❌ No villages available")
        return None
    
    village = villages[0]
    print(f"✓ Using village: {village['village_name']} (ID: {village['village_id']})")
    
    # Registration data
    reg_data = {
        "name": "Test E2E Cooperative Member",
        "email": "test_e2e_coop@gmail.com",
        "phone": "0789999999",
        "password": "TestPass123",
        "role": "cooperative",
        "sector": "Gashora",
        "cell_id": cell['cell_id'],
        "village_id": village['village_id'],
        "cooperative_id": coop['cooperative_id'],
        "farm_size_ha": 0.6
    }
    
    print(f"\n✓ Registration payload:")
    print(f"  - Name: {reg_data['name']}")
    print(f"  - Email: {reg_data['email']}")
    print(f"  - Role: {reg_data['role']}")
    print(f"  - Cooperative ID: {reg_data['cooperative_id']}")
    print(f"  - Cell ID: {reg_data['cell_id']}")
    print(f"  - Village ID: {reg_data['village_id']}")
    
    # Send registration request
    resp = requests.post(f"{BASE_URL}/api/register", json=reg_data)
    
    if resp.status_code != 201:
        print(f"❌ Registration failed: {resp.status_code}")
        print(f"   Response: {resp.json()}")
        return None
    
    result = resp.json()
    if not result.get('success'):
        print(f"❌ Registration failed: {result.get('error')}")
        return None
    
    print(f"✓ Registration successful!")
    print(f"  - Farmer ID: {result['user']['farmer_id']}")
    print(f"  - Generated Password: {result.get('generated_password')}")
    
    return {
        'email': reg_data['email'],
        'password': reg_data['password'],
        'farmer_id': result['user']['farmer_id']
    }

def test_login(credentials):
    """Test login and verify role is set correctly"""
    print("\n" + "="*80)
    print("STEP 2: LOGIN AS COOPERATIVE MEMBER")
    print("="*80)
    
    login_data = {
        "email": credentials['email'],
        "password": credentials['password']
    }
    
    print(f"✓ Logging in with email: {credentials['email']}")
    
    resp = requests.post(f"{BASE_URL}/api/login", json=login_data)
    
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.status_code}")
        return None
    
    result = resp.json()
    if not result.get('success'):
        print(f"❌ Login failed: {result.get('error')}")
        return None
    
    user = result['user']
    print(f"✓ Login successful!")
    print(f"\n" + "-"*80)
    print("USER DATA FROM LOGIN")
    print("-"*80)
    print(f"  - ID: {user.get('id')}")
    print(f"  - Name: {user.get('name')}")
    print(f"  - Role: {user.get('role')}")
    print(f"  - Email: {user.get('email')}")
    print(f"  - Sector: {user.get('sector')}")
    print(f"  - Cooperative Name: {user.get('cooperative_name')}")
    print(f"  - Farmer ID: {user.get('farmer_id')}")
    
    # Verify role
    if user.get('role') != 'cooperative':
        print(f"❌ FAIL: Expected role='cooperative', got '{user.get('role')}'")
        return None
    
    print(f"✓ Role is correctly set to 'cooperative'")
    
    if not user.get('cooperative_name'):
        print(f"❌ FAIL: Cooperative name is missing")
        return None
    
    print(f"✓ Cooperative name is present")
    
    return user

def test_dashboard_data(user):
    """Test fetching prediction history for dashboard"""
    print("\n" + "="*80)
    print("STEP 3: FETCH DASHBOARD DATA")
    print("="*80)
    
    farmer_id = user.get('farmer_id') or user.get('id')
    
    print(f"✓ Fetching predictions for farmer: {farmer_id}")
    
    resp = requests.get(f"{BASE_URL}/api/predictions?farmer_id={farmer_id}")
    
    if resp.status_code != 200:
        print(f"❌ Failed to fetch predictions: {resp.status_code}")
        return False
    
    result = resp.json()
    predictions = result.get('predictions', [])
    
    print(f"✓ Predictions fetched successfully")
    print(f"  - Total predictions: {len(predictions)}")
    
    # Fetch notifications
    resp = requests.get(f"{BASE_URL}/api/notifications/{farmer_id}")
    
    if resp.status_code == 200:
        result = resp.json()
        notifications = result.get('advice', [])
        print(f"✓ Notifications fetched successfully")
        print(f"  - Total notifications: {len(notifications)}")
    else:
        print(f"⚠️  Notifications endpoint returned {resp.status_code}")
    
    return True

def cleanup(email):
    """Clean up test user from database"""
    print("\n" + "="*80)
    print("CLEANUP")
    print("="*80)
    
    import pymysql
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='bugesera_harvest'
        )
        with conn.cursor() as cur:
            cur.execute("DELETE FROM farmers WHERE email=%s", (email,))
            conn.commit()
        conn.close()
        print(f"✓ Test user deleted from database")
    except Exception as e:
        print(f"⚠️  Cleanup failed: {e}")

def main():
    print("\n" + "="*80)
    print("END-TO-END TEST: COOPERATIVE MEMBER JOURNEY")
    print("="*80)
    print("\nThis test simulates the complete user flow:")
    print("1. Register as cooperative member (with cell/village selection)")
    print("2. Login with registered credentials")
    print("3. Verify role is set to 'cooperative'")
    print("4. Fetch dashboard data")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    try:
        # Step 1: Register
        credentials = test_registration()
        if not credentials:
            print("\n❌ TEST FAILED AT REGISTRATION")
            return
        
        # Step 2: Login
        user = test_login(credentials)
        if not user:
            print("\n❌ TEST FAILED AT LOGIN")
            cleanup(credentials['email'])
            return
        
        # Step 3: Dashboard data
        if not test_dashboard_data(user):
            print("\n❌ TEST FAILED AT DASHBOARD DATA FETCH")
            cleanup(credentials['email'])
            return
        
        # Success!
        print("\n" + "="*80)
        print("🎉 END-TO-END TEST PASSED! 🎉")
        print("="*80)
        print("\nVerification Summary:")
        print("✓ Registration successful with cooperative, cell, and village")
        print("✓ Login successful")
        print("✓ Role correctly set to 'cooperative'")
        print("✓ Cooperative name available in login response")
        print("✓ Dashboard data can be fetched")
        print("\nThe cooperative member will see:")
        print("  - Blue-themed Cooperative Dashboard")
        print("  - Cooperative name and member count")
        print("  - Location: Cell and Village information")
        print("  - All prediction and weather features")
        
        # Cleanup
        cleanup(credentials['email'])
        
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
