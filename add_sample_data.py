import requests
import time

# Productos de ejemplo para una botillería chilena
productos = [
    {
        "codigo": "001",
        "nombre": "Cerveza Cristal Lata 473ml",
        "descripcion": "Cerveza nacional",
        "precio_compra": 600,
        "precio_venta": 1000,
        "stock": 48,
        "stock_minimo": 12,
        "categoria": "Cervezas",
        "activo": True
    },
    {
        "codigo": "002",
        "nombre": "Cerveza Escudo Lata 473ml",
        "descripcion": "Cerveza nacional",
        "precio_compra": 600,
        "precio_venta": 1000,
        "stock": 36,
        "stock_minimo": 12,
        "categoria": "Cervezas",
        "activo": True
    },
    {
        "codigo": "003",
        "nombre": "Cerveza Royal Guard Lata 473ml",
        "descripcion": "Cerveza premium",
        "precio_compra": 700,
        "precio_venta": 1200,
        "stock": 24,
        "stock_minimo": 8,
        "categoria": "Cervezas",
        "activo": True
    },
    {
        "codigo": "004",
        "nombre": "Cerveza Heineken Lata 473ml",
        "descripcion": "Cerveza importada",
        "precio_compra": 900,
        "precio_venta": 1500,
        "stock": 18,
        "stock_minimo": 6,
        "categoria": "Cervezas",
        "activo": True
    },
    {
        "codigo": "005",
        "nombre": "Vino Casillero del Diablo 750ml",
        "descripcion": "Vino tinto reserva",
        "precio_compra": 3500,
        "precio_venta": 5500,
        "stock": 12,
        "stock_minimo": 4,
        "categoria": "Vinos",
        "activo": True
    },
    {
        "codigo": "006",
        "nombre": "Vino Gato Negro 750ml",
        "descripcion": "Vino tinto",
        "precio_compra": 2000,
        "precio_venta": 3500,
        "stock": 15,
        "stock_minimo": 5,
        "categoria": "Vinos",
        "activo": True
    },
    {
        "codigo": "007",
        "nombre": "Pisco Control C 35° 750ml",
        "descripcion": "Pisco nacional",
        "precio_compra": 4500,
        "precio_venta": 7000,
        "stock": 8,
        "stock_minimo": 3,
        "categoria": "Licores",
        "activo": True
    },
    {
        "codigo": "008",
        "nombre": "Pisco Capel 35° 750ml",
        "descripcion": "Pisco nacional",
        "precio_compra": 4200,
        "precio_venta": 6500,
        "stock": 10,
        "stock_minimo": 3,
        "categoria": "Licores",
        "activo": True
    },
    {
        "codigo": "009",
        "nombre": "Ron Bacardi Blanco 750ml",
        "descripcion": "Ron importado",
        "precio_compra": 6500,
        "precio_venta": 9500,
        "stock": 6,
        "stock_minimo": 2,
        "categoria": "Licores",
        "activo": True
    },
    {
        "codigo": "010",
        "nombre": "Coca Cola 3L",
        "descripcion": "Bebida gaseosa",
        "precio_compra": 1400,
        "precio_venta": 2500,
        "stock": 20,
        "stock_minimo": 8,
        "categoria": "Bebidas",
        "activo": True
    },
    {
        "codigo": "011",
        "nombre": "Coca Cola 1.5L",
        "descripcion": "Bebida gaseosa",
        "precio_compra": 900,
        "precio_venta": 1500,
        "stock": 30,
        "stock_minimo": 12,
        "categoria": "Bebidas",
        "activo": True
    },
    {
        "codigo": "012",
        "nombre": "Sprite 1.5L",
        "descripcion": "Bebida gaseosa",
        "precio_compra": 900,
        "precio_venta": 1500,
        "stock": 25,
        "stock_minimo": 10,
        "categoria": "Bebidas",
        "activo": True
    },
    {
        "codigo": "013",
        "nombre": "Papas Lays Clásicas 180g",
        "descripcion": "Snack",
        "precio_compra": 1200,
        "precio_venta": 2000,
        "stock": 40,
        "stock_minimo": 15,
        "categoria": "Snacks",
        "activo": True
    },
    {
        "codigo": "014",
        "nombre": "Maní Salado Bolsa 200g",
        "descripcion": "Snack",
        "precio_compra": 800,
        "precio_venta": 1500,
        "stock": 35,
        "stock_minimo": 10,
        "categoria": "Snacks",
        "activo": True
    },
    {
        "codigo": "015",
        "nombre": "Hielo Bolsa 3kg",
        "descripcion": "Hielo en bolsa",
        "precio_compra": 800,
        "precio_venta": 1500,
        "stock": 15,
        "stock_minimo": 10,
        "categoria": "Otros",
        "activo": True
    }
]

def agregar_productos():
    url = "http://localhost:8000/api/productos"
    
    print("🚀 Agregando productos de ejemplo...\n")
    
    for producto in productos:
        try:
            response = requests.post(url, json=producto)
            if response.status_code == 201:
                print(f"✅ {producto['nombre']} - ${producto['precio_venta']}")
            else:
                print(f"❌ Error al agregar {producto['nombre']}: {response.json()}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        time.sleep(0.1)  # Pequeña pausa entre requests
    
    print("\n✅ ¡Productos agregados exitosamente!")

if __name__ == "__main__":
    agregar_productos()
