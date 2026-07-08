import { Component, HostListener, OnInit, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { CommonModule } from "@angular/common";
import { VirtualWaiterComponent } from "./features/virtual-waiter/virtual-waiter.component";
import { CartDrawerComponent } from "./features/cart/cart-drawer.component";
import { AuthModalComponent } from "./features/auth/auth-modal.component";
import { ProfileDropdownComponent } from "./features/auth/profile-dropdown.component";
import { CartService } from "./core/services/cart.service";
import { CartUiService } from "./core/services/cart-ui.service";
import { AuthService } from "./core/services/auth.service";
import { AuthUiService } from "./core/services/auth-ui.service";
import { ApiService } from "./core/services/api.service";
import { Category } from "./core/models/category.model";

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VirtualWaiterComponent,
    CartDrawerComponent,
    AuthModalComponent,
    ProfileDropdownComponent,
  ],
  template: `
    <div class="app-shell">

      <!-- Sticky wrapper — topbar + header scroll together -->
      <div class="sticky-nav" [class.sticky-nav--scrolled]="scrolled()">

        <!-- Thin utility topbar -->
        <div class="topbar">
          <span class="topbar__tagline">משלוחים ואיסוף עצמי · מאדה 9 בני ברק · עזרת תורה 18 ירושלים</span>
          <a class="topbar__phone" href="tel:026200100">02-6200100</a>
        </div>

        <!-- Main header -->
        <header class="header">
          <a routerLink="/menu" class="header__logo">
            <span class="header__logo-main">GOLDY'S</span>
            <span class="header__logo-sub">אירוח פרימיום</span>
          </a>

          <nav class="header__nav">

            @if (!auth.isAdmin()) {
              <!-- ── Customer navigation ── -->

              <!-- תפריט with dropdown -->
              <div
                class="nav-dropdown"
                (mouseenter)="menuOpen.set(true)"
                (mouseleave)="menuOpen.set(false)"
              >
                <a
                  routerLink="/menu"
                  routerLinkActive="is-active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="nav-dropdown__trigger"
                  (click)="menuOpen.set(false)"
                >
                  תפריט
                  <svg class="nav-dropdown__chevron" [class.nav-dropdown__chevron--open]="menuOpen()"
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>

                @if (menuOpen() && categories().length > 0) {
                  <div class="nav-dropdown__panel">
                    <div class="nav-dropdown__header">קטגוריות</div>
                    @for (cat of categories(); track cat._id) {
                      <a
                        class="nav-dropdown__item"
                        [routerLink]="['/category', cat._id]"
                        (click)="menuOpen.set(false)"
                      >
                        <span class="nav-dropdown__dot"></span>
                        {{ cat.name }}
                      </a>
                    }
                    <div class="nav-dropdown__divider"></div>
                    <a class="nav-dropdown__item nav-dropdown__item--all" routerLink="/menu" (click)="menuOpen.set(false)">
                      כל הקטגוריות ←
                    </a>
                  </div>
                }
              </div>

              @if (auth.isLoggedIn()) {
                <a routerLink="/orders" routerLinkActive="is-active">ההזמנות שלי</a>
              }

            } @else {
              <!-- ── Admin navigation ── -->
              <span class="admin-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                פאנל ניהול
              </span>

              <a routerLink="/admin/dashboard" routerLinkActive="is-active">הזמנות</a>
              <a routerLink="/admin/products" routerLinkActive="is-active">ניהול תפריט</a>
            }

          </nav>

          <div class="header__actions">

            @if (!auth.isAdmin()) {
              <!-- Cart icon — customers only -->
              <button type="button" class="icon-btn" aria-label="סל קניות" (click)="cartUi.toggle()">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="9" cy="21" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="21" r="1.2" fill="currentColor" stroke="none" />
                  <path d="M2.5 3h2l2.2 12.1a2 2 0 0 0 2 1.65h8.1a2 2 0 0 0 1.97-1.63L21 8H6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                @if (cart.count() > 0) {
                  <span class="icon-btn__badge">{{ cart.count() }}</span>
                }
              </button>
            }

            @if (auth.isLoggedIn()) {
              <app-profile-dropdown />
            } @else {
              <button type="button" class="icon-btn" aria-label="התחברות" (click)="authUi.open('login')">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke-linecap="round" />
                </svg>
              </button>
            }

          </div>
        </header>
      </div><!-- /sticky-nav -->

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Global overlays -->
    <app-cart-drawer />
    <app-auth-modal />

    <!-- Virtual Waiter floating widget — visible on every page -->
    <app-virtual-waiter />
  `,
  styles: [
    `
      .app-shell {
        font-family: var(--font-family);
      }

      /* ── Sticky wrapper ── */
      .sticky-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        transition: box-shadow 0.2s;
      }
      .sticky-nav--scrolled {
        box-shadow: 0 2px 16px rgba(0,0,0,0.10);
      }

      /* ---- Topbar ---- */
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        height: var(--header-topbar-height);
        padding: 0 1.5rem;
        background: var(--color-primary);
        color: var(--color-text-on-primary);
        font-size: 0.78rem;
      }
      .topbar__tagline {
        opacity: 0.95;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .topbar__phone {
        color: #fff;
        text-decoration: none;
        font-weight: 700;
        white-space: nowrap;
      }
      .topbar__phone:hover { text-decoration: underline; }

      /* ---- Main header ---- */
      .header {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 0.9rem 1.5rem;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
      }
      .header__logo {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-decoration: none;
        color: var(--color-text);
        line-height: 1.1;
      }
      .header__logo-main {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: 1px;
        color: var(--color-primary);
      }
      .header__logo-sub {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 2px;
        color: var(--color-text-muted);
      }

      .header__nav {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-inline-end: auto;
      }
      .header__nav > a {
        color: var(--color-text);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.4rem 0.1rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s, border-color 0.15s;
      }
      .header__nav > a:hover,
      .header__nav > a.is-active {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }

      /* ── Categories dropdown ── */
      .nav-dropdown {
        position: relative;
      }
      .nav-dropdown__trigger {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--color-text);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.4rem 0.1rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s, border-color 0.15s;
        cursor: pointer;
        background: none;
        border-top: none;
        border-inline: none;
      }
      .nav-dropdown__trigger:hover,
      .nav-dropdown__trigger.is-active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
      .nav-dropdown__chevron {
        transition: transform 0.2s;
        flex-shrink: 0;
        opacity: 0.6;
      }
      .nav-dropdown__chevron--open {
        transform: rotate(180deg);
      }

      .nav-dropdown__panel {
        position: absolute;
        top: calc(100% + 10px);
        inset-inline-start: 0;
        min-width: 200px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        padding: 0.5rem 0;
        z-index: 200;
        animation: dropdown-in 0.15s ease;
      }
      @keyframes dropdown-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .nav-dropdown__header {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--color-text-muted);
        padding: 0.35rem 1rem 0.5rem;
      }
      .nav-dropdown__item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 1rem;
        color: var(--color-text);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: background 0.12s, color 0.12s;
      }
      .nav-dropdown__item:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .nav-dropdown__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-border);
        flex-shrink: 0;
        transition: background 0.12s;
      }
      .nav-dropdown__item:hover .nav-dropdown__dot {
        background: var(--color-primary);
      }
      .nav-dropdown__divider {
        height: 1px;
        background: var(--color-border);
        margin: 0.4rem 0;
      }
      .nav-dropdown__item--all {
        font-weight: 700;
        color: var(--color-primary);
        font-size: 0.85rem;
      }
      .nav-dropdown__item--all:hover {
        background: var(--color-primary-light);
      }

      /* ── Admin badge ── */
      .admin-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.7rem;
        background: var(--color-primary-light);
        color: var(--color-primary);
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
      }

      /* ---- Actions ---- */
      .header__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .icon-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        color: var(--color-text);
        text-decoration: none;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .icon-btn:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .icon-btn__badge {
        position: absolute;
        top: 0.1rem;
        inset-inline-end: 0.1rem;
        min-width: 1.05rem;
        height: 1.05rem;
        padding: 0 3px;
        border-radius: 999px;
        background: var(--color-badge);
        color: #fff;
        font-size: 0.62rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .content {
        padding: 1.5rem;
        min-height: calc(100vh - 34px - 66px);
      }

      @media (max-width: 720px) {
        .topbar__tagline { display: none; }
        .header { gap: 1rem; }
        .header__nav { gap: 0.85rem; }
        .header__nav > a,
        .nav-dropdown__trigger { font-size: 0.85rem; }
        .nav-dropdown__panel { min-width: 170px; }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  protected cart = inject(CartService);
  protected cartUi = inject(CartUiService);
  protected auth = inject(AuthService);
  protected authUi = inject(AuthUiService);

  scrolled = signal(false);
  menuOpen = signal(false);
  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.api.get<CategoriesResponse>("/categories/active").subscribe({
      next: (res) => this.categories.set(res.data ?? []),
      error: () => {},
    });
  }

  @HostListener("window:scroll")
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }
}
