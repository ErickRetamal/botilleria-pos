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
    currentView: 'pos',
    quickModeActive: false,
    discountAmount: 0,
    cashBox: {
        isOpen: false,
        initialAmount: 0,
        operator: '',
        openTime: null,
        cashSales: 0,
        cardSales: 0,
        transferSales: 0,
        withdrawals: 0
    },
    soundEnabled: true
};

const API_URL = '/api';

// ============== SISTEMA DE SONIDOS ==============
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async playBeep(frequency = 800, duration = 200, type = 'sine') {
        if (!this.enabled) return;
        
        await this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }

    success() { this.playBeep(800, 150); }
    error() { this.playBeep(400, 300); }
    warning() { this.playBeep(600, 200); }
    scan() { this.playBeep(1000, 100); }
    cashOpen() { this.playBeep(600, 200).then(() => setTimeout(() => this.playBeep(800, 200), 250)); }
    cashClose() { this.playBeep(800, 200).then(() => setTimeout(() => this.playBeep(600, 200), 250)); }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.success();
        return this.enabled;
    }
}

const sound = new SoundSystem();

// ============== CONTROL DE CAJA ==============
function initCashControl() {
    const cashBtn = document.getElementById('cashControlBtn');
    
    // Solo inicializar si estamos en el POS (donde existe el botón)
    if (!cashBtn) return;
    
    const modal = document.getElementById('cashModal');
    const openBtn = document.getElementById('openCashBtn');
    const closeBtn = document.getElementById('closeCashBtn');
    const actualCashInput = document.getElementById('actualCash');

    if (cashBtn) cashBtn.onclick = openCashModal;
    if (openBtn) openBtn.onclick = openCashBox;
    if (closeBtn) closeBtn.onclick = closeCashBox;
    if (actualCashInput) actualCashInput.oninput = calculateCashDifference;

    // Modal controls
    const modalClose = modal?.querySelector('.modal-close');
    if (modalClose) modalClose.onclick = () => modal.style.display = 'none';

    updateCashStatus();
    loadCashData();
}

function loadCashData() {
    // Cargar datos de caja desde localStorage
    const saved = localStorage.getItem('cashBoxData');
    if (saved) {
        const data = JSON.parse(saved);
        if (data.isOpen && data.openTime) {
            const today = new Date().toDateString();
            const openDate = new Date(data.openTime).toDateString();
            
            if (today === openDate) {
                Object.assign(state.cashBox, data);
                updateCashStatus();
            }
        }
    }
}

function saveCashData() {
    localStorage.setItem('cashBoxData', JSON.stringify(state.cashBox));
}

function openCashModal() {
    const modal = document.getElementById('cashModal');
    const title = document.getElementById('cashModalTitle');
    const openSection = document.getElementById('cashOpenSection');
    const closeSection = document.getElementById('cashCloseSection');

    if (state.cashBox.isOpen) {
        title.textContent = '🔒 Cierre de Caja';
        openSection.style.display = 'none';
        closeSection.style.display = 'block';
        updateCloseSummary();
    } else {
        title.textContent = '🔓 Apertura de Caja';
        openSection.style.display = 'block';
        closeSection.style.display = 'none';
        
        // Pre-llenar operador si existe
        const operatorInput = document.getElementById('operatorName');
        if (operatorInput && state.cashBox.operator) {
            operatorInput.value = state.cashBox.operator;
        }
    }

    modal.style.display = 'flex';
}

function openCashBox() {
    const initialAmount = parseFloat(document.getElementById('initialAmount')?.value) || 0;
    const operator = document.getElementById('operatorName')?.value || 'Sin nombre';

    if (initialAmount < 0) {
        sound.error();
        alert('⚠️ El monto inicial no puede ser negativo');
        return;
    }

    state.cashBox = {
        isOpen: true,
        initialAmount: initialAmount,
        operator: operator,
        openTime: new Date().toISOString(),
        cashSales: 0,
        cardSales: 0,
        transferSales: 0,
        withdrawals: 0
    };

    sound.cashOpen();
    saveCashData();
    updateCashStatus();
    document.getElementById('cashModal').style.display = 'none';
    
    // Limpiar inputs
    document.getElementById('initialAmount').value = '';
}

function closeCashBox() {
    const actualCash = parseFloat(document.getElementById('actualCash')?.value) || 0;
    
    if (actualCash < 0) {
        sound.error();
        alert('⚠️ El efectivo contado no puede ser negativo');
        return;
    }

    const expectedCash = state.cashBox.initialAmount + state.cashBox.cashSales - state.cashBox.withdrawals;
    const difference = actualCash - expectedCash;

    // Confirmar cierre
    let confirmMessage = `¿Confirmar cierre de caja?\n\nEfectivo esperado: $${formatPrice(expectedCash)}\nEfectivo contado: $${formatPrice(actualCash)}`;
    
    if (difference !== 0) {
        confirmMessage += `\nDiferencia: $${formatPrice(Math.abs(difference))} ${difference > 0 ? '(sobrante)' : '(faltante)'}`;
    }

    if (confirm(confirmMessage)) {
        // Guardar registro de cierre
        const closeRecord = {
            ...state.cashBox,
            closeTime: new Date().toISOString(),
            actualCash: actualCash,
            expectedCash: expectedCash,
            difference: difference
        };
        
        // Guardar en historial
        let history = JSON.parse(localStorage.getItem('cashHistory') || '[]');
        history.push(closeRecord);
        localStorage.setItem('cashHistory', JSON.stringify(history));

        // Cerrar caja
        state.cashBox = {
            isOpen: false,
            initialAmount: 0,
            operator: '',
            openTime: null,
            cashSales: 0,
            cardSales: 0,
            transferSales: 0,
            withdrawals: 0
        };

        sound.cashClose();
        saveCashData();
        updateCashStatus();
        document.getElementById('cashModal').style.display = 'none';
        
        if (difference !== 0) {
            setTimeout(() => {
                sound.warning();
                alert(`💰 Diferencia en caja: $${formatPrice(Math.abs(difference))} ${difference > 0 ? 'sobrante' : 'faltante'}`);
            }, 500);
        }
    }
}

