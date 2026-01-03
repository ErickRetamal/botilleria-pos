// ============== ESTADO GLOBAL ==============
const state = {
    productos: [],
    cart: [],
    retiroCart: [],
    selectedCategory: '',
    selectedUnidad: '',
    selectedMarca: '',
    selectedPaymentMethod: 'efectivo',
    editingProductId: null,
    selectedProduct: null,
    currentView: 'pos'
};

const API_URL = '/api';

// ============== INICIALIZACIÓN ==============
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadInitialData();
    setupKeyboardShortcuts();
});

function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // POS - Búsqueda y filtros (solo si existe el elemento)
    const posSearchInput = document.getElementById('posSearchInput');
    if (posSearchInput) {
        posSearchInput.addEventListener('input', debounce(filterPOSProducts, 300));
    }
    
    // Event delegation para los pills de categoría
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('pill') && e.target.dataset.categoria !== undefined) {
            filterByCategory(e.target.dataset.categoria);
        }
    });
    
    const unidadFilter = document.getElementById('unidadFilter');
    const marcaFilter = document.getElementById('marcaFilter');
    
    if (unidadFilter) {
        unidadFilter.addEventListener('change', (e) => {
            console.log('Filtro de unidad cambiado a:', e.target.value);
            state.selectedUnidad = e.target.value;
            renderPOSProducts();
        });
    }
    
    if (marcaFilter) {
        marcaFilter.addEventListener('change', (e) => {
            console.log('Filtro de marca cambiado a:', e.target.value);
            state.selectedMarca = e.target.value;
            renderPOSProducts();
        });
    }

    // Carrito
    const clearCartBtn = document.getElementById('clearCart');
    const processPaymentBtn = document.getElementById('processPayment');
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (processPaymentBtn) processPaymentBtn.addEventListener('click', processPayment);
    
    // Retiros
    const retiroSearchInput = document.getElementById('retiroSearchInput');
    const clearRetiroCartBtn = document.getElementById('clearRetiroCart');
    const processRetiroBtn = document.getElementById('processRetiro');
    if (retiroSearchInput) retiroSearchInput.addEventListener('input', debounce(filterRetiroProducts, 300));
    if (clearRetiroCartBtn) clearRetiroCartBtn.addEventListener('click', clearRetiroCart);
    if (processRetiroBtn) processRetiroBtn.addEventListener('click', processRetiro);
    
    // Métodos de pago
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.metodo));
    });

    // Productos - Escaneo rápido (solo en vista productos)
    const quickScanBtn = document.getElementById('quickScanBtn');
    if (quickScanBtn) quickScanBtn.addEventListener('click', handleQuickScan);

    // Productos - Formulario
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    const productoForm = document.getElementById('productoForm');
    const cancelForm = document.getElementById('cancelForm');
    if (btnNuevoProducto) btnNuevoProducto.addEventListener('click', showProductForm);
    if (productoForm) productoForm.addEventListener('submit', handleProductSubmit);
    if (cancelForm) cancelForm.addEventListener('click', hideProductForm);
    
    // Nuevos elementos del diseño mejorado
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', hideProductForm);
    }
    
    // Búsqueda mejorada de productos
    const productSearch = document.getElementById('productSearchInput');
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            // Implementar búsqueda en tiempo real si es necesario
            console.log('Buscando:', e.target.value);
        });
        // Agregar funcionalidad de Enter para escaneo rápido
        productSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickScan();
            }
        });
    }
    
    // Filtros de categoría
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-pill')) {
            // Actualizar filtros activos
            document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            console.log('Filtrar por categoría:', category);
            // Aquí puedes implementar la lógica de filtrado
        }
    });
    
    // Botón de exportar
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Funcionalidad de exportación próximamente');
        });
    }

    // Stock form
    const addStockForm = document.getElementById('addStockForm');
    const stockQuantity = document.getElementById('stockQuantity');
    if (addStockForm) addStockForm.addEventListener('submit', handleAddStock);
    if (stockQuantity) stockQuantity.addEventListener('input', updateFinalStock);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F2 - Focus en búsqueda (solo si existe el elemento)
        if (e.key === 'F2') {
            e.preventDefault();
            const searchInput = document.getElementById('posSearchInput');
            if (searchInput) searchInput.focus();
        }
        // ESC - Limpiar búsqueda o cerrar modales
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('posSearchInput');
            if (searchInput) {
                searchInput.value = '';
                filterProducts();
            }
            closeStockModal();
            hideProductForm();
        }
    });
}

