from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProductoBase(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=100)
    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    precio_compra: float = Field(..., ge=0)
    precio_venta: float = Field(..., ge=0)
    stock: int = Field(default=0, ge=0)
    stock_minimo: int = Field(default=5, ge=0)
    categoria: Optional[str] = None
    marca: Optional[str] = None
    litros: Optional[float] = Field(None, ge=0)
    imagen_url: Optional[str] = None
    activo: bool = True

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=100)
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    precio_compra: Optional[float] = Field(None, ge=0)
    precio_venta: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    categoria: Optional[str] = None
    marca: Optional[str] = None
    litros: Optional[float] = Field(None, ge=0)
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductoSearch(BaseModel):
    id: int
    codigo: str
    nombre: str
    precio_venta: float
    stock: int
    categoria: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schemas de Ventas
class VentaItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(..., gt=0)
    precio_unitario: float = Field(..., ge=0)

class VentaItemResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    
    class Config:
        from_attributes = True

class VentaCreate(BaseModel):
    items: List[VentaItemCreate]
    metodo_pago: str = Field(..., pattern="^(efectivo|tarjeta|transferencia)$")

class VentaResponse(BaseModel):
    id: int
    total: float
    metodo_pago: str
    created_at: datetime
    items: List[VentaItemResponse]
    
    class Config:
        from_attributes = True

class VentasList(BaseModel):
    id: int
    total: float
    metodo_pago: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============== RETIROS ==============
class RetiroItemCreate(BaseModel):
    producto_id: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)

class RetiroItemResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    
    class Config:
        from_attributes = True

class RetiroCreate(BaseModel):
    items: List[RetiroItemCreate]

class RetiroResponse(BaseModel):
    id: int
    total: float
    created_at: datetime
    items: List[RetiroItemResponse]
    
    class Config:
        from_attributes = True

class RetirosList(BaseModel):
    id: int
    total: float
    created_at: datetime
    
    class Config:
        from_attributes = True
