// API Base URL
const API_URL = '/api';

// Estado de la aplicación
let editingProductId = null;

// ============== INICIALIZACIÓN ==============
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadProducts();
});

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Toggle panel admin
    document.getElementById('toggleAdmin').addEventListener('click', toggleAdminPanel);

    // Formulario
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelBtn').addEventListener('click', resetForm);
}

// ============== BÚSQUEDA ==============
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('results');

    if (!query) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>✍️ Escribe para buscar un producto</p></div>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/buscar?q=${encodeURIComponent(query)}`);
        const productos = await response.json();

        if (productos.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state"><p>❌ No se encontraron productos</p></div>';
            return;
        }

        resultsDiv.innerHTML = productos.map(producto => `
            <div class="product-card">
                <div class="product-header">
                    <div>
                        <div class="product-name">${producto.nombre}</div>
                        <div class="product-code">Código: ${producto.codigo}</div>
                    </div>
                    <div class="product-price">$${formatPrice(producto.precio_venta)}</div>
                </div>
                <div class="product-details">
                    ${producto.categoria ? `<span>📦 ${producto.categoria}</span>` : ''}
                    <span class="${producto.stock < 5 ? 'stock-low' : ''}">
                        Stock: ${producto.stock} ${producto.stock < 5 ? '⚠️' : ''}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al buscar:', error);
        resultsDiv.innerHTML = '<div class="empty-state"><p>❌ Error al buscar productos</p></div>';
    }
}

// ============== GESTIÓN DE PRODUCTOS ==============
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const btn = document.getElementById('toggleAdmin');
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        btn.textContent = '➖ Ocultar Panel';
        loadProducts();
    } else {
        panel.style.display = 'none';
        btn.textContent = '➕ Gestionar Productos';
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/productos?limit=100`);
        const productos = await response.json();

        const listDiv = document.getElementById('productsList');

        if (productos.length === 0) {
            listDiv.innerHTML = '<div class="empty-state"><p>No hay productos registrados</p></div>';
            return;
        }

        listDiv.innerHTML = productos
            .filter(p => p.activo)
            .map(producto => `
                <div class="product-item">
                    <div class="product-info">
                        <h4>${producto.nombre} (${producto.codigo})</h4>
                        <p>
                            Venta: $${formatPrice(producto.precio_venta)} | 
                            Stock: ${producto.stock} | 
                            ${producto.categoria || 'Sin categoría'}
                        </p>
                    </div>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="editProduct(${producto.id})">✏️ Editar</button>
                        <button class="btn-delete" onclick="deleteProduct(${producto.id})">🗑️ Eliminar</button>
                    </div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const producto = {
        codigo: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value || null,
        precio_compra: parseFloat(document.getElementById('precioCompra').value),
        precio_venta: parseFloat(document.getElementById('precioVenta').value),
        stock: parseInt(document.getElementById('stock').value) || 0,
        stock_minimo: parseInt(document.getElementById('stockMinimo').value) || 5,
        categoria: document.getElementById('categoria').value || null,
        activo: true
    };

    try {
        let response;
        if (editingProductId) {
            // Actualizar
            response = await fetch(`${API_URL}/productos/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        } else {
            // Crear
            response = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        }

        if (response.ok) {
            alert(editingProductId ? '✅ Producto actualizado' : '✅ Producto creado');
            resetForm();
            loadProducts();
        } else {
            const error = await response.json();
            alert('❌ Error: ' + (error.detail || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar el producto');
    }
}

async function editProduct(id) {
    try {
        const response = await fetch(`${API_URL}/productos/${id}`);
        const producto = await response.json();

        editingProductId = id;
        document.getElementById('codigo').value = producto.codigo;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precioCompra').value = producto.precio_compra;
        document.getElementById('precioVenta').value = producto.precio_venta;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('stockMinimo').value = producto.stock_minimo;
        document.getElementById('categoria').value = producto.categoria || '';

        // Scroll al formulario
        document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error al cargar producto:', error);
        alert('❌ Error al cargar el producto');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('✅ Producto eliminado');
            loadProducts();
        } else {
            alert('❌ Error al eliminar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar el producto');
    }
}

function resetForm() {
    editingProductId = null;
    document.getElementById('productForm').reset();
    document.getElementById('codigo').focus();
}

// ============== UTILIDADES ==============
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
