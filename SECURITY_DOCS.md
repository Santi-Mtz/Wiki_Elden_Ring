# Documentación de Seguridad, Privacidad (LFPDPPP) y PWA - AEGIS Wiki

Esta documentación cubre los aspectos legales, de privacidad y la lista de comprobación de seguridad requeridos por la materia **Desarrollo para Dispositivos Inteligentes** para la **Evaluación 2 (Ecosistema Completo)**.

---

## 1. Cumplimiento Legal y LFPDPPP

### 1.1 Identificación de la Ley Aplicable
El ecosistema **AEGIS Wiki** cumple con la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)** en México. Dado que el backend de Express procesa e identifica cuentas de usuarios que residen en territorio nacional, el sistema establece controles claros sobre la privacidad.

### 1.2 Datos Personales Recabados y Justificación
El sistema procesa y almacena únicamente los siguientes datos personales:
1.  **Correo electrónico**: Obligatorio como identificador único de cuenta y para el canal de restablecimiento.
2.  **Contraseña**: Requerido para verificar la identidad en el login. Se procesa con cifrado unidireccional `bcrypt` en el servidor y nunca se almacena en texto plano.
3.  **Secreto TOTP (MFA)**: Clave alfanumérica compartida para el algoritmo de segundo factor (TOTP) generada por `otplib` para autenticación por proximidad o código manual.

*Justificación*: La recolección de estos datos es mínima e indispensable para prestar el servicio de autenticación segura y personalización de las builds del usuario en el ecosistema.

---

## 2. Aviso de Privacidad Básico (Simulado)

**Responsable del Tratamiento**: Santiago Alberto Martínez Hernández (Grupo: IDGS16), alumno del cuatrimestre Mayo-Agosto 2026 de la asignatura *Desarrollo para Dispositivos Inteligentes*.

**Finalidad del Tratamiento**:
Los datos personales recabados serán utilizados exclusivamente para:
*   Evaluar el funcionamiento del inicio de sesión único (SSO) en múltiples pantallas.
*   Establecer canal seguro de comunicación (SSE/Bluetooth).
*   Sincronizar las estadísticas del portador (ritmo cardíaco, horas de juego) entre el wearable, teléfono y Smart TV.

**Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)**:
El usuario puede solicitar en cualquier momento el acceso a sus datos de bitácora, la rectificación de su nombre de perfil, la cancelación de su cuenta o la oposición al procesamiento. En esta plataforma académica, el usuario puede ejercer estos derechos enviando un correo al administrador o eliminando su cuenta de forma directa a través del módulo de autogestión.

---

## 3. Plan de Retención y Eliminación de Datos

*   **Servidor PostgreSQL**: Los registros de usuarios inactivos o suspendidos se marcan con eliminación lógica (`activo = false`) para preservar la integridad referencial de los históricos de auditoría, eliminándose físicamente a solicitud del titular de la cuenta.
*   **Almacenamiento Local (PWA/Móvil)**: Los datos almacenados en el `localStorage` o `SharedPreferences` que excedan un período de **30 días** desde su creación son eliminados automáticamente al iniciar la aplicación.
*   **Método de Eliminación**: El frontend de la Smart TV PWA evalúa en `ngOnInit` los timestamps de las claves con prefijo `aegis_cache_time_` y elimina tanto el dato como el timestamp de expiración mediante `localStorage.removeItem()`.

---

## 4. Checklist de Seguridad para la PWA

### 4.1 Content Security Policy (CSP)
La PWA implementa restricciones estrictas en su cabecera `meta http-equiv="Content-Security-Policy"` en `index.html`:
*   `default-src 'self'`: Bloquea recursos externos no autorizados.
*   `connect-src 'self' http://localhost:3000 https://aegis-wiki-backend.onrender.com`: Restringe el intercambio asíncrono y los Server-Sent Events (SSE) exclusivamente al backend del proyecto.
*   `img-src` y `media-src`: Permite cargar imágenes y videos únicamente sobre canales cifrados `https:`.

### 4.2 Validación de Origen (Event Origin)
*   Para comunicaciones inter-pestañas mediante `BroadcastChannel` en la Smart TV, se configuró un middleware en TypeScript que valida que el origen del evento coincida exactamente con el dominio base del proyecto (`https://wikieldenring.vercel.app` o el origin local del navegador), descartando cualquier payload malicioso de inyección Cross-Site Scripting (XSS) (**SA.4**).

### 4.3 Uso de HTTPS y Cifrado
*   El backend en Render y la PWA en Vercel imponen de manera obligatoria la redirección de tráfico a canales seguros cifrados con el protocolo **HTTPS / TLS 1.3**. Se rechaza la transferencia sobre HTTP plano.

### 4.4 Subresource Integrity (SRI)
*   Se habilitó `"subresourceIntegrity": true` en `angular.json` para las compilaciones de producción de la PWA. Esto añade de forma automática firmas hashes criptográficas (`integrity="sha384-..."`) a todas las hojas de estilo y scripts cargados por el navegador, garantizando que los archivos de la app no hayan sido alterados o manipulados por terceros (ataques Man-in-the-Middle o inyecciones maliciosas) (**SA.4**).
