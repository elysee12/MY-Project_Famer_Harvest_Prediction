"""Check actual MySQL schema"""
import sys
sys.path.insert(0, '.')
from database import get_db
import pymysql.cursors

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)

# Farmers table columns
cur.execute("DESCRIBE farmers")
cols = cur.fetchall()
print("\n=== FARMERS TABLE COLUMNS ===")
for c in cols:
    print(f"  {c['Field']}  ({c['Type']})  NULL={c['Null']}  Key={c['Key']}")

# farms table columns (if exists)
try:
    cur.execute("DESCRIBE farms")
    cols2 = cur.fetchall()
    print("\n=== FARMS TABLE COLUMNS ===")
    for c in cols2:
        print(f"  {c['Field']}  ({c['Type']})  NULL={c['Null']}  Key={c['Key']}")
except:
    print("\n=== NO FARMS TABLE ===")

# Sample farmer row
cur.execute("SELECT * FROM farmers LIMIT 1")
row = cur.fetchone()
print("\n=== SAMPLE FARMER ROW ===")
if row:
    for k, v in row.items():
        print(f"  {k}: {v}")

cur.close()
conn.close()
