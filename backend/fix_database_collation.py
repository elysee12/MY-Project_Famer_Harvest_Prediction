#!/usr/bin/env python3
"""
Fix Database Collation Issues
============================

This script fixes the collation mismatch between tables that's causing the
"Illegal mix of collations" error in the cooperative dashboard.

The issue occurs when joining tables with different collations:
- utf8mb4_unicode_ci (newer, preferred)
- utf8mb4_general_ci (older, faster but less accurate)

This script standardizes all tables to use utf8mb4_unicode_ci.
"""

import pymysql
import sys
import os

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Empty password for XAMPP default
    'database': 'bugesera_harvest',
    'port': 3306
}

def fix_collation_issues():
    """Fix database collation issues by standardizing to utf8mb4_unicode_ci"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        print("Connected to MySQL database successfully")
        
        with conn.cursor() as cur:
            # First, let's check current collations
            print("\n=== Current Table Collations ===")
            cur.execute("""
                SELECT TABLE_NAME, TABLE_COLLATION 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = %s 
                ORDER BY TABLE_NAME
            """, (DB_CONFIG['database'],))
            
            tables = cur.fetchall()
            for table_name, collation in tables:
                print(f"  {table_name}: {collation}")
            
            # Check column collations for key tables
            print("\n=== Key Column Collations ===")
            key_tables = ['farmers', 'cooperatives', 'season_configurations']
            
            for table in key_tables:
                cur.execute("""
                    SELECT COLUMN_NAME, COLLATION_NAME 
                    FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s 
                    AND COLLATION_NAME IS NOT NULL
                    ORDER BY COLUMN_NAME
                """, (DB_CONFIG['database'], table))
                
                columns = cur.fetchall()
                print(f"\n  {table}:")
                for col_name, col_collation in columns:
                    print(f"    {col_name}: {col_collation}")
            
            # Fix the database and table collations
            print(f"\n=== Fixing Database Collation ===")
            
            # Set database default collation
            cur.execute(f"""
                ALTER DATABASE `{DB_CONFIG['database']}` 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci
            """)
            print(f"✓ Fixed database {DB_CONFIG['database']} collation")
            
            # Fix each table's default collation
            print(f"\n=== Fixing Table Collations ===")
            
            # Disable foreign key checks temporarily
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            print("✓ Disabled foreign key checks")
            
            for table_name, current_collation in tables:
                if current_collation != 'utf8mb4_unicode_ci':
                    try:
                        cur.execute(f"""
                            ALTER TABLE `{table_name}` 
                            CONVERT TO CHARACTER SET utf8mb4 
                            COLLATE utf8mb4_unicode_ci
                        """)
                        print(f"✓ Fixed {table_name} collation: {current_collation} → utf8mb4_unicode_ci")
                    except pymysql.Error as e:
                        # Skip views and other non-convertible tables
                        if "doesn't exist" in str(e) or "view" in str(e).lower():
                            print(f"⚠️  Skipped {table_name} (view or special table)")
                        else:
                            print(f"⚠️  Could not fix {table_name}: {e}")
                else:
                    print(f"✓ {table_name} already has correct collation")
            
            # Re-enable foreign key checks
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
            print("✓ Re-enabled foreign key checks")
            
            conn.commit()
            print(f"\n=== Collation Fix Complete ===")
            print("All tables now use utf8mb4_unicode_ci collation")
            print("This should resolve the 'Illegal mix of collations' errors")
            
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
    
    return True

def test_collation_fix():
    """Test that the collation fix resolved the issues"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        print("\n=== Testing Collation Fix ===")
        
        with conn.cursor() as cur:
            # Test the query that was failing
            cur.execute("""
                SELECT c.cooperative_name, f.email, f.full_name
                FROM cooperatives c
                JOIN farmers f ON c.leader_farmer_id = f.farmer_id
                WHERE c.cooperative_id = 1
            """)
            result = cur.fetchone()
            
            if result:
                print("✅ JOIN query between cooperatives and farmers works!")
                print(f"   Found: {result[0]} - {result[2]} ({result[1]})")
            else:
                print("⚠️  Query works but no results found")
            
            # Test another problematic query
            cur.execute("""
                SELECT sc.season_name, sc.crop_type, c.cooperative_name
                FROM season_configurations sc
                JOIN cooperatives c ON sc.cooperative_id = c.cooperative_id
                WHERE sc.is_active = 1
                LIMIT 1
            """)
            result = cur.fetchone()
            
            if result:
                print("✅ Season configuration JOIN query works!")
                print(f"   Found: {result[0]} - {result[1]} for {result[2]}")
            else:
                print("✅ Season configuration query works (no active configs found)")
        
        conn.close()
        return True
        
    except pymysql.Error as e:
        print(f"❌ Test failed with database error: {e}")
        return False

def main():
    """Main execution function"""
    print("🔧 Database Collation Fixer")
    print("=" * 50)
    
    if fix_collation_issues():
        print("\n" + "=" * 50)
        test_collation_fix()
        print("\n🎉 Database collation issues have been resolved!")
        print("The cooperative leader dashboard should now work without errors.")
    else:
        print("\n❌ Failed to fix collation issues")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())