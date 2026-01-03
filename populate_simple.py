from database import engine
from sqlalchemy import text
from models import Producto
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)
session = Session()

# Limpiar productos actuales
print("🗑️ Limpiando productos...")
session.query(Producto).delete()
session.commit()
print("✅ Base de datos limpia")

# Productos base (33)
productos_base = [
    # Cervezas (7)
    {"codigo": "CER001", "nombre": "Cerveza Cristal 330ml", "categoria": "Cervezas", "marca": "Cristal",
     "precio_compra": 700, "precio_venta": 1100, "stock": 48, "cantidad": 330, "unidad_medida": "ml"},
    {"codigo": "CER002", "nombre": "Cerveza Escudo 330ml", "categoria": "Cervezas", "marca": "Escudo",
     "precio_compra": 750, "precio_venta": 1150, "stock": 36, "cantidad": 330, "unidad_medida": "ml"},
    {"codigo": "CER003", "nombre": "Cerveza Becker 330ml", "categoria": "Cervezas", "marca": "Becker",
     "precio_compra": 800, "precio_venta": 1200, "stock": 24, "cantidad": 330, "unidad_medida": "ml"},
    {"codigo": "CER004", "nombre": "Cerveza Heineken 330ml", "categoria": "Cervezas", "marca": "Heineken",
     "precio_compra": 950, "precio_venta": 1450, "stock": 30, "cantidad": 330, "unidad_medida": "ml"},
    {"codigo": "CER005", "nombre": "Cerveza Corona 355ml", "categoria": "Cervezas", "marca": "Corona",
     "precio_compra": 1050, "precio_venta": 1550, "stock": 24, "cantidad": 355, "unidad_medida": "ml"},
    {"codigo": "CER006", "nombre": "Cerveza Stella Artois 330ml", "categoria": "Cervezas", "marca": "Stella Artois",
     "precio_compra": 1000, "precio_venta": 1500, "stock": 18, "cantidad": 330, "unidad_medida": "ml"},
    {"codigo": "CER007", "nombre": "Cerveza Kunstmann 330ml", "categoria": "Cervezas", "marca": "Kunstmann",
     "precio_compra": 1100, "precio_venta": 1650, "stock": 12, "cantidad": 330, "unidad_medida": "ml"},
    
    # Vinos (6)
    {"codigo": "VIN001", "nombre": "Vino Casillero del Diablo Cabernet", "categoria": "Vinos", "marca": "Casillero del Diablo",
     "precio_compra": 4500, "precio_venta": 6990, "stock": 12, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    {"codigo": "VIN002", "nombre": "Vino Gato Negro Cabernet", "categoria": "Vinos", "marca": "Gato Negro",
     "precio_compra": 2800, "precio_venta": 4290, "stock": 18, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    {"codigo": "VIN003", "nombre": "Vino Santa Rita 120 Carmenere", "categoria": "Vinos", "marca": "Santa Rita",
     "precio_compra": 3200, "precio_venta": 4990, "stock": 15, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    {"codigo": "VIN004", "nombre": "Vino Concha y Toro Sauvignon Blanc", "categoria": "Vinos", "marca": "Concha y Toro",
     "precio_compra": 4000, "precio_venta": 6290, "stock": 10, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    {"codigo": "VIN005", "nombre": "Vino Undurraga Carmenere", "categoria": "Vinos", "marca": "Undurraga",
     "precio_compra": 3500, "precio_venta": 5490, "stock": 12, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    {"codigo": "VIN006", "nombre": "Vino Cono Sur Bicicleta Pinot Noir", "categoria": "Vinos", "marca": "Cono Sur",
     "precio_compra": 3800, "precio_venta": 5890, "stock": 8, "cantidad": 750, "unidad_medida": "ml", "litros": 0.75},
    
    # Licores (5)
    {"codigo": "LIC001", "nombre": "Pisco Alto del Carmen 35°", "categoria": "Licores", "marca": "Alto del Carmen",
     "precio_compra": 5500, "precio_venta": 7990, "stock": 12, "litros": 1.0},
    {"codigo": "LIC002", "nombre": "Vodka Absolut", "categoria": "Licores", "marca": "Absolut",
     "precio_compra": 11990, "precio_venta": 15990, "stock": 8, "litros": 1.0},
    {"codigo": "LIC003", "nombre": "Ron Bacardi Blanco", "categoria": "Licores", "marca": "Bacardi",
     "precio_compra": 6990, "precio_venta": 9490, "stock": 10, "litros": 1.0},
    {"codigo": "LIC004", "nombre": "Whisky Johnnie Walker Red Label", "categoria": "Licores", "marca": "Johnnie Walker",
     "precio_compra": 12990, "precio_venta": 16990, "stock": 6, "litros": 1.0},
    {"codigo": "LIC005", "nombre": "Gin Bombay Sapphire", "categoria": "Licores", "marca": "Bombay",
     "precio_compra": 13990, "precio_venta": 18490, "stock": 5, "litros": 1.0},
    
    # Bebidas (7)
    {"codigo": "BEB001", "nombre": "Coca Cola 1.5L", "categoria": "Bebidas", "marca": "Coca Cola",
     "precio_compra": 1300, "precio_venta": 1990, "stock": 48, "cantidad": 1.5, "unidad_medida": "L"},
    {"codigo": "BEB002", "nombre": "Sprite 1.5L", "categoria": "Bebidas", "marca": "Sprite",
     "precio_compra": 1250, "precio_venta": 1890, "stock": 36, "cantidad": 1.5, "unidad_medida": "L"},
    {"codigo": "BEB003", "nombre": "Fanta 1.5L", "categoria": "Bebidas", "marca": "Fanta",
     "precio_compra": 1250, "precio_venta": 1890, "stock": 30, "cantidad": 1.5, "unidad_medida": "L"},
    {"codigo": "BEB004", "nombre": "Agua Mineral Cachantun 1.5L", "categoria": "Bebidas", "marca": "Cachantun",
     "precio_compra": 800, "precio_venta": 1290, "stock": 60, "cantidad": 1.5, "unidad_medida": "L"},
    {"codigo": "BEB005", "nombre": "Jugo Watts Durazno 1.5L", "categoria": "Bebidas", "marca": "Watts",
     "precio_compra": 1100, "precio_venta": 1690, "stock": 24, "cantidad": 1.5, "unidad_medida": "L"},
    {"codigo": "ENE001", "nombre": "Energética Red Bull 250ml", "categoria": "Bebidas", "marca": "Red Bull",
     "precio_compra": 950, "precio_venta": 1490, "stock": 36, "cantidad": 250, "unidad_medida": "ml"},
    {"codigo": "ENE002", "nombre": "Energética Monster 473ml", "categoria": "Bebidas", "marca": "Monster",
     "precio_compra": 1200, "precio_venta": 1790, "stock": 24, "cantidad": 473, "unidad_medida": "ml"},
    
    # Snacks (4)
    {"codigo": "SNK001", "nombre": "Papas Lays Clásicas", "categoria": "Snacks", "marca": "Lays",
     "precio_compra": 950, "precio_venta": 1490, "stock": 48, "cantidad": 180, "unidad_medida": "g"},
    {"codigo": "SNK002", "nombre": "Ramitas 90g", "categoria": "Snacks", "marca": "Carozzi",
     "precio_compra": 600, "precio_venta": 990, "stock": 60, "cantidad": 90, "unidad_medida": "g"},
    {"codigo": "SNK003", "nombre": "Maní Confitado", "categoria": "Snacks", "marca": "Evercrisp",
     "precio_compra": 400, "precio_venta": 690, "stock": 72, "cantidad": 100, "unidad_medida": "g"},
    {"codigo": "SNK004", "nombre": "Chocolate Sahne-Nuss", "categoria": "Snacks", "marca": "Costa",
     "precio_compra": 950, "precio_venta": 1390, "stock": 36, "cantidad": 100, "unidad_medida": "g"},
    
    # Cigarrillos (2)
    {"codigo": "CIG001", "nombre": "Cigarros Kent", "categoria": "Cigarrillos", "marca": "Kent",
     "precio_compra": 4000, "precio_venta": 5990, "stock": 20, "cantidad": 20, "unidad_medida": "unidades"},
    {"codigo": "CIG002", "nombre": "Cigarros Marlboro", "categoria": "Cigarrillos", "marca": "Marlboro",
     "precio_compra": 4300, "precio_venta": 6290, "stock": 15, "cantidad": 20, "unidad_medida": "unidades"},
    
    # Complementos (2)
    {"codigo": "HIE001", "nombre": "Hielo Bolsa 2kg", "categoria": "Complementos", "marca": "Hielo Sur",
     "precio_compra": 800, "precio_venta": 1290, "stock": 30, "cantidad": 2, "unidad_medida": "kg"},
    {"codigo": "COM001", "nombre": "Limones 1kg", "categoria": "Complementos", "marca": "Nacional",
     "precio_compra": 1500, "precio_venta": 2490, "stock": 15, "cantidad": 1, "unidad_medida": "kg"},
]

print(f"📦 Agregando {len(productos_base)} productos...")
for p in productos_base:
    producto = Producto(**p)
    session.add(producto)

session.commit()
print(f"✅ {len(productos_base)} productos agregados")

total = session.query(Producto).count()
print(f"\n🎉 TOTAL: {total} productos")
