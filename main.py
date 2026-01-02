from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import engine, get_db
from config import get_settings
import logging
import sys
import os

# Configurar logging extensivo
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

logger.info("=== INICIANDO APLICACIÓN BOTILLERÍA ===")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"PORT env var: {os.getenv('PORT', 'NOT_SET')}")

# Crear tablas de forma más robusta
try:
    logger.info("Intentando crear tablas de base de datos...")
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created successfully")
    
    # Inicializar datos básicos en producción
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        logger.info("Verificando si existen productos en la BD...")
        # Verificar si hay productos
        producto_count = db.query(models.Producto).count()
        logger.info(f"Productos encontrados: {producto_count}")
        
        if producto_count == 0:
            logger.info("No products found, creating sample data...")
            # Crear algunos productos básicos
            productos_basicos = [
                {"codigo": "PISCO001", "nombre": "Pisco Alto del Carmen 35°", "precio": 6990, "stock": 12, "categoria": "Pisco", "marca": "Alto del Carmen", "litros": 1.0},
                {"codigo": "VODKA001", "nombre": "Vodka Absolut", "precio": 14990, "stock": 8, "categoria": "Vodka", "marca": "Absolut", "litros": 1.0},
                {"codigo": "RON001", "nombre": "Ron Bacardi Blanco", "precio": 8990, "stock": 10, "categoria": "Ron", "marca": "Bacardi", "litros": 1.0}
            ]
            
            for producto_data in productos_basicos:
                producto = models.Producto(**producto_data)
                db.add(producto)
            
            db.commit()
            logger.info("✅ Sample data created successfully")
        else:
            logger.info("✅ Products already exist in database")
    except Exception as init_error:
        logger.error(f"❌ Error initializing data: {init_error}")
        logger.exception("Full stacktrace:")
        db.rollback()
    finally:
        db.close()
        
except Exception as e:
    logger.error(f"❌ Error creating database tables: {e}")
    logger.exception("Full stacktrace:")
    # Continuar con la aplicación incluso si hay problemas con las tablas

# Inicializar FastAPI
logger.info("Inicializando FastAPI...")
settings = get_settings()
app = FastAPI(title=settings.app_name)
logger.info(f"✅ FastAPI initialized with title: {settings.app_name}")

# Montar archivos estáticos
logger.info("Montando archivos estáticos...")
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    logger.info("✅ Static files mounted successfully")
except Exception as static_error:
    logger.error(f"❌ Error mounting static files: {static_error}")
    logger.exception("Full stacktrace:")

logger.info("=== CONFIGURANDO ENDPOINTS ===")

# ============== HEALTH CHECK ==============

@app.get("/test")
def test_endpoint():
    """Endpoint simple para verificar que la app funciona"""
    logger.info("Test endpoint called")
    return {
        "message": "¡Botillería funcionando correctamente!",
        "status": "success",
        "timestamp": "2026-01-02",
        "port": os.getenv("PORT", "NOT_SET")
    }

@app.get("/health")
def health_check():
    """Health check endpoint for Railway"""
    logger.info("Health check endpoint called")
    try:
        # Verificar conexión a la base de datos
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        logger.info("✅ Health check passed - database connected")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        logger.exception("Health check exception:")
        return {"status": "unhealthy", "error": str(e)}

@app.get("/")
def root():
    """Servir la página principal"""
    logger.info("Root endpoint called")
    try:
        return FileResponse("static/index.html")
    except Exception as e:
        logger.error(f"❌ Error serving index.html: {e}")
        logger.exception("Root endpoint exception:")
        raise HTTPException(status_code=500, detail=f"Error serving page: {e}")

logger.info("✅ Main endpoints configured")

# ============== RUTAS DE PRODUCTOS ==============

@app.post("/api/productos", response_model=schemas.ProductoResponse, status_code=201)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo producto"""
    # Verificar si el código ya existe
    db_producto = db.query(models.Producto).filter(models.Producto.codigo == producto.codigo).first()
    if db_producto:
        raise HTTPException(status_code=400, detail="El código de producto ya existe")
    
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@app.get("/api/productos", response_model=List[schemas.ProductoResponse])
def listar_productos(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    categoria: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listar todos los productos"""
    query = db.query(models.Producto)
    
    if activo is not None:
        query = query.filter(models.Producto.activo == activo)
    if categoria:
        query = query.filter(models.Producto.categoria == categoria)
    
    productos = query.offset(skip).limit(limit).all()
    return productos

@app.get("/api/productos/buscar", response_model=List[schemas.ProductoSearch])
def buscar_productos(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    db: Session = Depends(get_db)
):
    """Buscar productos por código o nombre"""
    search_term = f"%{q}%"
    productos = db.query(models.Producto).filter(
        (models.Producto.codigo.like(search_term)) |
        (models.Producto.nombre.like(search_term))
    ).filter(models.Producto.activo == True).limit(20).all()
    
    return productos

@app.get("/api/productos/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    """Obtener un producto por ID"""
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@app.put("/api/productos/{producto_id}", response_model=schemas.ProductoResponse)
def actualizar_producto(
    producto_id: int,
    producto: schemas.ProductoUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un producto"""
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Actualizar solo los campos proporcionados
    update_data = producto.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_producto, key, value)
    
    db.commit()
    db.refresh(db_producto)
    return db_producto

