/* =========================
   CONFIGURACIÓN GLOBAL OPTIMIZADA - CORREGIDA
========================= */
'use strict';

// Elementos DOM cacheados
const DOM = {
    search: {
        form: document.getElementById('searchForm'),
        input: document.getElementById('query'),
        suggestions: document.getElementById('suggestions')
    },
    clock: {
        time: document.getElementById('time'),
        date: document.getElementById('date')
    },
    weather: {
        container: document.getElementById('weather'),
        temp: document.getElementById('weather-temp'),
        city: document.getElementById('weather-city'),
        icon: document.getElementById('weather-icon')
    },
    shortcuts: {
        container: document.getElementById('shortcuts'),
        search: document.getElementById('shortcutSearch')
    },
    modal: {
        container: document.getElementById('shortcutModal'),
        title: document.getElementById('modalTitle'),
        name: document.getElementById('modalName'),
        url: document.getElementById('modalUrl'),
        save: document.getElementById('saveShortcut'),
        delete: document.getElementById('deleteShortcut'),
        cancel: document.getElementById('cancelShortcut')
    },
    theme: {
        toggle: document.getElementById('themeToggle'),
        root: document.documentElement
    }
};

// Constantes de configuración
const CONFIG = {
    WEATHER_API_KEY: '4bc0a9bce8c24b32bca11718250807',
    SEARCH_ENGINES: {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q='
    }
};

// Estado de la aplicación
const STATE = {
    currentEngine: 'google',
    shortcuts: JSON.parse(localStorage.getItem('shortcuts')) || [
        { name: 'Google', url: 'https://google.com' },
        { name: 'YouTube', url: 'https://youtube.com' }
    ],
    editingIndex: null,
    dragIndex: null,
    isModalOpen: false
};

