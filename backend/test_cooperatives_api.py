"""
Test cooperatives API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_get_cooperatives():
    """Test GET /api/cooperatives"""
    print("\n1️⃣ Testing GET /api/cooperatives")
    response = requests.get(f"{BASE_URL}/api/cooperatives")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Found {len(data.get('cooperatives', []))} cooperatives")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

def test_create_cooperative():
    """Test POST /api/cooperatives"""
    print("\n2️⃣ Testing POST /api/cooperatives")
    payload = {
        "name": "Test Gashora Farmers Cooperative",
        "contact_phone": "+250788123456",
        "contact_email": "test@gashora.rw",
        "cell_name": "Biryogo"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/cooperatives",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Created cooperative:")
        print(f"      ID: {data.get('cooperative', {}).get('cooperative_id')}")
        print(f"      Name: {data.get('cooperative', {}).get('cooperative_name')}")
        return data.get('cooperative', {}).get('cooperative_id')
    else:
        print(f"   ❌ Error: {response.text}")
        return None

def test_delete_cooperative(coop_id):
    """Test DELETE /api/cooperatives/<id>"""
    if not coop_id:
        print("\n3️⃣ Skipping DELETE test (no ID)")
        return
    
    print(f"\n3️⃣ Testing DELETE /api/cooperatives/{coop_id}")
    response = requests.delete(f"{BASE_URL}/api/cooperatives/{coop_id}")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✅ Success! Cooperative deleted")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

def test_officers_endpoint():
    """Test GET /api/officers/A001"""
    print("\n4️⃣ Testing GET /api/officers/A001")
    response = requests.get(f"{BASE_URL}/api/officers/A001")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Officer: {data.get('officer', {}).get('full_name')}")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🧪 Testing Cooperatives & Officers API Endpoints")
    print("=" * 60)
    
    try:
        # Test GET cooperatives
        test_get_cooperatives()
        
        # Test CREATE cooperative
        coop_id = test_create_cooperative()
        
        # Test DELETE cooperative
        if coop_id:
            test_delete_cooperative(coop_id)
        
        # Test officers endpoint
        test_officers_endpoint()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to Flask server")
        print("   Make sure Flask is running on http://localhost:5000")
    except Exception as e:
        print(f"\n❌ Error: {e}")