async function loadInitialData() {
    try {
        console.log('🚀 Cargando datos iniciales...');
        await Promise.all([
            loadProducts(),
            loadEstadisticas()
        ]);
        console.log('📦 Productos cargados:', state.productos.length);
        
        populateMarcasFilter();
        populateUnidadesFilter();
        
        // Solo renderizar productos POS si estamos en la página POS
        const posGrid = document.getElementById('posProductsGrid');
        if (posGrid) {
            renderPOSProducts();
        }
        
        console.log('✅ Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
    }
}

// ============== API CALLS ==============
async function loadProducts() {
    try {
        console.log('📦 Cargando productos...');
        const response = await fetch(`${API_URL}/productos?limit=500`);
        const data = await response.json();
        
        if (response.ok) {
            // El API devuelve diferentes formatos dependiendo del endpoint
            state.productos = data.productos || data || [];
            console.log('✅ Productos cargados:', state.productos.length);
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        state.productos = [];
        alert('❌ Error al cargar productos');
    }
}

async function loadEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/estadisticas`);
        const stats = await response.json();
        
        // Solo actualizar elementos que existen en la página actual
        const ventasHoyEl = document.getElementById('ventasHoy');
        const retirosHoyEl = document.getElementById('retirosHoy');
        const utilidadNetaEl = document.getElementById('utilidadNeta');
        
        if (ventasHoyEl) ventasHoyEl.textContent = `$${formatPrice(stats.ventas_hoy)}`;
        if (retirosHoyEl) retirosHoyEl.textContent = `$${formatPrice(stats.retiros_hoy)}`;
        if (utilidadNetaEl) utilidadNetaEl.textContent = `$${formatPrice(stats.utilidad_neta)}`;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadVentas() {
    try {
        const response = await fetch(`${API_URL}/ventas?limit=100`);
        const ventas = await response.json();
        renderVentasTable(ventas);
    } catch (error) {
        console.error('Error cargando ventas:', error);
    }
}

async function loadRetiros() {
    try {
        const response = await fetch(`${API_URL}/retiros?limit=100`);
        const retiros = await response.json();
        renderRetirosTable(retiros);
    } catch (error) {
        console.error('Error cargando retiros:', error);
    }
}

// ============== NAVEGACIÓN ==============
function switchView(viewName) {
    state.currentView = viewName;
    
    // Actualizar botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Actualizar vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });
    
    // Cargar datos específicos
    if (viewName === 'productos') {
        loadProductsTable();
        setTimeout(() => {
            const searchInput = document.getElementById('productSearchInput');
            if (searchInput) searchInput.focus();
        }, 100);
    } else if (viewName === 'ventas') {
        loadVentas();
    } else if (viewName === 'retiros') {
        renderRetiroProducts();
        loadRetiros();
        setTimeout(() => {
            const retiroInput = document.getElementById('retiroSearchInput');
            if (retiroInput) retiroInput.focus();
        }, 100);
    }
}

// ============== POS - PRODUCTOS ==============
function filterPOSProducts() {
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        renderPOSProducts(searchTerm);
    }
}

// Función legacy para compatibilidad
function filterProducts() {
    filterPOSProducts();
}

function filterByCategory(categoria) {
    state.selectedCategory = categoria;
    
    // Actualizar pills
    document.querySelectorAll('.pill[data-categoria]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoria === categoria);
    });
    
    renderPOSProducts();
}

function renderPOSProducts(searchTerm = '') {
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return; // Exit if element doesn't exist
    
    let filtered = state.productos.filter(p => p.activo);
    
    // Filtrar por categoría
    if (state.selectedCategory) {
        filtered = filtered.filter(p => p.categoria === state.selectedCategory);
    }
    
    // Filtrar por unidad de medida
    if (state.selectedUnidad) {
        filtered = filtered.filter(p => p.unidad_medida === state.selectedUnidad);
    }
    
    // Filtrar por marca
    if (state.selectedMarca) {
        filtered = filtered.filter(p => p.marca === state.selectedMarca);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm) ||
            p.codigo.toLowerCase().includes(searchTerm) ||
            (p.marca && p.marca.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No se encontraron productos</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(producto => {
        const outOfStock = producto.stock === 0;
        const lowStock = producto.stock > 0 && producto.stock < producto.stock_minimo;
        
        // Determinar emoji por categoría si no hay imagen
        let emoji = '📦';
        if (producto.categoria === 'Cervezas') emoji = '🍺';
        else if (producto.categoria === 'Vinos') emoji = '🍷';
        else if (producto.categoria === 'Licores') emoji = '🥃';
        else if (producto.categoria === 'Bebidas') emoji = '🥤';
        else if (producto.categoria === 'Snacks') emoji = '🍿';
        
        const imagenHtml = producto.imagen_url 
            ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" onerror="this.parentElement.innerHTML='${emoji}'">`
            : emoji;
        
        const metaInfo = [];
        if (producto.marca) metaInfo.push(`<span class="product-badge">🏭 ${producto.marca}</span>`);
        
        // Mostrar cantidad y unidad de medida si existen, sino mostrar litros legacy
        if (producto.cantidad && producto.unidad_medida) {
            const unidadIcon = getUnidadIcon(producto.unidad_medida);
            metaInfo.push(`<span class="product-badge">${unidadIcon} ${producto.cantidad}${producto.unidad_medida}</span>`);
        } else if (producto.litros) {
            metaInfo.push(`<span class="product-badge">💧 ${producto.litros}L</span>`);
        }
        
        return `
            <div class="product-card-pos ${outOfStock ? 'out-of-stock' : ''}" 
                 onclick="${outOfStock ? '' : `addToCart(${producto.id})`}">
                <div class="product-image">${imagenHtml}</div>
                <div class="product-info">
                    <div class="product-name">${producto.nombre}</div>
                    ${metaInfo.length > 0 ? `<div class="product-meta">${metaInfo.join('')}</div>` : ''}
                    <div class="product-price">$${formatPrice(producto.precio_venta)}</div>
                    <div class="product-stock ${lowStock ? 'low' : ''}">
                        ${outOfStock ? '❌ Sin stock' : `Stock: ${producto.stock}`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function populateMarcasFilter() {
    try {
        console.log('Poblando filtro de marcas...');
        const marcas = [...new Set(state.productos
            .filter(p => p.marca && p.marca.trim() !== '')
            .map(p => p.marca)
        )].sort();
        
        console.log('Marcas encontradas:', marcas);
        
        const select = document.getElementById('marcaFilter');
        if (!select) {
            return; // Silently return if element doesn't exist
        }
        
        select.innerHTML = '<option value="">🏭 Marca</option>' +
            marcas.map(marca => `<option value="${marca}">${marca}</option>`).join('');
            
        console.log('✅ Filtro de marcas poblado con', marcas.length, 'opciones');
    } catch (error) {
        console.error('❌ Error en populateMarcasFilter:', error);
    }
}

function populateUnidadesFilter() {
    try {
        console.log('Poblando filtro de unidades...');
        const unidades = [...new Set(state.productos
            .filter(p => p.unidad_medida)
            .map(p => p.unidad_medida)
        )].sort();
        
        console.log('Unidades encontradas:', unidades);
        
        const select = document.getElementById('unidadFilter');
        if (!select) {
            return; // Silently return if element doesn't exist
        }
        
        select.innerHTML = '<option value="">⚖️ Unidad</option>' +
            unidades.map(unidad => {
                const icon = getUnidadIcon(unidad);
                return `<option value="${unidad}">${icon} ${unidad}</option>`;
            }).join('');
            
        console.log('✅ Filtro de unidades poblado con', unidades.length, 'opciones');
    } catch (error) {
        console.error('❌ Error en populateUnidadesFilter:', error);
    }
}

function getUnidadIcon(unidad) {
    const icons = {
        'ml': '💧', 'L': '💧', 'cc': '💧',
        'g': '⚖️', 'kg': '⚖️', 'oz': '⚖️',
        'unidades': '🔢', 'paquetes': '📦'
    };
    return icons[unidad] || '📏';
}

// ============== CARRITO ==============
function addToCart(productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) return;
    
    const existingItem = state.cart.find(item => item.id === productoId);
    
    if (existingItem) {
        if (existingItem.cantidad < producto.stock) {
            existingItem.cantidad++;
        } else {
            alert('⚠️ No hay más stock disponible');
            return;
        }
    } else {
        state.cart.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio_venta,
            cantidad: 1,
            stockDisponible: producto.stock
        });
    }
    
    renderCart();
}

function removeFromCart(productoId) {
    state.cart = state.cart.filter(item => item.id !== productoId);
    renderCart();
}

function updateQuantity(productoId, delta) {
    const item = state.cart.find(i => i.id === productoId);
    if (!item) return;
    
    const newQuantity = item.cantidad + delta;
    
    if (newQuantity <= 0) {
        removeFromCart(productoId);
    } else if (newQuantity <= item.stockDisponible) {
        item.cantidad = newQuantity;
        renderCart();
    } else {
        alert('⚠️ No hay más stock disponible');
    }
}

function clearCart() {
    if (state.cart.length === 0) return;
    
    if (confirm('¿Limpiar el carrito?')) {
        state.cart = [];
        renderCart();
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const itemCount = document.getElementById('cartItemCount');
    const totalElement = document.getElementById('cartTotal');
    const paymentTotal = document.getElementById('paymentTotal');
    
    if (state.cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Carrito vacío</p></div>';
        itemCount.textContent = '0';
        totalElement.textContent = '$0';
        paymentTotal.textContent = '$0';
        return;
    }
    
    const total = state.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    container.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-name">${item.nombre}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span class="quantity">${item.cantidad}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">$${formatPrice(item.precio * item.cantidad)}</div>
            </div>
        </div>
    `).join('');
    
    itemCount.textContent = state.cart.reduce((sum, item) => sum + item.cantidad, 0);
    totalElement.textContent = `$${formatPrice(total)}`;
    paymentTotal.textContent = `$${formatPrice(total)}`;
}

