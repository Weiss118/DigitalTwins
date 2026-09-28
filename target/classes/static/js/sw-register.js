/**
 * Digital Twin PoC - Registro del Service Worker
 * Se ejecuta de forma diferida (defer) para no bloquear la carga inicial
 */

(function() {
  'use strict';

  // Verificar soporte de Service Worker
  if (!('serviceWorker' in navigator)) {
    console.log('📱 Service Worker no soportado en este navegador');
    return;
  }

  // Verificar si estamos en entorno seguro (HTTPS o localhost)
  const isSecureContext = window.isSecureContext || 
                          location.protocol === 'https:' || 
                          location.hostname === 'localhost' || 
                          location.hostname === '127.0.0.1';

  if (!isSecureContext) {
    console.warn('⚠️ Service Worker requiere contexto seguro (HTTPS/localhost)');
    return;
  }

  // Registrar Service Worker cuando la página esté cargada
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado exitosamente:', registration.scope);

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('🔄 Nueva versión de la app disponible');
              showUpdateNotification();
            }
          });
        }
      });

      // Verificar actualizaciones periódicamente
      setInterval(() => {
        registration.update().catch(err => console.warn('Error checking for updates:', err));
      }, 60 * 60 * 1000); // Cada hora

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  });

  // Escuchar mensajes del Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('📦 Caché actualizado:', event.data.payload);
    }
  });

  // Mostrar notificación de actualización disponible
  function showUpdateNotification() {
    // Crear toast personalizado para actualización
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-info';
    toast.style.maxWidth = '400px';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon" style="color: var(--color-secondary)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>
      <span class="toast-message">Nueva versión disponible. Recarga para actualizar.</span>
      <button class="toast-action btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;">Actualizar</button>
      <button class="toast-close" aria-label="Descartar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    toast.querySelector('.toast-action').addEventListener('click', () => {
      window.location.reload();
    });

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);
  }

  // Detectar si la app está instalada como PWA
  function checkPWAInstall() {
    if (window.matchMedia('(display-mode: standalone)').match || 
        window.navigator.standalone === true) {
      document.body.classList.add('pwa-installed');
      console.log('📱 App ejecutándose como PWA instalada');
    }
  }

  // Verificar al cargar y en cambios de display-mode
  checkPWAInstall();
  window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWAInstall);

  // Prompt de instalación PWA (beforeinstallprompt)
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir el mini-infobar por defecto en Chrome
    e.preventDefault();
    deferredPrompt = e;
    console.log('📥 Evento beforeinstallprompt capturado');
    
    // Mostrar botón de instalación personalizado si se desea
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada exitosamente');
    deferredPrompt = null;
    hideInstallButton();
    document.body.classList.add('pwa-installed');
  });

  function showInstallButton() {
    // Solo mostrar si no está ya instalada
    if (document.body.classList.contains('pwa-installed')) return;
    
    // Crear botón flotante de instalación
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.className = 'btn btn-primary';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 50px;
    `;
    installBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span>Instalar App</span>
    `;
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar la PWA');
      } else {
        console.log('❌ Usuario rechazó instalar la PWA');
      }
      
      deferredPrompt = null;
      hideInstallButton();
    });

    document.body.appendChild(installBtn);
  }

  function hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
  }

  // Exponer funciones para debugging
  window.PWARegistration = {
    update: () => navigator.serviceWorker.ready.then(reg => reg.update()),
    unregister: () => navigator.serviceWorker.ready.then(reg => reg.unregister()),
    showInstallPrompt: () => deferredPrompt?.prompt()
  };

})();