// Throttle/Debounce helpers
const UTILS = {
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

/* =========================
   FUNCIONES DE UTILIDAD OPTIMIZADAS
========================= */
const HELPERS = {
    normalizeUrl(url) {
        return url.startsWith('http') ? url : `https://${url}`;
    },
    
    getFavicon(url) {
        try {
            const hostname = new URL(this.normalizeUrl(url)).hostname;
            return `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
        } catch {
            return '';
        }
    },
    
    saveShortcuts() {
        localStorage.setItem('shortcuts', JSON.stringify(STATE.shortcuts));
    },
    
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

/* =========================
   ACCESOS DIRECTOS OPTIMIZADOS - CORREGIDO
========================= */
const SHORTCUTS = {
    init() {
        this.render();
        this.setupSearch();
        this.setupDragAndDrop();
    },
    
    render() {
        DOM.shortcuts.container.innerHTML = '';
        
        STATE.shortcuts.forEach((shortcut, index) => {
            const safeUrl = HELPERS.normalizeUrl(shortcut.url);
            
            const div = document.createElement('div');
            div.className = 'shortcut';
            div.draggable = true;
            div.dataset.index = index;
            
            div.innerHTML = `
                <img src="${HELPERS.getFavicon(safeUrl)}" 
                     alt="${shortcut.name}" 
                     loading="lazy">
                <span>${shortcut.name}</span>
                <div class="menu" role="button" aria-label="Menú de ${shortcut.name}">⋮</div>
            `;
            
            // Click principal (abrir URL)
            div.addEventListener('click', (e) => {
                // Solo abrir URL si no se hizo click en el menú
                if (!e.target.classList.contains('menu') && 
                    !e.target.closest('.menu')) {
                    window.location.href = safeUrl;
                }
            });
            
            // Menú contextual - CORRECCIÓN AQUÍ
            const menuBtn = div.querySelector('.menu');
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Abrir modal de edición
                MODAL.openEdit(index);
            });
            
            // Drag & Drop
            div.addEventListener('dragstart', () => {
                STATE.dragIndex = index;
                div.style.opacity = '0.4';
            });
            
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
                STATE.dragIndex = null;
            });
            
            div.addEventListener('dragover', (e) => e.preventDefault());
            
            div.addEventListener('drop', () => {
                if (STATE.dragIndex !== null && STATE.dragIndex !== index) {
                    const moved = STATE.shortcuts.splice(STATE.dragIndex, 1)[0];
                    STATE.shortcuts.splice(index, 0, moved);
                    HELPERS.saveShortcuts();
                    this.render();
                }
            });
            
            DOM.shortcuts.container.appendChild(div);
        });
        
        // Botón agregar
        this.addButton();
    },
    
    addButton() {
        const addBtn = document.createElement('div');
        addBtn.className = 'shortcut-add';
        addBtn.textContent = '+';
        addBtn.setAttribute('role', 'button');
        addBtn.setAttribute('aria-label', 'Agregar acceso directo');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            MODAL.openAdd();
        });
        DOM.shortcuts.container.appendChild(addBtn);
    },
    
    setupSearch() {
        DOM.shortcuts.search.addEventListener('input', UTILS.debounce(() => {
            const value = DOM.shortcuts.search.value.toLowerCase();
            
            document.querySelectorAll('.shortcut').forEach(card => {
                const name = card.querySelector('span').textContent.toLowerCase();
                card.style.display = name.includes(value) ? '' : 'none';
            });
        }, 150));
        
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                DOM.shortcuts.search.focus();
            }
            
            if (e.key === 'Escape' && document.activeElement === DOM.shortcuts.search) {
                DOM.shortcuts.search.value = '';
                DOM.shortcuts.search.dispatchEvent(new Event('input'));
                DOM.shortcuts.search.blur();
            }
        });
    },
    
    setupDragAndDrop() {
        // Touch events para móviles
        let touchStartY = 0;
        let touchStartX = 0;
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.shortcut')) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const touchDuration = Date.now() - touchStartTime;
            
            // Solo procesar si fue un tap corto (menos de 300ms)
            if (touchDuration < 300) {
                const shortcut = e.target.closest('.shortcut');
                const menuBtn = e.target.closest('.menu');
                
                if (shortcut) {
                    if (menuBtn) {
                        // Click en el menú
                        e.preventDefault();
                        const index = parseInt(shortcut.dataset.index);
                        MODAL.openEdit(index);
                    } else if (Math.abs(touchEndX - touchStartX) < 10 && 
                               Math.abs(touchEndY - touchStartY) < 10) {
                        // Click en el acceso directo (no swipe)
                        const index = parseInt(shortcut.dataset.index);
                        window.location.href = HELPERS.normalizeUrl(STATE.shortcuts[index].url);
                    }
                }
            }
        }, { passive: false });
    }
};

/* =========================
   MODAL OPTIMIZADO - CORREGIDO
========================= */
const MODAL = {
    init() {
        DOM.modal.save.addEventListener('click', () => this.save());
        DOM.modal.delete.addEventListener('click', () => this.delete());
        DOM.modal.cancel.addEventListener('click', () => this.close());
        
        // Cerrar al hacer clic fuera
        DOM.modal.container.addEventListener('click', (e) => {
            if (e.target === DOM.modal.container) {
                this.close();
            }
        });
        
        // Cerrar con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && STATE.isModalOpen) {
                this.close();
            }
        });
    },
    
    openAdd() {
        if (STATE.isModalOpen) return;
        
        STATE.editingIndex = STATE.shortcuts.length;
        STATE.isModalOpen = true;
        DOM.modal.title.textContent = 'Nuevo acceso';
        DOM.modal.name.value = '';
        DOM.modal.url.value = '';
        DOM.modal.delete.style.display = 'none';
        DOM.modal.container.classList.remove('hidden');
        DOM.modal.name.focus();
    },
    
    openEdit(index) {
        if (STATE.isModalOpen) return;
        
        STATE.editingIndex = index;
        STATE.isModalOpen = true;
        DOM.modal.title.textContent = 'Editar acceso';
        DOM.modal.name.value = STATE.shortcuts[index].name;
        DOM.modal.url.value = STATE.shortcuts[index].url;
        DOM.modal.delete.style.display = '';
        DOM.modal.container.classList.remove('hidden');
        DOM.modal.name.focus();
    },
    
    close() {
        STATE.isModalOpen = false;
        DOM.modal.container.classList.add('hidden');
        STATE.editingIndex = null;
    },
    
    save() {
        const name = DOM.modal.name.value.trim();
        let url = DOM.modal.url.value.trim();
        
        if (!name || !url) {
            alert('Por favor, completá todos los campos');
            return;
        }
        
        url = HELPERS.normalizeUrl(url);
        
        if (!HELPERS.validateUrl(url)) {
            alert('URL inválida. Asegurate de incluir http:// o https://');
            return;
        }
        
        STATE.shortcuts[STATE.editingIndex] = { name, url };
        HELPERS.saveShortcuts();
        SHORTCUTS.render();
        this.close();
    },
    
    delete() {
        if (!confirm('¿Estás seguro de eliminar este acceso directo?')) return;
        
        STATE.shortcuts.splice(STATE.editingIndex, 1);
        HELPERS.saveShortcuts();
        SHORTCUTS.render();
        this.close();
    }
};

/* =========================
   BUSCADOR OPTIMIZADO
========================= */
const SEARCH = {
    init() {
        this.setupEngines();
        this.setupForm();
        this.setupSuggestions();
    },
    
    setupEngines() {
        document.querySelectorAll('.engines button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.engines button')
                    .forEach(b => b.classList.remove('active'));
                
                btn.classList.add('active');
                STATE.currentEngine = btn.dataset.engine;
                
                // Actualizar placeholder
                const engineName = STATE.currentEngine.charAt(0).toUpperCase() + 
                                  STATE.currentEngine.slice(1);
                DOM.search.input.placeholder = `Buscar en ${engineName}...`;
            });
        });
    },
    
    setupForm() {
        DOM.search.form.addEventListener('submit', e => {
            e.preventDefault();
            this.handleSearch();
        });
    },
    
    handleSearch() {
        const query = DOM.search.input.value.trim().toLowerCase();
        if (!query) return;
        
        // Buscar en accesos directos
        const match = STATE.shortcuts.find(s =>
            s.name.toLowerCase().includes(query) ||
            HELPERS.normalizeUrl(s.url).toLowerCase().includes(query)
        );
        
        if (match) {
            window.location.href = HELPERS.normalizeUrl(match.url);
            return;
        }
        
        // Buscar en motor activo
        window.location.href = CONFIG.SEARCH_ENGINES[STATE.currentEngine] + 
                               encodeURIComponent(query);
    },
    
    setupSuggestions() {
        const debouncedFetch = UTILS.debounce(this.fetchSuggestions.bind(this), 250);
        
        DOM.search.input.addEventListener('input', () => {
            const query = DOM.search.input.value.trim();
            
            if (query.length < 2) {
                this.showShortcutSuggestions(query);
                return;
            }
            
            this.showShortcutSuggestions(query);
            debouncedFetch(query);
        });
        
        // Ocultar al hacer clic fuera
        document.addEventListener('click', e => {
            if (!e.target.closest('#searchForm')) {
                DOM.search.suggestions.classList.add('hidden');
            }
        });
    },
    
    showShortcutSuggestions(query) {
        const q = query.toLowerCase();
        
        if (!q) {
            DOM.search.suggestions.classList.add('hidden');
            DOM.search.suggestions.innerHTML = '';
            return;
        }
        
        DOM.search.suggestions.innerHTML = '';
        
        // Filtrar accesos
        const matches = STATE.shortcuts.filter(s =>
            s.name.toLowerCase().includes(q) ||
            HELPERS.normalizeUrl(s.url).toLowerCase().includes(q)
        ).slice(0, 3);
        
        matches.forEach(shortcut => {
            const div = document.createElement('div');
            div.className = 'suggestion';
            div.innerHTML = `
                <img src="${HELPERS.getFavicon(HELPERS.normalizeUrl(shortcut.url))}" 
                     alt="${shortcut.name}">
                <span>${shortcut.name}</span>
            `;
            div.onclick = () => {
                window.location.href = HELPERS.normalizeUrl(shortcut.url);
            };
            DOM.search.suggestions.appendChild(div);
        });
        
        // Opción de búsqueda
        if (query.length > 0) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'suggestion';
            searchDiv.innerHTML = `<span>🔎 Buscar "${query}"</span>`;
            searchDiv.onclick = () => {
                window.location.href = CONFIG.SEARCH_ENGINES[STATE.currentEngine] + 
                                      encodeURIComponent(query);
            };
            DOM.search.suggestions.appendChild(searchDiv);
        }
        
        DOM.search.suggestions.classList.toggle('hidden', matches.length === 0 && query.length === 0);
    },
    
    async fetchSuggestions(query) {
        try {
            const response = await fetch(
                `https://api.duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
            );
            const data = await response.json();
            
            // Limitar a 4 sugerencias
            data.slice(0, 4).forEach(item => {
                const div = document.createElement('div');
                div.className = 'suggestion';
                div.textContent = item.phrase;
                
                div.onclick = () => {
                    window.location.href = CONFIG.SEARCH_ENGINES.google + 
                                          encodeURIComponent(item.phrase);
                };
                
                DOM.search.suggestions.appendChild(div);
            });
            
            DOM.search.suggestions.classList.remove('hidden');
        } catch (error) {
            console.warn('No se pudieron cargar sugerencias:', error);
        }
    }
};

