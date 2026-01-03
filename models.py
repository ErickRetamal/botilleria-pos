from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    
    # Precios
    precio_compra = Column(Float, nullable=False, default=0)
    precio_venta = Column(Float, nullable=False, default=0)
    
    # Inventario
    stock = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=5)
    
    # Categoría y atributos
    categoria = Column(String(100), nullable=True, index=True)
    marca = Column(String(100), nullable=True, index=True)
    
    # Sistema de medidas mejorado
    cantidad = Column(Float, nullable=True)  # 500, 1.5, 250, etc.
    unidad_medida = Column(String(20), nullable=True)  # ml, L, g, kg, cc, oz, unidades
    
    # Campo legacy para compatibilidad
    litros = Column(Float, nullable=True)
    
    imagen_url = Column(String(500), nullable=True)
    
    # Estado
    activo = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Producto(codigo={self.codigo}, nombre={self.nombre}, precio_venta={self.precio_venta})>"

class Venta(Base):
    __tablename__ = "ventas"
    
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String(50), nullable=False)  # efectivo, tarjeta, transferencia
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación con items
    items = relationship("VentaItem", back_populates="venta", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Venta(id={self.id}, total={self.total})>"

class VentaItem(Base):
    __tablename__ = "venta_items"
    
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relaciones
    venta = relationship("Venta", back_populates="items")
    producto = relationship("Producto")

class Retiro(Base):
    __tablename__ = "retiros"
    
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)  # Valor total retirado (pérdida)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación con items
    items = relationship("RetiroItem", back_populates="retiro", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Retiro(id={self.id}, total={self.total})>"

class RetiroItem(Base):
    __tablename__ = "retiro_items"
    
    id = Column(Integer, primary_key=True, index=True)
    retiro_id = Column(Integer, ForeignKey("retiros.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)  # Precio de venta (la pérdida)
    subtotal = Column(Float, nullable=False)
    
    # Relaciones
    retiro = relationship("Retiro", back_populates="items")
    producto = relationship("Producto")
    
    def __repr__(self):
        return f"<VentaItem(producto_id={self.producto_id}, cantidad={self.cantidad})>"
