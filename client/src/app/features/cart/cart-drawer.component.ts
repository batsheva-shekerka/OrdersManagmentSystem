import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { CartService } from "../../core/services/cart.service";
import { CartUiService } from "../../core/services/cart-ui.service";
import { resolveAssetUrl } from "../../core/utils/asset-url";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ui.isOpen()) {
      <div class="drawer-backdrop" (click)="ui.close()"></div>
      <aside class="drawer" [class.drawer--open]="ui.isOpen()">
        <header class="drawer__header">
          <h2>סל הקניות ({{ cart.count() }})</h2>
          <button class="drawer__close" type="button" (click)="ui.close()" aria-label="סגירת הסל">✕</button>
        </header>

        <div class="drawer__body">
          @if (cart.items().length === 0) {
            <p class="drawer__empty">הסל שלכם ריק כרגע.</p>
          } @else {
            @for (line of cart.items(); track line.product._id) {
              <div class="drawer-item">
                <div
                  class="drawer-item__img"
                  [style.background-image]="line.product.imageUrl ? 'url(' + assetUrl(line.product.imageUrl) + ')' : ''"
                ></div>
                <div class="drawer-item__info">
                  <p class="drawer-item__name">{{ line.product.name }}</p>
                  <p class="drawer-item__price">{{ line.product.price | currency: "ILS" }}</p>
                </div>
                <div class="qty-stepper">
                  <button class="qty-stepper__btn" type="button" (click)="cart.decrement(line.product._id)" aria-label="הפחת כמות">−</button>
                  <span class="qty-stepper__value">{{ line.quantity }}</span>
                  <button class="qty-stepper__btn" type="button" (click)="cart.add(line.product)" aria-label="הוסף כמות">+</button>
                </div>
                <button class="drawer-item__remove" type="button" (click)="cart.remove(line.product._id)" aria-label="הסרת פריט">🗑</button>
              </div>
            }
          }
        </div>

        @if (cart.items().length > 0) {
          <footer class="drawer__footer">
            <div class="drawer__summary">
              <span>{{ cart.count() }} פריטים</span>
              <span class="drawer__total">{{ cart.subtotal() | currency: "ILS" }}</span>
            </div>
            <button class="btn btn-primary btn-block" type="button" (click)="checkout()">לרכישה</button>
          </footer>
        }
      </aside>
    }
  `,
  styles: [
    `
      .drawer-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 1200;
        animation: fadeIn 0.2s ease;
      }
      .drawer {
        position: fixed;
        top: 0;
        inset-inline-end: 0;
        height: 100%;
        width: min(400px, 100vw);
        background: var(--color-bg);
        box-shadow: var(--shadow-md);
        z-index: 1201;
        display: flex;
        flex-direction: column;
        animation: slideIn 0.25s ease;
        font-family: var(--font-family);
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      [dir="rtl"] .drawer {
        inset-inline-end: 0;
      }

      .drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.1rem 1.25rem;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
      }
      .drawer__header h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 800;
      }
      .drawer__close {
        border: none;
        background: transparent;
        font-size: 1.1rem;
        cursor: pointer;
        color: var(--color-text-muted);
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
      }
      .drawer__close:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }

      .drawer__body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .drawer__empty {
        text-align: center;
        color: var(--color-text-muted);
        margin-top: 2rem;
      }

      .drawer-item {
        display: grid;
        grid-template-columns: 56px 1fr auto auto;
        align-items: center;
        gap: 0.75rem;
      }
      .drawer-item__img {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-sm);
        background-color: #ede4d3;
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
      }
      .drawer-item__info {
        min-width: 0;
      }
      .drawer-item__name {
        margin: 0 0 0.2rem;
        font-weight: 700;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .drawer-item__price {
        margin: 0;
        color: var(--color-primary);
        font-weight: 700;
        font-size: 0.85rem;
      }
      .drawer-item__remove {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 0.95rem;
        color: var(--color-text-muted);
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 50%;
      }
      .drawer-item__remove:hover {
        background: var(--color-primary-light);
      }

      .qty-stepper {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
        padding: 0.1rem 0.35rem;
      }
      .qty-stepper__btn {
        width: 1.4rem;
        height: 1.4rem;
        border: none;
        background: transparent;
        color: var(--color-primary);
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qty-stepper__btn:hover {
        background: var(--color-primary-light);
      }
      .qty-stepper__value {
        min-width: 0.9rem;
        text-align: center;
        font-weight: 700;
        font-size: 0.85rem;
      }

      .drawer__footer {
        padding: 1rem 1.25rem 1.25rem;
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .drawer__summary {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
      }
      .drawer__total {
        color: var(--color-primary);
        font-size: 1.1rem;
      }

      @media (max-width: 480px) {
        .drawer {
          width: 100vw;
        }
      }
    `,
  ],
})
export class CartDrawerComponent {
  protected cart = inject(CartService);
  protected ui = inject(CartUiService);
  private router = inject(Router);

  assetUrl(path?: string): string {
    return resolveAssetUrl(path);
  }

  checkout(): void {
    this.ui.close();
    this.router.navigate(["/checkout"]);
  }
}
