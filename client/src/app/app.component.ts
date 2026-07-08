import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { VirtualWaiterComponent } from "./features/virtual-waiter/virtual-waiter.component";
import { CartDrawerComponent } from "./features/cart/cart-drawer.component";
import { AuthModalComponent } from "./features/auth/auth-modal.component";
import { CartService } from "./core/services/cart.service";
import { CartUiService } from "./core/services/cart-ui.service";
import { AuthService } from "./core/services/auth.service";
import { AuthUiService } from "./core/services/auth-ui.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VirtualWaiterComponent,
    CartDrawerComponent,
    AuthModalComponent,
  ],
  template: `
    <div class="app-shell">
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
          <a routerLink="/menu" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">תפריט</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/orders" routerLinkActive="is-active">ההזמנות שלי</a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin/dashboard" routerLinkActive="is-active">ניהול</a>
          }
        </nav>

        <div class="header__actions">
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

          @if (auth.isLoggedIn()) {
            <a routerLink="/orders" class="icon-btn" aria-label="החשבון שלי">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke-linecap="round" />
              </svg>
            </a>
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
      .topbar__phone:hover {
        text-decoration: underline;
      }

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
      .header__nav a {
        color: var(--color-text);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.4rem 0.1rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s, border-color 0.15s;
      }
      .header__nav a:hover,
      .header__nav a.is-active {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }

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
        .topbar__tagline {
          display: none;
        }
        .header {
          gap: 1rem;
        }
        .header__nav {
          gap: 0.85rem;
        }
        .header__nav a {
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class AppComponent {
  protected cart = inject(CartService);
  protected cartUi = inject(CartUiService);
  protected auth = inject(AuthService);
  protected authUi = inject(AuthUiService);
}
