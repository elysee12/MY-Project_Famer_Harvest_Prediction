"""
Test what the login endpoint actually returns
"""
import requests
import json

BASE_URL = "http://localhost:5000"

print("\n" + "="*80)
print("TESTING LOGIN ENDPOINT RESPONSE")
print("="*80)

# Test data - adjust the password if needed
test_users = [
    {"email": "kinyarwanda@gmail.com", "password": "Elysee12"},
]

for user_data in test_users:
    print(f"\n{'='*80}")
    print(f"Testing login for: {user_data['email']}")
    print(f"{'='*80}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/login",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                user = result['user']
                print("\n✅ LOGIN SUCCESSFUL")
                print("\nUser Data Returned:")
                print(json.dumps(user, indent=2))
                
                print("\n" + "-"*80)
                print("KEY FIELDS CHECK:")
                print("-"*80)
                print(f"  Role: {user.get('role')}")
                print(f"  Cell Name: {user.get('cell_name')}")
                print(f"  Village Name: {user.get('village_name')}")
                print(f"  Cooperative Name: {user.get('cooperative_name')}")
                print(f"  Coop Total Members: {user.get('coop_total_members')}")
                
                # Verify what dashboard should be shown
                print("\n" + "-"*80)
                print("DASHBOARD ROUTING:")
                print("-"*80)
                if user.get('role') == 'cooperative':
                    print("  ✅ Should show: COOPERATIVE DASHBOARD (Blue)")
                elif user.get('role') == 'farmer':
                    print("  ✅ Should show: FARMER DASHBOARD (Green)")
                else:
                    print(f"  ⚠️  Unknown role: {user.get('role')}")
                
            else:
                print(f"❌ Login failed: {result.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)
print("\nIf all fields are present but dashboard is wrong:")
print("1. Hard refresh browser (Ctrl+Shift+R)")
print("2. Clear browser cache")
print("3. Try in incognito/private window")
print("4. Check browser console for errors (F12)")
