-- ═══════════════════════════════════════════════════════════════════════════
-- BUGESERA HARVEST SYSTEM — COOPERATIVES TABLE MIGRATION
-- Adds cooperatives table and updates farmers table with cooperative_id FK
-- ═══════════════════════════════════════════════════════════════════════════

-- Create cooperatives table
CREATE TABLE IF NOT EXISTS cooperatives (
    cooperative_id   VARCHAR(50) PRIMARY KEY,
    cooperative_name VARCHAR(255) NOT NULL UNIQUE,
    sector_id        INT NOT NULL,
    contact_phone    VARCHAR(20),
    contact_email    VARCHAR(100),
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE RESTRICT
);

-- Add cooperative_id to farmers table if not exists
-- Check first to avoid errors
SET @db_name = DATABASE();
SET @table_name = 'farmers';
SET @column_name = 'cooperative_id';

SET @query = CONCAT('
    ALTER TABLE ', @table_name, '
    ADD COLUMN IF NOT EXISTS ', @column_name, ' VARCHAR(50) NULL,
    ADD CONSTRAINT fk_farmer_cooperative 
    FOREIGN KEY (', @column_name, ') REFERENCES cooperatives(cooperative_id) ON DELETE SET NULL
');

-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll use a stored procedure approach

DELIMITER $$

CREATE PROCEDURE add_cooperative_column()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'farmers'
        AND column_name = 'cooperative_id';
    
    IF column_exists = 0 THEN
        ALTER TABLE farmers 
        ADD COLUMN cooperative_id VARCHAR(50) NULL,
        ADD CONSTRAINT fk_farmer_cooperative 
            FOREIGN KEY (cooperative_id) REFERENCES cooperatives(cooperative_id) 
            ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL add_cooperative_column();
DROP PROCEDURE add_cooperative_column;

-- Add cells and villages tables for Gashora sector location hierarchy
-- (These may be referenced by other parts of the system)

CREATE TABLE IF NOT EXISTS cells (
    cell_id   INT AUTO_INCREMENT PRIMARY KEY,
    sector_id INT NOT NULL,
    cell_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cell_per_sector (sector_id, cell_name)
);

CREATE TABLE IF NOT EXISTS villages (
    village_id INT AUTO_INCREMENT PRIMARY KEY,
    cell_id    INT NOT NULL,
    village_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id) ON DELETE CASCADE,
    UNIQUE KEY unique_village_per_cell (cell_id, village_name)
);

-- Insert Gashora cells (5 cells)
INSERT INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Biryogo'
FROM sectors s 
WHERE s.sector_name = 'Gashora' 
AND NOT EXISTS (SELECT 1 FROM cells WHERE cell_name = 'Biryogo');

INSERT INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Kabuye'
FROM sectors s 
WHERE s.sector_name = 'Gashora' 
AND NOT EXISTS (SELECT 1 FROM cells WHERE cell_name = 'Kabuye');

INSERT INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Kagomasi'
FROM sectors s 
WHERE s.sector_name = 'Gashora' 
AND NOT EXISTS (SELECT 1 FROM cells WHERE cell_name = 'Kagomasi');

INSERT INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Mwendo'
FROM sectors s 
WHERE s.sector_name = 'Gashora' 
AND NOT EXISTS (SELECT 1 FROM cells WHERE cell_name = 'Mwendo');

INSERT INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Ramiro'
FROM sectors s 
WHERE s.sector_name = 'Gashora' 
AND NOT EXISTS (SELECT 1 FROM cells WHERE cell_name = 'Ramiro');

-- Insert Gashora villages by cell (35 villages total)
-- Biryogo cell villages
INSERT INTO villages (cell_id, village_name)
SELECT c.cell_id, v.village_name
FROM cells c
CROSS JOIN (
    SELECT 'Cyahinda' AS village_name UNION ALL
    SELECT 'Gasharu' UNION ALL
    SELECT 'Karambi' UNION ALL
    SELECT 'Kinyana' UNION ALL
    SELECT 'Munanira' UNION ALL
    SELECT 'Muvumu' UNION ALL
    SELECT 'Rugarama'
) v
WHERE c.cell_name = 'Biryogo'
AND NOT EXISTS (
    SELECT 1 FROM villages 
    WHERE cell_id = c.cell_id AND village_name = v.village_name
);

