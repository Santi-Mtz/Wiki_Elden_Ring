import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { LiveUpdatesService } from '../services/live-updates.service';

interface Personaje {
  id: number;
  nombre: string;
  faccion: string;
  zona: string;
  descripcion: string;
}

@Component({
  selector: 'app-personajes-page',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule],
  template: `
    <section class="page-section">
      <div class="section-toolbar">
        <div class="section-intro">
          <h3>Personajes</h3>
          <p>Consulta ubicación y facción sin saturar la lectura.</p>
        </div>
        <div class="wiki-actions">
          <p-tag severity="contrast" [value]="personajes().length + ' registrados'"></p-tag>
          <button pButton type="button" icon="pi pi-sync" label="Recargar" (click)="loadPersonajes()"></button>
        </div>
      </div>
      <p-card header="Personajes" subheader="NPCs del mundo">
        @if (personajes().length === 0) {
          <div class="empty-state">
            Todavia no hay personajes cargados.
          </div>
        } @else {
          <div class="wiki-card-grid">
            @for (personaje of personajes(); track personaje.id) {
              <p-card [subheader]="personaje.zona">
                <ng-template pTemplate="title">{{ personaje.nombre }}</ng-template>
                <p>{{ personaje.descripcion }}</p>
                <p><strong>Facción:</strong> {{ personaje.faccion }}</p>
              </p-card>
            }
          </div>
        }
      </p-card>
    </section>
  `
})
export class PersonajesPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private liveSubscription?: Subscription;
  protected personajes = signal<Personaje[]>([]);

  ngOnInit() {
    this.loadPersonajes();
    this.liveSubscription = this.liveUpdates.watchWikiUpdates().subscribe((event) => {
      if (event.type === 'wiki-update') {
        this.loadPersonajes();
      }
    });
  }

  ngOnDestroy() {
    this.liveSubscription?.unsubscribe();
  }

  loadPersonajes() {
    this.http.get<Personaje[]>('/api/personajes').subscribe({
      next: (data) => this.personajes.set(data),
      error: (err) => console.error('Error al cargar personajes:', err)
    });
  }
}