function updateCloseSummary() {
    document.getElementById('summaryInitial').textContent = `$${formatPrice(state.cashBox.initialAmount)}`;
    document.getElementById('summaryCashSales').textContent = `$${formatPrice(state.cashBox.cashSales)}`;
    document.getElementById('summaryCardSales').textContent = `$${formatPrice(state.cashBox.cardSales)}`;
    document.getElementById('summaryWithdrawals').textContent = `-$${formatPrice(state.cashBox.withdrawals)}`;
    
    const expected = state.cashBox.initialAmount + state.cashBox.cashSales - state.cashBox.withdrawals;
    document.getElementById('expectedCash').textContent = `$${formatPrice(expected)}`;
}

function calculateCashDifference() {
    const actualCash = parseFloat(document.getElementById('actualCash')?.value) || 0;
    const expectedCash = state.cashBox.initialAmount + state.cashBox.cashSales - state.cashBox.withdrawals;
    const difference = actualCash - expectedCash;
    
    const alert = document.getElementById('differenceAlert');
    const amount = document.getElementById('differenceAmount');
    
    if (difference === 0) {
        alert.style.display = 'none';
    } else {
        alert.style.display = 'block';
        alert.className = 'difference-alert ' + (difference > 0 ? 'positive' : 'negative');
        amount.textContent = `$${formatPrice(Math.abs(difference))} ${difference > 0 ? 'sobrante' : 'faltante'}`;
    }
}

function updateCashStatus() {
    const statusEl = document.getElementById('cashStatus');
    const btnEl = document.getElementById('cashControlBtn');
    
    // Solo actualizar si los elementos existen (solo en POS)
    if (!statusEl || !btnEl) return;
    
    if (state.cashBox.isOpen) {
        statusEl.textContent = `Caja Abierta - ${state.cashBox.operator}`;
        btnEl.classList.add('open');
    } else {
        statusEl.textContent = 'Caja Cerrada';
        btnEl.classList.remove('open');
    }
}

function registerSale(amount, method) {
    if (!state.cashBox.isOpen) return;
    
    if (method === 'efectivo') {
        state.cashBox.cashSales += amount;
    } else if (method === 'tarjeta') {
        state.cashBox.cardSales += amount;
    } else if (method === 'transferencia') {
        state.cashBox.transferSales += amount;
    }
    
    saveCashData();
}

