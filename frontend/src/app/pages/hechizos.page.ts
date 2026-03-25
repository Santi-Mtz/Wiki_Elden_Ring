import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { LiveUpdatesService } from '../services/live-updates.service';

interface Hechizo {
  id: number;
  nombre: string;
  costo_fp: number;
  requisitos: string;
  descripcion: string;
}

@Component({
  selector: 'app-hechizos-page',
  standalone: true,
  imports: [CardModule, TagModule, ButtonModule],
  template: `
    <section class="page-section">
      <div class="section-toolbar">
        <div class="section-intro">
          <h3>Hechizos</h3>
          <p>Gestiona daño mágico y costo de FP en una vista compacta.</p>
        </div>
        <div class="wiki-actions">
          <p-tag severity="contrast" [value]="hechizos().length + ' registrados'"></p-tag>
          <button pButton type="button" icon="pi pi-sync" label="Recargar" (click)="loadHechizos()"></button>
        </div>
      </div>
      <p-card header="Hechizos" subheader="Listado de hechizos disponibles">
        @if (hechizos().length === 0) {
          <div class="empty-state">
            No hay hechizos para mostrar.
          </div>
        } @else {
          <div class="wiki-card-grid">
            @for (hechizo of hechizos(); track hechizo.id) {
              <p-card [subheader]="hechizo.requisitos">
                <ng-template pTemplate="title">{{ hechizo.nombre }}</ng-template>
                <p>{{ hechizo.descripcion }}</p>
                <p><strong>Costo FP:</strong> {{ hechizo.costo_fp }}</p>
              </p-card>
            }
          </div>
        }
      </p-card>
    </section>
  `
})
export class HechizosPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private liveSubscription?: Subscription;
  protected readonly hechizos = signal<Hechizo[]>([]);

  ngOnInit(): void {
    this.loadHechizos();
    this.liveSubscription = this.liveUpdates.watchWikiUpdates().subscribe((event) => {
      if (event.type === 'wiki-update') {
        this.loadHechizos();
      }
    });
  }

  ngOnDestroy(): void {
    this.liveSubscription?.unsubscribe();
  }

  protected loadHechizos(): void {
    this.http.get<Hechizo[]>('/api/hechizos').subscribe({
      next: (data) => this.hechizos.set(data ?? []),
      error: (err) => console.error('Error al cargar hechizos:', err)
    });
  }
}
