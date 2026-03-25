# AEGIS Wiki Elden Ring

Una wiki interactiva sobre Elden Ring con autenticación segura mediante WebAuthn biométrico, gestión de perfiles de usuario y contenido multimedia.

## Versiones

- **Node.js**: 24.13.0
- **Angular**: 21.1.0
- **Express**: 5.2.1
- **PostgreSQL**: 15+
- **@simplewebauthn/browser**: 11.0.0
- **@simplewebauthn/server**: 11.0.0

## Características Implementadas

### ✅ Autenticación y Seguridad
- Sistema de login/registro con validación JWT
- **Autenticación biométrica 2FA** usando WebAuthn (Windows Hello, Touch ID, lectores de huellas)
- Entrenamiento y gestión de credenciales biométricas desde el perfil del usuario
- Almacenamiento seguro de credenciales en base de datos PostgreSQL
- Sesión persistente mediante localStorage

### ✅ Gestión de Usuarios
- Sistema de roles (usuario, administrador)
- Perfil de usuario ("Mi perfil") con:
  - Información personal (nombre, email, rol, estado de cuenta)
  - Configuración de huella digital biométrica
  - Opción para re-enrolar biometría
- Guardias de ruta para acceso seguro (authGuard, adminGuard, userGuard)

### ✅ Contenido
- **Bases de datos de Elden Ring**:
  - Armas y armaduras
  - Hechizos y milagros
  - Talismanes
  - Guías de builds
- **Mapas interactivos** embebidos (MapGenie):
  - The Lands Between
  - The Shadow Realm

### ✅ Interfaz de Usuario
- Navegación optimizada con sidebar responsive
- Menú de secciones dinámico (se adapta según autenticación)
- Estructura: 
  - Barra superior con branding
  - Sidebar con sesión del usuario y navegación
  - Área de contenido flexible
  - Footer con información
- Diseño responsivo y tema oscuro

## Estructura del Proyecto

```
.
├── frontend/                          # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.ts               # Componente principal con gestión de menú
│   │   │   ├── app.html             # Layout principal
│   │   │   ├── app.css              # Estilos globales
│   │   │   ├── pages/               # Páginas de la aplicación
│   │   │   │   ├── login.page.ts    # Autenticación+ WebAuthn
│   │   │   │   ├── vista-usuario.page.ts   # Perfil con config biométrica
│   │   │   │   ├── vista-admin.page.ts     # Perfil admin
│   │   │   │   ├── mapa.page.ts    # Mapas interactivos
│   │   │   │   └── (otras páginas)
│   │   │   ├── services/            # Servicios
│   │   │   │   ├── auth.service.ts  # Autenticación y WebAuthn
│   │   │   │   └── api.service.ts
│   │   │   └── guards/              # Guardias de ruta
│   │   ├── assets/                  # Recursos (logos, imágenes)
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
└── mi-servidor/                      # Backend Express.js
    ├── index.js                      # Servidor API con endpoints WebAuthn
    ├── db.js                         # Configuración de base de datos
    └── package.json
```

## Cómo Ejecutar

### Requisitos Previos
- Node.js 24.13.0+
- PostgreSQL 15+ (o Docker con imagen PostgreSQL)
- npm

### Backend
```bash
cd mi-servidor
npm install
npm run db:init    # Inicializar base de datos
npm start          # Inicia en puerto 3000
```

### Frontend
```bash
cd frontend
npm install
npm start          # Inicia en puerto 4200
# O: ng serve --open
```

La aplicación estará disponible en `http://localhost:4200`

## Endpoints Principales de API

### Autenticación
- `POST /auth/login` - Validar credenciales, inicia flujo WebAuthn si es necesario
- `POST /auth/login/verify-biometric` - Verifica/registra credencial biométrica
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/logout` - Cerrar sesión

### Biometría (WebAuthn)
- `GET /auth/biometric/status/:userId` - Verificar si usuario tiene huella registrada
- `POST /auth/biometric/enroll/start` - Iniciar enrolado de huella desde perfil
- `POST /auth/biometric/reset` - Eliminar huella registrada

### Contenido
- `GET /api/armas` - Listar armas
- `GET /api/armaduras` - Listar armaduras
- `GET /api/hechizos` - Listar hechizos
- Y más según contenido disponible

## Paleta de Colores

```
Fondo principal:        #0F1115
Superficie:             #1A1E24
Texto:                  #E6E6E6
Texto secundario:       #A0A6B0
Acento dorado:          #C9A227
Acento rojo tenue:      #8B2E2E
Borde suave:            #2A2F38
Acento azul:            #7db4ff
```

## Tecnologías y Librerías

- **Frontend**: Angular 21 (standalone components), PrimeNG 21, RxJS, TypeScript 5
- **Backend**: Express.js 5.2.1, PostgreSQL, bcryptjs, @simplewebauthn/server
- **Seguridad**: JWT, WebAuthn (FIDO2), bcrypt para hashing de contraseñas
- **Base de datos**: PostgreSQL con tablas: usuarios, armas, armaduras, hechizos, milagros, talismanes, builds, user_webauthn_credentials

## Estado del Proyecto

### Completado
- ✅ Sistema de autenticación con JWT
- ✅ Registración de usuarios
- ✅ WebAuthn biométrico integrado (2FA)
- ✅ Gestión de perfil de usuario
- ✅ Navegación y estructura visual
- ✅ Mapas interactivos
- ✅ Sistema de roles (usuario/admin)
- ✅ Guardias de ruta

### En Desarrollo / Mejoras Futuras
- Búsqueda avanzada de contenido
- Comparadores de builds
- Sistema de comentarios
- Favoritismo de items/builds
- Importación de datos desde APIs externas

## Notas Importantes

- **Biometría**: Funciona en navegadores modernos (Chrome 67+, Firefox 60+, Safari 13+) con autenticadores de plataforma (Windows Hello, Touch ID, lectores de huellas)
- **HTTPS**: En producción, considera usar HTTPS para mayor seguridad con WebAuthn
- **Base de datos**: La aplicación espera PostgreSQL en `localhost:5432` (o configuración en mi-servidor/index.js)
- **Puerto del servidor**: Backend corre en puerto 3000 por defecto