function registerWithdrawal(amount) {
    if (!state.cashBox.isOpen) return;
    
    state.cashBox.withdrawals += amount;
    saveCashData();
}

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
                <button onclick="createNewProduct('${code}')" class="btn-action secondary">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Crear Producto</span>
                </button>
            </div>
        `;
    }
}

function addProductFromCode(productId) {
    addToCartQuickMode(productId);
    sound.success();
    closeCodeSearchModal();
}

function createNewProduct(code) {
    const newCode = code || generateInternalCode();
    if (confirm(`¿Crear nuevo producto con código ${newCode}?`)) {
        localStorage.setItem('newProductCode', newCode);
        window.location.href = 'productos.html';
    }
}

function generateInternalCode() {
    const prefix = 'INT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
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

    // Modo venta rápida
    const quickModeToggle = document.getElementById('quickModeToggle');
    if (quickModeToggle) quickModeToggle.addEventListener('change', toggleQuickMode);

    // Descuentos
    const toggleDiscountBtn = document.getElementById('toggleDiscount');
    const discountAmountInput = document.getElementById('discountAmount');
    if (toggleDiscountBtn) toggleDiscountBtn.addEventListener('click', toggleDiscountControls);
    if (discountAmountInput) discountAmountInput.addEventListener('input', applyDiscount);

    // Atajos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Control de Caja
    initCashControl();

    // Búsqueda por código
    const codeSearchBtn = document.getElementById('codeSearchBtn');
    if (codeSearchBtn) codeSearchBtn.onclick = openCodeSearchModal;

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
        
        // Renderizar tabla de productos si estamos en la página de productos
        const productosTable = document.getElementById('productosTable');
        if (productosTable) {
            const productosActivos = state.productos.filter(p => p.activo);
            renderProductsTable(productosActivos);
            updateProductStats(productosActivos);
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
        initRetirosModule();
        renderRetiroProducts();
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
        
        // Formato de lista compacta
        return `
            <div class="product-card-pos ${outOfStock ? 'out-of-stock' : ''}" 
                 onclick="${outOfStock ? '' : `addToCartQuickMode(${producto.id})`}">
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
    if (!producto || producto.stock === 0) {
        sound.error();
        return;
    }
    
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
        sound.success();
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
        state.discountAmount = 0;
        const discountInput = document.getElementById('discountAmount');
        if (discountInput) discountInput.value = '';
        sound.warning();
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
            <div class="cart-item-info">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-price">$${formatPrice(item.precio * item.cantidad)}</div>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="quantity">${item.cantidad}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
        </div>
    `).join('');
    
    updateCartSummary();
}

function selectPaymentMethod(metodo) {
    state.selectedPaymentMethod = metodo;
    
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.metodo === metodo);
    });
}

async function processPayment() {
    if (state.cart.length === 0) {
        sound.error();
        alert('⚠️ El carrito está vacío');
        return;
    }

    // Verificar si la caja está abierta para ventas en efectivo
    if (state.selectedPaymentMethod === 'efectivo' && !state.cashBox.isOpen) {
        sound.warning();
        if (confirm('⚠️ La caja está cerrada. ¿Abrir caja antes de procesar la venta?')) {
            openCashModal();
            return;
        }
    }
    
    const subtotal = state.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = Math.max(0, subtotal + state.discountAmount);

    const venta = {
        items: state.cart.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
        })),
        metodo_pago: state.selectedPaymentMethod,
        total: total,
        descuento: state.discountAmount
    };
    
    try {
        // Simular venta exitosa (en producción sería llamada a API real)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Registrar en control de caja
        registerSale(total, state.selectedPaymentMethod);
        
        // Actualizar stock localmente
        state.cart.forEach(item => {
            const producto = state.productos.find(p => p.id === item.id);
            if (producto) {
                producto.stock -= item.cantidad;
            }
        });
        
        sound.success();
        alert(`✅ Venta registrada!\nTotal: $${formatPrice(total)}\nMétodo: ${state.selectedPaymentMethod}`);
        
        // Limpiar carrito
        state.cart = [];
        state.discountAmount = 0;
        const discountInput = document.getElementById('discountAmount');
        if (discountInput) discountInput.value = '';
        
        renderCart();
        renderPOSProducts();
        
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
    if (!tbody) return; // Exit if element doesn't exist
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hay productos registrados</td></tr>';
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

// Variables globales para retiros
const LIMITE_PERDIDAS_DIA = 150000; // $150k límite diario
let historialRetiros = [];

// Datos de prueba para retiros
const testRetiros = [
    {
        id: 1,
        fecha: new Date().toISOString(),
        productos: [{nombre: 'Cerveza Corona 330ml', cantidad: 2, precio: 2800}],
        motivo: 'consumo_interno',
        observaciones: 'Consumo del personal',
        total: 5600
    },
    {
        id: 2,
        fecha: new Date(Date.now() - 86400000).toISOString(),
        productos: [{nombre: 'Vino Santa Rita 750ml', cantidad: 1, precio: 8500}],
        motivo: 'perdida',
        observaciones: 'Botella rota durante transporte',
        total: 8500
    }
];

function initRetirosModule() {
    if (!historialRetiros.length) {
        historialRetiros = [...testRetiros];
    }
    
    updateRetirosStats();
    checkAlertas();
    renderHistorialRetiros();
    bindRetirosEvents();
}

function bindRetirosEvents() {
    const clearBtn = document.getElementById('clearRetiroCart');
    const processBtn = document.getElementById('processRetiro');
    const filtroMotivo = document.getElementById('filtroMotivo');
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    
    if (clearBtn) clearBtn.onclick = clearRetiroCart;
    if (processBtn) processBtn.onclick = processRetiro;
    if (filtroMotivo) filtroMotivo.onchange = renderHistorialRetiros;
    if (filtroPeriodo) filtroPeriodo.onchange = renderHistorialRetiros;
}

function updateRetirosStats() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const retirosHoy = historialRetiros.filter(r => 
        new Date(r.fecha) >= hoy
    );
    
    const perdidasHoy = retirosHoy.reduce((sum, r) => sum + r.total, 0);
    const itemsHoy = retirosHoy.reduce((sum, r) => 
        sum + r.productos.reduce((pSum, p) => pSum + p.cantidad, 0), 0
    );
    
    // Calcular promedio semanal
    const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    const retirosSemanales = historialRetiros.filter(r => 
        new Date(r.fecha) >= semanaAtras
    );
    const promedioSemanal = retirosSemanales.length > 0 
        ? retirosSemanales.reduce((sum, r) => sum + r.total, 0) / 7
        : 0;
    
    // Actualizar DOM
    const perdidasEl = document.getElementById('perdidasHoy');
    const itemsEl = document.getElementById('itemsRetiradosHoy');
    const promedioEl = document.getElementById('promedioSemanal');
    
    if (perdidasEl) perdidasEl.textContent = `$${formatPrice(perdidasHoy)}`;
    if (itemsEl) itemsEl.textContent = itemsHoy.toString();
    if (promedioEl) promedioEl.textContent = `$${formatPrice(promedioSemanal)}`;
}

function checkAlertas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const retirosHoy = historialRetiros.filter(r => 
        new Date(r.fecha) >= hoy
    );
    
    const perdidasHoy = retirosHoy.reduce((sum, r) => sum + r.total, 0);
    const alertaCard = document.getElementById('alertaPerdidas');
    const alertaMensaje = document.getElementById('alertaMensaje');
    
    if (perdidasHoy > LIMITE_PERDIDAS_DIA) {
        if (alertaCard && alertaMensaje) {
            alertaMensaje.textContent = `Las pérdidas de hoy ($${formatPrice(perdidasHoy)}) exceden el límite recomendado de $${formatPrice(LIMITE_PERDIDAS_DIA)}`;
            alertaCard.style.display = 'flex';
        }
    } else if (alertaCard) {
        alertaCard.style.display = 'none';
    }
}

function processRetiro() {
    if (state.retiroCart.length === 0) {
        alert('⚠️ No hay productos en el carrito');
        return;
    }
    
    const motivo = document.getElementById('motivoRetiro')?.value || 'otro';
    const observaciones = document.getElementById('observacionesRetiro')?.value || '';
    
    const nuevoRetiro = {
        id: historialRetiros.length + 1,
        fecha: new Date().toISOString(),
        productos: state.retiroCart.map(item => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio
        })),
        motivo: motivo,
        observaciones: observaciones,
        total: state.retiroCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    };
    
    // Actualizar stock
    state.retiroCart.forEach(item => {
        const producto = state.productos.find(p => p.id === item.id);
        if (producto) {
            producto.stock -= item.cantidad;
        }
    });
    
    historialRetiros.push(nuevoRetiro);
    state.retiroCart = [];
    
    // Limpiar formulario
    const motivoEl = document.getElementById('motivoRetiro');
    const obsEl = document.getElementById('observacionesRetiro');
    if (motivoEl) motivoEl.value = 'consumo_interno';
    if (obsEl) obsEl.value = '';
    
    renderRetiroCart();
    updateRetirosStats();
    checkAlertas();
    renderHistorialRetiros();
    renderRetiroProducts();
    
    alert('✅ Retiro procesado correctamente');
}

function renderHistorialRetiros() {
    const tbody = document.getElementById('historialRetiros');
    if (!tbody) return;
    
    const filtroMotivo = document.getElementById('filtroMotivo')?.value || '';
    const filtroPeriodo = document.getElementById('filtroPeriodo')?.value || 'hoy';
    
    let filtered = [...historialRetiros];
    
    // Filtrar por motivo
    if (filtroMotivo) {
        filtered = filtered.filter(r => r.motivo === filtroMotivo);
    }
    
    // Filtrar por período
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (filtroPeriodo === 'hoy') {
        filtered = filtered.filter(r => new Date(r.fecha) >= hoy);
    } else if (filtroPeriodo === 'semana') {
        const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.fecha) >= semanaAtras);
    } else if (filtroPeriodo === 'mes') {
        const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.fecha) >= mesAtras);
    }
    
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No hay retiros para mostrar</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(retiro => {
        const fecha = new Date(retiro.fecha);
        const motivosMap = {
            'consumo_interno': '🍺 Consumo Interno',
            'perdida': '💔 Pérdida/Rotura',
            'vencido': '📅 Vencido',
            'deteriorado': '⚠️ Deteriorado',
            'muestra': '🎁 Muestra',
            'inventario': '📋 Ajuste',
            'otro': '❓ Otro'
        };
        
        const productosText = retiro.productos.map(p => 
            `${p.nombre} (${p.cantidad})`
        ).join(', ');
        
        return `
            <tr>
                <td>${fecha.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</td>
                <td title="${productosText}">${retiro.productos.length === 1 ? productosText : `${retiro.productos.length} productos`}</td>
                <td>${retiro.productos.reduce((sum, p) => sum + p.cantidad, 0)}</td>
                <td>$${formatPrice(retiro.total)}</td>
                <td>${motivosMap[retiro.motivo] || '❓ Otro'}</td>
                <td title="${retiro.observaciones || 'Sin observaciones'}">${retiro.observaciones ? (retiro.observaciones.length > 30 ? retiro.observaciones.substring(0, 30) + '...' : retiro.observaciones) : '-'}</td>
            </tr>
        `;
    }).join('');
}

function clearRetiroCart() {
    if (confirm('¿Estás seguro de limpiar el carrito?')) {
        state.retiroCart = [];
        renderRetiroCart();
    }
}

function renderRetiroCart() {
    const container = document.getElementById('retiroCartItems');
    const itemCount = document.getElementById('retiroItemCount');
    const total = document.getElementById('retiroTotal');
    const impacto = document.getElementById('impactoPerdidas');
    
    if (!container) return;
    
    if (state.retiroCart.length === 0) {
        container.innerHTML = '<div class="cart-empty">🛒 No hay productos para retirar</div>';
        if (itemCount) itemCount.textContent = '0';
        if (total) total.textContent = '$0';
        if (impacto) impacto.textContent = '$0';
        return;
    }
    
    const totalAmount = state.retiroCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const totalItems = state.retiroCart.reduce((sum, item) => sum + item.cantidad, 0);
    
    if (itemCount) itemCount.textContent = totalItems.toString();
    if (total) total.textContent = `$${formatPrice(totalAmount)}`;
    if (impacto) impacto.textContent = `$${formatPrice(totalAmount)}`;
    
    container.innerHTML = state.retiroCart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">$${formatPrice(item.precio)} c/u</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateRetiroQuantity(${item.id}, -1)" class="quantity-btn">-</button>
                <span class="quantity">${item.cantidad}</span>
                <button onclick="updateRetiroQuantity(${item.id}, 1)" class="quantity-btn">+</button>
                <button onclick="removeFromRetiroCart(${item.id})" class="remove-btn">🗑️</button>
            </div>
            <div class="cart-item-total">$${formatPrice(item.precio * item.cantidad)}</div>
        </div>
    `).join('');
}

