# Documentación de Actualización Estacional y Manipulación del DOM

Esta documentación detalla los desarrollos técnicos y las características implementadas para la actualización de temporada de la **Wiki de Elden Ring (AEGIS Wiki)**, enfocado en eventos del puntero, tematización del calendario y administración interactiva del DOM.

---

## 1. Evento de Destacado mediante Puntero (Spotlight Glow)

### Descripción
Para la **Temporada de la Gracia Dorada (Verano)**, se implementó un evento interactivo que detecta la posición del cursor sobre las tarjetas de la interfaz para proyectar un foco o resplandor de luz dorado (spotlight) que sigue el movimiento del puntero, acompañado de una transición de escala y cambio de color del borde.

### Detalles Técnicos e Implementación
El evento se programó en Angular mediante una directiva standalone (`HighlightDirective`), utilizando escuchadores de eventos nativos de JavaScript para dispositivos señaladores (Pointer Events):

1. **Directiva (`highlight.directive.ts`)**:
   - **`pointerenter`**: Activa la clase `.seasonal-highlight-active` que inicia la transición visual (escala, borde dorado y opacidad del brillo).
   - **`pointermove`**: Registra las coordenadas relativas `clientX` y `clientY` respecto al contenedor usando `getBoundingClientRect()`, y actualiza dos variables de entorno CSS (`--mouse-x` y `--mouse-y`).
   - **`pointerleave`**: Remueve la clase activa y oculta el resplandor para optimizar el rendimiento y limpiar el DOM visual.

```typescript
// Fragmento de highlight.directive.ts
@HostListener('pointermove', ['$event'])
onPointerMove(event: PointerEvent) {
  const rect = this.el.nativeElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  this.renderer.setStyle(this.el.nativeElement, '--mouse-x', `${x}px`);
  this.renderer.setStyle(this.el.nativeElement, '--mouse-y', `${y}px`);
}
```

2. **Estilos CSS (`styles.css`)**:
   Utiliza un gradiente radial flotante posicionado con las variables actualizadas por el evento JavaScript:
```css
.seasonal-highlight::before {
	content: '';
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	background: radial-gradient(
		80px circle at var(--mouse-x, 0px) var(--mouse-y, 0px),
		rgba(202, 165, 81, 0.15),
		transparent 80%
	);
	opacity: 0;
	transition: opacity 0.3s ease;
	pointer-events: none;
}
.seasonal-highlight-active::before {
	opacity: 1;
}
```

---

## 2. Menú Desplegable Basado en Eventos de Puntero (Dropdown)

### Descripción
Un menú de navegación en la barra superior ("Wiki Categorías") que se despliega dinámicamente al pasar el puntero sobre él y se oculta cuando el puntero sale de su área delimitada. Esto permite una navegación rápida y fluida sin requerir clics innecesarios.

### Detalles Técnicos e Implementación
- El contenedor del menú se enlazó a los eventos JavaScript/Angular `(pointerenter)` y `(pointerleave)` en la plantilla `app.html`.
- Dichos eventos modifican el estado de un Signal reactivo (`dropdownVisible`).
- Al cambiar el estado a `true`, el DOM renderiza condicionalmente el contenedor del menú desplegable (`.nav-dropdown-menu`), el cual posee un diseño glassmorphic y una animación de entrada de desvanecimiento y deslizamiento (`slideDownFade`).
- Al hacer clic en un enlace de categoría o retirar el puntero, se dispara el evento para cerrar el menú inmediatamente.

---

## 3. Tematización de Interfaz basada en el Calendario (Periodos)

### Descripción
El sitio web cuenta con un detector de fecha calendarizado que adapta la cabecera, el banner y el esquema de colores de la interfaz dependiendo del mes actual en el sistema del cliente.

### Calendario de Eventos:
*   **Verano (Meses Junio, Julio, Agosto)**: *Temporada de la Gracia Dorada (Golden Grace Season)*.
    - Estilo: Resplandor dorado, ámbar y azul cobalto oscuro.
    - Banner: "AEGIS Wiki · Solsticio de Oro - Temporada de la Gracia Dorada".
*   **Otoño (Meses Octubre, Noviembre)**: *Temporada del Fuego de la Zarza (Shadow Bramble Season)*.
    - Estilo: Resplandor carmesí, ceniza y negro carbón.
    - Banner: "AEGIS Wiki · Cosecha de Sombras - Temporada del Fuego de la Zarza".
*   **Invierno (Meses Diciembre, Enero, Febrero)**: *Temporada de la Helada del Gigante (Frost Glintstone Season)*.
    - Estilo: Resplandor azul glacial, escarcha y plateado.
    - Banner: "AEGIS Wiki · Invierno Helado - Temporada de la Helada del Gigante".
*   **Resto del año**: Tema por defecto del sitio.

### Flujo de Ejecución:
En el ciclo de inicio `ngOnInit()` de `app.ts`, se evalúa:
```typescript
const currentMonth = new Date().getMonth();
// Asigna clases como 'theme-golden-grace' y modifica los signals del banner
```
La clase resultante se acopla al tag principal del DOM `<main [class]="currentTheme()">`, heredando los colores correspondientes de las variables CSS.

---

## 4. Administrador de Tareas: Bitácora de Misiones del Sinluz

### Descripción
Para satisfacer la manipulación avanzada de la estructura, contenido y estilos del DOM, se implementó una página interactiva de administración de tareas (misiones) a la cual se accede desde la barra lateral o el menú desplegable.

### Funciones Implementadas del DOM y Eventos:
1.  **Creación**: El usuario llena un formulario. El botón de envío se valida activamente. Al presionar "Añadir Misión", se crea dinámicamente una nueva tarjeta en la rejilla del DOM.
2.  **Validaciones**: Validación en tiempo real del título (mínimo 4 letras) y el objetivo (mínimo 10 letras), mostrando mensajes de error dinámicos en el DOM y deshabilitando el botón de envío si no se cumplen.
3.  **Modificación (Edición)**: Al presionar "Editar", se cargan los datos en el formulario para modificarlos. Al guardar, se actualiza el contenido de la tarjeta en el DOM.
4.  **Actualización de Estados (Completado)**: Al presionar "Completar/Reabrir", se altera el estilo de la tarjeta (se tacha el título, se cambia la opacidad y el color del chip de estado) y se actualizan dinámicamente las estadísticas del progreso.
5.  **Eliminación**: El botón "Eliminar" remueve físicamente el nodo del DOM y recalcula las estadísticas globales de misiones de inmediato.
6.  **Estadísticas Dinámicas**: Un panel circular calcula de forma computada el porcentaje de misiones completas y actualiza los contadores en tiempo real.
