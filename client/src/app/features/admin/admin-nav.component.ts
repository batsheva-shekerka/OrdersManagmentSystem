import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";

/** Small tab bar shared by every staff page so admins can move between order management and menu management without leaving the admin area. */
@Component({
  selector: "app-admin-nav",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="admin-nav">
      <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="admin-nav__tab">
        הזמנות
      </a>
      <a routerLink="/admin/products" routerLinkActive="is-active" class="admin-nav__tab">
        ניהול תפריט
      </a>
    </nav>
  `,
  styles: [
    `
      .admin-nav {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--color-border);
      }
      .admin-nav__tab {
        padding: 0.6rem 1.1rem;
        font-family: var(--font-family);
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--color-text-muted);
        text-decoration: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .admin-nav__tab.is-active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
    `,
  ],
})
export class AdminNavComponent {}
