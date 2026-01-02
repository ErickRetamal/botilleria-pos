import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('botilleria.db')
cursor = conn.cursor()

# Productos de ejemplo con marca, litros e imagen
productos = [
    ('001', 'Cerveza Cristal Lata 473ml', 'Cerveza nacional', 600, 1000, 48, 12, 'Cervezas', 'Cristal', 0.473, None, 1),
    ('002', 'Cerveza Escudo Lata 473ml', 'Cerveza nacional', 600, 1000, 36, 12, 'Cervezas', 'Escudo', 0.473, None, 1),
    ('003', 'Cerveza Royal Guard Lata 473ml', 'Cerveza premium', 700, 1200, 24, 8, 'Cervezas', 'Royal Guard', 0.473, None, 1),
    ('004', 'Cerveza Heineken Lata 473ml', 'Cerveza importada', 900, 1500, 18, 6, 'Cervezas', 'Heineken', 0.473, None, 1),
    ('005', 'Vino Casillero del Diablo 750ml', 'Vino tinto reserva', 3500, 5500, 12, 4, 'Vinos', 'Casillero del Diablo', 0.75, None, 1),
    ('006', 'Vino Gato Negro 750ml', 'Vino tinto', 2000, 3500, 15, 5, 'Vinos', 'Gato Negro', 0.75, None, 1),
    ('007', 'Pisco Control C 35° 750ml', 'Pisco nacional', 4500, 7000, 8, 3, 'Licores', 'Control C', 0.75, None, 1),
    ('008', 'Pisco Capel 35° 750ml', 'Pisco nacional', 4200, 6500, 10, 3, 'Licores', 'Capel', 0.75, None, 1),
    ('009', 'Ron Bacardi Blanco 750ml', 'Ron importado', 6500, 9500, 6, 2, 'Licores', 'Bacardi', 0.75, None, 1),
    ('010', 'Coca Cola 3L', 'Bebida gaseosa', 1400, 2500, 20, 8, 'Bebidas', 'Coca Cola', 3.0, None, 1),
    ('011', 'Coca Cola 1.5L', 'Bebida gaseosa', 900, 1500, 30, 12, 'Bebidas', 'Coca Cola', 1.5, None, 1),
    ('012', 'Sprite 1.5L', 'Bebida gaseosa', 900, 1500, 25, 10, 'Bebidas', 'Sprite', 1.5, None, 1),
    ('013', 'Papas Lays Clásicas 180g', 'Snack', 1200, 2000, 40, 15, 'Snacks', 'Lays', None, None, 1),
    ('014', 'Maní Salado Bolsa 200g', 'Snack', 800, 1500, 35, 10, 'Snacks', 'Genérico', None, None, 1),
    ('015', 'Hielo Bolsa 3kg', 'Hielo en bolsa', 800, 1500, 15, 10, 'Otros', None, None, None, 1),
]

# Insertar productos
for producto in productos:
    try:
        cursor.execute('''
            INSERT INTO productos 
            (codigo, nombre, descripcion, precio_compra, precio_venta, stock, stock_minimo, categoria, marca, litros, imagen_url, activo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ''', producto)
        print(f"✅ {producto[1]} - ${producto[4]}")
    except sqlite3.IntegrityError:
        print(f"⚠️  {producto[1]} ya existe")

conn.commit()
conn.close()
print("\n✅ ¡Productos agregados exitosamente!")