/* =========================
   RELOJ Y CLIMA OPTIMIZADOS
========================= */
const TIME = {
    init() {
        this.update();
        setInterval(() => this.update(), 1000);
    },
    
    update() {
        const now = new Date();
        
        DOM.clock.time.textContent = now.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        DOM.clock.date.textContent = now.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
};

const WEATHER = {
    async init() {
        if (!navigator.geolocation) {
            DOM.weather.container.style.display = 'none';
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => this.fetchWeather(position.coords),
            () => DOM.weather.container.style.display = 'none',
            { timeout: 5000, maximumAge: 600000 } // Cache de 10 minutos
        );
    },
    
    async fetchWeather(coords) {
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${CONFIG.WEATHER_API_KEY}&q=${coords.latitude},${coords.longitude}&lang=es`
            );
            
            if (!response.ok) throw new Error('Error en la respuesta');
            
            const data = await response.json();
            
            DOM.weather.temp.textContent = Math.round(data.current.temp_c) + '°';
            DOM.weather.city.textContent = data.location.name;
            DOM.weather.icon.src = 'https:' + data.current.condition.icon;
            DOM.weather.icon.alt = data.current.condition.text;
        } catch (error) {
            console.warn('No se pudo cargar el clima:', error);
            DOM.weather.container.style.display = 'none';
        }
    }
};

/* =========================
   TEMA Y EFECTOS OPTIMIZADOS
========================= */
const THEME = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        DOM.theme.root.dataset.theme = savedTheme;
        DOM.theme.toggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        
        DOM.theme.toggle.addEventListener('click', () => this.toggle());
    },
    
    toggle() {
        const nextTheme = DOM.theme.root.dataset.theme === 'dark' ? 'light' : 'dark';
        DOM.theme.root.dataset.theme = nextTheme;
        localStorage.setItem('theme', nextTheme);
        DOM.theme.toggle.textContent = nextTheme === 'dark' ? '🌙' : '☀️';
    }
};

const EFFECTS = {
    init() {
        // Efecto de parallax solo en escritorio
        if (window.innerWidth > 768) {
            document.addEventListener('mousemove', UTILS.throttle(this.parallax, 16));
        }
        
        // Detectar cambios de orientación en móviles
        window.addEventListener('orientationchange', () => {
            setTimeout(() => window.location.reload(), 100);
        });
    },
    
    parallax(e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        
        document.body.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }
};

/* =========================
   INICIALIZACIÓN FINAL - CORREGIDA
========================= */
const APP = {
    async init() {
        try {
            console.log('🚀 Inicializando aplicación...');
            
            // Primero: Elementos críticos que deben cargar inmediatamente
            TIME.init();
            THEME.init();
            
            // Segundo: Inicializar el modal ANTES de los shortcuts
            MODAL.init();
            
            // Tercero: Inicializar shortcuts y búsqueda
            SEARCH.init();
            SHORTCUTS.init();
            
            // Cuarto: Efectos y clima (pueden cargar después)
            setTimeout(() => {
                EFFECTS.init();
                WEATHER.init();
            }, 500);
            
            console.log('✅ Aplicación inicializada correctamente');
            
            // Verificar que el modal esté cerrado al inicio
            if (DOM.modal.container && !DOM.modal.container.classList.contains('hidden')) {
                console.warn('⚠️ Modal estaba abierto al cargar, cerrando...');
                DOM.modal.container.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
        }
    }
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, iniciando aplicación...');
    APP.init();
});

// Si el DOM ya está cargado, iniciar inmediatamente
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('⚡ DOM ya cargado, iniciando...');
    setTimeout(() => APP.init(), 0);
}