@app.delete("/api/productos/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    """Eliminar un producto (soft delete)"""
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_producto.activo = False
    db.commit()
    return None

# ============== RUTAS DE VENTAS ==============

@app.post("/api/ventas", response_model=schemas.VentaResponse, status_code=201)
def crear_venta(venta: schemas.VentaCreate, db: Session = Depends(get_db)):
    """Crear una nueva venta y actualizar inventario"""
    try:
        # Validar stock y calcular total
        total = 0
        items_data = []
        
        for item in venta.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
            
            if producto.stock < item.cantidad:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
                )
            
            subtotal = item.cantidad * item.precio_unitario
            total += subtotal
            items_data.append({
                "producto": producto,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
                "subtotal": subtotal
            })
        
        # Crear venta
        nueva_venta = models.Venta(
            total=total,
            metodo_pago=venta.metodo_pago
        )
        db.add(nueva_venta)
        db.flush()
        
        # Crear items y actualizar stock
        for item_data in items_data:
            venta_item = models.VentaItem(
                venta_id=nueva_venta.id,
                producto_id=item_data["producto"].id,
                cantidad=item_data["cantidad"],
                precio_unitario=item_data["precio_unitario"],
                subtotal=item_data["subtotal"]
            )
            db.add(venta_item)
            
            # Actualizar stock
            item_data["producto"].stock -= item_data["cantidad"]
        
        db.commit()
        db.refresh(nueva_venta)
        return nueva_venta
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ventas", response_model=List[schemas.VentasList])
def listar_ventas(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Listar ventas"""
    ventas = db.query(models.Venta).order_by(models.Venta.created_at.desc()).offset(skip).limit(limit).all()
    return ventas

@app.get("/api/ventas/{venta_id}", response_model=schemas.VentaResponse)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    """Obtener detalle de una venta"""
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta

@app.get("/api/estadisticas")
def obtener_estadisticas(db: Session = Depends(get_db)):
    """Obtener estadísticas básicas"""
    from sqlalchemy import func, desc
    from datetime import datetime, timedelta
    
    # Ventas del día
    hoy = datetime.now().date()
    ventas_hoy = db.query(func.sum(models.Venta.total)).filter(
        func.date(models.Venta.created_at) == hoy
    ).scalar() or 0
    
    # Total productos
    total_productos = db.query(models.Producto).filter(models.Producto.activo == True).count()
    
    # Productos con stock bajo
    productos_bajo_stock = db.query(models.Producto).filter(
        models.Producto.stock < models.Producto.stock_minimo,
        models.Producto.activo == True
    ).count()
    
    # Última venta
    ultima_venta = db.query(models.Venta).order_by(desc(models.Venta.created_at)).first()
    
    # Retiros del día (pérdidas)
    retiros_hoy = db.query(func.sum(models.Retiro.total)).filter(
        func.date(models.Retiro.created_at) == func.date(func.now())
    ).scalar() or 0
    
    return {
        "ventas_hoy": ventas_hoy,
        "retiros_hoy": retiros_hoy,
        "utilidad_neta": ventas_hoy - retiros_hoy,
        "total_productos": total_productos,
        "productos_bajo_stock": productos_bajo_stock,
        "ultima_venta": ultima_venta.created_at if ultima_venta else None
    }

# ============== RUTAS DE RETIROS ==============

@app.post("/api/retiros", response_model=schemas.RetiroResponse, status_code=201)
def crear_retiro(retiro: schemas.RetiroCreate, db: Session = Depends(get_db)):
    """Registrar retiro/consumo interno"""
    
    # Validar stock y calcular total
    total = 0
    items_data = []
    
    for item in retiro.items:
        producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
        
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para {producto.nombre}. Stock actual: {producto.stock}"
            )
        
        subtotal = producto.precio_venta * item.cantidad
        total += subtotal
        
        items_data.append({
            "producto": producto,
            "cantidad": item.cantidad,
            "precio_unitario": producto.precio_venta,
            "subtotal": subtotal
        })
    
    # Crear retiro
    nuevo_retiro = models.Retiro(total=total)
    db.add(nuevo_retiro)
    db.flush()
    
    # Crear items y actualizar stock
    for item_data in items_data:
        retiro_item = models.RetiroItem(
            retiro_id=nuevo_retiro.id,
            producto_id=item_data["producto"].id,
            cantidad=item_data["cantidad"],
            precio_unitario=item_data["precio_unitario"],
            subtotal=item_data["subtotal"]
        )
        db.add(retiro_item)
        
        # Reducir stock
        item_data["producto"].stock -= item_data["cantidad"]
    
    db.commit()
    db.refresh(nuevo_retiro)
    return nuevo_retiro

@app.get("/api/retiros", response_model=List[schemas.RetirosList])
def listar_retiros(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar retiros/consumos"""
    retiros = db.query(models.Retiro).order_by(desc(models.Retiro.created_at)).offset(skip).limit(limit).all()
    return retiros

@app.get("/api/retiros/{retiro_id}", response_model=schemas.RetiroResponse)
def obtener_retiro(retiro_id: int, db: Session = Depends(get_db)):
    """Obtener detalles de un retiro"""
    retiro = db.query(models.Retiro).filter(models.Retiro.id == retiro_id).first()
    if not retiro:
        raise HTTPException(status_code=404, detail="Retiro no encontrado")
    return retiro

# ============== RUTAS FRONTEND ==============

if __name__ == "__main__":
    logger.info("=== INICIANDO SERVIDOR UVICORN ===")
    import uvicorn
    import os
    # Usar puerto 8000 que es el configurado en Railway
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 Starting server on port {port}")
    logger.info(f"Host: 0.0.0.0")
    logger.info(f"App: main:app")
    logger.info("=== UVICORN START ===")
    
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")
    except Exception as server_error:
        logger.error(f"❌ Server failed to start: {server_error}")
        logger.exception("Server startup exception:")
        raise