function updateRetiroQuantity(productoId, change) {
    const item = state.retiroCart.find(i => i.id === productoId);
    const producto = state.productos.find(p => p.id === productoId);
    
    if (!item || !producto) return;
    
    const newQuantity = item.cantidad + change;
    
    if (newQuantity <= 0) {
        removeFromRetiroCart(productoId);
        return;
    }
    
    if (newQuantity > producto.stock) {
        alert('⚠️ No hay suficiente stock');
        return;
    }
    
    item.cantidad = newQuantity;
    renderRetiroCart();
}

function removeFromRetiroCart(productoId) {
    state.retiroCart = state.retiroCart.filter(item => item.id !== productoId);
    renderRetiroCart();
}

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

// ============== REPORTES MODULE ==============
let reportesData = {
    ventas: [],
    filtros: {
        periodo: 'hoy',
        fechaDesde: '',
        fechaHasta: '',
        metodo: ''
    }
};

function initReportesModule() {
    console.log('🚀 Inicializando módulo de reportes...');
    
    // Event listeners para tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchReportTab(btn.dataset.tab));
    });
    
    // Event listeners para filtros
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', handlePeriodoChange);
    }
    
    const metodoFilter = document.getElementById('metodoFilter');
    if (metodoFilter) {
        metodoFilter.addEventListener('change', () => {
            reportesData.filtros.metodo = metodoFilter.value;
            aplicarFiltrosReporte();
        });
    }
    
    const aplicarFiltros = document.getElementById('aplicarFiltros');
    if (aplicarFiltros) {
        aplicarFiltros.addEventListener('click', aplicarFiltrosReporte);
    }
    
    const limpiarFiltros = document.getElementById('limpiarFiltros');
    if (limpiarFiltros) {
        limpiarFiltros.addEventListener('click', limpiarFiltrosReporte);
    }
    
    const searchVentas = document.getElementById('searchVentas');
    if (searchVentas) {
        searchVentas.addEventListener('input', debounce(filtrarVentasEnTabla, 300));
    }
    
    // Inicializar filtros con fechas por defecto
    actualizarFechasPorPeriodo();
    
    // Cargar datos iniciales
    loadReportesData();
    updateReportesStats();
    renderReportTabs();
}

function switchReportTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    
    // Cargar contenido específico del tab
    switch(tabName) {
        case 'ventas':
            renderVentasTable();
            break;
        case 'productos':
            renderProductosRanking();
            break;
        case 'inventario':
            renderInventarioAlerts();
            break;
        case 'graficos':
            renderGraficos();
            break;
    }
}

function handlePeriodoChange() {
    const periodoSelect = document.getElementById('periodoFilter');
    const fechasDiv = document.getElementById('fechasPersonalizadas');
    
    if (!periodoSelect || !fechasDiv) return;
    
    const periodo = periodoSelect.value;
    
    if (periodo === 'personalizado') {
        fechasDiv.style.display = 'flex';
        fechasDiv.style.gap = '1rem';
        fechasDiv.style.alignItems = 'center';
        
        // Establecer fechas por defecto para el modo personalizado
        const hoy = new Date();
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        
        const fechaDesdeInput = document.getElementById('fechaDesde');
        const fechaHastaInput = document.getElementById('fechaHasta');
        
        if (fechaDesdeInput && !fechaDesdeInput.value) {
            fechaDesdeInput.value = hace7dias.toISOString().split('T')[0];
        }
        if (fechaHastaInput && !fechaHastaInput.value) {
            fechaHastaInput.value = hoy.toISOString().split('T')[0];
        }
    } else {
        fechasDiv.style.display = 'none';
    }
    
    reportesData.filtros.periodo = periodo;
    actualizarFechasPorPeriodo();
    
    // Aplicar filtros automáticamente cuando cambia el período
    setTimeout(aplicarFiltrosReporte, 100);
}

