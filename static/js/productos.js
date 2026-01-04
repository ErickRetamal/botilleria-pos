// ============== PRODUCTOS.JS - Gestión de Productos ==============
// Este archivo maneja toda la lógica específica de la página de productos

// ============== INICIALIZACIÓN ==============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📦 Módulo de productos cargado');
    await init();
});

async function init() {
    setupEventListeners();
    await loadProducts();
    await loadProductsTable();
    
    // Verificar si hay un producto para editar en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        await editProduct(editId);
        // Limpiar URL sin recargar
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function setupEventListeners() {
    // Formulario de producto
    const productoForm = document.getElementById('productoForm');
    if (productoForm) {
        productoForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Botones
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', showProductForm);
    }
    
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', hideProductForm);
    }
    
    const cancelForm = document.getElementById('cancelForm');
    if (cancelForm) {
        cancelForm.addEventListener('click', hideProductForm);
    }
    
    // Búsqueda
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProducts, 300));
    }
    
    // Filtros de categoría
    const categoryButtons = document.querySelectorAll('.filter-pill');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.selectedFilter = this.dataset.category;
            filterProducts();
        });
    });
    
    // Cálculo de margen de ganancia en tiempo real
    const precioCompra = document.getElementById('precioCompra');
    const precioVenta = document.getElementById('precioVenta');
    if (precioCompra && precioVenta) {
        precioCompra.addEventListener('input', updateProfitMargin);
        precioVenta.addEventListener('input', updateProfitMargin);
    }
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

// ============== PRODUCTOS - CARGA Y RENDERIZADO ==============
async function loadProducts() {
    try {
        state.productos = await fetchAPI('/productos');
        console.log(`✅ ${state.productos.length} productos cargados`);
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showNotification('Error al cargar productos', 'error');
    }
}

async function loadProductsTable() {
    try {
        const response = await fetch(`${API_URL}/productos?limit=500`);
        const productos = await response.json();
        const productosActivos = productos.filter(p => p.activo);
        state.productos = productosActivos;
        renderProductsTable(productosActivos);
        updateProductStats(productosActivos);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar productos', 'error');
    }
}

function renderProductsTable(productos) {
    const tbody = document.getElementById('productosTable');
    if (!tbody) return;
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td><strong>${p.codigo}</strong></td>
            <td>
                ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" class="product-thumb" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 8px; vertical-align: middle;">` : '📦'}
                <strong>${p.nombre}</strong>
                ${p.descripcion ? `<br><small style="color: var(--text-muted);">${p.descripcion}</small>` : ''}
            </td>
            <td>${p.categoria || '-'}</td>
            <td><strong>${formatCurrency(p.precio_venta)}</strong></td>
            <td>
                <span class="badge ${p.stock < p.stock_minimo ? 'warning' : 'success'}">
                    ${p.stock}
                </span>
            </td>
            <td>
                <span class="badge ${p.stock < p.stock_minimo ? 'warning' : 'success'}">
                    ${p.stock < p.stock_minimo ? '⚠️ Bajo' : '✅ OK'}
                </span>
            </td>
            <td>
                <button class="btn-icon edit" onclick="editProduct(${p.id})" title="Editar">✏️</button>
                <button class="btn-icon delete" onclick="deleteProduct(${p.id})" title="Eliminar">🗑️</button>
                <button class="btn-icon" onclick="showAddStockModal(${p.id})" title="Agregar Stock">📦</button>
            </td>
        </tr>
    `).join('');
}

function updateProductStats(productos) {
    if (!productos) return;
    
    const totalProductos = productos.length;
    const stockBajo = productos.filter(p => p.stock <= p.stock_minimo).length;
    
    const totalEl = document.getElementById('totalProducts');
    const stockEl = document.getElementById('lowStock');
    
    if (totalEl) totalEl.textContent = totalProductos;
    if (stockEl) stockEl.textContent = stockBajo;
}

