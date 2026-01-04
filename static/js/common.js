// ============== CONFIGURACIÓN GLOBAL ==============
const API_URL = '/api';

// ============== ESTADO GLOBAL COMPARTIDO ==============
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

// ============== UTILIDADES DE FORMATO ==============
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// ============== API HELPERS ==============
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error en API ${endpoint}:`, error);
        throw error;
    }
}

async function loadProductos() {
    try {
        state.productos = await fetchAPI('/productos');
        console.log(`✅ ${state.productos.length} productos cargados`);
        return state.productos;
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showNotification('Error al cargar productos', 'error');
        return [];
    }
}

// ============== NOTIFICACIONES ==============
function showNotification(message, type = 'info', duration = 3000) {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        padding: 16px 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `
        <span style="font-size: 20px;">${icon}</span>
        <span style="flex: 1; color: #1f2937; font-weight: 500;">${message}</span>
    `;

    container.appendChild(notification);

    // Sonido
    if (type === 'success') sound.success();
    else if (type === 'error') sound.error();
    else if (type === 'warning') sound.warning();

    // Auto-remover
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Agregar estilos de animación
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============== VALIDACIONES ==============
function validateProductForm(data) {
    const errors = [];

    if (!data.codigo || data.codigo.trim() === '') {
        errors.push('El código del producto es obligatorio');
    }

    if (!data.nombre || data.nombre.trim() === '') {
        errors.push('El nombre del producto es obligatorio');
    }

    if (!data.precio_venta || data.precio_venta <= 0) {
        errors.push('El precio de venta debe ser mayor a 0');
    }

    if (!data.precio_compra || data.precio_compra <= 0) {
        errors.push('El precio de compra debe ser mayor a 0');
    }

    if (data.precio_venta < data.precio_compra) {
        errors.push('El precio de venta no puede ser menor al precio de compra');
    }

    return errors;
}

// ============== BÚSQUEDA Y FILTROS ==============
function filterProducts(productos, filters = {}) {
    let filtered = [...productos];

    // Filtro de búsqueda por texto
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.nombre?.toLowerCase().includes(searchLower) ||
            p.codigo?.toLowerCase().includes(searchLower) ||
            p.marca?.toLowerCase().includes(searchLower)
        );
    }

    // Filtro por categoría
    if (filters.categoria && filters.categoria !== '') {
        filtered = filtered.filter(p => p.categoria === filters.categoria);
    }

    // Filtro por marca
    if (filters.marca && filters.marca !== '') {
        filtered = filtered.filter(p => p.marca === filters.marca);
    }

    // Filtro por unidad
    if (filters.unidad && filters.unidad !== '') {
        filtered = filtered.filter(p => p.unidad_medida === filters.unidad);
    }

    // Filtro por stock bajo
    if (filters.stockBajo) {
        filtered = filtered.filter(p => p.stock <= p.stock_minimo);
    }

    return filtered;
}

// ============== CÁLCULOS ==============
function calculateCartTotal(cart) {
    return cart.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
}

function calculateCartItems(cart) {
    return cart.reduce((sum, item) => sum + item.cantidad, 0);
}

function calculateProfit(precioCompra, precioVenta) {
    if (!precioCompra || !precioVenta) return 0;
    const profit = precioVenta - precioCompra;
    const margin = (profit / precioVenta) * 100;
    return margin.toFixed(1);
}

// ============== STORAGE HELPERS ==============
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// ============== EXPORTAR PARA USO GLOBAL ==============
window.state = state;
window.sound = sound;
window.API_URL = API_URL;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.fetchAPI = fetchAPI;
window.loadProductos = loadProductos;
window.showNotification = showNotification;
window.validateProductForm = validateProductForm;
window.filterProducts = filterProducts;
window.calculateCartTotal = calculateCartTotal;
window.calculateCartItems = calculateCartItems;
window.calculateProfit = calculateProfit;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
