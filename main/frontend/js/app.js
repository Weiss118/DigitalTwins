/**
 * Digital Twin PoC - Aplicación Principal PWA
 * Manufactura Industrial - Gemelos Digitales
 * 
 * Maneja autenticación, navegación, permisos por rol y UI del dashboard.
 */

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const CONFIG = {
  // Detectar automáticamente entorno: si frontend en puerto distinto al backend, usar URL absoluta
  API_BASE_URL: (() => {
    // En desarrollo con puertos distintos (ej: frontend 3000/5173, backend 8080)
    // En producción (mismo origen): ruta relativa
    const backendPort = '8080';
    const isDev = location.port && location.port !== backendPort && ['3000', '5173', '8081', '4200'].includes(location.port);
    return isDev ? `http://localhost:${backendPort}/api/v1` : '/api/v1';
  })(),
  ENDPOINTS: {
    LOGIN: '/auth/login'
  },
  STORAGE_KEYS: {
    TOKEN: 'dt_access_token',
    USER: 'dt_user',
    REMEMBER_ME: 'dt_remember_me'
  },
  ROLES: {
    OPERADOR: 'OPERADOR',
    TECNICO: 'TECNICO',
    SUPERVISOR: 'SUPERVISOR'
  },
  PERMISSIONS: {
    OPERADOR: ['operador'],
    TECNICO: ['operador', 'tecnico'],
    SUPERVISOR: ['operador', 'tecnico', 'supervisor']
  }
};

// ============================================================================
// ESTADO DE LA APLICACIÓN
// ============================================================================

const AppState = {
  token: null,
  user: null,
  isAuthenticated: false,
  currentScreen: 'login' // 'login' | 'dashboard'
};

// ============================================================================
// UTILIDADES
// ============================================================================

