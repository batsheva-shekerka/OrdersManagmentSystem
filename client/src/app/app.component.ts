import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { VirtualWaiterComponent } from "./features/virtual-waiter/virtual-waiter.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, VirtualWaiterComponent],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">Goldie's</a>
      <nav>
        <a routerLink="/menu">Menu</a>
        <a routerLink="/cart">Cart</a>
        <a routerLink="/orders">My Orders</a>
        <a routerLink="/admin">Admin</a>
        <a routerLink="/auth/login">Login</a>
      </nav>
    </header>
    <main class="content">
      <router-outlet></router-outlet>
    </main>

    <!-- Virtual Waiter floating widget — visible on every page -->
    <app-virtual-waiter />
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--brand);
        color: #fff;
      }
      .brand {
        font-weight: 700;
        font-size: 1.25rem;
      }
      nav {
        display: flex;
        gap: 1rem;
        margin-left: auto;
      }
      a {
        color: #fff;
        text-decoration: none;
      }
      .content {
        padding: 1.5rem;
      }
    `,
  ],
})
export class AppComponent {}
