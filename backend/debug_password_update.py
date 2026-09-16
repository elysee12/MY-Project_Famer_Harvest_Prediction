#!/usr/bin/env python3
"""
Debug Password Update
====================

Debug the update_user_password function to see why it's failing.
"""

import pymysql
from database import get_db

def debug_password_update():
    """Debug the password update process"""
    try:
        user_id = "CL001"
        role = "cooperative_leader"
        new_password = "newpassword123"
        
        print("=== Debug Password Update ===")
        print(f"user_id: {user_id}")
        print(f"role: {role}")
        print(f"new_password: {new_password}")
        
        with get_db() as conn:
            with conn.cursor() as cur:
                # Check current password
                cur.execute("SELECT farmer_id, full_name, password_hash FROM farmers WHERE farmer_id = %s", (user_id,))
                before = cur.fetchone()
                print(f"\nBEFORE UPDATE:")
                print(f"  Found user: {before is not None}")
                if before:
                    print(f"  farmer_id: {before.get('farmer_id')}")
                    print(f"  full_name: {before.get('full_name')}")
                    print(f"  password_hash: {before.get('password_hash')}")
                
                # Test the UPDATE query
                print(f"\nTesting UPDATE query...")
                result = cur.execute("UPDATE farmers SET password_hash=%s WHERE farmer_id=%s", 
                                   (new_password, user_id))
                print(f"  Query executed, result: {result}")
                print(f"  Rows affected: {cur.rowcount}")
                
                # Check after update (but don't commit)
                cur.execute("SELECT farmer_id, full_name, password_hash FROM farmers WHERE farmer_id = %s", (user_id,))
                after = cur.fetchone()
                print(f"\nAFTER UPDATE (not committed):")
                if after:
                    print(f"  farmer_id: {after.get('farmer_id')}")
                    print(f"  full_name: {after.get('full_name')}")
                    print(f"  password_hash: {after.get('password_hash')}")
                    
                # Test if we should commit
                if cur.rowcount > 0:
                    print(f"\n✓ UPDATE would succeed (rowcount: {cur.rowcount})")
                    # conn.commit()  # Uncomment to actually commit
                    print("  (Not committing - this is just a test)")
                else:
                    print(f"\n❌ UPDATE would fail (rowcount: {cur.rowcount})")
                
                # Rollback to keep original password
                conn.rollback()
                print("  Rolled back changes")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_password_update()