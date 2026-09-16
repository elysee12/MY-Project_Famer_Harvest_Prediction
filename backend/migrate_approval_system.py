"""
Migration script to add approval workflow system to the database
"""
import pymysql
import pymysql.cursors

# DB Config
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

def migrate():
    conn = pymysql.connect(**DB_CONFIG)
    
    try:
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("SHOW COLUMNS FROM farmers LIKE 'approval_status'")
        has_approval_status = cursor.fetchone() is not None
        
        # Add approval_status if it doesn't exist
        if not has_approval_status:
            print("Adding approval_status column to farmers table...")
            cursor.execute("""
                ALTER TABLE farmers 
                ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
            """)
            print("✓ approval_status column added")
        else:
            print("✓ approval_status column already exists")
        
        # Check rejection_reason
        cursor.execute("SHOW COLUMNS FROM farmers LIKE 'rejection_reason'")
        has_rejection_reason = cursor.fetchone() is not None
        
        # Add rejection_reason if it doesn't exist
        if not has_rejection_reason:
            print("Adding rejection_reason column to farmers table...")
            cursor.execute("ALTER TABLE farmers ADD COLUMN rejection_reason TEXT")
            print("✓ rejection_reason column added")
        else:
            print("✓ rejection_reason column already exists")
        
        # Check cooperatives table
        cursor.execute("SHOW COLUMNS FROM cooperatives LIKE 'registration_number'")
        has_registration_number = cursor.fetchone() is not None
        
        # Add registration_number if it doesn't exist
        if not has_registration_number:
            print("Adding registration_number column to cooperatives table...")
            cursor.execute("ALTER TABLE cooperatives ADD COLUMN registration_number VARCHAR(50) UNIQUE")
            print("✓ registration_number column added")
        else:
            print("✓ registration_number column already exists")
        
        # Update existing records
        print("Updating existing farmer records...")
        
        # Set cooperative members to pending (only those not already approved/rejected)
        cursor.execute("""
            UPDATE farmers 
            SET approval_status = 'pending' 
            WHERE is_cooperative_member = 1 
              AND role = 'cooperative'
              AND approval_status = 'approved'
        """)
        pending_count = cursor.rowcount
        
        # Generate registration numbers for existing cooperatives
        cursor.execute("SELECT cooperative_id FROM cooperatives WHERE registration_number IS NULL ORDER BY cooperative_id")
        coops = cursor.fetchall()
        
        for idx, coop in enumerate(coops, start=1):
            reg_num = f"COOP-{idx:03d}"
            cursor.execute("UPDATE cooperatives SET registration_number = %s WHERE cooperative_id = %s",
                          (reg_num, coop['cooperative_id']))
        
        conn.commit()
        
        print(f"\n✓ Migration completed successfully!")
        print(f"  - Set {pending_count} cooperative members to pending status")
        print(f"  - Generated registration numbers for {len(coops)} cooperatives")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
