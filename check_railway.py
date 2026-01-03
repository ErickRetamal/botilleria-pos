from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) as total FROM productos'))
    total = result.fetchone()[0]
    print(f'✅ Productos en Railway MySQL: {total}')
