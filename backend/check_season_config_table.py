import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='bugesera_harvest',
    cursorclass=pymysql.cursors.DictCursor
)

cur = conn.cursor()
cur.execute('DESCRIBE season_configurations')
cols = cur.fetchall()

print("Season Configurations Table Structure:")
print("="*60)
for c in cols:
    null_str = 'NULL' if c['Null'] == 'YES' else 'NOT NULL'
    default = f" DEFAULT {c['Default']}" if c['Default'] else ''
    print(f"{c['Field']}: {c['Type']} {null_str}{default}")

print("\n" + "="*60)
print("Current Records:")
print("="*60)
cur.execute('SELECT * FROM season_configurations ORDER BY created_at DESC LIMIT 10')
records = cur.fetchall()

if records:
    for r in records:
        print(f"ID: {r['config_id']} | Coop: {r['cooperative_id']} | Season: {r['season_name']} | Active: {r['is_active']}")
else:
    print("No records found")

conn.close()
