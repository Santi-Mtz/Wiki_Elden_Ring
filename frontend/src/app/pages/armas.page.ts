import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { LiveUpdatesService } from '../services/live-updates.service';

interface Arma {
  id: number;
  nombre: string;
  tipo_id: number;
  rareza: number;
  peso: string;
  escalado: string;
  descripcion: string;
}

@Component({
  selector: 'app-armas-page',
  standalone: true,
  imports: [CardModule, TagModule, ButtonModule],
  template: `
    <section class="page-section">
      <div class="section-toolbar">
        <div class="section-intro">
          <h3>Armas</h3>
          <p>Compara estadísticas base y escalado antes de invertir recursos.</p>
        </div>
        <div class="wiki-actions">
          <p-tag severity="contrast" [value]="armas().length + ' registradas'"></p-tag>
          <button pButton type="button" icon="pi pi-sync" label="Recargar" (click)="loadArmas()"></button>
        </div>
      </div>
      <p-card header="Armas" subheader="Todas las armas disponibles">
        @if (armas().length === 0) {
          <div class="empty-state">
            Aun no hay armas cargadas para mostrar.
          </div>
        } @else {
          <div class="wiki-card-grid">
            @for (arma of armas(); track arma.id) {
              <p-card [subheader]="arma.escalado">
                <ng-template pTemplate="title">{{ arma.nombre }}</ng-template>
                <div class="weapon-card-media">
                  <img [src]="getWeaponImage(arma)" [alt]="arma.nombre" />
                </div>
                <p>{{ arma.descripcion }}</p>
                <p><strong>Rareza:</strong> {{ arma.rareza }}/5</p>
                <p><strong>Peso:</strong> {{ arma.peso }}</p>
                <p-tag [value]="arma.escalado" [severity]="getSeverity(arma.rareza)"></p-tag>
              </p-card>
            }
          </div>
        }
      </p-card>
    </section>
  `
})
export class ArmasPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private liveSubscription?: Subscription;
  protected armas = signal<Arma[]>([]);

  ngOnInit() {
    this.loadArmas();
    this.liveSubscription = this.liveUpdates.watchWikiUpdates().subscribe((event) => {
      if (event.type === 'wiki-update') {
        this.loadArmas();
      }
    });
  }

  ngOnDestroy() {
    this.liveSubscription?.unsubscribe();
  }

  loadArmas() {
    this.http.get<Arma[]>('/api/armas').subscribe({
      next: (data) => {
        const sorted = [...(data ?? [])].sort((a, b) => {
          const aPriority = this.getWeaponPriority(a.nombre);
          const bPriority = this.getWeaponPriority(b.nombre);
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return a.nombre.localeCompare(b.nombre);
        });

        this.armas.set(sorted);
      },
      error: (err) => console.error('Error al cargar armas:', err)
    });
  }

  getSeverity(rareza: number): 'success' | 'info' | 'warn' | 'danger' {
    if (rareza <= 2) return 'info';
    if (rareza === 3) return 'warn';
    return 'danger';
  }

  getWeaponImage(arma: Arma): string {
    const normalizedName = arma.nombre.trim().toLowerCase();
    const imageByExactName: Record<string, string> = {
      "lordsworn's straight sword": '/assets/lordsworns_straight_sword_straight_sword_weapon_elden_ring_wiki_guide_200px.png',
      'bastard sword': '/assets/bastard_sword_weapon_elden_ring_wiki_guide_200px.png',
      uchigatana: '/assets/uchigatana_elden_ring_wiki_guide_200px.png'
    };

    return imageByExactName[normalizedName] ?? '/assets/Logo/logo_provisional.jpg';
  }

  private getWeaponPriority(name: string): number {
    const normalizedName = name.trim().toLowerCase();
    const orderedWithImage = [
      "lordsworn's straight sword",
      'uchigatana',
      'bastard sword'
    ];

    const imageIndex = orderedWithImage.indexOf(normalizedName);
    if (imageIndex !== -1) {
      return imageIndex;
    }

    return 99;
  }
}
