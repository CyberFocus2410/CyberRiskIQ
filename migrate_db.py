import sqlite3

def migrate():
    conn = sqlite3.connect('cyberriskiq.db')
    cursor = conn.cursor()
    try:
        cols = [c[1] for c in cursor.execute('PRAGMA table_info(security_assessment_runs)').fetchall()]
        print('Existing columns:', cols)
        for col, col_type in [
            ('scope', 'TEXT DEFAULT "Standard Full Scope"'),
            ('logs', 'TEXT DEFAULT ""'),
            ('report_json', 'JSON DEFAULT "{}"'),
            ('error_message', 'TEXT')
        ]:
            if col not in cols:
                print(f'Adding column {col}...')
                cursor.execute(f'ALTER TABLE security_assessment_runs ADD COLUMN {col} {col_type}')
        conn.commit()
        print('Migration success!')
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
