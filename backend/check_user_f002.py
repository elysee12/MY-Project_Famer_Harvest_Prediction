import pymysql
import pymysql.cursors

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='bugesera_harvest',
    cursorclass=pymysql.cursors.DictCursor
)

cur = conn.cursor()
cur.execute("""
    SELECT farmer_id, full_name, email, role, is_cooperative_member, 
           cooperative_id, cooperative_name, cell_id, village_id
    FROM farmers 
    WHERE farmer_id='F002'
""")

result = cur.fetchone()
print('\nDatabase Record for F002:')
print('='*60)
for k, v in result.items():
    print(f'{k:30s}: {v}')

conn.close()