-- Kabuye cell villages
INSERT INTO villages (cell_id, village_name)
SELECT c.cell_id, v.village_name
FROM cells c
CROSS JOIN (
    SELECT 'Gako' AS village_name UNION ALL
    SELECT 'Kabuye' UNION ALL
    SELECT 'Munini' UNION ALL
    SELECT 'Murama' UNION ALL
    SELECT 'Nyarutovu' UNION ALL
    SELECT 'Rugazi' UNION ALL
    SELECT 'Ruhunde'
) v
WHERE c.cell_name = 'Kabuye'
AND NOT EXISTS (
    SELECT 1 FROM villages 
    WHERE cell_id = c.cell_id AND village_name = v.village_name
);

-- Kagomasi cell villages
INSERT INTO villages (cell_id, village_name)
SELECT c.cell_id, v.village_name
FROM cells c
CROSS JOIN (
    SELECT 'Gahama' AS village_name UNION ALL
    SELECT 'Kagomasi' UNION ALL
    SELECT 'Kayovu' UNION ALL
    SELECT 'Kibumbwe' UNION ALL
    SELECT 'Mpanda' UNION ALL
    SELECT 'Nyagasambu' UNION ALL
    SELECT 'Rwimbogo'
) v
WHERE c.cell_name = 'Kagomasi'
AND NOT EXISTS (
    SELECT 1 FROM villages 
    WHERE cell_id = c.cell_id AND village_name = v.village_name
);

-- Mwendo cell villages
INSERT INTO villages (cell_id, village_name)
SELECT c.cell_id, v.village_name
FROM cells c
CROSS JOIN (
    SELECT 'Akabungo' AS village_name UNION ALL
    SELECT 'Cyinzovu' UNION ALL
    SELECT 'Gashikiri' UNION ALL
    SELECT 'Kabuga' UNION ALL
    SELECT 'Mwendo' UNION ALL
    SELECT 'Nyamirama' UNION ALL
    SELECT 'Rwamagana'
) v
WHERE c.cell_name = 'Mwendo'
AND NOT EXISTS (
    SELECT 1 FROM villages 
    WHERE cell_id = c.cell_id AND village_name = v.village_name
);

-- Ramiro cell villages
INSERT INTO villages (cell_id, village_name)
SELECT c.cell_id, v.village_name
FROM cells c
CROSS JOIN (
    SELECT 'Bihembe' AS village_name UNION ALL
    SELECT 'Gashenyi' UNION ALL
    SELECT 'Kabeza' UNION ALL
    SELECT 'Kamubuga' UNION ALL
    SELECT 'Karenge' UNION ALL
    SELECT 'Ruhanga' UNION ALL
    SELECT 'Rurambi'
) v
WHERE c.cell_name = 'Ramiro'
AND NOT EXISTS (
    SELECT 1 FROM villages 
    WHERE cell_id = c.cell_id AND village_name = v.village_name
);

-- Add cell_id and village_id to farms table if not exists
DELIMITER $$

CREATE PROCEDURE add_location_columns()
BEGIN
    DECLARE cell_col_exists INT DEFAULT 0;
    DECLARE village_col_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO cell_col_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'farms'
        AND column_name = 'cell_id';
    
    SELECT COUNT(*) INTO village_col_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'farms'
        AND column_name = 'village_id';
    
    IF cell_col_exists = 0 THEN
        ALTER TABLE farms 
        ADD COLUMN cell_id INT NULL,
        ADD CONSTRAINT fk_farm_cell 
            FOREIGN KEY (cell_id) REFERENCES cells(cell_id) ON DELETE SET NULL;
    END IF;
    
    IF village_col_exists = 0 THEN
        ALTER TABLE farms 
        ADD COLUMN village_id INT NULL,
        ADD CONSTRAINT fk_farm_village 
            FOREIGN KEY (village_id) REFERENCES villages(village_id) ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL add_location_columns();
DROP PROCEDURE add_location_columns;

-- Create index on cooperatives
CREATE INDEX IF NOT EXISTS idx_coop_sector ON cooperatives(sector_id);
CREATE INDEX IF NOT EXISTS idx_coop_active ON cooperatives(is_active);

-- Create index on farmers cooperative_id
CREATE INDEX IF NOT EXISTS idx_farmer_coop ON farmers(cooperative_id);

-- Migration complete
SELECT 'Cooperatives table migration completed successfully' AS status;
