// ============== RETIROS-APP.JS ==============
// Este archivo contiene la lógica específica del módulo de retiros
// Las utilidades comunes están en common.js

// Importar state, sound, API_URL, etc. desde common.js (cargado previamente)

// ============== BÚSQUEDA POR CÓDIGO ==============
function openCodeSearchModal() {
    const modal = document.getElementById('codeSearchModal');
    const input = document.getElementById('codeSearchInput');
    
    modal.style.display = 'flex';
    setTimeout(() => input?.focus(), 100);
    
    // Event listeners para el modal
    const closeBtn = modal.querySelector('.modal-close');
    const cameraBtn = document.getElementById('cameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    
    if (closeBtn) closeBtn.onclick = () => closeCodeSearchModal();
    if (cameraBtn) cameraBtn.onclick = startCamera;
    if (stopCameraBtn) stopCameraBtn.onclick = stopCamera;
    if (input) input.oninput = searchByCode;
}

function closeCodeSearchModal() {
    const modal = document.getElementById('codeSearchModal');
    modal.style.display = 'none';
    stopCamera();
}

function searchByCode() {
    const input = document.getElementById('codeSearchInput');
    const result = document.getElementById('codeSearchResult');
    const code = input?.value.trim();
    
    if (!code) {
        result.style.display = 'none';
        return;
    }
    
    // Buscar producto por código
    const producto = state.productos.find(p => 
        p.codigo === code || 
        p.codigo_barras === code ||
        p.codigo_interno === code
    );
    
    result.style.display = 'block';
    
    if (producto) {
        sound.scan();
        result.className = 'search-result found';
        result.innerHTML = `
            <div class="product-found">
                <h4>✅ Producto Encontrado</h4>
                <div class="product-details">
                    <strong>${producto.nombre}</strong><br>
                    <span>Código: ${producto.codigo}</span><br>
                    <span>Precio: $${formatPrice(producto.precio_venta)}</span><br>
                    <span>Stock: ${producto.stock}</span>
                </div>
                <button onclick="addProductFromCode(${producto.id})" class="btn-action primary">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Agregar al Carrito</span>
                </button>
            </div>
        `;
    } else {
        sound.error();
        result.className = 'search-result not-found';
        result.innerHTML = `
            <div class="product-not-found">
                <h4>❌ Producto No Encontrado</h4>
                <p>No se encontró ningún producto con el código: <strong>${code}</strong></p>
            </div>
        `;
    }
}

function addProductFromCode(productId) {
    addToRetiroCart(productId);
    sound.success();
    closeCodeSearchModal();
}

async function startCamera() {
    const video = document.getElementById('cameraVideo');
    const cameraSection = document.getElementById('cameraSection');
    const cameraBtn = document.getElementById('cameraBtn');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        video.srcObject = stream;
        cameraSection.style.display = 'block';
        cameraBtn.style.display = 'none';
        
        simulateBarcodeDetection(video);
        
    } catch (error) {
        sound.error();
        alert('❌ No se pudo acceder a la cámara. Verifica los permisos.');
        console.error('Error accessing camera:', error);
    }
}

function stopCamera() {
    const video = document.getElementById('cameraVideo');
    const cameraSection = document.getElementById('cameraSection');
    const cameraBtn = document.getElementById('cameraBtn');
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    cameraSection.style.display = 'none';
    cameraBtn.style.display = 'block';
}

function simulateBarcodeDetection(video) {
    let detectionInterval = setInterval(() => {
        if (!video.srcObject) {
            clearInterval(detectionInterval);
            return;
        }
        
        if (Math.random() < 0.1) { 
            const demoCode = '7891000100103';
            document.getElementById('codeSearchInput').value = demoCode;
            searchByCode();
            stopCamera();
            clearInterval(detectionInterval);
        }
    }, 1000);
}

// ============== INICIALIZACIÓN ==============
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadInitialData();
    setupKeyboardShortcuts();
});

