import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-vista-admin-page',
  standalone: true,
  imports: [CardModule, TagModule, ButtonModule, RouterLink],
  template: `
    <section class="page-section">
      <div class="section-intro">
        <h3>Mi perfil (Administrador)</h3>
        <p>Gestiona tu cuenta y tus tareas de administración desde un solo lugar.</p>
      </div>

      <p-card header="Resumen de perfil" subheader="Información de acceso administrativo">
        <div class="wiki-card-grid">
          <p-card subheader="Cuenta">
            <ng-template pTemplate="title">Datos de administrador</ng-template>
            <p><strong>Nombre:</strong> {{ currentUser()?.nombre ?? 'Sin datos' }}</p>
            <p><strong>Correo:</strong> {{ currentUser()?.email ?? 'Sin datos' }}</p>
            <p-tag severity="danger" [value]="'Rol: ' + (currentUser()?.role ?? 'admin')"></p-tag>
          </p-card>

          <p-card subheader="Identidad">
            <ng-template pTemplate="title">Avatar textual</ng-template>
            <p>Referencia rápida para sesiones de administración.</p>
            <p-tag severity="info" [value]="'Iniciales: ' + initials()"></p-tag>
          </p-card>

          <p-card subheader="Seguridad">
            <ng-template pTemplate="title">Buenas prácticas</ng-template>
            <p>Mantén credenciales seguras y revisa accesos periódicamente.</p>
            <p-tag severity="success" value="Protegido"></p-tag>
          </p-card>
        </div>

        <div class="wiki-card-grid">
          <p-card subheader="Contenido">
            <ng-template pTemplate="title">Revisar secciones</ng-template>
            <p>Actualiza entradas de armas, hechizos y builds.</p>
            <p-tag severity="info" value="Gestión"></p-tag>
          </p-card>

          <p-card subheader="Usuarios">
            <ng-template pTemplate="title">Control de cuentas</ng-template>
            <p>Supervisa registro, acceso y actividad del sistema.</p>
            <p-tag severity="warn" value="Moderación"></p-tag>
          </p-card>

          <p-card subheader="Sistema">
            <ng-template pTemplate="title">Estado del sitio</ng-template>
            <p>Verifica conexión API y consistencia de datos.</p>
            <p-tag severity="contrast" value="Monitoreo"></p-tag>
          </p-card>
        </div>

        <div class="wiki-actions">
          <a pButton routerLink="/armas" icon="pi pi-sparkles" label="Gestionar armas"></a>
          <a pButton routerLink="/seguridad" icon="pi pi-shield" label="Configurar 2FA" severity="warn"></a>
          <a pButton routerLink="/contacto" icon="pi pi-envelope" label="Responder mensajes" severity="secondary"></a>
          <a pButton routerLink="/personajes" icon="pi pi-users" label="Revisar perfiles" severity="contrast"></a>
        </div>
      </p-card>
    </section>
  `
})
export class VistaAdminPage {
  private readonly authService = inject(AuthService);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly initials = computed(() => {
    const name = this.currentUser()?.nombre?.trim() ?? '';
    if (!name) {
      return 'AD';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase() || 'AD';
  });
}
