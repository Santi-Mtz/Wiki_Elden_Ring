import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { LiveUpdatesService } from '../services/live-updates.service';

interface Talisman {
  id: number;
  nombre: string;
  efecto: string;
  ubicacion: string;
}

@Component({
  selector: 'app-talismanes-page',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule],
  template: `
    <section class="page-section">
      <div class="section-toolbar">
        <div class="section-intro">
          <h3>Talismanes</h3>
          <p>Encuentra efectos clave sin perder visibilidad del inventario.</p>
        </div>
        <div class="wiki-actions">
          <p-tag severity="contrast" [value]="talismanes().length + ' registrados'"></p-tag>
          <button pButton type="button" icon="pi pi-sync" label="Recargar" (click)="loadTalismanes()"></button>
        </div>
      </div>
      <p-card header="Talismanes" subheader="Todos los talismanes disponibles">
        @if (talismanes().length === 0) {
          <div class="empty-state">
            Aun no hay talismanes disponibles para esta vista.
          </div>
        } @else {
          <div class="wiki-card-grid">
            @for (talisman of talismanes(); track talisman.id) {
              <p-card [subheader]="talisman.ubicacion">
                <ng-template pTemplate="title">{{ talisman.nombre }}</ng-template>
                <p>{{ talisman.efecto }}</p>
              </p-card>
            }
          </div>
        }
      </p-card>
    </section>
  `
})
export class TalismanesPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private liveSubscription?: Subscription;
  protected talismanes = signal<Talisman[]>([]);

  ngOnInit() {
    this.loadTalismanes();
    this.liveSubscription = this.liveUpdates.watchWikiUpdates().subscribe((event) => {
      if (event.type === 'wiki-update') {
        this.loadTalismanes();
      }
    });
  }

  ngOnDestroy() {
    this.liveSubscription?.unsubscribe();
  }

  loadTalismanes() {
    this.http.get<Talisman[]>('/api/talismanes').subscribe({
      next: (data) => this.talismanes.set(data),
      error: (err) => console.error('Error al cargar talismanes:', err)
    });
  }
}
