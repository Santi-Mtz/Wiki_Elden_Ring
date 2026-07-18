# Manual de Usuario - Sistema de Administración, Seguridad y Auditoría (AEGIS Wiki)

Este manual te guiará paso a paso en el uso de la Wiki de Elden Ring (AEGIS Wiki) para gestionar tu cuenta de usuario, configurar la seguridad y, si eres administrador, gestionar los accesos y revisar la bitácora de auditoría del sistema (requisito de las **Prácticas 11 y 12**).

---

## 1. Registro e Inicio de Sesión

### 1.1 Registrar una Cuenta
1. Abre tu navegador e ingresa al sitio.
2. Haz clic en **Registro** en el panel de navegación izquierdo o ingresa a `/registro`.
3. Escribe tu Nombre Completo, Correo Electrónico y una Contraseña.
   *   *Nota de seguridad*: La contraseña debe cumplir las políticas de fuerza (mínimo 8 caracteres, al menos una mayúscula, un número y un símbolo especial como `!`, `@`, `#`).
4. Haz clic en **Registrarme**. Serás redirigido e iniciarás sesión automáticamente.

### 1.2 Iniciar Sesión (Login)
1. Ve al panel de navegación y haz clic en **Login** (o ingresa a `/login`).
2. Digita tu correo y tu contraseña.
3. Si tienes la verificación en dos pasos (2FA) configurada, abre Microsoft Authenticator en tu celular, digita el código de 6 números y confírmalo.

> [!WARNING]
> **Bloqueo Temporal de Cuenta**
> Si ingresas la contraseña de forma incorrecta **3 veces consecutivas**, tu cuenta se bloqueará automáticamente por seguridad durante **15 minutos**. Verás una alerta roja en pantalla. Deberás esperar a que expire el lapso antes de intentar de nuevo.

---

## 2. Autogestión de Perfil (Usuario Regular)

Al ingresar a la Wiki, haz clic en tu nombre en el panel lateral y selecciona **Perfil** para entrar a tu perfil.

### 2.1 Editar Datos del Perfil
*   En la tarjeta **Editar Datos**, verás tu nombre actual.
*   Modifícalo en el cuadro de texto y presiona **Guardar Datos**. Tu avatar e iniciales cambiarán de forma inmediata.

### 2.2 Cambiar Contraseña
*   En la sección inferior **Seguridad de la Cuenta**, introduce tu contraseña actual.
*   Digita tu nueva contraseña y confírmala en la casilla inferior.
*   Presiona **Actualizar Contraseña** para efectuar el cambio.

---

## 3. Módulo Administrativo (Administrador)

Si has ingresado con una cuenta con rol de Administrador, verás un botón negro llamado **Gestionar usuarios** en el panel de navegación lateral.

El módulo administrativo está dividido en tres pestañas:

### 3.1 Pestaña: Cuentas (Gestión de Usuarios)
Esta sección permite el control total de los empleados:
*   **Crear Usuario**: Utiliza el formulario **Nuevo Usuario** a la izquierda. Escribe su nombre, correo, rol principal, contraseña temporal y presiona *Crear Usuario*.
*   **Editar Usuario**: Haz clic en el botón azul **Editar** al lado de cualquier usuario de la lista. Su información se cargará en el formulario para que puedas editar su nombre, rol, estado activo o permisos personalizados.
*   **Baja Lógica**: Haz clic en el botón rojo **Baja Lógica** al lado de un usuario. Esto desactivará su cuenta. Su fila se volverá opaca en el listado y no podrá iniciar sesión en la plataforma, pero sus datos se conservarán en el sistema para fines de auditoría.
*   **Restablecer Contraseña**: Si un empleado olvida su contraseña, haz clic en el botón amarillo **Clave** al lado de su nombre. Se desplegará un formulario inferior para que le asignes una nueva clave segura.

### 3.2 Pestaña: Roles y Permisos
*   Visualiza el desglose de los permisos predeterminados del sistema asociados a los roles de **Administrador (admin)** y **Usuario Regular (user)**.

### 3.3 Pestaña: Bitácora de Auditoría
*   Visualiza la tabla de historial donde se registran todas las actividades importantes en tiempo real.
*   Presiona **Actualizar Bitácora** para cargar los registros más recientes.
*   Verás columnas detalladas con:
    *   **ID**: Identificador del log.
    *   **Usuario**: Quién realizó la acción.
    *   **Fecha y Hora**: Cuándo se efectuó.
    *   **Dirección IP**: La IP física desde la cual se llamó a la API.
    *   **Acción Realizada**: Descripción detallada del evento.