function setupEventListeners() {
    // Retiros - Búsqueda y filtros
    const retiroSearchInput = document.getElementById('retiroSearchInput');
    if (retiroSearchInput) {
        retiroSearchInput.addEventListener('input', debounce(filterRetiroProducts, 300));
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
            renderRetiroProducts();
        });
    }
    
    if (marcaFilter) {
        marcaFilter.addEventListener('change', (e) => {
            console.log('Filtro de marca cambiado a:', e.target.value);
            state.selectedMarca = e.target.value;
            renderRetiroProducts();
        });
    }

    // Carrito de retiros
    const clearRetiroCartBtn = document.getElementById('clearRetiroCart');
    const processRetiroBtn = document.getElementById('processRetiro');
    if (clearRetiroCartBtn) clearRetiroCartBtn.addEventListener('click', clearRetiroCart);
    if (processRetiroBtn) processRetiroBtn.addEventListener('click', processRetiro);

    // Modo venta rápida
    const quickModeToggle = document.getElementById('quickModeToggle');
    if (quickModeToggle) quickModeToggle.addEventListener('change', toggleQuickMode);

    // Búsqueda por código
    const codeSearchBtn = document.getElementById('codeSearchBtn');
    if (codeSearchBtn) codeSearchBtn.onclick = openCodeSearchModal;

    // Atajos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F2 - Focus en búsqueda
        if (e.key === 'F2') {
            e.preventDefault();
            const searchInput = document.getElementById('retiroSearchInput');
            if (searchInput) searchInput.focus();
        }
        // ESC - Limpiar búsqueda
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('retiroSearchInput');
            if (searchInput) {
                searchInput.value = '';
                filterRetiroProducts();
            }
        }
    });
}

async function loadInitialData() {
    try {
        console.log('🚀 Cargando datos iniciales para retiros...');
        await Promise.all([
            loadProducts(),
            loadEstadisticas()
        ]);
        console.log('📦 Productos cargados:', state.productos.length);
        
        populateMarcasFilter();
        populateUnidadesFilter();
        renderRetiroProducts();
        
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
        
        // Si no hay backend, usar datos de prueba
        if (response.status === 404) {
            console.log('📦 Backend no disponible, usando datos de prueba...');
            state.productos = [
                {
                    id: 1,
                    codigo: 'CER001',
                    nombre: 'Cerveza Cristal 350ml',
                    descripcion: 'Cerveza rubia, refrescante',
                    precio_compra: 800,
                    precio_venta: 1200,
                    stock: 24,
                    stock_minimo: 5,
                    categoria: 'Cervezas',
                    marca: 'Cristal',
                    cantidad: 350,
                    unidad_medida: 'ml',
                    litros: 0.35,
                    imagen_url: null,
                    activo: true
                },
                {
                    id: 2,
                    codigo: 'VIN001',
                    nombre: 'Vino Casillero del Diablo Cabernet',
                    descripcion: 'Vino tinto reserva',
                    precio_compra: 3500,
                    precio_venta: 5500,
                    stock: 12,
                    stock_minimo: 3,
                    categoria: 'Vinos',
                    marca: 'Casillero del Diablo',
                    cantidad: 750,
                    unidad_medida: 'ml',
                    litros: 0.75,
                    imagen_url: null,
                    activo: true
                },
                {
                    id: 3,
                    codigo: 'LIC001',
                    nombre: 'Pisco Capel 35°',
                    descripcion: 'Pisco tradicional chileno',
                    precio_compra: 4000,
                    precio_venta: 6500,
                    stock: 8,
                    stock_minimo: 2,
                    categoria: 'Licores',
                    marca: 'Capel',
                    cantidad: 750,
                    unidad_medida: 'ml',
                    litros: 0.75,
                    imagen_url: null,
                    activo: true
                },
                {
                    id: 4,
                    codigo: 'BEB001',
                    nombre: 'Coca Cola 500ml',
                    descripcion: 'Bebida gaseosa cola',
                    precio_compra: 600,
                    precio_venta: 1000,
                    stock: 30,
                    stock_minimo: 10,
                    categoria: 'Bebidas',
                    marca: 'Coca Cola',
                    cantidad: 500,
                    unidad_medida: 'ml',
                    litros: 0.5,
                    imagen_url: null,
                    activo: true
                },
                {
                    id: 5,
                    codigo: 'SNK001',
                    nombre: 'Papas Lays Original',
                    descripcion: 'Papas fritas sabor original',
                    precio_compra: 800,
                    precio_venta: 1300,
                    stock: 2,
                    stock_minimo: 5,
                    categoria: 'Snacks',
                    marca: 'Lays',
                    cantidad: 140,
                    unidad_medida: 'g',
                    litros: null,
                    imagen_url: null,
                    activo: true
                }
            ];
            console.log('✅ Productos de prueba cargados:', state.productos.length);
            return;
        }
        
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

// ============== RETIROS - PRODUCTOS ==============
function filterRetiroProducts() {
    const searchInput = document.getElementById('retiroSearchInput');
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        renderRetiroProducts(searchTerm);
    }
}

function filterByCategory(categoria) {
    state.selectedCategory = categoria;
    
    // Actualizar pills
    document.querySelectorAll('.pill[data-categoria]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoria === categoria);
    });
    
    renderRetiroProducts();
}