// ============== FILTRADO ==============
function filterProducts() {
    const searchTerm = document.getElementById('productSearchInput')?.value.toLowerCase() || '';
    const selectedCategory = state.selectedFilter || '';
    
    let filteredProducts = state.productos.filter(producto => {
        const matchesSearch = !searchTerm || 
            producto.nombre.toLowerCase().includes(searchTerm) ||
            producto.codigo.toLowerCase().includes(searchTerm) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
            (producto.marca && producto.marca.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || 
            selectedCategory === '' || 
            producto.categoria === selectedCategory;
        
        return matchesSearch && matchesCategory && producto.activo;
    });
    
    renderProductsTable(filteredProducts);
    updateProductStats(filteredProducts);
}

// ============== FORMULARIO DE PRODUCTOS ==============
function showProductForm() {
    const formTitle = document.getElementById('formTitle');
    const productoForm = document.getElementById('productoForm');
    const codigoInput = document.getElementById('codigo');
    
    if (formTitle) formTitle.textContent = '➕ Nuevo Producto';
    if (productoForm) productoForm.reset();
    if (codigoInput) {
        codigoInput.readOnly = false;
        codigoInput.focus();
    }
    state.editingProductId = null;
    
    // Scroll al formulario si es mobile
    if (window.innerWidth <= 968) {
        const sidebar = document.querySelector('.productos-sidebar');
        if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideProductForm() {
    const productoForm = document.getElementById('productoForm');
    const codigoInput = document.getElementById('codigo');
    if (productoForm) productoForm.reset();
    if (codigoInput) codigoInput.readOnly = false;
    state.editingProductId = null;
    
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) searchInput.focus();
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const getElementValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        return el ? el.value : defaultValue;
    };
    
    const producto = {
        codigo: getElementValue('codigo'),
        nombre: getElementValue('nombre'),
        descripcion: getElementValue('descripcion') || null,
        precio_compra: parseFloat(getElementValue('precioCompra')) || 0,
        precio_venta: parseFloat(getElementValue('precioVenta')) || 0,
        stock: parseInt(getElementValue('stock')) || 0,
        stock_minimo: parseInt(getElementValue('stockMinimo')) || 5,
        categoria: getElementValue('categoria') || null,
        marca: getElementValue('marca') || null,
        cantidad: parseFloat(getElementValue('cantidad')) || null,
        unidad_medida: getElementValue('unidadMedida') || null,
        litros: parseFloat(getElementValue('litros')) || null,
        imagen_url: getElementValue('imagen_url') || null,
        activo: true
    };
    
    // Validación
    const errors = validateProductForm(producto);
    if (errors.length > 0) {
        showNotification(errors.join('\n'), 'error');
        return;
    }
    
    try {
        let response;
        if (state.editingProductId) {
            response = await fetch(`${API_URL}/productos/${state.editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        } else {
            response = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        }
        
        if (response.ok) {
            showNotification(
                state.editingProductId ? 'Producto actualizado' : 'Producto creado',
                'success'
            );
            sound.success();
            hideProductForm();
            await loadProductsTable();
        } else {
            const error = await response.json();
            showNotification(`Error: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar el producto', 'error');
    }
}

async function editProduct(id) {
    try {
        console.log(`📝 Editando producto ${id}...`);
        
        const response = await fetch(`${API_URL}/productos/${id}`);
        if (!response.ok) {
            throw new Error(`Error al cargar producto: ${response.statusText}`);
        }
        
        const producto = await response.json();
        console.log('Producto cargado:', producto);
        
        state.editingProductId = id;
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = '✏️ Editar Producto';
        }
        
        // Llenar campos
        const campos = {
            'codigo': producto.codigo || '',
            'nombre': producto.nombre || '',
            'descripcion': producto.descripcion || '',
            'precioCompra': producto.precio_compra || '',
            'precioVenta': producto.precio_venta || '',
            'stock': producto.stock || '',
            'stockMinimo': producto.stock_minimo || '',
            'categoria': producto.categoria || '',
            'marca': producto.marca || '',
            'litros': producto.litros || '',
            'imagen_url': producto.imagen_url || '',
            'cantidad': producto.cantidad || '',
            'unidadMedida': producto.unidad_medida || ''
        };
        
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = campos[campo];
            }
        });
        
        // Código no editable en modo edición
        const codigoInput = document.getElementById('codigo');
        if (codigoInput) {
            codigoInput.readOnly = true;
        }
        
        // Actualizar margen de ganancia
        updateProfitMargin();
        
        // Scroll al formulario
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('✅ Producto cargado en formulario para edición');
        
    } catch (error) {
        console.error('❌ Error en editProduct:', error);
        showNotification(`Error al cargar el producto: ${error.message}`, 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Producto eliminado', 'success');
            sound.success();
            await loadProductsTable();
        } else {
            showNotification('Error al eliminar el producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar el producto', 'error');
    }
}

// ============== AGREGAR STOCK ==============
async function showAddStockModal(productoId) {
    // Esta función requiere el modal definido en el HTML
    // Por ahora solo mostramos un prompt simple
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto) return;
    
    const cantidad = prompt(`Agregar stock a ${producto.nombre}\nStock actual: ${producto.stock}\n\n¿Cuántas unidades deseas agregar?`);
    if (!cantidad || isNaN(cantidad)) return;
    
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum <= 0) {
        showNotification('La cantidad debe ser mayor a 0', 'warning');
        return;
    }
    
    try {
        const nuevoStock = producto.stock + cantidadNum;
        const response = await fetch(`${API_URL}/productos/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...producto, stock: nuevoStock })
        });
        
        if (response.ok) {
            showNotification(`Stock actualizado: +${cantidadNum} unidades`, 'success');
            sound.success();
            await loadProductsTable();
        } else {
            showNotification('Error al actualizar stock', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar stock', 'error');
    }
}

// ============== CÁLCULO DE MARGEN ==============
function updateProfitMargin() {
    const precioCompra = parseFloat(document.getElementById('precioCompra')?.value) || 0;
    const precioVenta = parseFloat(document.getElementById('precioVenta')?.value) || 0;
    
    const profitMarginEl = document.getElementById('profitMargin');
    if (!profitMarginEl) return;
    
    if (precioVenta && precioCompra) {
        const margin = calculateProfit(precioCompra, precioVenta);
        profitMarginEl.textContent = `${margin}%`;
        
        if (parseFloat(margin) < 0) {
            profitMarginEl.style.color = 'var(--danger)';
        } else if (parseFloat(margin) < 20) {
            profitMarginEl.style.color = 'var(--warning)';
        } else {
            profitMarginEl.style.color = 'var(--success)';
        }
    } else {
        profitMarginEl.textContent = '0%';
        profitMarginEl.style.color = 'var(--text-muted)';
    }
}

// Exportar funciones globales para uso en onclick en HTML
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.showAddStockModal = showAddStockModal;