function actualizarFechasPorPeriodo() {
    const hoy = new Date();
    const periodo = reportesData.filtros.periodo;
    
    switch(periodo) {
        case 'hoy':
            reportesData.filtros.fechaDesde = hoy.toISOString().split('T')[0];
            reportesData.filtros.fechaHasta = hoy.toISOString().split('T')[0];
            break;
        case 'ayer':
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);
            reportesData.filtros.fechaDesde = ayer.toISOString().split('T')[0];
            reportesData.filtros.fechaHasta = ayer.toISOString().split('T')[0];
            break;
        case 'semana':
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay());
            reportesData.filtros.fechaDesde = inicioSemana.toISOString().split('T')[0];
            reportesData.filtros.fechaHasta = hoy.toISOString().split('T')[0];
            break;
        case 'mes':
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            reportesData.filtros.fechaDesde = inicioMes.toISOString().split('T')[0];
            reportesData.filtros.fechaHasta = hoy.toISOString().split('T')[0];
            break;
    }
}

function aplicarFiltrosReporte() {
    const metodoFilter = document.getElementById('metodoFilter');
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    
    if (metodoFilter) {
        reportesData.filtros.metodo = metodoFilter.value;
    }
    
    if (reportesData.filtros.periodo === 'personalizado') {
        if (fechaDesdeInput && fechaDesdeInput.value) {
            reportesData.filtros.fechaDesde = fechaDesdeInput.value;
        }
        if (fechaHastaInput && fechaHastaInput.value) {
            reportesData.filtros.fechaHasta = fechaHastaInput.value;
        }
    }
    
    loadReportesData();
    updateReportesStats();
    renderReportTabs();
    
    console.log('🔍 Filtros aplicados:', reportesData.filtros);
    
    // Mostrar notificación de filtros aplicados
    mostrarNotificacionFiltros();
}

function mostrarNotificacionFiltros() {
    const filtrosActivos = [];
    
    if (reportesData.filtros.periodo !== 'hoy') {
        filtrosActivos.push(`Período: ${reportesData.filtros.periodo}`);
    }
    
    if (reportesData.filtros.metodo) {
        filtrosActivos.push(`Método: ${reportesData.filtros.metodo}`);
    }
    
    if (reportesData.filtros.fechaDesde && reportesData.filtros.fechaHasta) {
        filtrosActivos.push(`Desde: ${reportesData.filtros.fechaDesde} hasta ${reportesData.filtros.fechaHasta}`);
    }
    
    if (filtrosActivos.length > 0) {
        console.log('✅ Filtros activos:', filtrosActivos.join(', '));
    }
}

function filtrarVentasEnTabla() {
    const searchInput = document.getElementById('searchVentas');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const tbody = document.getElementById('ventasTable');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let shouldShow = false;
        
        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().includes(searchTerm)) {
                shouldShow = true;
                break;
            }
        }
        
        row.style.display = shouldShow ? '' : 'none';
    }
}

function limpiarFiltrosReporte() {
    const periodoFilter = document.getElementById('periodoFilter');
    const metodoFilter = document.getElementById('metodoFilter');
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');
    const fechasDiv = document.getElementById('fechasPersonalizadas');
    const searchVentas = document.getElementById('searchVentas');
    
    if (periodoFilter) periodoFilter.value = 'hoy';
    if (metodoFilter) metodoFilter.value = '';
    if (fechaDesde) fechaDesde.value = '';
    if (fechaHasta) fechaHasta.value = '';
    if (fechasDiv) fechasDiv.style.display = 'none';
    if (searchVentas) searchVentas.value = '';
    
    reportesData.filtros = {
        periodo: 'hoy',
        fechaDesde: '',
        fechaHasta: '',
        metodo: ''
    };
    
    actualizarFechasPorPeriodo();
    aplicarFiltrosReporte();
    
    console.log('🗑️ Filtros limpiados');
}

