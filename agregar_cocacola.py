#!/usr/bin/env python3
"""
Script para agregar catálogo completo de bebidas Coca-Cola
Incluye todos los formatos y tamaños disponibles en Chile
"""
from sqlalchemy.orm import sessionmaker
from database import engine
from models import Producto

def agregar_catalogo_cocacola():
    """Agregar catálogo completo de Coca-Cola"""
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Catálogo completo de Coca-Cola Chile
        productos_cocacola = [
            # COCA COLA ORIGINAL
            {"codigo": "CC001", "nombre": "Coca Cola Lata 350ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 600, "precio_venta": 900, "stock": 120, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "CC002", "nombre": "Coca Cola Vidrio 500ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 700, "precio_venta": 1100, "stock": 60, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "CC003", "nombre": "Coca Cola Botella 500ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 650, "precio_venta": 1000, "stock": 80, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "CC004", "nombre": "Coca Cola 1L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1100, "precio_venta": 1650, "stock": 36, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "CC005", "nombre": "Coca Cola 1.25L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1200, "precio_venta": 1800, "stock": 30, "cantidad": 1.25, "unidad_medida": "L"},
            {"codigo": "CC006", "nombre": "Coca Cola 1.5L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1300, "precio_venta": 1950, "stock": 48, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "CC007", "nombre": "Coca Cola 2L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1600, "precio_venta": 2400, "stock": 24, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "CC008", "nombre": "Coca Cola 2.5L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1900, "precio_venta": 2850, "stock": 18, "cantidad": 2.5, "unidad_medida": "L"},
            {"codigo": "CC009", "nombre": "Coca Cola 3L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 2200, "precio_venta": 3300, "stock": 12, "cantidad": 3, "unidad_medida": "L"},
            
            # COCA COLA ZERO
            {"codigo": "CCZ01", "nombre": "Coca Cola Zero Lata 350ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 620, "precio_venta": 950, "stock": 60, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "CCZ02", "nombre": "Coca Cola Zero 500ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 680, "precio_venta": 1050, "stock": 40, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "CCZ03", "nombre": "Coca Cola Zero 1.5L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1350, "precio_venta": 2000, "stock": 24, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "CCZ04", "nombre": "Coca Cola Zero 2L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1650, "precio_venta": 2500, "stock": 18, "cantidad": 2, "unidad_medida": "L"},
            
            # COCA COLA LIGHT
            {"codigo": "CCL01", "nombre": "Coca Cola Light Lata 350ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 620, "precio_venta": 950, "stock": 48, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "CCL02", "nombre": "Coca Cola Light 500ml", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 680, "precio_venta": 1050, "stock": 30, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "CCL03", "nombre": "Coca Cola Light 1.5L", "categoria": "Bebidas", "marca": "Coca Cola",
             "precio_compra": 1350, "precio_venta": 2000, "stock": 18, "cantidad": 1.5, "unidad_medida": "L"},
            
            # SPRITE
            {"codigo": "SPR01", "nombre": "Sprite Lata 350ml", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 580, "precio_venta": 880, "stock": 96, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "SPR02", "nombre": "Sprite Vidrio 500ml", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 680, "precio_venta": 1050, "stock": 48, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "SPR03", "nombre": "Sprite Botella 500ml", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 630, "precio_venta": 980, "stock": 60, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "SPR04", "nombre": "Sprite 1L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1050, "precio_venta": 1580, "stock": 30, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "SPR05", "nombre": "Sprite 1.25L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1150, "precio_venta": 1720, "stock": 24, "cantidad": 1.25, "unidad_medida": "L"},
            {"codigo": "SPR06", "nombre": "Sprite 1.5L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1250, "precio_venta": 1880, "stock": 36, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "SPR07", "nombre": "Sprite 2L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1550, "precio_venta": 2300, "stock": 20, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "SPR08", "nombre": "Sprite 2.5L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1850, "precio_venta": 2750, "stock": 15, "cantidad": 2.5, "unidad_medida": "L"},
            {"codigo": "SPR09", "nombre": "Sprite 3L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 2150, "precio_venta": 3200, "stock": 12, "cantidad": 3, "unidad_medida": "L"},
            
            # SPRITE ZERO
            {"codigo": "SPZ01", "nombre": "Sprite Zero Lata 350ml", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 600, "precio_venta": 920, "stock": 48, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "SPZ02", "nombre": "Sprite Zero 500ml", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 660, "precio_venta": 1020, "stock": 24, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "SPZ03", "nombre": "Sprite Zero 1.5L", "categoria": "Bebidas", "marca": "Sprite",
             "precio_compra": 1300, "precio_venta": 1950, "stock": 18, "cantidad": 1.5, "unidad_medida": "L"},
            
            # FANTA NARANJA
            {"codigo": "FAN01", "nombre": "Fanta Naranja Lata 350ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 570, "precio_venta": 870, "stock": 84, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "FAN02", "nombre": "Fanta Naranja Vidrio 500ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 670, "precio_venta": 1030, "stock": 42, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "FAN03", "nombre": "Fanta Naranja 500ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 620, "precio_venta": 950, "stock": 54, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "FAN04", "nombre": "Fanta Naranja 1L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1000, "precio_venta": 1500, "stock": 24, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "FAN05", "nombre": "Fanta Naranja 1.25L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1100, "precio_venta": 1650, "stock": 18, "cantidad": 1.25, "unidad_medida": "L"},
            {"codigo": "FAN06", "nombre": "Fanta Naranja 1.5L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1200, "precio_venta": 1800, "stock": 30, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "FAN07", "nombre": "Fanta Naranja 2L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1500, "precio_venta": 2250, "stock": 18, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "FAN08", "nombre": "Fanta Naranja 2.5L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1800, "precio_venta": 2700, "stock": 12, "cantidad": 2.5, "unidad_medida": "L"},
            {"codigo": "FAN09", "nombre": "Fanta Naranja 3L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 2100, "precio_venta": 3150, "stock": 10, "cantidad": 3, "unidad_medida": "L"},
            
            # FANTA LIMÓN
            {"codigo": "FAL01", "nombre": "Fanta Limón Lata 350ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 570, "precio_venta": 870, "stock": 60, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "FAL02", "nombre": "Fanta Limón 500ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 620, "precio_venta": 950, "stock": 36, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "FAL03", "nombre": "Fanta Limón 1.5L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1200, "precio_venta": 1800, "stock": 20, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "FAL04", "nombre": "Fanta Limón 2L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1500, "precio_venta": 2250, "stock": 15, "cantidad": 2, "unidad_medida": "L"},
            
            # FANTA UVA
            {"codigo": "FAU01", "nombre": "Fanta Uva Lata 350ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 580, "precio_venta": 880, "stock": 48, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "FAU02", "nombre": "Fanta Uva 500ml", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 630, "precio_venta": 970, "stock": 30, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "FAU03", "nombre": "Fanta Uva 1.5L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1250, "precio_venta": 1880, "stock": 18, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "FAU04", "nombre": "Fanta Uva 2L", "categoria": "Bebidas", "marca": "Fanta",
             "precio_compra": 1550, "precio_venta": 2300, "stock": 12, "cantidad": 2, "unidad_medida": "L"},
            
            # SCHWEPPES (Productos Coca-Cola)
            {"codigo": "SCH01", "nombre": "Schweppes Pomelo Lata 350ml", "categoria": "Bebidas", "marca": "Schweppes",
             "precio_compra": 650, "precio_venta": 1000, "stock": 36, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "SCH02", "nombre": "Schweppes Pomelo 500ml", "categoria": "Bebidas", "marca": "Schweppes",
             "precio_compra": 750, "precio_venta": 1150, "stock": 24, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "SCH03", "nombre": "Schweppes Tónica Lata 350ml", "categoria": "Bebidas", "marca": "Schweppes",
             "precio_compra": 650, "precio_venta": 1000, "stock": 30, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "SCH04", "nombre": "Schweppes Tónica 500ml", "categoria": "Bebidas", "marca": "Schweppes",
             "precio_compra": 750, "precio_venta": 1150, "stock": 18, "cantidad": 500, "unidad_medida": "ml"},
        ]
        
        productos_creados = 0
        productos_existentes = 0
        
        for prod_data in productos_cocacola:
            # Verificar si el código ya existe
            existing = session.query(Producto).filter_by(codigo=prod_data["codigo"]).first()
            if existing:
                productos_existentes += 1
                continue
                
            producto = Producto(**prod_data)
            session.add(producto)
            productos_creados += 1
            
        session.commit()
        
        print(f"🥤 CATÁLOGO COCA-COLA AGREGADO")
        print("=" * 45)
        print(f"✅ {productos_creados} productos nuevos")
        print(f"⚠️  {productos_existentes} ya existían")
        print(f"\n📊 RESUMEN POR MARCA:")
        
        # Contar productos por marca
        marcas_coca = ['Coca Cola', 'Sprite', 'Fanta', 'Schweppes']
        for marca in marcas_coca:
            count = session.query(Producto).filter_by(marca=marca).count()
            print(f"  🏷️  {marca}: {count} productos")
            
        total_bebidas = session.query(Producto).filter_by(categoria='Bebidas').count()
        print(f"\n🍹 Total bebidas en sistema: {total_bebidas}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("🥤 Agregando catálogo completo Coca-Cola...")
    agregar_catalogo_cocacola()
    print("\n✅ ¡Catálogo Coca-Cola completo!")