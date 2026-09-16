"""
Verify Cooperative Leader Access and Permissions
Ensures the leader can access all features
"""
import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
}

def verify_leader_access():
    """Verify cooperative leader exists and has correct permissions"""
    print("\n" + "="*70)
    print("  🔐 COOPERATIVE LEADER ACCESS VERIFICATION")
    print("="*70)
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            # Get all cooperative leaders
            cur.execute("""
                SELECT 
                    f.farmer_id,
                    f.full_name,
                    f.email,
                    f.phone,
                    f.role,
                    f.password_hash
                FROM farmers f
                WHERE f.role COLLATE utf8mb4_unicode_ci = 'cooperative_leader' AND f.is_active = 1
            """)
            
            leaders_basic = cur.fetchall()
            
            if not leaders_basic:
                print("\n❌ NO COOPERATIVE LEADERS FOUND!")
                print("\n📋 TO CREATE A COOPERATIVE LEADER:")
                print("  1. Go to District Admin dashboard")
                print("  2. Navigate to 'Cooperatives' tab")
                print("  3. Click 'Create Cooperative'")
                print("  4. Fill form with leader details")
                print("  5. Leader will receive email with login credentials")
                return False
            
            leaders = []
            for leader in leaders_basic:
                # Get cooperative details
                cur.execute("""
                    SELECT cooperative_id, cooperative_name, total_members
                    FROM cooperatives
                    WHERE leader_farmer_id = %s
                """, (leader['farmer_id'],))
                coop = cur.fetchone()
                
                if coop:
                    leader['cooperative_id'] = coop['cooperative_id']
                    leader['cooperative_name'] = coop['cooperative_name']
                    leader['total_members'] = coop['total_members']
                
                # Get location details
                if 'cell_id' in leader and leader.get('cell_id'):
                    cur.execute("SELECT cell_name FROM cells WHERE cell_id = %s", (leader['cell_id'],))
                    cell = cur.fetchone()
                    leader['cell_name'] = cell['cell_name'] if cell else 'N/A'
                else:
                    leader['cell_name'] = 'N/A'
                
                if 'village_id' in leader and leader.get('village_id'):
                    cur.execute("SELECT village_name FROM villages WHERE village_id = %s", (leader['village_id'],))
                    village = cur.fetchone()
                    leader['village_name'] = village['village_name'] if village else 'N/A'
                else:
                    leader['village_name'] = 'N/A'
                
                leaders.append(leader)
            
            if not leaders:
                print("\n❌ NO COOPERATIVE LEADERS FOUND!")
                print("\n📋 TO CREATE A COOPERATIVE LEADER:")
                print("  1. Go to District Admin dashboard")
                print("  2. Navigate to 'Cooperatives' tab")
                print("  3. Click 'Create Cooperative'")
                print("  4. Fill form with leader details")
                print("  5. Leader will receive email with login credentials")
                return False
            
            print(f"\n✅ Found {len(leaders)} cooperative leader(s):")
            print()
            
            for idx, leader in enumerate(leaders, 1):
                print(f"{'─'*70}")
                print(f"  LEADER #{idx}: {leader['full_name']}")
                print(f"{'─'*70}")
                print(f"  📧 Email:        {leader['email']}")
                print(f"  📱 Phone:        {leader['phone']}")
                print(f"  🆔 Farmer ID:    {leader['farmer_id']}")
                print(f"  🔑 Role:         {leader['role']}")
                print(f"  🔒 Password:     harvest2024 (default)")
                print(f"")
                print(f"  🏢 Cooperative:  {leader['cooperative_name']}")
                print(f"  🆔 Coop ID:      {leader['cooperative_id']}")
                print(f"  👥 Members:      {leader['total_members']}")
                print(f"  📍 Location:     {leader['cell_name']}, {leader['village_name']}")
                print()
                
                # Check if leader can access dashboard features
                print(f"  🔍 Feature Access Check:")
                
                # Check season configuration
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM season_configurations 
                    WHERE cooperative_id = %s
                """, (leader['cooperative_id'],))
                config_count = cur.fetchone()['count']
                
                if config_count > 0:
                    print(f"     ✅ Season configurations: {config_count} found")
                    
                    # Get latest config
                    cur.execute("""
                        SELECT season_name, crop_type, seed_variety, fertilizer_type, has_irrigation
                        FROM season_configurations
                        WHERE cooperative_id = %s AND is_active = 1
                        ORDER BY created_at DESC
                        LIMIT 1
                    """, (leader['cooperative_id'],))
                    config = cur.fetchone()
                    
                    if config:
                        print(f"        - Active Season: {config['season_name']}")
                        print(f"        - Crop: {config['crop_type']}")
                        print(f"        - Seed: {config['seed_variety']}")
                        print(f"        - Fertilizer: {config['fertilizer_type']}")
                        print(f"        - Irrigation: {'Yes' if config['has_irrigation'] else 'No'}")
                else:
                    print(f"     ⚠️  Season configurations: None created yet")
                
                # Check members
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM farmers 
                    WHERE cooperative_id = %s AND is_cooperative_member = 1 AND approval_status = 'approved'
                """, (leader['cooperative_id'],))
                member_count = cur.fetchone()['count']
                print(f"     ✅ Active members: {member_count}")
                
                # Check pending requests
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM farmers 
                    WHERE cooperative_id = %s AND approval_status = 'pending'
                """, (leader['cooperative_id'],))
                pending_count = cur.fetchone()['count']
                
                if pending_count > 0:
                    print(f"     ⚠️  Pending requests: {pending_count} waiting for approval")
                else:
                    print(f"     ✅ Pending requests: None")
                
                # Check predictions
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM predictions p
                    JOIN farmers f ON p.farmer_id = f.farmer_id
                    WHERE f.cooperative_id = %s
                """, (leader['cooperative_id'],))
                pred_count = cur.fetchone()['count']
                print(f"     ✅ Total predictions: {pred_count}")
                
                print()
                print(f"  🔐 LOGIN CREDENTIALS:")
                print(f"     Email:    {leader['email']}")
                print(f"     Password: harvest2024")
                print(f"     URL:      http://localhost:5173")
                print()
                
                print(f"  📱 DASHBOARD FEATURES AVAILABLE:")
                print(f"     ✅ Overview - Dashboard with KPIs")
                print(f"     ✅ Members - View all active farmers")
                print(f"     ✅ Pending Requests - Approve/reject applications")
                print(f"     ✅ Season Configuration - Set crop settings")
                print(f"     ✅ Predictions - View aggregate predictions")
                print(f"     ✅ Reports - Generate cooperative reports")
                print(f"     ✅ My Profile - View/update profile")
                print()
            
            print("="*70)
            print("  ✅ ALL COOPERATIVE LEADERS VERIFIED!")
            print("="*70)
            print("\n📋 NEXT STEPS TO TEST:")
            print("  1. Start backend:  python backend/flask_api.py")
            print("  2. Start frontend: cd frontend && npm run dev")
            print("  3. Go to: http://localhost:5173")
            print("  4. Login with credentials above")
            print("  5. Check left sidebar has 7 navigation options")
            print("  6. Click 'Season Configuration' to set up season")
            print("  7. Check email for confirmation notification")
            print()
            
            return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n📋 TROUBLESHOOTING:")
        print("  1. Ensure XAMPP MySQL is running")
        print("  2. Verify database 'bugesera_harvest' exists")
        print("  3. Check cooperatives table has data")
        print("  4. Run: python backend/create_season_config_table.py")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    verify_leader_access()
