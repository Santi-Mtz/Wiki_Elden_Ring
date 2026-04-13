import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MenuItem } from 'primeng/api';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DatePipe,
    FormsModule,
    PanelMenuModule,
    CardModule,
    InputTextModule,
    TagModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly domain = signal('localhost:4200');
  protected readonly updatedAt = signal(new Date());
  protected readonly armas = signal<Array<{ id?: number; nombre?: string; tipo?: string }>>([]);
  protected readonly armaduras = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly talismanes = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly hechizos = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly milagros = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly clases = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly builds = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly personajes = signal<Array<{ id?: number; nombre?: string }>>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly sidebarOpen = signal(false);
  protected readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  protected readonly sections = computed<Array<{ label: string; path: string; icon: string }>>(() => {
    const items: Array<{ label: string; path: string; icon: string }> = [
      { label: 'Inicio', path: '/', icon: 'pi pi-home' },
      { label: 'Mapa interactivo', path: '/mapa', icon: 'pi pi-map' },
      { label: 'Quiénes somos', path: '/quienes-somos', icon: 'pi pi-info-circle' },
      { label: 'Servicios', path: '/servicios', icon: 'pi pi-briefcase' },
      { label: 'Contacto', path: '/contacto', icon: 'pi pi-envelope' },
      { label: 'Términos de uso', path: '/terminos-de-uso', icon: 'pi pi-book' }
    ];

    if (this.isAuthenticated()) {
      const user = this.currentUser();
      if (user?.role === 'admin') {
        items.splice(1, 0, { label: 'Mi perfil', path: '/vista-admin', icon: 'pi pi-shield' });
      } else {
        items.splice(1, 0, { label: 'Mi perfil', path: '/vista-usuario', icon: 'pi pi-user' });
      }
    }

    return items;
  });
  protected readonly footerMenu: Array<{ label: string; path: string }> = [
    { label: 'Quienes somos', path: '/quienes-somos' },
    { label: 'Servicios', path: '/servicios' },
    { label: 'Contacto', path: '/contacto' },
    { label: 'Terminos', path: '/terminos-de-uso' }
  ];
  protected readonly topMenu = computed<MenuItem[]>(() => {
    const wikiItems: MenuItem[] = [
      { label: 'Clases', icon: 'pi pi-id-card', routerLink: '/clases' },
      { label: 'Armas', icon: 'pi pi-sparkles', routerLink: '/armas' },
      { label: 'Armaduras', icon: 'pi pi-shield', routerLink: '/armaduras' },
      { label: 'Talismanes', icon: 'pi pi-star', routerLink: '/talismanes' },
      { label: 'Hechizos', icon: 'pi pi-bolt', routerLink: '/hechizos' },
      { label: 'Milagros', icon: 'pi pi-sun', routerLink: '/milagros' },
      { label: 'Builds', icon: 'pi pi-cog', routerLink: '/builds' },
      { label: 'Personajes', icon: 'pi pi-users', routerLink: '/personajes' }
    ];

    if (this.isAuthenticated()) {
      return wikiItems;
    }

    return wikiItems.map((item) => ({ ...item, routerLink: '/login' }));
  });
  protected readonly topSections = computed<Array<{ label: string; path: string; icon: string }>>(() => this.sections());
  protected readonly filteredArmas = computed(() => {
    const term = this.search().trim().toLowerCase();
    const allArmas = this.armas();

    if (!term) {
      return allArmas;
    }

    return allArmas.filter((arma) => String(arma.nombre ?? '').toLowerCase().includes(term));
  });
  protected readonly filteredWikiObjects = computed(() => {
    const term = this.search().trim().toLowerCase();

    const filterByTerm = (items: Array<{ id?: number; nombre?: string }>) => {
      if (!term) {
        return [];
      }
      return items.filter((item) => String(item.nombre ?? '').toLowerCase().includes(term));
    };

    return {
      clases: filterByTerm(this.clases()),
      armas: filterByTerm(this.armas()),
      armaduras: filterByTerm(this.armaduras()),
      talismanes: filterByTerm(this.talismanes()),
      hechizos: filterByTerm(this.hechizos()),
      milagros: filterByTerm(this.milagros()),
      builds: filterByTerm(this.builds()),
      personajes: filterByTerm(this.personajes())
    };
  });
  protected readonly filteredSections = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.sections();
    }
    return this.sections().filter((item) => item.label.toLowerCase().includes(term));
  });
  protected readonly sidebarItems = computed<MenuItem[]>(() => {
    const term = this.search().trim().toLowerCase();
    const categories = this.topMenu();
    const objectsByCategory = this.filteredWikiObjects();

    const keyByLabel: Record<string, keyof typeof objectsByCategory> = {
      clases: 'clases',
      armas: 'armas',
      armaduras: 'armaduras',
      talismanes: 'talismanes',
      hechizos: 'hechizos',
      milagros: 'milagros',
      builds: 'builds',
      personajes: 'personajes'
    };

    const categoryItems: MenuItem[] = categories
      .map((item): MenuItem | null => {
        const labelKey = String(item.label ?? '').toLowerCase();
        const categoryKey = keyByLabel[labelKey];

        if (!term) {
          return {
            label: item.label,
            icon: item.icon,
            routerLink: item.routerLink
          };
        }

        if (!categoryKey) {
          return null;
        }

        const matches = objectsByCategory[categoryKey];
        const children: MenuItem[] = matches.map((entry) => ({
          label: String(entry.nombre ?? 'Sin nombre'),
          icon: 'pi pi-angle-right',
          routerLink: item.routerLink,
          queryParams: {
            itemId: entry.id ?? null,
            q: String(entry.nombre ?? '')
          },
          fragment: entry.id ? `item-${entry.id}` : undefined
        }));

        if (children.length === 0) {
          return null;
        }

        const itemWithChildren: MenuItem = {
          label: item.label,
          icon: item.icon,
          routerLink: item.routerLink,
          items: children
        };

        return itemWithChildren;
      })
      .filter((item): item is MenuItem => item !== null);

    return [
      {
        label: 'Categorias',
        icon: 'pi pi-sitemap',
        expanded: true,
        items: categoryItems
      }
    ];
  });
  protected readonly stats = computed(() => ({
    sections: this.sections().length,
    weapons: this.armas().length,
    pages: this.topMenu().length + this.sections().length
  }));

  ngOnInit(): void {
    const host = globalThis.window?.location?.host;
    if (host) {
      this.domain.set(host);
    }

    this.http.get<Array<{ id?: number; nombre?: string; tipo?: string }>>('/api/armas')
      .subscribe({
        next: (data) => {
          this.armas.set(data ?? []);
          this.updatedAt.set(new Date());
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de armas.');
          this.loading.set(false);
        }
      });

    this.loadWikiCollection('/api/armaduras', this.armaduras);
    this.loadWikiCollection('/api/talismanes', this.talismanes);
    this.loadWikiCollection('/api/hechizos', this.hechizos);
    this.loadWikiCollection('/api/milagros', this.milagros);
    this.loadWikiCollection('/api/clases', this.clases);
    this.loadWikiCollection('/api/builds', this.builds);
    this.loadWikiCollection('/api/personajes', this.personajes);
  }

  private loadWikiCollection(
    endpoint: string,
    target: ReturnType<typeof signal<Array<{ id?: number; nombre?: string }>>>
  ): void {
    this.http.get<Array<{ id?: number; nombre?: string }>>(endpoint).subscribe({
      next: (data) => {
        target.set(data ?? []);
      },
      error: () => {
        target.set([]);
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
    this.sidebarOpen.set(false);
    this.router.navigateByUrl('/login');
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
