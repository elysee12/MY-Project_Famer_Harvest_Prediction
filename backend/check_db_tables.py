import sqlite3

conn = sqlite3.connect('bugesera.db')
cur = conn.cursor()
cur.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = [t[0] for t in cur.fetchall()]
print("Tables in database:")
for table in tables:
    print(f"  - {table}")
conn.close()
