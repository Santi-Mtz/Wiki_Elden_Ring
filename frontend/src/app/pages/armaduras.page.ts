import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { LiveUpdatesService } from '../services/live-updates.service';

interface Armadura {
  id: number;
  nombre: string;
  categoria: string;
  peso: string;
  defensa_fisica: string;
  defensa_magica: string;
  descripcion: string;
}

@Component({
  selector: 'app-armaduras-page',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule],
  template: `
    <section class="page-section">
      <div class="section-toolbar">
        <div class="section-intro">
          <h3>Armaduras</h3>
          <p>Evalua peso y defensas para mantener movilidad y supervivencia.</p>
        </div>
        <div class="wiki-actions">
          <p-tag severity="contrast" [value]="armaduras().length + ' registradas'"></p-tag>
          <button pButton type="button" icon="pi pi-sync" label="Recargar" (click)="loadArmaduras()"></button>
        </div>
      </div>
      <p-card header="Armaduras" subheader="Todas las armaduras disponibles">
        @if (armaduras().length === 0) {
          <div class="empty-state">
            No hay armaduras cargadas todavia.
          </div>
        } @else {
          <div class="wiki-card-grid">
            @for (armadura of armaduras(); track armadura.id) {
              <p-card [subheader]="armadura.categoria">
                <ng-template pTemplate="title">{{ armadura.nombre }}</ng-template>
                <p>{{ armadura.descripcion }}</p>
                <p><strong>Peso:</strong> {{ armadura.peso }}</p>
                <p><strong>Defensa Física:</strong> {{ armadura.defensa_fisica }}</p>
                <p><strong>Defensa Mágica:</strong> {{ armadura.defensa_magica }}</p>
              </p-card>
            }
          </div>
        }
      </p-card>
    </section>
  `
})
export class ArmadurasPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private liveSubscription?: Subscription;
  protected armaduras = signal<Armadura[]>([]);

  ngOnInit() {
    this.loadArmaduras();
    this.liveSubscription = this.liveUpdates.watchWikiUpdates().subscribe((event) => {
      if (event.type === 'wiki-update') {
        this.loadArmaduras();
      }
    });
  }

  ngOnDestroy() {
    this.liveSubscription?.unsubscribe();
  }

  loadArmaduras() {
    this.http.get<Armadura[]>('/api/armaduras').subscribe({
      next: (data) => this.armaduras.set(data),
      error: (err) => console.error('Error al cargar armaduras:', err)
    });
  }
}
