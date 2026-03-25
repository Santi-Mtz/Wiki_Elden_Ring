import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-vista-usuario-page',
  standalone: true,
  imports: [CardModule, TagModule, ButtonModule, RouterLink],
  template: `
    <section class="page-section">
      <div class="section-intro">
        <h3>Mi perfil</h3>
        <p>Gestiona tu cuenta, tus preferencias y tu ruta dentro de la wiki.</p>
      </div>

      <p-card header="Panel de perfil" subheader="Información de cuenta y atajos personales">
        <div class="profile-top">
          <div class="profile-identity">
            <div class="profile-avatar">{{ initials() }}</div>
            <div class="profile-details">
              <h4>{{ currentUser()?.nombre ?? 'Sin datos' }}</h4>
              <p>{{ currentUser()?.email ?? 'Sin datos' }}</p>
              <p-tag severity="info" [value]="'Rol: ' + (currentUser()?.role ?? 'user')"></p-tag>
            </div>
          </div>

          <div class="wiki-chip-row">
            <p-tag severity="success" value="Perfil activo"></p-tag>
            <p-tag severity="warn" value="Preferencias configurables"></p-tag>
            <p-tag severity="contrast" value="Soporte disponible"></p-tag>
          </div>
        </div>

        <div class="profile-panels">
          <p-card>
            <ng-template pTemplate="title">Preferencias rápidas</ng-template>
            <ng-template pTemplate="subtitle">Personalización</ng-template>
            <p>Accede rápido a secciones clave según tu estilo de juego.</p>
            <p-tag severity="warn" value="Configurable"></p-tag>
          </p-card>

          <p-card>
            <ng-template pTemplate="title">Seguridad de cuenta</ng-template>
            <ng-template pTemplate="subtitle">Recomendaciones</ng-template>
            <p>Mantén una contraseña segura y evita compartir tus accesos.</p>
            <p-tag severity="success" value="Recomendado"></p-tag>
          </p-card>

          <p-card>
            <ng-template pTemplate="title">Ayuda y soporte</ng-template>
            <ng-template pTemplate="subtitle">Asistencia</ng-template>
            <p>Usa contacto para dudas, reportes y sugerencias de mejora.</p>
            <p-tag severity="info" value="Disponible"></p-tag>
          </p-card>
        </div>

        <div class="wiki-actions">
          <a pButton routerLink="/armas" icon="pi pi-arrow-right" label="Explorar armas"></a>
          <a pButton routerLink="/builds" icon="pi pi-cog" label="Ver builds" severity="secondary"></a>
          <a pButton routerLink="/seguridad" icon="pi pi-shield" label="Configurar 2FA" severity="warn"></a>
          <a pButton routerLink="/contacto" icon="pi pi-envelope" label="Contactar soporte" severity="contrast"></a>
        </div>
      </p-card>
    </section>
  `
})
export class VistaUsuarioPage {
  private readonly authService = inject(AuthService);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly initials = computed(() => {
    const name = this.currentUser()?.nombre?.trim() ?? '';
    if (!name) {
      return 'US';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase() || 'US';
  });
}