function loadReportesData() {
    // Generar datos de prueba para ventas con diferentes fechas
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const antesDeAyer = new Date(hoy);
    antesDeAyer.setDate(antesDeAyer.getDate() - 2);
    
    const ventasEjemplo = [
        // Ventas de hoy
        {
            id: 'V001',
            fecha: new Date().toISOString(),
            total: 15000,
            metodo: 'efectivo',
            productos: [
                {nombre: 'Cerveza Cristal 350ml', cantidad: 6, precio: 1200},
                {nombre: 'Pisco Capel 35°', cantidad: 1, precio: 6500},
                {nombre: 'Papas Lays Original', cantidad: 2, precio: 1300}
            ]
        },
        {
            id: 'V002',
            fecha: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
            total: 8500,
            metodo: 'tarjeta',
            productos: [
                {nombre: 'Vino Casillero del Diablo', cantidad: 1, precio: 5500},
                {nombre: 'Coca Cola 500ml', cantidad: 3, precio: 1000}
            ]
        },
        {
            id: 'V003',
            fecha: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
            total: 12400,
            metodo: 'transferencia',
            productos: [
                {nombre: 'Cerveza Cristal 350ml', cantidad: 4, precio: 1200},
                {nombre: 'Vino Casillero del Diablo', cantidad: 1, precio: 5500},
                {nombre: 'Coca Cola 500ml', cantidad: 2, precio: 1000},
                {nombre: 'Papas Lays Original', cantidad: 1, precio: 1300}
            ]
        },
        // Ventas de ayer
        {
            id: 'V004',
            fecha: ayer.toISOString(),
            total: 22000,
            metodo: 'efectivo',
            productos: [
                {nombre: 'Pisco Capel 35°', cantidad: 2, precio: 6500},
                {nombre: 'Cerveza Cristal 350ml', cantidad: 8, precio: 1200}
            ]
        },
        {
            id: 'V005',
            fecha: new Date(ayer.getTime() + 7200000).toISOString(),
            total: 13800,
            metodo: 'tarjeta',
            productos: [
                {nombre: 'Vino Casillero del Diablo', cantidad: 2, precio: 5500},
                {nombre: 'Papas Lays Original', cantidad: 2, precio: 1300},
                {nombre: 'Coca Cola 500ml', cantidad: 1, precio: 1000}
            ]
        },
        // Ventas de hace 2 días
        {
            id: 'V006',
            fecha: antesDeAyer.toISOString(),
            total: 19500,
            metodo: 'transferencia',
            productos: [
                {nombre: 'Pisco Capel 35°', cantidad: 1, precio: 6500},
                {nombre: 'Vino Casillero del Diablo', cantidad: 1, precio: 5500},
                {nombre: 'Cerveza Cristal 350ml', cantidad: 6, precio: 1200},
                {nombre: 'Coca Cola 500ml', cantidad: 1, precio: 1000}
            ]
        }
    ];
    
    // Filtrar según los filtros activos
    reportesData.ventas = ventasEjemplo.filter(venta => {
        const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
        
        // Verificar rango de fechas
        let enRangoFecha = true;
        if (reportesData.filtros.fechaDesde && reportesData.filtros.fechaHasta) {
            enRangoFecha = fechaVenta >= reportesData.filtros.fechaDesde && 
                          fechaVenta <= reportesData.filtros.fechaHasta;
        }
        
        // Verificar método de pago
        const coincideMetodo = !reportesData.filtros.metodo || venta.metodo === reportesData.filtros.metodo;
        
        return enRangoFecha && coincideMetodo;
    });
    
    console.log(`📊 Cargadas ${reportesData.ventas.length} ventas con filtros aplicados`);
    
    // Log detalle de filtros aplicados
    if (reportesData.filtros.fechaDesde && reportesData.filtros.fechaHasta) {
        console.log(`📅 Rango de fechas: ${reportesData.filtros.fechaDesde} - ${reportesData.filtros.fechaHasta}`);
    }
    if (reportesData.filtros.metodo) {
        console.log(`💳 Método filtrado: ${reportesData.filtros.metodo}`);
    }
}

function updateReportesStats() {
    const ventas = reportesData.ventas;
    
    // Calcular estadísticas
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalTransacciones = ventas.length;
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
    
    const productosVendidos = ventas.reduce((total, venta) => {
        return total + venta.productos.reduce((sum, p) => sum + p.cantidad, 0);
    }, 0);
    
    // Calcular ganancia (asumiendo 30% de margen promedio)
    const gananciaEstimada = totalVentas * 0.3;
    const margen = totalVentas > 0 ? ((gananciaEstimada / totalVentas) * 100).toFixed(1) : 0;
    
    // Actualizar elementos
    const ventasDiaEl = document.getElementById('ventasDiaReporte');
    if (ventasDiaEl) ventasDiaEl.textContent = `$${formatPrice(totalVentas)}`;
    
    const gananciaBrutaEl = document.getElementById('gananciaBruta');
    if (gananciaBrutaEl) gananciaBrutaEl.textContent = `$${formatPrice(gananciaEstimada)}`;
    
    const margenEl = document.getElementById('margenGanancia');
    if (margenEl) margenEl.textContent = `${margen}%`;
    
    const productosVendidosEl = document.getElementById('productosVendidos');
    if (productosVendidosEl) productosVendidosEl.textContent = productosVendidos;
    
    const totalTransaccionesEl = document.getElementById('totalTransacciones');
    if (totalTransaccionesEl) totalTransaccionesEl.textContent = totalTransacciones;
    
    const ticketPromedioEl = document.getElementById('ticketPromedio');
    if (ticketPromedioEl) ticketPromedioEl.textContent = `$${formatPrice(ticketPromedio)}`;
    
    const ultimaActualizacionEl = document.getElementById('ultimaActualizacion');
    if (ultimaActualizacionEl) {
        ultimaActualizacionEl.textContent = new Date().toLocaleTimeString('es-CL');
    }
}

function renderReportTabs() {
    // Renderizar el tab activo
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'ventas';
    switchReportTab(activeTab);
}

