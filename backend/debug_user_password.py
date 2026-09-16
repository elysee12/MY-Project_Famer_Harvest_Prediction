#!/usr/bin/env python3
"""
Debug User Password
==================

Debug the cooperative leader password issue by checking what's stored in the database.
"""

import pymysql
from database import get_db, get_farmer

def debug_cooperative_leader():
    """Debug the cooperative leader CL001 password"""
    try:
        # Get user using the same function as the API
        user = get_farmer("CL001")
        print("=== Debug Cooperative Leader CL001 ===")
        
        if user:
            print("✓ User found via get_farmer()")
            print(f"  farmer_id: {user.get('farmer_id')}")
            print(f"  full_name: {user.get('full_name')}")
            print(f"  role: {user.get('role')}")
            print(f"  password_hash: {user.get('password_hash')}")
            print(f"  password: {user.get('password')}")
            print(f"  is_active: {user.get('is_active')}")
            
            # Check what field contains the password
            password_field = user.get('password') or user.get('password_hash')
            print(f"  actual password field: {password_field}")
            
            # Test password comparison
            test_password = "harvest2024"
            matches = password_field == test_password if password_field else False
            print(f"  password matches 'harvest2024': {matches}")
            
        else:
            print("❌ User NOT found via get_farmer()")
            
        # Also check direct database query
        print("\n=== Direct Database Query ===")
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM farmers WHERE farmer_id = 'CL001'")
                row = cur.fetchone()
                
                if row:
                    print("✓ User found in database")
                    print(f"  farmer_id: {row.get('farmer_id')}")
                    print(f"  full_name: {row.get('full_name')}")
                    print(f"  role: {row.get('role')}")  
                    print(f"  password_hash: {row.get('password_hash')}")
                    print(f"  is_active: {row.get('is_active')}")
                    
                    # Test password
                    stored_password = row.get('password_hash')
                    matches = stored_password == "harvest2024"
                    print(f"  password matches 'harvest2024': {matches}")
                    
                else:
                    print("❌ User NOT found in database")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_cooperative_leader()