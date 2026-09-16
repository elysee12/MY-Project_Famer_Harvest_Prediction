"""
Create season_configurations table for cooperative leader season management
"""
import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bugesera_harvest',
    'charset': 'utf8mb4',
}

def create_season_config_table():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            # Create season_configurations table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS season_configurations (
                    config_id INT AUTO_INCREMENT PRIMARY KEY,
                    cooperative_id INT NOT NULL,
                    season_name VARCHAR(100) NOT NULL,
                    crop_type VARCHAR(50) NOT NULL,
                    seed_variety VARCHAR(50) NOT NULL,
                    fertilizer_type VARCHAR(50) NOT NULL,
                    has_irrigation TINYINT(1) DEFAULT 0,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (cooperative_id) REFERENCES cooperatives(cooperative_id) ON DELETE CASCADE,
                    INDEX idx_cooperative (cooperative_id),
                    INDEX idx_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✅ season_configurations table created successfully")
            
            # Check if table exists and has data
            cur.execute("SELECT COUNT(*) as cnt FROM season_configurations")
            result = cur.fetchone()
            print(f"📊 Current season configurations: {result[0]}")
            
        conn.commit()
        print("✅ Migration completed successfully")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Creating season_configurations table...")
    create_season_config_table()
