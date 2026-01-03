#!/usr/bin/env python3
"""
Script de migración para agregar campos de cantidad y unidad_medida
"""

import os
import sys
import sqlite3
from sqlalchemy import create_engine, text
from database import engine

def migrate_database():
    """Migrar la base de datos para agregar los nuevos campos"""
    print("🔄 Iniciando migración de base de datos...")
    
    try:
        # Verificar si las columnas ya existen
        with engine.connect() as connection:
            result = connection.execute(text("PRAGMA table_info(productos)"))
            columns = [row[1] for row in result.fetchall()]
            
            print(f"📋 Columnas actuales: {columns}")
            
            # Agregar columna 'cantidad' si no existe
            if 'cantidad' not in columns:
                print("➕ Agregando columna 'cantidad'...")
                connection.execute(text("ALTER TABLE productos ADD COLUMN cantidad REAL"))
                print("✅ Columna 'cantidad' agregada")
            else:
                print("✓ Columna 'cantidad' ya existe")
            
            # Agregar columna 'unidad_medida' si no existe
            if 'unidad_medida' not in columns:
                print("➕ Agregando columna 'unidad_medida'...")
                connection.execute(text("ALTER TABLE productos ADD COLUMN unidad_medida TEXT"))
                print("✅ Columna 'unidad_medida' agregada")
            else:
                print("✓ Columna 'unidad_medida' ya existe")
            
            connection.commit()
        
        # Migrar datos existentes de litros a cantidad/unidad_medida
        print("🔄 Migrando datos existentes...")
        migrate_existing_data()
        
        print("🎉 Migración completada exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        return False

def migrate_existing_data():
    """Migrar productos existentes con litros a cantidad/unidad_medida"""
    with engine.connect() as connection:
        # Obtener productos con litros pero sin unidad_medida
        result = connection.execute(text("""
            SELECT id, litros FROM productos 
            WHERE litros IS NOT NULL 
            AND litros > 0 
            AND (unidad_medida IS NULL OR unidad_medida = '')
        """))
        
        productos_a_migrar = result.fetchall()
        
        if not productos_a_migrar:
            print("✓ No hay productos para migrar")
            return
        
        print(f"🔄 Migrando {len(productos_a_migrar)} productos...")
        
        for producto in productos_a_migrar:
            id_producto, litros = producto
            
            # Convertir litros a cantidad y unidad apropiada
            if litros >= 1:
                cantidad = litros
                unidad = 'L'
            else:
                # Convertir a mililitros
                cantidad = int(litros * 1000)
                unidad = 'ml'
            
            # Actualizar producto
            connection.execute(text("""
                UPDATE productos 
                SET cantidad = :cantidad, unidad_medida = :unidad
                WHERE id = :id
            """), {"cantidad": cantidad, "unidad": unidad, "id": id_producto})
            
            print(f"  ✓ Producto ID {id_producto}: {litros}L → {cantidad}{unidad}")
        
        connection.commit()
        print(f"✅ {len(productos_a_migrar)} productos migrados")

def verificar_migracion():
    """Verificar que la migración fue exitosa"""
    print("\n🔍 Verificando migración...")
    
    with engine.connect() as connection:
        # Contar productos con nuevos campos
        result = connection.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(cantidad) as con_cantidad,
                COUNT(unidad_medida) as con_unidad
            FROM productos
        """))
        
        stats = result.fetchone()
        print(f"📊 Estadísticas:")
        print(f"   Total productos: {stats[0]}")
        print(f"   Con cantidad: {stats[1]}")
        print(f"   Con unidad: {stats[2]}")
        
        # Mostrar algunos ejemplos
        result = connection.execute(text("""
            SELECT codigo, nombre, cantidad, unidad_medida, litros
            FROM productos 
            WHERE cantidad IS NOT NULL OR unidad_medida IS NOT NULL
            LIMIT 5
        """))
        
        ejemplos = result.fetchall()
        if ejemplos:
            print(f"\n📋 Ejemplos migrados:")
            for ej in ejemplos:
                codigo, nombre, cantidad, unidad, litros = ej
                print(f"   {codigo}: {nombre} - {cantidad}{unidad} (legacy: {litros}L)")

if __name__ == "__main__":
    print("🚀 Script de Migración - Sistema de Unidades")
    print("=" * 50)
    
    if migrate_database():
        verificar_migracion()
        print("\n🎉 ¡Migración completada! Ya puedes usar el nuevo sistema de unidades.")
        print("💡 Los productos existentes mantienen sus litros como referencia.")
    else:
        print("\n❌ Migración falló. Revisa los errores arriba.")
        sys.exit(1)