const Utils = {
  /**
   * Realiza peticiones HTTP con manejo de errores estándar y logging mejorado
   */
  async fetchWithAuth(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (AppState.token) {
      headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    // Construir URL completa si es relativa
    const fullUrl = url.startsWith('http') ? url : `${CONFIG.API_BASE_URL}${url}`;

    console.log(`[API] ${options.method || 'GET'} ${fullUrl}`, options.body ? JSON.parse(options.body) : '');

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        credentials: 'include'  // Importante para cookies si se usan en el futuro
      });

      // Leer respuesta como texto primero para debug
      const responseText = await response.text();
      console.log(`[API] Response ${response.status}:`, responseText);

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('[API] Respuesta no es JSON válido:', responseText);
      }

      if (!response.ok) {
        const error = new Error(data.message || `Error HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.responseText = responseText;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[API] Error en fetch:', error);
      // Re-lanzar con información útil
      if (!error.status) {
        error.message = 'Error de conexión: ¿Backend corriendo en puerto 8080? ¿CORS configurado?';
      }
      throw error;
    }
  },

  /**
   * Guarda datos en localStorage o sessionStorage
   */
  saveStorage(key, value, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(key, JSON.stringify(value));
  },

  /**
   * Obtiene datos de localStorage o sessionStorage
   */
  getStorage(key) {
    return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || 'null');
  },

  /**
   * Elimina datos de ambos storages
   */
  clearStorage(key) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },

  /**
   * Formatea fecha para mostrar
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  /**
   * Genera iniciales para avatar
   */
  getInitials(name) {
    return name
      .split(' ')
      .filter(word => word.length > 2 && !['(', ')'].includes(word[0]))
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Muestra toast notification
   */
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
      <span class="toast-icon" style="color: var(--color-${type === 'info' ? 'secondary' : type})">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Cerrar notificación">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideInRight 0.3s ease reverse';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  },

  /**
   * Debounce para limitar frecuencia de ejecución
   */
  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

const Auth = {
  /**
   * Inicia sesión con credenciales
   */
  async login(employeeNumber, password, rememberMe = false) {
    try {
      const response = await Utils.fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        body: JSON.stringify({
          numero_empleado: employeeNumber,
          contrasena: password
        })
      });

      // Guardar token y usuario
      AppState.token = response.access_token;
      AppState.user = response.user;
      AppState.isAuthenticated = true;

      // Persistir en storage
      Utils.saveStorage(CONFIG.STORAGE_KEYS.TOKEN, response.access_token, rememberMe);
      Utils.saveStorage(CONFIG.STORAGE_KEYS.USER, response.user, rememberMe);
      Utils.saveStorage(CONFIG.STORAGE_KEYS.REMEMBER_ME, rememberMe, rememberMe);

      return { success: true, user: response.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.data?.message || error.message || 'Error de conexión' 
      };
    }
  },

  /**
   * Cierra sesión
   */
  logout() {
    AppState.token = null;
    AppState.user = null;
    AppState.isAuthenticated = false;
    
    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
      Utils.clearStorage(key);
    });
  },

  /**
   * Restaura sesión desde storage
   */
  restoreSession() {
    const token = Utils.getStorage(CONFIG.STORAGE_KEYS.TOKEN);
    const user = Utils.getStorage(CONFIG.STORAGE_KEYS.USER);
    const rememberMe = Utils.getStorage(CONFIG.STORAGE_KEYS.REMEMBER_ME);

    if (token && user) {
      AppState.token = token;
      AppState.user = user;
      AppState.isAuthenticated = true;
      return true;
    }
    return false;
  },

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission) {
    if (!AppState.user || !AppState.user.role) return false;
    
    const userRole = AppState.user.role;
    const allowedPermissions = CONFIG.PERMISSIONS[userRole] || [];
    return allowedPermissions.includes(permission);
  },

  /**
   * Obtiene todos los permisos del usuario actual
   */
  getUserPermissions() {
    if (!AppState.user || !AppState.user.role) return [];
    return CONFIG.PERMISSIONS[AppState.user.role] || [];
  }
};

// ============================================================================
// UI - PANTALLA DE LOGIN
// ============================================================================

const LoginUI = {
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkAutoFill();
  },

  cacheElements() {
    this.elements = {
      screen: document.getElementById('loginScreen'),
      form: document.getElementById('loginForm'),
      employeeNumber: document.getElementById('employeeNumber'),
      password: document.getElementById('password'),
      togglePassword: document.getElementById('togglePassword'),
      loginBtn: document.getElementById('loginBtn'),
      btnText: document.querySelector('#loginBtn .btn-text'),
      btnLoader: document.querySelector('#loginBtn .btn-loader'),
      errorContainer: document.getElementById('loginError'),
      errorMessage: document.getElementById('loginErrorMessage'),
      employeeNumberError: document.getElementById('employeeNumberError'),
      passwordError: document.getElementById('passwordError'),
      testUsers: document.querySelectorAll('.test-user')
    };
  },

  bindEvents() {
    // Submit formulario
    this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Toggle password visibility
    this.elements.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());

    // Limpiar errores al escribir
    this.elements.employeeNumber.addEventListener('input', () => this.clearFieldError('employeeNumber'));
    this.elements.password.addEventListener('input', () => this.clearFieldError('password'));

    // Usuarios de prueba - click para autollenar
    this.elements.testUsers.forEach(userEl => {
      userEl.addEventListener('click', () => this.fillTestUser(userEl));
    });

    // Enter en campos navega al siguiente
    this.elements.employeeNumber.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.elements.password.focus();
    });
  },

  checkAutoFill() {
    // Si hay credenciales guardadas y rememberMe, autollenar
    const rememberMe = Utils.getStorage(CONFIG.STORAGE_KEYS.REMEMBER_ME);
    if (rememberMe) {
      const savedUser = Utils.getStorage(CONFIG.STORAGE_KEYS.USER);
      if (savedUser?.employeeNumber) {
        this.elements.employeeNumber.value = savedUser.employeeNumber;
      }
    }
  },

  async handleSubmit(event) {
    event.preventDefault();

    const employeeNumber = this.elements.employeeNumber.value.trim().toUpperCase();
    const password = this.elements.password.value;

    // Validación básica
    if (!employeeNumber) {
      this.showFieldError('employeeNumber', 'El número de empleado es obligatorio');
      this.elements.employeeNumber.focus();
      return;
    }

    if (!password) {
      this.showFieldError('password', 'La contraseña es obligatoria');
      this.elements.password.focus();
      return;
    }

    this.setLoading(true);
    this.hideError();

    const result = await Auth.login(employeeNumber, password, false);

    this.setLoading(false);

    if (result.success) {
      Utils.showToast(`Bienvenido, ${result.user.name}`, 'success');
      App.initDashboard();
    } else {
      this.showError(result.message);
      this.elements.password.value = '';
      this.elements.password.focus();
    }
  },

  togglePasswordVisibility() {
    const isHidden = this.elements.password.type === 'password';
    this.elements.password.type = isHidden ? 'text' : 'password';
    this.elements.togglePassword.setAttribute('aria-pressed', isHidden.toString());
  },

  showFieldError(field, message) {
    const errorEl = this.elements[`${field}Error`];
    const inputEl = this.elements[field];
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
  },

  clearFieldError(field) {
    const errorEl = this.elements[`${field}Error`];
    const inputEl = this.elements[field];
    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.removeAttribute('aria-invalid');
    this.hideError();
  },

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorContainer.style.display = 'flex';
    this.elements.errorContainer.setAttribute('aria-hidden', 'false');
  },

  hideError() {
    this.elements.errorContainer.style.display = 'none';
    this.elements.errorContainer.setAttribute('aria-hidden', 'true');
  },

  setLoading(loading) {
    this.elements.loginBtn.disabled = loading;
    this.elements.btnText.style.display = loading ? 'none' : 'inline';
    this.elements.btnLoader.style.display = loading ? 'inline-flex' : 'none';
    this.elements.employeeNumber.disabled = loading;
    this.elements.password.disabled = loading;
    this.elements.togglePassword.disabled = loading;
  },

  fillTestUser(userEl) {
    const employee = userEl.dataset.employee;
    const password = userEl.dataset.password;
    
    this.elements.employeeNumber.value = employee;
    this.elements.password.value = password;
    this.clearFieldError('employeeNumber');
    this.clearFieldError('password');
    this.hideError();
    
    Utils.showToast(`Credenciales de ${employee} cargadas`, 'info', 2000);
  },

  show() {
    this.elements.screen.style.display = 'flex';
    this.elements.employeeNumber.focus();
  },

  hide() {
    this.elements.screen.style.display = 'none';
  }
};

// ============================================================================
// UI - DASHBOARD
// ============================================================================

const DashboardUI = {
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.renderUserInfo();
    this.renderPermissions();
    this.renderFeatures();
    this.updateSystemInfo();
  },

  cacheElements() {
    this.elements = {
      screen: document.getElementById('dashboardScreen'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebarToggle'),
      sidebarOverlay: document.getElementById('sidebarOverlay'),
      logoutBtn: document.getElementById('logoutBtn'),
      userAvatar: document.getElementById('userAvatar'),
      userName: document.getElementById('userName'),
      userRole: document.getElementById('userRole'),
      welcomeText: document.getElementById('welcomeText'),
      userBadge: document.getElementById('userBadge'),
      featuresGrid: document.getElementById('featuresGrid'),
      twinCount: document.getElementById('twinCount'),
      systemStatus: document.getElementById('systemStatus'),
      lastSync: document.getElementById('lastSync'),
      navButtons: document.querySelectorAll('.nav-btn')
    };
  },

  bindEvents() {
    // Toggle sidebar (móvil)
    this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

    // Logout
    this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Navegación botones del sidebar
    this.elements.navButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleNavClick(btn));
    });

    // Cerrar sidebar al hacer click en un enlace (móvil)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          !this.elements.sidebar.contains(e.target) && 
          !this.elements.sidebarToggle.contains(e.target) &&
          this.elements.sidebar.classList.contains('open')) {
        this.closeSidebar();
      }
    });

    // Responsive
    window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
  },

  renderUserInfo() {
    const user = AppState.user;
    if (!user) return;

    this.elements.userName.textContent = user.name;
    this.elements.userRole.textContent = user.role;
    this.elements.userAvatar.textContent = Utils.getInitials(user.name);
    this.elements.welcomeText.textContent = `Accedido como ${user.name.split(' ')[0]} con rol de ${user.role}`;
    
    const badgeRole = user.role.charAt(0) + user.role.slice(1).toLowerCase();
    this.elements.userBadge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
      </svg>
      ${badgeRole}
    `;
  },

  renderPermissions() {
    const permissions = Auth.getUserPermissions();
    
    // Actualizar botones del sidebar
    this.elements.navButtons.forEach(btn => {
      const permission = btn.dataset.permission;
      const hasPermission = permissions.includes(permission);
      
      if (!hasPermission) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.pointerEvents = 'none';
        btn.title = `Requiere rol: ${permission.charAt(0).toUpperCase() + permission.slice(1)}`;
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        btn.title = '';
      }
    });
  },

  renderFeatures() {
    const permissions = Auth.getUserPermissions();
    const grid = this.elements.featuresGrid;
    
    // Definir características por permiso
    const features = [
      {
        permission: 'operador',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        title: 'Estado del Gemelo Digital',
        desc: 'Visualiza el estado en tiempo real de los gemelos digitales de la línea de producción'
      },
      {
        permission: 'operador',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        title: 'Variables Básicas',
        desc: 'Consulta temperatura, presión, velocidad y otras variables de proceso'
      },
      {
        permission: 'tecnico',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        title: 'Configurar Mantenimiento',
        desc: 'Programa y gestiona planes de mantenimiento preventivo y correctivo'
      },
      {
        permission: 'tecnico',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        title: 'Umbrales de Alertas',
        desc: 'Ajusta límites críticos y de advertencia para variables de proceso'
      },
      {
        permission: 'supervisor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        title: 'Administración de Usuarios',
        desc: 'Gestiona usuarios, roles y permisos del sistema'
      },
      {
        permission: 'supervisor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        title: 'Parámetros del Tenant',
        desc: 'Configura parámetros globales de la instancia multi-tenant'
      },
      {
        permission: 'supervisor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        title: 'Reportes Globales',
        desc: 'Visualiza dashboards ejecutivos y reportes de rendimiento global'
      }
    ];

    // Filtrar por permisos del usuario
    const allowedFeatures = features.filter(f => permissions.includes(f.permission));

    grid.innerHTML = allowedFeatures.map(feature => `
      <article class="feature-card" data-permission="${feature.permission}" tabindex="0" role="button" aria-label="${feature.title}">
        <div class="feature-icon">${feature.icon}</div>
        <h4 class="feature-title">${feature.title}</h4>
        <p class="feature-desc">${feature.desc}</p>
      </article>
    `).join('');

    // Agregar event listeners a las tarjetas
    grid.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', () => this.handleFeatureClick(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleFeatureClick(card);
        }
      });
    });
  },

  updateSystemInfo() {
    // Simular datos del sistema
    this.elements.twinCount.textContent = '12';
    this.elements.systemStatus.textContent = 'En línea';
    this.elements.lastSync.textContent = Utils.formatDate(new Date());
  },

  toggleSidebar() {
    const isOpen = this.elements.sidebar.classList.toggle('open');
    this.elements.sidebarOverlay.classList.toggle('visible', isOpen);
    this.elements.sidebarToggle.setAttribute('aria-expanded', isOpen.toString());
    
    // Prevenir scroll del body cuando sidebar abierto en móvil
    document.body.style.overflow = isOpen ? 'hidden' : '';
  },

  closeSidebar() {
    this.elements.sidebar.classList.remove('open');
    this.elements.sidebarOverlay.classList.remove('visible');
    this.elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  handleResize() {
    if (window.innerWidth > 1024) {
      this.closeSidebar();
    }
  },

  handleNavClick(button) {
    if (button.disabled) return;
    
    const featureTitle = button.querySelector('span')?.textContent || 'Función';
    Utils.showToast(`Navegando a: ${featureTitle}`, 'info', 2000);
    
    // Cerrar sidebar en móvil después de navegar
    if (window.innerWidth <= 1024) {
      this.closeSidebar();
    }
  },

  handleFeatureClick(card) {
    if (card.disabled || card.classList.contains('disabled')) return;
    
    const title = card.querySelector('.feature-title')?.textContent || 'Función';
    Utils.showToast(`Abriendo: ${title}`, 'info', 2000);
  },

  handleLogout() {
    Auth.logout();
    Utils.showToast('Sesión cerrada correctamente', 'success');
    App.showLogin();
  },

  show() {
    this.elements.screen.style.display = 'flex';
    // Forzar reflow para animación
    this.elements.screen.offsetHeight;
  },

  hide() {
    this.elements.screen.style.display = 'none';
  }
};

