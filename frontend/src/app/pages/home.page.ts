import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, CardModule, TagModule, ButtonModule],
  template: `
    <section class="page-section">
      <div class="section-intro">
        <h3>Panel principal</h3>
        <p>Tu ruta por las Tierras Intermedias empieza aqui.</p>
      </div>

      <p-card subheader="Guia comunitaria para avanzar con confianza">
        <div class="home-simple">
          <div class="home-simple-main">
            <h4>Bienvenido, Sinluz</h4>
            <p>
              Explora equipo, compara builds y avanza con una ruta clara sin complicaciones.
            </p>

            <div class="quick-actions">
              <a pButton routerLink="/armas" icon="pi pi-arrow-right" label="Explorar armas"></a>
              <a pButton routerLink="/builds" icon="pi pi-compass" label="Ver builds" severity="secondary"></a>
              <a pButton routerLink="/mapa" icon="pi pi-map" label="Abrir mapa" severity="contrast"></a>
            </div>

            <div class="home-highlights">
              <p-tag severity="warn" value="Base en expansion"></p-tag>
              <p-tag severity="info" value="Builds iniciales"></p-tag>
              <p-tag severity="success" value="Apto para nuevos jugadores"></p-tag>
            </div>
          </div>

          <div class="home-simple-side">
            <img src="/assets/Logo/logo_provisional.jpg" alt="Insignia AEGIS Wiki" />
            <div class="home-simple-stats">
              <span>8 secciones</span>
              <span>12 builds</span>
              <span>Actualizacion en vivo</span>
            </div>
          </div>
        </div>
      </p-card>
    </section>
  `
})
export class HomePage {}
