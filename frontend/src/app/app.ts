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
  protected readonly filteredTopMenu = computed<MenuItem[]>(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.topMenu();
    }

    return this.topMenu().filter((item) => String(item.label ?? '').toLowerCase().includes(term));
  });
  protected readonly filteredSections = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.sections();
    }
    return this.sections().filter((item) => item.label.toLowerCase().includes(term));
  });
  protected readonly sidebarItems = computed<MenuItem[]>(() => [
    {
      label: 'Categorias',
      icon: 'pi pi-sitemap',
      expanded: true,
      items: [
        ...this.filteredTopMenu().map((item) => ({
        label: item.label,
        icon: item.icon,
        routerLink: item.routerLink
        })),
        ...(this.isAuthenticated()
          ? [{ label: 'Salir', icon: 'pi pi-sign-out', command: () => this.logout() }]
          : [])
      ]
    }
  ]);
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
