# Sistema de Botillería

Sistema web simple para gestión de precios e inventario de botillería.

## Características

- ✅ Búsqueda rápida de productos
- ✅ Consulta de precios en tiempo real
- ✅ Gestión de inventario
- ✅ Control de stock
- ✅ Categorización de productos
- ✅ Interfaz responsive (móvil/tablet/desktop)

## Tecnologías

- **Backend**: Python + FastAPI
- **Base de datos**: MySQL
- **Frontend**: HTML + CSS + JavaScript vanilla

## Instalación Local

### 1. Clonar el repositorio
```bash
cd Botilleria
```

### 2. Crear entorno virtual
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar base de datos
Crear un archivo `.env` basado en `.env.example`:
```env
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/botilleria
```

### 5. Crear base de datos MySQL
```sql
CREATE DATABASE botilleria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Ejecutar el servidor
```bash
python main.py
```

El sistema estará disponible en: `http://localhost:8000`

## Despliegue en Railway

### 1. Conectar repositorio a Railway
- Ve a [railway.app](https://railway.app)
- Crea un nuevo proyecto
- Conecta tu repositorio de GitHub

### 2. Agregar MySQL
- En Railway, agrega un servicio MySQL
- Railway generará automáticamente las variables de entorno

### 3. Configurar variables de entorno
Railway configurará automáticamente:
- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLPORT`
- `MYSQLDATABASE`

### 4. Deploy
Railway desplegará automáticamente la aplicación.

## API Endpoints

### Productos
- `POST /api/productos` - Crear producto
- `GET /api/productos` - Listar productos
- `GET /api/productos/buscar?q={query}` - Buscar productos
- `GET /api/productos/{id}` - Obtener producto
- `PUT /api/productos/{id}` - Actualizar producto
- `DELETE /api/productos/{id}` - Eliminar producto

### Documentación interactiva
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Uso

### Consulta de Precios
1. Abre la aplicación
2. Escribe el código o nombre del producto
3. Los resultados aparecen automáticamente

### Gestión de Productos
1. Click en "Gestionar Productos"
2. Completa el formulario
3. Guarda el producto

## Estructura del Proyecto

```
Botilleria/
├── main.py              # Aplicación FastAPI
├── models.py            # Modelos de base de datos
├── schemas.py           # Schemas Pydantic
├── database.py          # Configuración de DB
├── config.py            # Configuración
├── requirements.txt     # Dependencias
├── static/
│   ├── index.html      # Frontend
│   ├── style.css       # Estilos
│   └── app.js          # JavaScript
└── README.md
```

## Licencia

MIT