function renderRetiroProducts(searchTerm = '') {
    const grid = document.getElementById('retiroProductsGrid');
    if (!grid) return;
    
    let filtered = state.productos.filter(p => p.activo && p.stock > 0);
    
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
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No se encontraron productos con stock</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(producto => {
        const outOfStock = producto.stock === 0;
        const lowStock = producto.stock > 0 && producto.stock < producto.stock_minimo;
        
        // Formato de lista compacta
        return `
            <div class="product-card-pos ${outOfStock ? 'out-of-stock' : ''}" 
                 onclick="${outOfStock ? '' : `addToRetiroCartQuickMode(${producto.id})`}">
                <div class="product-info-list">
                    <div class="product-name-list">${producto.nombre}</div>
                    <div class="product-details-list">
                        <span class="product-code-list">${producto.codigo}</span>
                        ${producto.marca ? `<span>🏭 ${producto.marca}</span>` : ''}
                        ${producto.cantidad && producto.unidad_medida ? 
                            `<span>${getUnidadIcon(producto.unidad_medida)} ${producto.cantidad}${producto.unidad_medida}</span>` :
                            producto.litros ? `<span>💧 ${producto.litros}L</span>` : ''
                        }
                        <span class="product-stock-list ${lowStock ? 'low' : ''}">
                            ${outOfStock ? '❌ Sin stock' : `Stock: ${producto.stock}`}
                        </span>
                    </div>
                </div>
                <div class="product-price-list">$${formatPrice(producto.precio_venta)}</div>
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
            return;
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
            return;
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

// ============== CARRITO DE RETIROS ==============
function addToRetiroCart(productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) {
        sound.error();
        return;
    }
    
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
        sound.success();
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
    
    if (confirm('¿Limpiar el carrito de retiros?')) {
        state.retiroCart = [];
        sound.warning();
        renderRetiroCart();
    }
}

function renderRetiroCart() {
    const container = document.getElementById('retiroCartItems');
    const itemCount = document.getElementById('retiroItemCount');
    const subtotalEl = document.getElementById('retiroSubtotal');
    const totalElement = document.getElementById('retiroTotal');
    const totalBtnEl = document.getElementById('retiroTotalBtn');
    
    if (state.retiroCart.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📤</div><p>Sin productos en retiro</p></div>';
        itemCount.textContent = '0';
        if (subtotalEl) subtotalEl.textContent = '$0';
        totalElement.textContent = '$0';
        if (totalBtnEl) totalBtnEl.textContent = '$0';
        return;
    }
    
    const total = state.retiroCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const totalItems = state.retiroCart.reduce((sum, item) => sum + item.cantidad, 0);
    
    container.innerHTML = state.retiroCart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-price">$${formatPrice(item.precio * item.cantidad)}</div>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateRetiroQuantity(${item.id}, -1)">−</button>
                <span class="quantity">${item.cantidad}</span>
                <button class="qty-btn" onclick="updateRetiroQuantity(${item.id}, 1)">+</button>
                <button class="btn-remove" onclick="removeFromRetiroCart(${item.id})">×</button>
            </div>
        </div>
    `).join('');
    
    itemCount.textContent = totalItems.toString();
    if (subtotalEl) subtotalEl.textContent = `$${formatPrice(total)}`;
    totalElement.textContent = `$${formatPrice(total)}`;
    if (totalBtnEl) totalBtnEl.textContent = `$${formatPrice(total)}`;
}

async function processRetiro() {
    if (state.retiroCart.length === 0) {
        sound.error();
        alert('⚠️ No hay items para retirar');
        return;
    }
    
    const motivo = document.getElementById('motivoRetiro')?.value || 'consumo_interno';
    const observaciones = document.getElementById('observacionesRetiro')?.value || '';
    
    const retiro = {
        items: state.retiroCart.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad
        })),
        motivo: motivo,
        observaciones: observaciones
    };
    
    try {
        const response = await fetch(`${API_URL}/retiros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retiro)
        });
        
        if (response.ok) {
            const retiroCreado = await response.json();
            sound.success();
            alert(`✅ Retiro registrado!\nMotivo: ${getMotivoText(motivo)}\nPérdida: $${formatPrice(retiroCreado.total)}`);
            
            // Actualizar stock localmente
            state.retiroCart.forEach(item => {
                const producto = state.productos.find(p => p.id === item.id);
                if (producto) {
                    producto.stock -= item.cantidad;
                }
            });
            
            // Limpiar carrito y formulario
            state.retiroCart = [];
            const motivoEl = document.getElementById('motivoRetiro');
            const obsEl = document.getElementById('observacionesRetiro');
            if (motivoEl) motivoEl.value = 'consumo_interno';
            if (obsEl) obsEl.value = '';
            
            renderRetiroCart();
            renderRetiroProducts();
            await loadEstadisticas();
            
        } else {
            const error = await response.json();
            sound.error();
            alert(`❌ Error: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error procesando retiro:', error);
        sound.error();
        alert('❌ Error al registrar el retiro');
    }
}

