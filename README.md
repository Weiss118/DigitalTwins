# Digital Twin PoC - Gemelos Digitales para Manufactura Industrial

> **Primer Avance (Demostrativo/PoC)** - Sistema de autenticación y panel de control con arquitectura Fullstack: Backend Spring Boot + Frontend PWA (HTML/CSS/JS Vanilla)

## 📋 Descripción

Este Proof of Concept implementa la base de un sistema de **Gemelos Digitales para Manufactura Industrial** con:

- **Backend**: API REST Spring Boot 3.2 + Java 21 con autenticación JWT stateless
- **Frontend**: Progressive Web App (PWA) instalable, responsive, offline-capable
- **Autenticación**: Login con número de empleado y contraseña, roles y permisos
- **Arquitectura**: Separación clara backend/frontend, listo para escalar

## 🎯 Funcionalidades Implementadas

### Backend (Spring Boot)
- ✅ Endpoint `POST /api/v1/auth/login` con validación de credenciales
- ✅ Autenticación JWT stateless (access token 1 hora)
- ✅ Repositorio de usuarios en memoria (carga desde `users.json`)
- ✅ Spring Security con filtro JWT personalizado
- ✅ CORS configurado para desarrollo PWA
- ✅ Validación Bean Validation (JSR-380)
- ✅ Manejo global de errores con respuestas estandarizadas

### Frontend (PWA)
- ✅ **Pantalla Login**: Formulario con validación, toggle password, usuarios de prueba
- ✅ **Dashboard**: Panel lateral con navegación, bienvenida personalizada, tarjetas de funciones
- ✅ **Control de permisos por rol**: Botones deshabilitados/opacos según rol (CSS + JS)
- ✅ **Service Worker**: Cache First (assets) / Network First (API/HTML) / Stale-While-Revalidate
- ✅ **Manifest**: Instalable, shortcuts, icons, screenshots
- ✅ **Responsive**: Mobile-first, sidebar colapsable, breakpoints 1024px/768px/480px
- ✅ **Accesibilidad**: ARIA labels, focus-visible, semantic HTML, reduced motion

### Usuarios de Prueba
| Empleado | Nombre | Contraseña | Rol |
|----------|--------|------------|-----|
| EMP001 | Juan Pérez (Operador) | 12345678 | OPERADOR |
| EMP002 | Pedro Gómez (Técnico) | 12345678 | TECNICO |
| EMP003 | María Rodríguez (Supervisora) | 12345678 | SUPERVISOR |

### Matriz de Permisos
| Función | OPERADOR | TECNICO | SUPERVISOR |
|---------|----------|---------|------------|
| Ver Estado del Gemelo Digital | ✅ | ✅ | ✅ |
| Consultar Variables Básicas | ✅ | ✅ | ✅ |
| Configurar Mantenimiento | ❌ | ✅ | ✅ |
| Ajustar Umbrales de Alertas | ❌ | ✅ | ✅ |
| Administración de Usuarios | ❌ | ❌ | ✅ |
| Configurar Parámetros del Tenant | ❌ | ❌ | ✅ |
| Ver Reportes Globales | ❌ | ❌ | ✅ |

> **Regla visual**: Opciones sin permiso → `opacity: 0.4`, `disabled`, `pointer-events: none`

## 🚀 Inicio Rápido

### Prerrequisitos
- **Java 21** (JDK)
- **Maven 3.9+**
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Ejecutar Backend
```bash
cd digital-twin-poc
./mvnw spring-boot:run
```
- Backend: http://localhost:8080
- Health check: http://localhost:8080/actuator/health
- API Login: http://localhost:8080/api/v1/auth/login

### Ejecutar Frontend (Desarrollo)
El frontend se sirve automáticamente desde Spring Boot en `/` (recursos estáticos copiados a `/static` durante el build).

```bash
# Opción 1: Solo backend (sirve frontend también)
./mvnw spring-boot:run

# Opción 2: Servidor estático independiente (para desarrollo frontend)
cd src/main/frontend
npx serve . -p 3000
# Frontend: http://localhost:3000 (proxy API a :8080)
```

### Probar Login
1. Abrir http://localhost:8080
2. Usar credenciales de la tabla anterior
3. Explorar dashboard según rol

## 📁 Estructura del Proyecto

```
digital-twin-poc/
├── pom.xml                          # Configuración Maven
├── README.md                        # Este archivo
├── src/
│   ├── main/
│   │   ├── java/com/digitaltwin/
│   │   │   ├── DigitalTwinPocApplication.java    # Main class
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java           # POST /api/v1/auth/login
│   │   │   ├── model/
│   │   │   │   ├── User.java                     # Entidad + Role enum
│   │   │   │   ├── UserResponse.java             # DTO respuesta (sin password)
│   │   │   │   ├── LoginRequest.java             # DTO petición login
│   │   │   │   ├── LoginResponse.java            # DTO respuesta + JWT
│   │   │   │   └── ErrorResponse.java            # DTO errores estandarizado
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java           # In-memory + JSON loader
│   │   │   └── security/
│   │   │       ├── JwtUtil.java                  # Generación/validación JWT
│   │   │       ├── JwtAuthenticationFilter.java  # Filtro Spring Security
│   │   │       ├── UserDetailsServiceImpl.java   # UserDetailsService
│   │   │       └── SecurityConfig.java           # Configuración Security + CORS
│   │   ├── resources/
│   │   │   ├── application.yml                   # Configuración (puerto, JWT, logging)
│   │   │   └── users.json                        # Usuarios de prueba
│   │   └── frontend/                             # PWA (copiado a /static en build)
│   │       ├── index.html                        # Login + Dashboard (SPA)
│   │       ├── dashboard.html                    # Entry point PWA
│   │       ├── manifest.webmanifest              # PWA Manifest
│   │       ├── sw.js                             # Service Worker
│   │       ├── css/
│   │       │   └── styles.css                    # Estilos completos (CSS Variables)
│   │       ├── js/
│   │       │   ├── app.js                        # Lógica principal (Auth, UI, State)
│   │       │   └── sw-register.js                # Registro SW + PWA install prompt
│   │       └── assets/
│   │           ├── icon.svg                      # Icono base vectorial
│   │           ├── generate-icons.js             # Script generar PNGs (sharp/inkscape)
│   │           └── README.md                     # Instrucciones iconos
│   └── test/                                     # Tests (pendientes)
└── target/                                       # Build output (generado)
```

