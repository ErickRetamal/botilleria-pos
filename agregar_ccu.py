#!/usr/bin/env python3
"""
Script para agregar catálogo completo de CCU
Compañía de Cervecerías Unidas - Marcas chilenas icónicas
"""
from sqlalchemy.orm import sessionmaker
from database import engine
from models import Producto

def agregar_catalogo_ccu():
    """Agregar catálogo completo de CCU"""
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Catálogo completo CCU Chile
        productos_ccu = [
            # BILZ (LA BEBIDA ROJA CHILENA)
            {"codigo": "BIL001", "nombre": "Bilz Lata 350ml", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 580, "precio_venta": 900, "stock": 96, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "BIL002", "nombre": "Bilz Vidrio 500ml", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 700, "precio_venta": 1100, "stock": 48, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BIL003", "nombre": "Bilz Botella 500ml", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 650, "precio_venta": 1000, "stock": 60, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BIL004", "nombre": "Bilz 1L", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 1080, "precio_venta": 1650, "stock": 30, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "BIL005", "nombre": "Bilz 1.5L", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 1300, "precio_venta": 1950, "stock": 36, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "BIL006", "nombre": "Bilz 2L", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 1600, "precio_venta": 2400, "stock": 24, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "BIL007", "nombre": "Bilz 2.5L", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 1900, "precio_venta": 2850, "stock": 15, "cantidad": 2.5, "unidad_medida": "L"},
            {"codigo": "BIL008", "nombre": "Bilz 3L", "categoria": "Bebidas", "marca": "Bilz",
             "precio_compra": 2200, "precio_venta": 3300, "stock": 12, "cantidad": 3, "unidad_medida": "L"},
            
            # PAP (LA BEBIDA AMARILLA CHILENA)
            {"codigo": "PAP001", "nombre": "Pap Lata 350ml", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 580, "precio_venta": 900, "stock": 84, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "PAP002", "nombre": "Pap Vidrio 500ml", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 700, "precio_venta": 1100, "stock": 42, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "PAP003", "nombre": "Pap Botella 500ml", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 650, "precio_venta": 1000, "stock": 54, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "PAP004", "nombre": "Pap 1L", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 1080, "precio_venta": 1650, "stock": 24, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "PAP005", "nombre": "Pap 1.5L", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 1300, "precio_venta": 1950, "stock": 30, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "PAP006", "nombre": "Pap 2L", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 1600, "precio_venta": 2400, "stock": 18, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "PAP007", "nombre": "Pap 2.5L", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 1900, "precio_venta": 2850, "stock": 12, "cantidad": 2.5, "unidad_medida": "L"},
            {"codigo": "PAP008", "nombre": "Pap 3L", "categoria": "Bebidas", "marca": "Pap",
             "precio_compra": 2200, "precio_venta": 3300, "stock": 10, "cantidad": 3, "unidad_medida": "L"},
            
            # KEM (BEBIDA DE FRUTAS CHILENA)
            {"codigo": "KEM001", "nombre": "Kem Extreme Lata 350ml", "categoria": "Bebidas", "marca": "Kem",
             "precio_compra": 600, "precio_venta": 950, "stock": 72, "cantidad": 350, "unidad_medida": "ml"},
            {"codigo": "KEM002", "nombre": "Kem Extreme 500ml", "categoria": "Bebidas", "marca": "Kem",
             "precio_compra": 720, "precio_venta": 1150, "stock": 36, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "KEM003", "nombre": "Kem Extreme 1.5L", "categoria": "Bebidas", "marca": "Kem",
             "precio_compra": 1350, "precio_venta": 2000, "stock": 18, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "KEM004", "nombre": "Kem Extreme 2L", "categoria": "Bebidas", "marca": "Kem",
             "precio_compra": 1680, "precio_venta": 2500, "stock": 15, "cantidad": 2, "unidad_medida": "L"},
            
            # WATTS (JUGOS Y NÉCTARES)
            {"codigo": "WAT001", "nombre": "Watts Durazno 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 900, "precio_venta": 1400, "stock": 24, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAT002", "nombre": "Watts Naranja 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 900, "precio_venta": 1400, "stock": 30, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAT003", "nombre": "Watts Manzana 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 900, "precio_venta": 1400, "stock": 24, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAT004", "nombre": "Watts Piña 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 950, "precio_venta": 1450, "stock": 18, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAT005", "nombre": "Watts Pera 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 950, "precio_venta": 1450, "stock": 18, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAT006", "nombre": "Watts Multifrutas 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 980, "precio_venta": 1500, "stock": 24, "cantidad": 1, "unidad_medida": "L"},
            
            # WATTS FRESH (LÍNEA PREMIUM)
            {"codigo": "WAF001", "nombre": "Watts Fresh Naranja 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 1200, "precio_venta": 1800, "stock": 18, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAF002", "nombre": "Watts Fresh Manzana 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 1200, "precio_venta": 1800, "stock": 15, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "WAF003", "nombre": "Watts Fresh Uva 1L", "categoria": "Jugos", "marca": "Watts",
             "precio_compra": 1250, "precio_venta": 1850, "stock": 12, "cantidad": 1, "unidad_medida": "L"},
            
            # BENEDICTINO (AGUA MINERAL)
            {"codigo": "BEN001", "nombre": "Agua Benedictino 500ml", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 350, "precio_venta": 600, "stock": 120, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEN002", "nombre": "Agua Benedictino 1L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 580, "precio_venta": 900, "stock": 60, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "BEN003", "nombre": "Agua Benedictino 1.5L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 750, "precio_venta": 1150, "stock": 48, "cantidad": 1.5, "unidad_medida": "L"},
            {"codigo": "BEN004", "nombre": "Agua Benedictino 2L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 950, "precio_venta": 1400, "stock": 36, "cantidad": 2, "unidad_medida": "L"},
            {"codigo": "BEN005", "nombre": "Agua Benedictino 5L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 1800, "precio_venta": 2700, "stock": 12, "cantidad": 5, "unidad_medida": "L"},
            
            # BENEDICTINO CON GAS
            {"codigo": "BEG001", "nombre": "Benedictino con Gas 500ml", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 380, "precio_venta": 650, "stock": 96, "cantidad": 500, "unidad_medida": "ml"},
            {"codigo": "BEG002", "nombre": "Benedictino con Gas 1L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 630, "precio_venta": 980, "stock": 48, "cantidad": 1, "unidad_medida": "L"},
            {"codigo": "BEG003", "nombre": "Benedictino con Gas 1.5L", "categoria": "Bebidas", "marca": "Benedictino",
             "precio_compra": 800, "precio_venta": 1250, "stock": 30, "cantidad": 1.5, "unidad_medida": "L"},
            
            # CERVEZAS CCU ADICIONALES (completar el catálogo)
            {"codigo": "CCU001", "nombre": "Cerveza Cristal Lata 473ml Pack 6", "categoria": "Cervezas", "marca": "Cristal",
             "precio_compra": 4800, "precio_venta": 7200, "stock": 12, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "CCU002", "nombre": "Cerveza Escudo Lata 473ml Pack 6", "categoria": "Cervezas", "marca": "Escudo",
             "precio_compra": 5000, "precio_venta": 7500, "stock": 10, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "CCU003", "nombre": "Cerveza Becker Lata 473ml Pack 6", "categoria": "Cervezas", "marca": "Becker",
             "precio_compra": 5400, "precio_venta": 8100, "stock": 8, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "CCU004", "nombre": "Cerveza Royal Guard Lata 473ml Pack 6", "categoria": "Cervezas", "marca": "Royal Guard",
             "precio_compra": 4500, "precio_venta": 6800, "stock": 15, "cantidad": 473, "unidad_medida": "ml"},
            
            # CERVEZAS BOTELLAS
            {"codigo": "CCU005", "nombre": "Cerveza Cristal Botella 330ml Pack 6", "categoria": "Cervezas", "marca": "Cristal",
             "precio_compra": 4200, "precio_venta": 6300, "stock": 18, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CCU006", "nombre": "Cerveza Escudo Botella 330ml Pack 6", "categoria": "Cervezas", "marca": "Escudo",
             "precio_compra": 4400, "precio_venta": 6600, "stock": 15, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "CCU007", "nombre": "Cerveza Becker Botella 330ml Pack 6", "categoria": "Cervezas", "marca": "Becker",
             "precio_compra": 4800, "precio_venta": 7200, "stock": 12, "cantidad": 330, "unidad_medida": "ml"},
            
            # HEINEKEN (LICENCIA CCU)
            {"codigo": "HEI001", "nombre": "Cerveza Heineken Lata 473ml", "categoria": "Cervezas", "marca": "Heineken",
             "precio_compra": 1100, "precio_venta": 1650, "stock": 48, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "HEI002", "nombre": "Cerveza Heineken Botella 330ml", "categoria": "Cervezas", "marca": "Heineken",
             "precio_compra": 950, "precio_venta": 1450, "stock": 36, "cantidad": 330, "unidad_medida": "ml"},
            {"codigo": "HEI003", "nombre": "Cerveza Heineken Pack 6 Latas 473ml", "categoria": "Cervezas", "marca": "Heineken",
             "precio_compra": 6200, "precio_venta": 9300, "stock": 8, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "HEI004", "nombre": "Cerveza Heineken Pack 6 Botellas 330ml", "categoria": "Cervezas", "marca": "Heineken",
             "precio_compra": 5400, "precio_venta": 8100, "stock": 10, "cantidad": 330, "unidad_medida": "ml"},
            
            # MILLER (LICENCIA CCU)
            {"codigo": "MIL001", "nombre": "Cerveza Miller Lata 473ml", "categoria": "Cervezas", "marca": "Miller",
             "precio_compra": 980, "precio_venta": 1480, "stock": 36, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "MIL002", "nombre": "Cerveza Miller Botella 330ml", "categoria": "Cervezas", "marca": "Miller",
             "precio_compra": 850, "precio_venta": 1300, "stock": 30, "cantidad": 330, "unidad_medida": "ml"},
            
            # BUDWEISER (LICENCIA CCU)
            {"codigo": "BUD001", "nombre": "Cerveza Budweiser Lata 473ml", "categoria": "Cervezas", "marca": "Budweiser",
             "precio_compra": 1050, "precio_venta": 1580, "stock": 42, "cantidad": 473, "unidad_medida": "ml"},
            {"codigo": "BUD002", "nombre": "Cerveza Budweiser Botella 330ml", "categoria": "Cervezas", "marca": "Budweiser",
             "precio_compra": 900, "precio_venta": 1380, "stock": 24, "cantidad": 330, "unidad_medida": "ml"},
        ]
        
        productos_creados = 0
        productos_existentes = 0
        
        for prod_data in productos_ccu:
            # Verificar si el código ya existe
            existing = session.query(Producto).filter_by(codigo=prod_data["codigo"]).first()
            if existing:
                productos_existentes += 1
                continue
                
            producto = Producto(**prod_data)
            session.add(producto)
            productos_creados += 1
            
        session.commit()
        
        print(f"🏭 CATÁLOGO CCU AGREGADO")
        print("=" * 40)
        print(f"✅ {productos_creados} productos nuevos")
        print(f"⚠️  {productos_existentes} ya existían")
        print(f"\n📊 RESUMEN POR MARCA CCU:")
        
        # Contar productos por marca CCU
        marcas_ccu = ['Bilz', 'Pap', 'Kem', 'Watts', 'Benedictino', 'Cristal', 'Escudo', 'Becker', 'Royal Guard', 'Heineken', 'Miller', 'Budweiser']
        for marca in marcas_ccu:
            count = session.query(Producto).filter_by(marca=marca).count()
            if count > 0:
                print(f"  🏷️  {marca}: {count} productos")
                
        # Estadísticas generales
        total_bebidas = session.query(Producto).filter_by(categoria='Bebidas').count()
        total_jugos = session.query(Producto).filter_by(categoria='Jugos').count()
        total_cervezas = session.query(Producto).filter_by(categoria='Cervezas').count()
        total_productos = session.query(Producto).count()
        
        print(f"\n🍹 Total bebidas: {total_bebidas}")
        print(f"🧃 Total jugos: {total_jugos}")
        print(f"🍺 Total cervezas: {total_cervezas}")
        print(f"📦 Total productos sistema: {total_productos}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("🏭 Agregando catálogo completo CCU...")
    agregar_catalogo_ccu()
    print("\n✅ ¡Catálogo CCU completo!")