function getMotivoText(motivo) {
    const motivos = {
        'consumo_interno': '🍺 Consumo Interno',
        'perdida': '💔 Pérdida/Rotura',
        'vencido': '📅 Producto Vencido',
        'deteriorado': '⚠️ Deteriorado',
        'muestra': '🎁 Muestra/Regalo',
        'inventario': '📋 Ajuste Inventario',
        'otro': '❓ Otro'
    };
    return motivos[motivo] || '❓ Otro';
}

// ============== MODO RÁPIDO ==============
function toggleQuickMode() {
    const toggle = document.getElementById('quickModeToggle');
    state.quickModeActive = toggle?.checked || false;
    
    // Cambiar clase del body para estilos
    if (state.quickModeActive) {
        document.body.classList.add('quick-mode-active');
    } else {
        document.body.classList.remove('quick-mode-active');
    }
    
    console.log('Modo rápido:', state.quickModeActive ? 'ACTIVADO' : 'DESACTIVADO');
}

function addToRetiroCartQuickMode(productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) return;
    
    if (state.quickModeActive) {
        // En modo rápido, agregar directamente
        addToRetiroCart(productoId);
        
        // Opcional: Auto-scroll al carrito en móviles
        if (window.innerWidth <= 768) {
            const cartPanel = document.querySelector('.cart-panel');
            if (cartPanel) {
                cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    } else {
        // Modo normal
        addToRetiroCart(productoId);
    }
}

function handleKeyboardShortcuts(event) {
    // F4 - Toggle modo rápido
    if (event.key === 'F4') {
        event.preventDefault();
        const toggle = document.getElementById('quickModeToggle');
        if (toggle) {
            toggle.checked = !toggle.checked;
            toggleQuickMode();
        }
    }
    
    // Enter - Procesar retiro si hay productos en el carrito
    if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        if (state.retiroCart.length > 0) {
            processRetiro();
        }
    }
}

// ============== UTILIDADES ==============
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(Math.round(price));
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
