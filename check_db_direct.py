import os
from sqlalchemy import create_engine, text

# Usar directamente la variable MYSQL_URL que Railway proporciona
mysql_url = os.getenv('MYSQL_URL', 'mysql://root:aQFBHQJEvjYGkyLLmPjBmkQtrVIGjjyl@gondola.proxy.rlwy.net:23659/railway')

# Forzar PyMySQL
if mysql_url.startswith('mysql://'):
    mysql_url = mysql_url.replace('mysql://', 'mysql+pymysql://', 1)

print(f"Conectando a: {mysql_url.split('@')[1] if '@' in mysql_url else mysql_url}")

engine = create_engine(mysql_url)

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) as total FROM productos'))
    total = result.scalar()
    print(f'\n✅ Total productos en Railway MySQL: {total}\n')
    
    # Ver primeros 10 productos
    result = conn.execute(text('SELECT codigo, nombre, categoria, marca FROM productos LIMIT 10'))
    print("Primeros 10 productos:")
    for row in result:
        print(f"  - {row.codigo}: {row.nombre} ({row.categoria} - {row.marca})")
