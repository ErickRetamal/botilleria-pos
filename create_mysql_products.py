#!/usr/bin/env python3
"""
Script para crear productos reales en Railway MySQL
Productos típicos de botillería chilena
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Producto
from config import get_settings

def create_tables_and_products():
    """Crear tablas y poblar con productos en Railway"""
    settings = get_settings()
    
    # Obtener URL de la base de datos
    database_url = settings.get_database_url()
    print(f"🔗 Conectando a Railway MySQL...")
    
    # Crear engine y tablas
    engine = create_engine(database_url)
    
    try:
        # Test connection
        with engine.connect() as conn:
            print("✅ Conexión a Railway MySQL exitosa")
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas en Railway")
        
    except Exception as e:
        print(f"❌ Error de conexión a Railway: {e}")
        raise
    
    # Crear sesión
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    try:
        # Verificar si ya hay productos
        existing_count = session.query(Producto).count()
        if existing_count > 0:
            print(f"⚠️  Ya existen {existing_count} productos. ¿Continuar agregando más? (y/n)")
            if input().lower() != 'y':
                return
        
        # Productos reales de botillería
        productos = [
            # CERVEZAS NACIONALES
            {"codigo": "CER001", "nombre": "Cerveza Cristal 330ml", "categoria": "Cervezas", "marca": "Cristal", 
             "precio_compra": 800, "precio_venta": 1200, "stock": 48, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CER002", "nombre": "Cerveza Escudo 330ml", "categoria": "Cervezas", "marca": "Escudo", 
             "precio_compra": 850, "precio_venta": 1250, "stock": 36, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CER003", "nombre": "Cerveza Becker 330ml", "categoria": "Cervezas", "marca": "Becker", 
             "precio_compra": 900, "precio_venta": 1350, "stock": 24, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CER004", "nombre": "Cerveza Royal Guard 330ml", "categoria": "Cervezas", "marca": "Royal Guard", 
             "precio_compra": 750, "precio_venta": 1100, "stock": 60, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CER005", "nombre": "Cerveza Kunstmann 330ml", "categoria": "Cervezas", "marca": "Kunstmann", 
             "precio_compra": 1200, "precio_venta": 1800, "stock": 18, "cantidad": 330, "unidad_medida": "ml"},
            
            # CERVEZAS LATA 500ML
            {"codigo": "CER006", "nombre": "Cerveza Cristal Lata 500ml", "categoria": "Cervezas", "marca": "Cristal", 
             "precio_compra": 1100, "precio_venta": 1600, "stock": 36, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "CER007", "nombre": "Cerveza Escudo Lata 500ml", "categoria": "Cervezas", "marca": "Escudo", 
             "precio_compra": 1150, "precio_venta": 1700, "stock": 24, "cantidad": 500, "unidad_medida": "ml"},
            
            # VINOS TINTOS
            {"codigo": "VIN001", "nombre": "Vino Santa Rita 120 Cabernet", "categoria": "Vinos", "marca": "Santa Rita", 
             "precio_compra": 3500, "precio_venta": 5200, "stock": 12, "cantidad": 750, "unidad_medida": "ml"},
            {"codigo": "VIN002", "nombre": "Vino Concha y Toro Casillero Merlot", "categoria": "Vinos", "marca": "Concha y Toro", 
             "precio_compra": 4200, "precio_venta": 6300, "stock": 8, "cantidad": 750, "unidad_medida": "ml"},
            {"codigo": "VIN003", "nombre": "Vino Gato Negro Cabernet", "categoria": "Vinos", "marca": "Gato Negro", 
             "precio_compra": 2800, "precio_venta": 4200, "stock": 15, "cantidad": 750, "unidad_medida": "ml"},
            {"codigo": "VIN004", "nombre": "Vino San Pedro 1865 Carmenere", "categoria": "Vinos", "marca": "San Pedro", 
             "precio_compra": 3000, "precio_venta": 4500, "stock": 10, "cantidad": 750, "unidad_medida": "ml"},
            
            # VINOS BLANCOS
            {"codigo": "VIN005", "nombre": "Vino Santa Rita Sauvignon Blanc", "categoria": "Vinos", "marca": "Santa Rita", 
             "precio_compra": 3200, "precio_venta": 4800, "stock": 6, "cantidad": 750, "unidad_medida": "ml"},
            {"codigo": "VIN006", "nombre": "Vino Concha y Toro Chardonnay", "categoria": "Vinos", "marca": "Concha y Toro", 
             "precio_compra": 3800, "precio_venta": 5700, "stock": 8, "cantidad": 750, "unidad_medida": "ml"},
            
            # LICORES Y DESTILADOS
            {"codigo": "LIC001", "nombre": "Pisco Control C 35°", "categoria": "Licores", "marca": "Control C", 
             "precio_compra": 8500, "precio_venta": 12500, "stock": 6, "cantidad": 700, "unidad_medida": "ml"},
            {"codigo": "LIC002", "nombre": "Pisco Capel 35°", "categoria": "Licores", "marca": "Capel", 
             "precio_compra": 7500, "precio_venta": 11000, "stock": 8, "cantidad": 700, "unidad_medida": "ml"},
            {"codigo": "LIC003", "nombre": "Vodka Absolut", "categoria": "Licores", "marca": "Absolut", 
             "precio_compra": 12000, "precio_venta": 18000, "stock": 4, "cantidad": 700, "unidad_medida": "ml"},
            {"codigo": "LIC004", "nombre": "Ron Bacardi Blanco", "categoria": "Licores", "marca": "Bacardi", 
             "precio_compra": 10500, "precio_venta": 15500, "stock": 5, "cantidad": 700, "unidad_medida": "ml"},
            {"codigo": "LIC005", "nombre": "Whisky Johnnie Walker Red", "categoria": "Licores", "marca": "Johnnie Walker", 
             "precio_compra": 15000, "precio_venta": 22000, "stock": 3, "cantidad": 700, "unidad_medida": "ml"},
            
            # BEBIDAS NO ALCOHÓLICAS
            {"codigo": "BEB001", "nombre": "Coca Cola 500ml", "categoria": "Bebidas", "marca": "Coca Cola", 
             "precio_compra": 600, "precio_venta": 900, "stock": 48, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEB002", "nombre": "Pepsi 500ml", "categoria": "Bebidas", "marca": "Pepsi", 
             "precio_compra": 550, "precio_venta": 850, "stock": 36, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEB003", "nombre": "Sprite 500ml", "categoria": "Bebidas", "marca": "Sprite", 
             "precio_compra": 580, "precio_venta": 880, "stock": 24, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEB004", "nombre": "Fanta 500ml", "categoria": "Bebidas", "marca": "Fanta", 
             "precio_compra": 570, "precio_venta": 870, "stock": 30, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEB005", "nombre": "Agua Mineral Cachantun 500ml", "categoria": "Bebidas", "marca": "Cachantun", 
             "precio_compra": 400, "precio_venta": 700, "stock": 60, "cantidad": 500, "unidad_medida": "ml"},
            
            # ENERGÉTICAS
            {"codigo": "ENE001", "nombre": "Red Bull 250ml", "categoria": "Bebidas", "marca": "Red Bull", 
             "precio_compra": 1200, "precio_venta": 1800, "stock": 24, "cantidad": 250, "unidad_medida": "ml"},
            {"codigo": "ENE002", "nombre": "Monster Energy 473ml", "categoria": "Bebidas", "marca": "Monster", 
             "precio_compra": 1500, "precio_venta": 2200, "stock": 18, "cantidad": 473, "unidad_medida": "ml"},
            
            # SNACKS Y BOTANAS
            {"codigo": "SNK001", "nombre": "Papas Lays Clásicas", "categoria": "Snacks", "marca": "Lays", 
             "precio_compra": 800, "precio_venta": 1200, "stock": 36, "cantidad": 140, "unidad_medida": "g"},
            {"codigo": "SNK002", "nombre": "Doritos Nacho Cheese", "categoria": "Snacks", "marca": "Doritos", 
             "precio_compra": 900, "precio_venta": 1350, "stock": 24, "cantidad": 150, "unidad_medida": "g"},
            {"codigo": "SNK003", "nombre": "Cheetos Horneados", "categoria": "Snacks", "marca": "Cheetos", 
             "precio_compra": 750, "precio_venta": 1150, "stock": 30, "cantidad": 130, "unidad_medida": "g"},
            {"codigo": "SNK004", "nombre": "Maní Confitado Evercrisp", "categoria": "Snacks", "marca": "Evercrisp", 
             "precio_compra": 600, "precio_venta": 1000, "stock": 48, "cantidad": 100, "unidad_medida": "g"},
            
            # CIGARRILLOS (Productos controlados)
            {"codigo": "CIG001", "nombre": "Marlboro Box", "categoria": "Cigarrillos", "marca": "Marlboro", 
             "precio_compra": 4500, "precio_venta": 6500, "stock": 10, "cantidad": 20, "unidad_medida": "unidades"},
            {"codigo": "CIG002", "nombre": "Lucky Strike", "categoria": "Cigarrillos", "marca": "Lucky Strike", 
             "precio_compra": 4200, "precio_venta": 6200, "stock": 8, "cantidad": 20, "unidad_medida": "unidades"},
            
            # HIELO Y COMPLEMENTOS
            {"codigo": "HIE001", "nombre": "Hielo en Cubos 2kg", "categoria": "Complementos", "marca": "Polar", 
             "precio_compra": 800, "precio_venta": 1300, "stock": 15, "cantidad": 2, "unidad_medida": "kg"},
            {"codigo": "COM001", "nombre": "Limones kg", "categoria": "Complementos", "marca": "Local", 
             "precio_compra": 1500, "precio_venta": 2200, "stock": 5, "cantidad": 1, "unidad_medida": "kg"},
        ]
        
        # Insertar productos
        productos_creados = 0
        for prod_data in productos:
            # Verificar si el código ya existe
            existing = session.query(Producto).filter_by(codigo=prod_data["codigo"]).first()
            if existing:
                print(f"⚠️  Producto {prod_data['codigo']} ya existe, omitiendo...")
                continue
                
            producto = Producto(**prod_data)
            session.add(producto)
            productos_creados += 1
            
        session.commit()
        print(f"✅ {productos_creados} productos creados exitosamente")
        
        # Mostrar estadísticas
        total_productos = session.query(Producto).count()
        categorias = session.query(Producto.categoria).distinct().all()
        
        print(f"\n📊 ESTADÍSTICAS:")
        print(f"  Total productos: {total_productos}")
        print(f"  Categorías: {len(categorias)}")
        for cat in categorias:
            if cat[0]:  # Solo si no es None
                count = session.query(Producto).filter_by(categoria=cat[0]).count()
                print(f"    - {cat[0]}: {count} productos")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("🍺 Configurando Botillería en Railway MySQL...")
    print("=" * 55)
    
    try:
        # Crear tablas y productos directamente (Railway ya tiene la BD)
        create_tables_and_products()
        
        print("\n✅ ¡Sistema Railway MySQL configurado correctamente!")
        print("🎯 Ya puedes usar la aplicación con productos reales en la nube")
        
    except Exception as e:
        print(f"\n❌ Error durante la configuración: {e}")
        print("💡 Verifica las credenciales de Railway en el archivo .env")