function renderVentasTable() {
    const tbody = document.getElementById('ventasTable');
    if (!tbody) return;
    
    if (reportesData.ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No hay ventas en el período seleccionado</td></tr>';
        return;
    }
    
    tbody.innerHTML = reportesData.ventas.map(venta => {
        const fecha = new Date(venta.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-CL');
        const horaFormateada = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <tr>
                <td><strong>${venta.id}</strong></td>
                <td>
                    📅 ${fechaFormateada}<br>
                    🕐 ${horaFormateada}
                </td>
                <td><strong>$${formatPrice(venta.total)}</strong></td>
                <td>
                    <span class="badge ${getMetodoBadgeClass(venta.metodo)}">
                        ${getMetodoIcon(venta.metodo)} ${capitalize(venta.metodo)}
                    </span>
                </td>
                <td>${venta.productos.length} item${venta.productos.length !== 1 ? 's' : ''}</td>
                <td>
                    <button class="btn-icon" onclick="showVentaDetail('${venta.id}')" title="Ver detalle">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderProductosRanking() {
    const container = document.getElementById('productosRanking');
    if (!container) return;
    
    // Consolidar productos vendidos
    const productosMap = new Map();
    
    reportesData.ventas.forEach(venta => {
        venta.productos.forEach(producto => {
            const key = producto.nombre;
            if (productosMap.has(key)) {
                const existing = productosMap.get(key);
                existing.cantidad += producto.cantidad;
                existing.revenue += producto.cantidad * producto.precio;
            } else {
                productosMap.set(key, {
                    nombre: producto.nombre,
                    cantidad: producto.cantidad,
                    precio: producto.precio,
                    revenue: producto.cantidad * producto.precio
                });
            }
        });
    });
    
    // Convertir a array y ordenar por cantidad vendida
    const productos = Array.from(productosMap.values())
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10); // Top 10
    
    if (productos.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No hay datos de productos en el período seleccionado</div>';
        return;
    }
    
    container.innerHTML = productos.map((producto, index) => `
        <div class="ranking-item">
            <div class="ranking-position">#${index + 1}</div>
            <div class="ranking-details">
                <h4>${producto.nombre}</h4>
                <div class="ranking-stats">
                    📦 ${producto.cantidad} unidades vendidas • 💰 $${formatPrice(producto.revenue)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderInventarioAlerts() {
    const criticoContainer = document.getElementById('stockCritico');
    const bajoContainer = document.getElementById('stockBajo');
    const normalContainer = document.getElementById('stockNormal');
    
    if (!criticoContainer || !bajoContainer || !normalContainer) return;
    
    const productosActivos = state.productos.filter(p => p.activo);
    
    const stockCritico = productosActivos.filter(p => p.stock === 0);
    const stockBajo = productosActivos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo);
    const stockNormal = productosActivos.filter(p => p.stock > p.stock_minimo);
    
    // Render stock crítico
    if (stockCritico.length === 0) {
        criticoContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-muted);">✅ No hay productos agotados</div>';
    } else {
        criticoContainer.innerHTML = stockCritico.map(p => `
            <div class="inventory-item critico">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small>Código: ${p.codigo}</small>
                </div>
                <div style="color: var(--danger); font-weight: bold;">AGOTADO</div>
            </div>
        `).join('');
    }
    
    // Render stock bajo
    if (stockBajo.length === 0) {
        bajoContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-muted);">✅ No hay productos con stock bajo</div>';
    } else {
        bajoContainer.innerHTML = stockBajo.map(p => `
            <div class="inventory-item bajo">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small>Código: ${p.codigo}</small>
                </div>
                <div style="color: var(--warning); font-weight: bold;">${p.stock} unidades</div>
            </div>
        `).join('');
    }
    
    // Render stock normal (solo los primeros 10)
    const stockNormalMuestra = stockNormal.slice(0, 10);
    normalContainer.innerHTML = stockNormalMuestra.map(p => `
        <div class="inventory-item normal">
            <div>
                <strong>${p.nombre}</strong><br>
                <small>Código: ${p.codigo}</small>
            </div>
            <div style="color: var(--success); font-weight: bold;">${p.stock} unidades</div>
        </div>
    `).join('');
    
    if (stockNormal.length > 10) {
        normalContainer.innerHTML += `<div style="text-align: center; padding: 1rem; color: var(--text-muted);">... y ${stockNormal.length - 10} productos más con stock normal</div>`;
    }
}

function renderGraficos() {
    renderVentasPorHora();
    renderVentasPorCategoria();
    renderMetodosPago();
}

function renderVentasPorHora() {
    const container = document.getElementById('horasChart');
    if (!container) return;
    
    // Inicializar array de 24 horas
    const ventasPorHora = new Array(24).fill(0);
    
    reportesData.ventas.forEach(venta => {
        const hora = new Date(venta.fecha).getHours();
        ventasPorHora[hora] += venta.total;
    });
    
    const maxVenta = Math.max(...ventasPorHora);
    
    container.innerHTML = ventasPorHora.map((venta, hora) => {
        const altura = maxVenta > 0 ? (venta / maxVenta) * 100 : 0;
        return `
            <div class="chart-bar" 
                 style="height: ${altura}%" 
                 data-value="${hora}:00"
                 title="$${formatPrice(venta)}">
            </div>
        `;
    }).join('');
}

function renderVentasPorCategoria() {
    const container = document.getElementById('categoriaChart');
    if (!container) return;
    
    const categorias = new Map();
    let totalVentas = 0;
    
    reportesData.ventas.forEach(venta => {
        venta.productos.forEach(producto => {
            const categoria = getProductoCategoria(producto.nombre);
            const revenue = producto.cantidad * producto.precio;
            
            if (categorias.has(categoria)) {
                categorias.set(categoria, categorias.get(categoria) + revenue);
            } else {
                categorias.set(categoria, revenue);
            }
            totalVentas += revenue;
        });
    });
    
    container.innerHTML = Array.from(categorias.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, venta]) => {
            const porcentaje = totalVentas > 0 ? ((venta / totalVentas) * 100).toFixed(1) : 0;
            return `
                <div class="breakdown-item">
                    <div class="item-label">${getCategoriaIcon(categoria)} ${categoria}</div>
                    <div class="item-bar">
                        <div class="item-progress" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="item-value">$${formatPrice(venta)}</div>
                </div>
            `;
        }).join('');
}

function renderMetodosPago() {
    const container = document.getElementById('metodosChart');
    if (!container) return;
    
    const metodos = new Map();
    let totalVentas = 0;
    
    reportesData.ventas.forEach(venta => {
        if (metodos.has(venta.metodo)) {
            metodos.set(venta.metodo, metodos.get(venta.metodo) + venta.total);
        } else {
            metodos.set(venta.metodo, venta.total);
        }
        totalVentas += venta.total;
    });
    
    container.innerHTML = Array.from(metodos.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([metodo, venta]) => {
            const porcentaje = totalVentas > 0 ? ((venta / totalVentas) * 100).toFixed(1) : 0;
            return `
                <div class="method-item">
                    <div class="item-label">${getMetodoIcon(metodo)} ${capitalize(metodo)}</div>
                    <div class="item-bar">
                        <div class="item-progress" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="item-value">$${formatPrice(venta)}</div>
                </div>
            `;
        }).join('');
}

// Funciones auxiliares
function getMetodoBadgeClass(metodo) {
    const classes = {
        'efectivo': 'success',
        'tarjeta': 'primary',
        'transferencia': 'info'
    };
    return classes[metodo] || 'secondary';
}

function getMetodoIcon(metodo) {
    const icons = {
        'efectivo': '💵',
        'tarjeta': '💳',
        'transferencia': '🏦'
    };
    return icons[metodo] || '💰';
}

function getCategoriaIcon(categoria) {
    const icons = {
        'Cervezas': '🍺',
        'Vinos': '🍷',
        'Licores': '🥃',
        'Bebidas': '🥤',
        'Snacks': '🍟'
    };
    return icons[categoria] || '📦';
}

function getProductoCategoria(nombreProducto) {
    if (nombreProducto.toLowerCase().includes('cerveza')) return 'Cervezas';
    if (nombreProducto.toLowerCase().includes('vino')) return 'Vinos';
    if (nombreProducto.toLowerCase().includes('pisco') || nombreProducto.toLowerCase().includes('licor')) return 'Licores';
    if (nombreProducto.toLowerCase().includes('coca') || nombreProducto.toLowerCase().includes('bebida')) return 'Bebidas';
    if (nombreProducto.toLowerCase().includes('papas') || nombreProducto.toLowerCase().includes('snack')) return 'Snacks';
    return 'Otros';
}

function showVentaDetail(ventaId) {
    const venta = reportesData.ventas.find(v => v.id === ventaId);
    if (!venta) return;
    
    const modal = document.getElementById('ventaModal');
    const detail = document.getElementById('ventaDetail');
    
    if (modal && detail) {
        const fecha = new Date(venta.fecha);
        
        detail.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h3>Venta ${venta.id}</h3>
                <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-CL')} ${fecha.toLocaleTimeString('es-CL')}</p>
                <p><strong>Método:</strong> ${getMetodoIcon(venta.metodo)} ${capitalize(venta.metodo)}</p>
            </div>
            
            <h4>Productos:</h4>
            <table class="data-table" style="margin-bottom: 1rem;">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.productos.map(p => `
                        <tr>
                            <td>${p.nombre}</td>
                            <td>${p.cantidad}</td>
                            <td>$${formatPrice(p.precio)}</td>
                            <td>$${formatPrice(p.cantidad * p.precio)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="text-align: right; font-size: var(--text-lg); font-weight: bold;">
                Total: $${formatPrice(venta.total)}
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Cerrar modal
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
        
        window.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// ============== MODO VENTA RÁPIDA ==============

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

function toggleDiscountControls() {
    const controls = document.getElementById('discountControls');
    const button = document.getElementById('toggleDiscount');
    
    if (controls && button) {
        const isVisible = controls.style.display !== 'none';
        controls.style.display = isVisible ? 'none' : 'block';
        button.innerHTML = isVisible ? '<span class="btn-icon">➕</span>' : '<span class="btn-icon">➖</span>';
    }
}

function applyQuickDiscount(amount) {
    const input = document.getElementById('discountAmount');
    if (input) {
        input.value = amount;
        applyDiscount();
    }
}

function applyDiscount() {
    const input = document.getElementById('discountAmount');
    state.discountAmount = parseFloat(input?.value) || 0;
    updateCartSummary();
}

function clearDiscount() {
    const input = document.getElementById('discountAmount');
    if (input) {
        input.value = '';
        state.discountAmount = 0;
        updateCartSummary();
    }
}

function handleKeyboardShortcuts(event) {
    // Solo procesar atajos en vista POS
    if (state.currentView !== 'pos') return;
    
    // Prevenir comportamiento por defecto para F1, F2, F3
    if (event.key === 'F1' || event.key === 'F2' || event.key === 'F3') {
        event.preventDefault();
    }
    
    switch (event.key) {
        case 'F1':
            // Efectivo y procesar
            selectPaymentMethod('efectivo');
            setTimeout(() => {
                if (state.cart.length > 0) {
                    processPayment();
                }
            }, 100);
            break;
            
        case 'F2':
            // Tarjeta y procesar  
            selectPaymentMethod('tarjeta');
            setTimeout(() => {
                if (state.cart.length > 0) {
                    processPayment();
                }
            }, 100);
            break;
            
        case 'F3':
            // Transferencia y procesar
            selectPaymentMethod('transferencia');
            setTimeout(() => {
                if (state.cart.length > 0) {
                    processPayment();
                }
            }, 100);
            break;
            
        case 'F4':
            // Toggle modo rápido
            const toggle = document.getElementById('quickModeToggle');
            if (toggle) {
                toggle.checked = !toggle.checked;
                toggleQuickMode();
            }
            break;
            
        case 'Escape':
            // Limpiar carrito
            clearCart();
            break;
    }
}

// Sobrescribir addToCart para soportar modo rápido
function addToCartQuickMode(productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) return;
    
    if (state.quickModeActive) {
        // En modo rápido, agregar directamente
        addToCart(productoId);
        
        // Opcional: Auto-scroll al carrito en móviles
        if (window.innerWidth <= 768) {
            const cartPanel = document.querySelector('.cart-panel');
            if (cartPanel) {
                cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    } else {
        // Modo normal, comportamiento estándar
        addToCart(productoId);
    }
}

function updateCartSummary() {
    const itemCountEl = document.getElementById('cartItemCount');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountRowEl = document.getElementById('discountRow');
    const discountLabelEl = document.getElementById('discountLabel');
    const discountDisplayEl = document.getElementById('discountDisplay');
    const totalEl = document.getElementById('cartTotal');
    const paymentTotalEl = document.getElementById('paymentTotal');
    
    const itemCount = state.cart.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = Math.max(0, subtotal + state.discountAmount); // No permitir totales negativos
    
    if (itemCountEl) itemCountEl.textContent = itemCount.toString();
    if (subtotalEl) subtotalEl.textContent = `$${formatPrice(subtotal)}`;
    if (totalEl) totalEl.textContent = `$${formatPrice(total)}`;
    if (paymentTotalEl) paymentTotalEl.textContent = `$${formatPrice(total)}`;
    
    // Mostrar/ocultar fila de descuento
    if (discountRowEl && discountLabelEl && discountDisplayEl) {
        if (state.discountAmount !== 0) {
            discountRowEl.style.display = 'flex';
            discountLabelEl.textContent = state.discountAmount > 0 ? 'Recargo:' : 'Descuento:';
            discountDisplayEl.textContent = `$${formatPrice(Math.abs(state.discountAmount))}`;
            discountDisplayEl.style.color = state.discountAmount > 0 ? '#dc2626' : '#059669';
        } else {
            discountRowEl.style.display = 'none';
        }
    }
}

// ============== FIN MODO VENTA RÁPIDA ==============

// Inicializar reportes si estamos en la página correcta
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ventasDiaReporte')) {
        initReportesModule();
    }
});
