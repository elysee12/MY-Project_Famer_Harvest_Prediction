-- ═══════════════════════════════════════════════════════════════════════════
-- BUGESERA HARVEST SYSTEM — COOPERATIVES TABLE MIGRATION (SIMPLE VERSION)
-- Adds cooperatives table and updates related tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Create cooperatives table
CREATE TABLE IF NOT EXISTS cooperatives (
    cooperative_id   VARCHAR(50) PRIMARY KEY,
    cooperative_name VARCHAR(255) NOT NULL UNIQUE,
    sector_id        INT NOT NULL,
    contact_phone    VARCHAR(20),
    contact_email    VARCHAR(100),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE RESTRICT
);

-- Create cells table
CREATE TABLE IF NOT EXISTS cells (
    cell_id   INT AUTO_INCREMENT PRIMARY KEY,
    sector_id INT NOT NULL,
    cell_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cell_per_sector (sector_id, cell_name)
);

-- Create villages table
CREATE TABLE IF NOT EXISTS villages (
    village_id INT AUTO_INCREMENT PRIMARY KEY,
    cell_id    INT NOT NULL,
    village_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id) ON DELETE CASCADE,
    UNIQUE KEY unique_village_per_cell (cell_id, village_name)
);

-- Insert Gashora cells (5 cells)
INSERT IGNORE INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Biryogo'
FROM sectors s 
WHERE s.sector_name = 'Gashora';

INSERT IGNORE INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Kabuye'
FROM sectors s 
WHERE s.sector_name = 'Gashora';

INSERT IGNORE INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Kagomasi'
FROM sectors s 
WHERE s.sector_name = 'Gashora';

INSERT IGNORE INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Mwendo'
FROM sectors s 
WHERE s.sector_name = 'Gashora';

INSERT IGNORE INTO cells (sector_id, cell_name) 
SELECT s.sector_id, 'Ramiro'
FROM sectors s 
WHERE s.sector_name = 'Gashora';

-- Insert Biryogo villages
INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Cyahinda' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Gasharu' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Karambi' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kinyana' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Munanira' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Muvumu' FROM cells c WHERE c.cell_name = 'Biryogo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Rugarama' FROM cells c WHERE c.cell_name = 'Biryogo';

-- Insert Kabuye villages
INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Gako' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kabuye' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Munini' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Murama' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Nyarutovu' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Rugazi' FROM cells c WHERE c.cell_name = 'Kabuye';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Ruhunde' FROM cells c WHERE c.cell_name = 'Kabuye';

-- Insert Kagomasi villages
INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Gahama' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kagomasi' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kayovu' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kibumbwe' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Mpanda' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Nyagasambu' FROM cells c WHERE c.cell_name = 'Kagomasi';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Rwimbogo' FROM cells c WHERE c.cell_name = 'Kagomasi';

-- Insert Mwendo villages
INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Akabungo' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Cyinzovu' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Gashikiri' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kabuga' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Mwendo' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Nyamirama' FROM cells c WHERE c.cell_name = 'Mwendo';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Rwamagana' FROM cells c WHERE c.cell_name = 'Mwendo';

-- Insert Ramiro villages
INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Bihembe' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Gashenyi' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kabeza' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Kamubuga' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Karenge' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Ruhanga' FROM cells c WHERE c.cell_name = 'Ramiro';

INSERT IGNORE INTO villages (cell_id, village_name)
SELECT c.cell_id, 'Rurambi' FROM cells c WHERE c.cell_name = 'Ramiro';

-- Migration complete
SELECT 'Simple cooperatives migration completed' AS status;