function selectPaymentMethod(metodo) {
    state.selectedPaymentMethod = metodo;
    
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.metodo === metodo);
    });
}

async function processPayment() {
    if (state.cart.length === 0) {
        alert('⚠️ El carrito está vacío');
        return;
    }
    
    const venta = {
        items: state.cart.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
        })),
        metodo_pago: state.selectedPaymentMethod
    };
    
    try {
        const response = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });
        
        if (response.ok) {
            const ventaCreada = await response.json();
            alert(`✅ Venta registrada! Total: $${formatPrice(ventaCreada.total)}`);
            
            // Limpiar carrito y recargar
            state.cart = [];
            renderCart();
            await loadProducts();
            await loadEstadisticas();
            renderPOSProducts();
        } else {
            const error = await response.json();
            alert(`❌ Error: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error procesando pago:', error);
        alert('❌ Error al procesar la venta');
    }
}

// ============== PRODUCTOS - ESCANEO RÁPIDO ==============
async function handleQuickScan() {
    const scanInput = document.getElementById('productSearchInput');
    if (!scanInput) {
        alert('⚠️ Input de búsqueda no encontrado');
        return;
    }
    
    const codigo = scanInput.value.trim();
    
    if (!codigo) {
        alert('⚠️ Ingresa un código de producto');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos?limit=500`);
        const productos = await response.json();
        const producto = productos.find(p => p.codigo.toLowerCase() === codigo.toLowerCase() && p.activo);
        
        if (producto) {
            // Si estamos en vista productos, editar el producto
            if (state.currentView === 'productos') {
                editProduct(producto.id);
            } else {
                // Si estamos en POS, buscar el producto
                const posSearchInput = document.getElementById('posSearchInput');
                if (posSearchInput) {
                    posSearchInput.value = codigo;
                    filterPOSProducts();
                }
            }
        } else {
            // Producto no encontrado - ir a formulario de nuevo producto
            if (state.currentView === 'productos') {
                showProductForm();
                const codigoInput = document.getElementById('codigo');
                const nombreInput = document.getElementById('nombre');
                if (codigoInput) codigoInput.value = codigo;
                if (nombreInput) nombreInput.focus();
            } else {
                alert('❌ Producto no encontrado');
            }
        }
        
        // Limpiar input
        scanInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al buscar el producto');
    }
}
async function handleQuickScan() {
    const quickScanInput = document.getElementById('quickScanInput');
    if (!quickScanInput) return;
    
    const codigo = quickScanInput.value.trim();
    
    if (!codigo) {
        alert('⚠️ Ingresa un código de producto');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos?limit=500`);
        const productos = await response.json();
        const producto = productos.find(p => p.codigo.toLowerCase() === codigo.toLowerCase() && p.activo);
        
        if (producto) {
            // Producto existe - Mostrar modal para agregar stock
            showAddStockModal(producto);
        } else {
            // Producto no existe - Abrir formulario de creación
            alert('ℹ️ Producto no encontrado. Completa los datos para crearlo.');
            showProductForm();
            const codigoInput = document.getElementById('codigo');
            const nombreInput = document.getElementById('nombre');
            if (codigoInput) {
                codigoInput.value = codigo;
                codigoInput.readOnly = true;
            }
            if (nombreInput) nombreInput.focus();
        }
        
        // Limpiar input
        quickScanInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al buscar el producto');
    }
}

function showAddStockModal(producto) {
    state.selectedProduct = producto;
    
    const modal = document.getElementById('addStockModal');
    const infoCard = document.getElementById('stockProductInfo');
    
    if (!modal || !infoCard) return;
    
    infoCard.innerHTML = `
        <h3>${producto.nombre}</h3>
        <p><strong>Código:</strong> ${producto.codigo}</p>
        <p><strong>Categoría:</strong> ${producto.categoria || 'Sin categoría'}</p>
        <p><strong>Precio Venta:</strong> $${formatPrice(producto.precio_venta)}</p>
    `;
    
    const currentStockEl = document.getElementById('currentStock');
    const stockQuantityEl = document.getElementById('stockQuantity');
    const finalStockEl = document.getElementById('finalStock');
    
    if (currentStockEl) currentStockEl.value = producto.stock;
    if (stockQuantityEl) stockQuantityEl.value = '';
    if (finalStockEl) finalStockEl.value = producto.stock;
    
    modal.classList.add('active');
    setTimeout(() => {
        const qtyInput = document.getElementById('stockQuantity');
        if (qtyInput) qtyInput.focus();
    }, 100);
}

function updateFinalStock() {
    const currentStockEl = document.getElementById('currentStock');
    const stockQuantityEl = document.getElementById('stockQuantity');
    const finalStockEl = document.getElementById('finalStock');
    
    if (currentStockEl && stockQuantityEl && finalStockEl) {
        const current = parseInt(currentStockEl.value) || 0;
        const toAdd = parseInt(stockQuantityEl.value) || 0;
        finalStockEl.value = current + toAdd;
    }
}

async function handleAddStock(e) {
    e.preventDefault();
    
    const producto = state.selectedProduct;
    if (!producto) return;
    
    const stockQuantityEl = document.getElementById('stockQuantity');
    if (!stockQuantityEl) return;
    
    const quantityToAdd = parseInt(stockQuantityEl.value);
    if (!quantityToAdd || quantityToAdd <= 0) {
        alert('⚠️ Ingresa una cantidad válida');
        return;
    }
    
    const newStock = producto.stock + quantityToAdd;
    
    try {
        const response = await fetch(`${API_URL}/productos/${producto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: newStock })
        });
        
        if (response.ok) {
            alert(`✅ Stock actualizado: ${producto.nombre} (+${quantityToAdd})`);
            closeStockModal();
            await loadProducts();
            loadProductsTable();
            renderPOSProducts();
        } else {
            alert('❌ Error al actualizar el stock');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al actualizar el stock');
    }
}