## 🔧 Configuración

### Variables de Entorno / application.yml
```yaml
server:
  port: 8080

jwt:
  secret: "tu-clave-secreta-muy-larga-y-segura"  # Mínimo 256 bits
  expiration: 3600000  # 1 hora en ms

logging:
  level:
    com.digitaltwin: DEBUG
```

### Usuarios (users.json)
```json
[
  {
    "numero_empleado": "EMP001",
    "name": "Juan Pérez (Operador)",
    "password": "12345678",
    "role": "OPERADOR",
    "active": true
  }
  // ...
]
```

> **Nota**: En producción, usar BCrypt para passwords y base de datos real.

## 🧪 Testing API

### Login Exitoso
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"numero_empleado": "EMP001", "contrasena": "12345678"}'
```

**Respuesta:**
```json
{
  "user": {
    "numero_empleado": "EMP001",
    "name": "Juan Pérez (Operador)",
    "role": "OPERADOR"
  },
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Login Fallido
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"numero_empleado": "EMP001", "contrasena": "wrong"}'
```

**Respuesta (401):**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Número de empleado o contraseña incorrectos",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### Usar Token (Endpoints protegidos futuros)
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/api/v1/...
```

## 📱 PWA - Instalación y Offline

### Instalar como App
1. Abrir en Chrome/Edge: http://localhost:8080
2. Menú (⋮) → **Instalar Digital Twin**
3. O barra de direcciones → Icono de instalación (⬇️)

### Funcionamiento Offline
- **Assets estáticos** (HTML, CSS, JS, icons): Cache First → Disponibles offline
- **API calls**: Network First → Requieren conexión
- **Navegación**: Network First con fallback a `/index.html`

### Verificar Service Worker
- Chrome DevTools → Application → Service Workers
- Lighthouse → PWA Audit

## 🛠️ Desarrollo

### Build Completo
```bash
./mvnw clean package
# Genera: target/digital-twin-poc-1.0.0-SNAPSHOT.jar
```

### Ejecutar JAR
```bash
java -jar target/digital-twin-poc-1.0.0-SNAPSHOT.jar
```

### Generar Iconos PWA
```bash
cd src/main/frontend/assets
npm install sharp
node generate-icons.js
# O con Inkscape/ImageMagick instalados
```

### Estructura CSS (Variables)
```css
:root {
  --color-primary: #1e3a5f;
  --color-secondary: #00a8cc;
  --bg-primary: #f5f7fa;
  --sidebar-width: 280px;
  --header-height: 64px;
  /* ... más variables en css/styles.css */
}
```

## 🔒 Seguridad (Consideraciones PoC)

| Aspecto | PoC Actual | Producción Requerida |
|---------|------------|---------------------|
| Passwords | Texto plano en JSON | BCrypt/Argon2 + DB |
| JWT Secret | Hardcoded en YAML | Vault/Config Server + Rotación |
| HTTPS | No (localhost) | Obligatorio (TLS 1.3) |
| CORS | `*` (todos) | Origen específico |
| Rate Limiting | No | Bucket4j / Gateway |
| Auditoría | No | Spring Audit / Custom |

## 📦 Próximos Pasos (Roadmap)

### Avance 2 - Core Digital Twin
- [ ] WebSocket para datos en tiempo real (MQTT/OPC UA)
- [ ] Modelado de activos (Asset Administration Shell - AAS)
- [ ] Visualización 3D (Three.js / Babylon.js)
- [ ] Histórico de variables (TimescaleDB / InfluxDB)

### Avance 3 - Mantenimiento Predictivo
- [ ] Motor de reglas (Drools / Easy Rules)
- [ ] Alertas y notificaciones (Email, Push, SMS)
- [ ] Dashboards analíticos (Grafana / Apache ECharts)

### Avance 4 - Multi-Tenant & Enterprise
- [ ] Arquitectura multi-tenant (schema por cliente)
- [ ] SSO/OIDC (Keycloak / Auth0)
- [ ] Auditoría completa y compliance

## 📄 Licencia

Proyecto PoC interno - Manufactura Industrial Digital Twin Initiative

## 👥 Autores

- **Arquitectura & Backend**: Senior Fullstack Java Developer
- **Frontend PWA**: Vanilla JS + CSS Variables + Service Worker

---

> **Nota**: Este es un **Proof of Concept** demostrativo. No usar en producción sin implementar las medidas de seguridad indicadas.