// ============================================================================
// APLICACIÓN PRINCIPAL
// ============================================================================

const App = {
  init() {
    console.log('🚀 Digital Twin PoC - Iniciando aplicación...');
    
    // Inicializar UI de login
    LoginUI.init();
    
    // Intentar restaurar sesión
    if (Auth.restoreSession()) {
      console.log('🔐 Sesión restaurada para:', AppState.user?.name);
      this.initDashboard();
    } else {
      console.log('👤 No hay sesión activa, mostrando login');
      this.showLogin();
    }

    // Registrar Service Worker si está disponible
    this.registerSW();
  },

  async registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);
      } catch (error) {
        console.warn('⚠️ Error registrando Service Worker:', error);
      }
    }
  },

  showLogin() {
    DashboardUI.hide();
    LoginUI.show();
    AppState.currentScreen = 'login';
  },

  initDashboard() {
    LoginUI.hide();
    DashboardUI.init();
    DashboardUI.show();
    AppState.currentScreen = 'dashboard';
  }
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Manejar errores globales no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesa rechazada no manejada:', event.reason);
  Utils.showToast('Error inesperado en la aplicación', 'error');
});

window.addEventListener('error', (event) => {
  console.error('❌ Error global:', event.error);
});

// Exponer para debugging en consola
window.DigitalTwinApp = {
  AppState,
  Auth,
  Utils,
  LoginUI,
  DashboardUI,
  CONFIG
};

console.log('📦 Digital Twin PoC v1.0.0 cargado');
console.log('💡 Escribe DigitalTwinApp en la consola para debugging');