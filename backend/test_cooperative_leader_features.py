"""
Comprehensive test script for Cooperative Leader Features
Tests all functionality to ensure everything works perfectly
"""
import pymysql
import requests
import json

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
}

BASE_URL = "http://localhost:5000"

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print info message"""
    print(f"ℹ️  {message}")

def test_database_schema():
    """Test 1: Verify database schema"""
    print_header("TEST 1: Database Schema Verification")
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            # Check if season_configurations table exists
            cur.execute("SHOW TABLES LIKE 'season_configurations'")
            if cur.fetchone():
                print_success("season_configurations table exists")
            else:
                print_error("season_configurations table NOT found")
                return False
            
            # Check table structure
            cur.execute("DESCRIBE season_configurations")
            columns = cur.fetchall()
            expected_columns = ['config_id', 'cooperative_id', 'season_name', 'crop_type', 
                              'seed_variety', 'fertilizer_type', 'has_irrigation', 
                              'is_active', 'created_at', 'updated_at']
            
            found_columns = [col['Field'] for col in columns]
            for col in expected_columns:
                if col in found_columns:
                    print_success(f"Column '{col}' exists")
                else:
                    print_error(f"Column '{col}' missing")
                    return False
            
            # Check cooperatives table has required fields
            cur.execute("DESCRIBE cooperatives")
            coop_cols = [col['Field'] for col in cur.fetchall()]
            if 'leader_farmer_id' in coop_cols:
                print_success("Cooperatives table has leader_farmer_id")
            else:
                print_error("Cooperatives table missing leader_farmer_id")
                return False
        
        conn.close()
        return True
        
    except Exception as e:
        print_error(f"Database error: {e}")
        return False

def test_cooperative_data():
    """Test 2: Verify cooperative and leader data"""
    print_header("TEST 2: Cooperative & Leader Data Verification")
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            # Check if cooperatives exist
            cur.execute("SELECT COUNT(*) as count FROM cooperatives")
            coop_count = cur.fetchone()['count']
            print_info(f"Found {coop_count} cooperative(s) in database")
            
            if coop_count == 0:
                print_error("No cooperatives found! Cannot test features.")
                return False
            
            # Get first cooperative with details
            cur.execute("""
                SELECT c.*, f.full_name as leader_name, f.email as leader_email, f.role
                FROM cooperatives c
                LEFT JOIN farmers f ON c.leader_farmer_id = f.farmer_id
                LIMIT 1
            """)
            coop = cur.fetchone()
            
            print_info(f"Testing with: {coop['cooperative_name']}")
            print_info(f"Leader: {coop['leader_name']} ({coop['leader_email']})")
            print_info(f"Leader Role: {coop['role']}")
            print_info(f"Cooperative ID: {coop['cooperative_id']}")
            
            if coop['role'] != 'cooperative_leader':
                print_error(f"Leader role is '{coop['role']}', should be 'cooperative_leader'")
                return False
            else:
                print_success("Leader has correct role: 'cooperative_leader'")
            
            # Check if cooperative has members
            cur.execute("""
                SELECT COUNT(*) as count FROM farmers 
                WHERE cooperative_id = %s AND is_cooperative_member = 1
            """, (coop['cooperative_id'],))
            member_count = cur.fetchone()['count']
            print_info(f"Cooperative has {member_count} member(s)")
            
        conn.close()
        return True
        
    except Exception as e:
        print_error(f"Database error: {e}")
        return False

def test_season_config_api():
    """Test 3: Test Season Configuration API"""
    print_header("TEST 3: Season Configuration API")
    
    try:
        # Get first cooperative ID
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute("SELECT cooperative_id, cooperative_name FROM cooperatives LIMIT 1")
            coop = cur.fetchone()
            if not coop:
                print_error("No cooperative found")
                return False
            
            coop_id = coop['cooperative_id']
            coop_name = coop['cooperative_name']
        conn.close()
        
        # Test CREATE/UPDATE config
        payload = {
            "cooperative_id": coop_id,
            "season_name": "2026 Season A - Test",
            "crop_type": "Rice",
            "seed_variety": "Kigoli",
            "fertilizer_type": "DAP",
            "has_irrigation": True
        }
        
        print_info(f"Creating configuration for: {coop_name}")
        response = requests.post(
            f"{BASE_URL}/api/cooperative/season-config",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200 and response.json().get('success'):
            print_success("Season configuration created successfully")
            print_info(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print_error(f"Failed to create config. Status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        # Test GET config
        print_info(f"Fetching configuration for cooperative {coop_id}")
        response = requests.get(f"{BASE_URL}/api/cooperative/season-config/{coop_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('has_config'):
                print_success("Configuration fetched successfully")
                config = data.get('config', {})
                print_info(f"Season: {config.get('season_name')}")
                print_info(f"Crop: {config.get('crop_type')}")
                print_info(f"Seed: {config.get('seed_variety')}")
                print_info(f"Fertilizer: {config.get('fertilizer_type')}")
                print_info(f"Irrigation: {'Yes' if config.get('has_irrigation') else 'No'}")
            else:
                print_error("No configuration found")
                return False
        else:
            print_error(f"Failed to fetch config. Status: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print_error(f"API test error: {e}")
        return False

def test_email_configuration():
    """Test 4: Verify email configuration"""
    print_header("TEST 4: Email Configuration Verification")
    
    try:
        import os
        
        # Check if SMTP settings are configured
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        
        if smtp_user and smtp_pass:
            print_success(f"SMTP User configured: {smtp_user}")
            print_success("SMTP Password configured (hidden)")
        else:
            print_error("SMTP settings not configured in environment variables")
            print_info("Email notifications will not be sent")
            print_info("Run: backend/apply_email_config.bat to configure")
            return False
        
        return True
        
    except Exception as e:
        print_error(f"Email config error: {e}")
        return False

def test_cooperative_dashboard_endpoints():
    """Test 5: Test all cooperative dashboard endpoints"""
    print_header("TEST 5: Cooperative Dashboard Endpoints")
    
    try:
        # Get first cooperative
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute("SELECT cooperative_id FROM cooperatives LIMIT 1")
            coop = cur.fetchone()
            if not coop:
                print_error("No cooperative found")
                return False
            coop_id = coop['cooperative_id']
        conn.close()
        
        # Test dashboard endpoint
        print_info(f"Testing dashboard endpoint for cooperative {coop_id}")
        response = requests.get(f"{BASE_URL}/api/cooperative-dashboard/{coop_id}")
        
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()
            print_success("Dashboard endpoint working")
            print_info(f"Members: {len(data.get('members', []))}")
            print_info(f"Stats: {data.get('stats', {})}")
        else:
            print_error(f"Dashboard endpoint failed. Status: {response.status_code}")
            return False
        
        # Test pending members endpoint
        print_info("Testing pending members endpoint")
        response = requests.get(f"{BASE_URL}/api/cooperative/pending-members/{coop_id}")
        
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()
            print_success("Pending members endpoint working")
            print_info(f"Pending members: {len(data.get('pending_members', []))}")
        else:
            print_error(f"Pending members endpoint failed. Status: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print_error(f"Dashboard endpoint error: {e}")
        return False

def run_all_tests():
    """Run all tests and provide summary"""
    print("\n" + "="*70)
    print("  🧪 COOPERATIVE LEADER FEATURES - COMPREHENSIVE TEST")
    print("="*70)
    print("\nTesting all features to ensure everything works perfectly...")
    print("\n⚠️  PREREQUISITES:")
    print("  1. XAMPP MySQL running")
    print("  2. Flask server running (python backend/flask_api.py)")
    print("  3. Database 'bugesera_harvest' exists")
    print("  4. At least one cooperative exists in database")
    print("\nPress Enter to start tests...")
    input()
    
    results = []
    
    # Run all tests
    results.append(("Database Schema", test_database_schema()))
    results.append(("Cooperative Data", test_cooperative_data()))
    results.append(("Season Config API", test_season_config_api()))
    results.append(("Email Configuration", test_email_configuration()))
    results.append(("Dashboard Endpoints", test_cooperative_dashboard_endpoints()))
    
    # Print summary
    print_header("📊 TEST SUMMARY")
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name:.<50} {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\n  {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 SUCCESS! All features working perfectly!")
        print("\n📋 NEXT STEPS:")
        print("  1. Start frontend: cd frontend && npm run dev")
        print("  2. Login as cooperative leader")
        print("  3. Navigate to 'Season Configuration' in left sidebar")
        print("  4. Configure season settings and save")
        print("  5. Check email for confirmation notification")
        print("  6. Login as cooperative farmer to see pre-filled predictions")
    else:
        print(f"\n⚠️  {total_tests - total_passed} test(s) failed!")
        print("\n📋 TROUBLESHOOTING:")
        print("  1. Ensure XAMPP MySQL is running")
        print("  2. Run: python backend/create_season_config_table.py")
        print("  3. Check Flask server is running without errors")
        print("  4. Verify at least one cooperative exists")
        print("  5. Check cooperative has leader_farmer_id set")

if __name__ == "__main__":
    run_all_tests()
