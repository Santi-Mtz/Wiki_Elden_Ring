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
        <h3>Panel Principal</h3>
        <p>Tu ruta por las Tierras Intermedias empieza aqui.</p>
      </div>

      <p-card subheader="Guia comunitaria para avanzar con confianza">
        <div class="home-hero home-hero-v2">
          <div class="home-hero-content">
            <h3 class="home-title">
              <span>Bienvenido,</span>
              <strong>Sinluz</strong>
            </h3>
            <span class="home-kicker">Ruta del Sinluz</span>
            <h4>Avanza con foco en tres pasos</h4>

            <ol class="home-steps">
              <li>Explora armas y armaduras para definir tu estilo.</li>
              <li>Combina talismanes y hechizos con objetivos claros.</li>
              <li>Ajusta tu build y entra al combate con ventaja.</li>
            </ol>

            <div class="home-highlights">
              <p-tag severity="warn" value="Base en expansion"></p-tag>
              <p-tag severity="info" value="Builds con nivel recomendado"></p-tag>
              <p-tag severity="success" value="Guias para nuevos jugadores"></p-tag>
            </div>

            <div class="quick-actions">
              <a pButton routerLink="/armas" icon="pi pi-arrow-right" label="Explorar armas"></a>
              <a pButton routerLink="/builds" icon="pi pi-compass" label="Ver builds" severity="secondary"></a>
              <a pButton routerLink="/mapa" icon="pi pi-map" label="Abrir mapa" severity="contrast"></a>
            </div>
          </div>

          <aside class="home-side-panel">
            <img src="/assets/Logo/logo_provisional.jpg" alt="Vista general AEGIS Wiki" />
            <div class="home-weapon-showcase">
              <img
                src="/assets/lordsworns_straight_sword_straight_sword_weapon_elden_ring_wiki_guide_200px.png"
                alt="Espada destacada"
              />
              <p>Arma destacada</p>
            </div>
            <div class="home-stat-grid">
              <div class="home-stat-card">
                <strong>8</strong>
                <span>secciones clave</span>
              </div>
              <div class="home-stat-card">
                <strong>12</strong>
                <span>builds iniciales</span>
              </div>
              <div class="home-stat-card">
                <strong>100%</strong>
                <span>enfoque comunidad</span>
              </div>
            </div>
          </aside>
        </div>

        <div class="home-feature-strip">
          <article>
            <i class="pi pi-shield"></i>
            <div>
              <h5>Progresion guiada</h5>
              <p>Te mostramos una ruta clara para no perderte al empezar.</p>
            </div>
          </article>
          <article>
            <i class="pi pi-bolt"></i>
            <div>
              <h5>Comparacion rapida</h5>
              <p>Compara piezas y decisiones de build sin salir de la wiki.</p>
            </div>
          </article>
          <article>
            <i class="pi pi-users"></i>
            <div>
              <h5>Comunidad activa</h5>
              <p>Contenido pensado por jugadores para jugadores.</p>
            </div>
          </article>
        </div>
      </p-card>
    </section>
  `
})
export class HomePage {}