function closeStockModal() {
    const modal = document.getElementById('addStockModal');
    if (modal) {
        modal.classList.remove('active');
    }
    state.selectedProduct = null;
    const scanInput = document.getElementById('quickScanInput');
    if (scanInput && state.currentView === 'productos') {
        scanInput.focus();
    }
}

// ============== PRODUCTOS - GESTIÓN ==============
async function loadProductsTable() {
    try {
        const response = await fetch(`${API_URL}/productos?limit=500`);
        const productos = await response.json();
        const productosActivos = productos.filter(p => p.activo);
        renderProductsTable(productosActivos);
        updateProductStats(productosActivos);
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateProductStats(productos) {
    if (!productos) return;
    
    const totalProductos = productos.length;
    const stockBajo = productos.filter(p => p.stock <= p.stock_minimo).length;
    const valorTotal = productos.reduce((sum, p) => sum + (p.precio_venta * p.stock), 0);
    
    // Actualizar estadísticas en el sidebar
    const totalEl = document.querySelector('.quick-stats .stat-card:nth-child(1) .stat-value');
    const stockEl = document.querySelector('.quick-stats .stat-card:nth-child(2) .stat-value');
    const valorEl = document.querySelector('.quick-stats .stat-card:nth-child(3) .stat-value');
    
    if (totalEl) totalEl.textContent = totalProductos;
    if (stockEl) stockEl.textContent = stockBajo;
    if (valorEl) valorEl.textContent = `$${formatPrice(valorTotal)}`;
}

function renderProductsTable(productos) {
    const tbody = document.getElementById('productosTable');
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td><strong>${p.codigo}</strong></td>
            <td>
                ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" class="product-thumb">` : '📦'}
                <strong>${p.nombre}</strong>
                ${p.descripcion ? `<br><small>${p.descripcion}</small>` : ''}
            </td>
            <td>${p.categoria || '-'}</td>
            <td><strong>$${formatPrice(p.precio_venta)}</strong></td>
            <td>
                <span class="badge ${p.stock < p.stock_minimo ? 'warning' : 'success'}">
                    ${p.stock}
                </span>
            </td>
            <td>
                <button class="btn-icon edit" onclick="editProduct(${p.id})" title="Editar">✏️</button>
                <button class="btn-icon delete" onclick="deleteProduct(${p.id})" title="Eliminar">🗑️</button>
                <button class="btn-icon" onclick="showStockModal(${p.id})" title="Agregar Stock">📦</button>
            </td>
        </tr>
    `).join('');
}

// Función de filtrado de productos mejorada
function filterProducts() {
    const searchTerm = document.getElementById('productSearchInput')?.value.toLowerCase() || '';
    const selectedCategory = state.selectedFilter || '';
    
    let filteredProducts = state.productos.filter(producto => {
        const matchesSearch = !searchTerm || 
            producto.nombre.toLowerCase().includes(searchTerm) ||
            producto.codigo.toLowerCase().includes(searchTerm) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || 
            selectedCategory === 'todos' || 
            producto.categoria === selectedCategory;
        
        return matchesSearch && matchesCategory && producto.activo;
    });
    
    renderProductsTable(filteredProducts);
    updateProductStats(filteredProducts);
}

function showProductForm() {
    // En el nuevo diseño, el formulario siempre está visible en el sidebar
    // Solo necesitamos scroll al sidebar y limpiar el formulario
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
    // En el nuevo diseño no ocultamos el formulario, solo lo limpiamos
    const productoForm = document.getElementById('productoForm');
    const codigoInput = document.getElementById('codigo');
    if (productoForm) productoForm.reset();
    if (codigoInput) codigoInput.readOnly = false;
    state.editingProductId = null;
    
    // Focus en búsqueda si existe
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.focus();
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    // Helper function to safely get element value
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
            alert(state.editingProductId ? '✅ Producto actualizado' : '✅ Producto creado');
            hideProductForm();
            await loadProducts();
            loadProductsTable();
            renderPOSProducts();
        } else {
            const error = await response.json();
            alert(`❌ Error: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar el producto');
    }
}

async function editProduct(id) {
    try {
        console.log('Editando producto ID:', id);
        const response = await fetch(`${API_URL}/productos/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const producto = await response.json();
        console.log('Producto cargado:', producto);
        
        state.editingProductId = id;
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = '✏️ Editar Producto';
        } else {
            console.warn('⚠️ No se encontró formTitle');
        }
        
        // Llenar campos básicos
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
        
        // Llenar todos los campos de forma segura
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = campos[campo];
                console.log(`✅ Campo ${campo} = ${campos[campo]}`);
            } else {
                console.warn(`⚠️ No se encontró el elemento: ${campo}`);
            }
        });
        
        // Asegurar que el código no sea editable en modo edición
        const codigoInput = document.getElementById('codigo');
        if (codigoInput) {
            codigoInput.readOnly = true;
        }
        
        showProductForm();
        
        // Scroll al formulario
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn('⚠️ No se encontró productForm para scroll');
        }
        
        console.log('✅ Producto cargado en formulario para edición');
        
    } catch (error) {
        console.error('❌ Error en editProduct:', error);
        alert(`❌ Error al cargar el producto: ${error.message}`);
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('✅ Producto eliminado');
            await loadProducts();
            loadProductsTable();
            renderPOSProducts();
        } else {
            alert('❌ Error al eliminar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar el producto');
    }
}

// ============== VENTAS ==============
function renderVentasTable(ventas) {
    const tbody = document.getElementById('ventasTable');
    
    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay ventas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = ventas.map(v => `
        <tr>
            <td><strong>#${v.id}</strong></td>
            <td>${formatDateTime(v.created_at)}</td>
            <td><strong>$${formatPrice(v.total)}</strong></td>
            <td>
                <span class="badge success">
                    ${v.metodo_pago === 'efectivo' ? '💵' : v.metodo_pago === 'tarjeta' ? '💳' : '📱'} 
                    ${capitalize(v.metodo_pago)}
                </span>
            </td>
            <td>-</td>
        </tr>
    `).join('');
}

// ============== RETIROS ==============
function filterRetiroProducts() {
    const searchTerm = document.getElementById('retiroSearchInput').value.toLowerCase();
    renderRetiroProducts(searchTerm);
}

function renderRetiroProducts(searchTerm = '') {
    const grid = document.getElementById('retiroProductsGrid');
    
    let filtered = state.productos.filter(p => p.activo && p.stock > 0);
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm) ||
            p.codigo.toLowerCase().includes(searchTerm) ||
            (p.marca && p.marca.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No se encontraron productos con stock</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(producto => {
        const lowStock = producto.stock < producto.stock_minimo;
        
        // Determinar emoji por categoría si no hay imagen
        let emoji = '📦';
        if (producto.categoria === 'Cervezas') emoji = '🍺';
        else if (producto.categoria === 'Vinos') emoji = '🍷';
        else if (producto.categoria === 'Licores') emoji = '🥃';
        else if (producto.categoria === 'Bebidas') emoji = '🥤';
        else if (producto.categoria === 'Snacks') emoji = '🍿';
        
        const imagenHtml = producto.imagen_url 
            ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" onerror="this.parentElement.innerHTML='${emoji}'">`
            : emoji;
        
        const metaInfo = [];
        if (producto.marca) metaInfo.push(`<span class="product-badge">🏭 ${producto.marca}</span>`);
        if (producto.litros) metaInfo.push(`<span class="product-badge">💧 ${producto.litros}L</span>`);
        
        return `
            <div class="product-card-pos" onclick="addToRetiroCart(${producto.id})">
                <div class="product-image">${imagenHtml}</div>
                <div class="product-info">
                    <div class="product-name">${producto.nombre}</div>
                    ${metaInfo.length > 0 ? `<div class="product-meta">${metaInfo.join('')}</div>` : ''}
                    <div class="product-price">$${formatPrice(producto.precio_venta)}</div>
                    <div class="product-stock ${lowStock ? 'low' : ''}">
                        Stock: ${producto.stock}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToRetiroCart(productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) return;
    
    const existingItem = state.retiroCart.find(item => item.id === productoId);
    
    if (existingItem) {
        if (existingItem.cantidad < producto.stock) {
            existingItem.cantidad++;
        } else {
            alert('⚠️ No hay más stock disponible');
            return;
        }
    } else {
        state.retiroCart.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio_venta,
            cantidad: 1,
            stockDisponible: producto.stock
        });
    }
    
    renderRetiroCart();
}

function removeFromRetiroCart(productoId) {
    state.retiroCart = state.retiroCart.filter(item => item.id !== productoId);
    renderRetiroCart();
}

function updateRetiroQuantity(productoId, delta) {
    const item = state.retiroCart.find(i => i.id === productoId);
    if (!item) return;
    
    const newQuantity = item.cantidad + delta;
    
    if (newQuantity <= 0) {
        removeFromRetiroCart(productoId);
    } else if (newQuantity <= item.stockDisponible) {
        item.cantidad = newQuantity;
        renderRetiroCart();
    } else {
        alert('⚠️ No hay más stock disponible');
    }
}

function clearRetiroCart() {
    if (state.retiroCart.length === 0) return;
    
    if (confirm('¿Limpiar carrito de retiros?')) {
        state.retiroCart = [];
        renderRetiroCart();
    }
}

function renderRetiroCart() {
    const container = document.getElementById('retiroCartItems');
    const itemCount = document.getElementById('retiroItemCount');
    const totalElement = document.getElementById('retiroTotal');
    
    if (state.retiroCart.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📤</div><p>Sin retiros</p></div>';
        itemCount.textContent = '0';
        totalElement.textContent = '$0';
        return;
    }
    
    const total = state.retiroCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    container.innerHTML = state.retiroCart.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-name">${item.nombre}</div>
                <button class="cart-item-remove" onclick="removeFromRetiroCart(${item.id})">×</button>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateRetiroQuantity(${item.id}, -1)">−</button>
                    <span class="quantity">${item.cantidad}</span>
                    <button class="qty-btn" onclick="updateRetiroQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">$${formatPrice(item.precio * item.cantidad)}</div>
            </div>
        </div>
    `).join('');
    
    itemCount.textContent = state.retiroCart.reduce((sum, item) => sum + item.cantidad, 0);
    totalElement.textContent = `$${formatPrice(total)}`;
}

async function processRetiro() {
    if (state.retiroCart.length === 0) {
        alert('⚠️ No hay items para retirar');
        return;
    }
    
    const retiro = {
        items: state.retiroCart.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad
        }))
    };
    
    try {
        const response = await fetch(`${API_URL}/retiros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retiro)
        });
        
        if (response.ok) {
            const retiroCreado = await response.json();
            alert(`✅ Retiro registrado! Pérdida: $${formatPrice(retiroCreado.total)}`);
            
            // Limpiar carrito y recargar
            state.retiroCart = [];
            renderRetiroCart();
            await loadProducts();
            await loadEstadisticas();
            renderRetiroProducts();
            loadRetiros();
        } else {
            const error = await response.json();
            alert(`❌ Error: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error procesando retiro:', error);
        alert('❌ Error al registrar el retiro');
    }
}

function renderRetirosTable(retiros) {
    const tbody = document.getElementById('retirosTable');
    
    if (retiros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No hay retiros registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = retiros.map(r => `
        <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${formatDateTime(r.created_at)}</td>
            <td><strong class="text-danger">$${formatPrice(r.total)}</strong></td>
        </tr>
    `).join('');
}

// ============== UTILIDADES ==============
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(Math.round(price));
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
