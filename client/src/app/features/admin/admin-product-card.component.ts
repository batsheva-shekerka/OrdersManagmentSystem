import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Product } from "../../core/models/product.model";
import { Category } from "../../core/models/category.model";
import { resolveAssetUrl } from "../../core/utils/asset-url";

/**
 * Admin-only product card: no "add to cart" affordance, just an in-stock
 * toggle plus edit/delete actions. Toggling flips `Product.status` between
 * "available" and "out_of_stock" via `ProductService.toggleAvailability`
 * (wired by the parent), which customers read directly on the storefront.
 */
@Component({
  selector: "app-admin-product-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="admin-product-card" [class.admin-product-card--out]="!isAvailable">
      <div
        class="admin-product-card__media"
        [style.background-image]="product.imageUrl ? 'url(' + assetUrl(product.imageUrl) + ')' : ''"
      >
        @if (!isAvailable) {
          <span class="admin-product-card__badge">אזל המלאי</span>
        }
        <div class="admin-product-card__tools">
          <button
            type="button"
            class="admin-product-card__icon-btn"
            aria-label="עריכת מוצר"
            (click)="edit.emit()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            class="admin-product-card__icon-btn admin-product-card__icon-btn--danger"
            aria-label="מחיקת מוצר"
            (click)="remove.emit()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="admin-product-card__body">
        <span class="admin-product-card__category">{{ categoryName }}</span>
        <h3 class="admin-product-card__title">{{ product.name }}</h3>
        @if (product.description) {
          <p class="admin-product-card__desc">{{ product.description }}</p>
        }

        <div class="admin-product-card__footer">
          <span class="admin-product-card__price">{{ product.price | currency: "ILS" }}</span>

          <label class="stock-toggle">
            <span class="stock-toggle__label">זמין במלאי</span>
            <input
              type="checkbox"
              [checked]="isAvailable"
              (change)="toggleAvailability.emit()"
            />
            <span class="stock-toggle__track"><span class="stock-toggle__thumb"></span></span>
          </label>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .admin-product-card {
        display: flex;
        flex-direction: column;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        font-family: var(--font-family);
        transition: opacity 0.15s ease;
      }
      .admin-product-card--out {
        opacity: 0.6;
      }
      .admin-product-card__media {
        position: relative;
        aspect-ratio: 1 / 1;
        background-color: var(--color-bg);
        background-size: cover;
        background-position: center;
      }
      .admin-product-card__badge {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        background: var(--color-badge);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
      }
      .admin-product-card__tools {
        position: absolute;
        bottom: 0.6rem;
        left: 0.6rem;
        display: flex;
        gap: 0.4rem;
      }
      .admin-product-card__icon-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.92);
        color: var(--color-text);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
      }
      .admin-product-card__icon-btn:hover {
        background: #fff;
      }
      .admin-product-card__icon-btn--danger:hover {
        color: var(--color-primary);
      }
      .admin-product-card__body {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.9rem 1rem 1rem;
      }
      .admin-product-card__category {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--color-primary);
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .admin-product-card__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text);
      }
      .admin-product-card__desc {
        margin: 0;
        font-size: 0.82rem;
        color: var(--color-text-muted);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .admin-product-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.5rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--color-border);
      }
      .admin-product-card__price {
        font-weight: 800;
        color: var(--color-primary);
      }

      .stock-toggle {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
      }
      .stock-toggle__label {
        font-size: 0.72rem;
        color: var(--color-text-muted);
        font-weight: 600;
      }
      .stock-toggle input {
        display: none;
      }
      .stock-toggle__track {
        width: 34px;
        height: 20px;
        border-radius: 999px;
        background: var(--color-disabled);
        position: relative;
        transition: background 0.15s ease;
        flex-shrink: 0;
      }
      .stock-toggle__thumb {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.15s ease;
      }
      .stock-toggle input:checked + .stock-toggle__track {
        background: var(--color-primary);
      }
      .stock-toggle input:checked + .stock-toggle__track .stock-toggle__thumb {
        transform: translateX(-14px);
      }
    `,
  ],
})
export class AdminProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() edit = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() toggleAvailability = new EventEmitter<void>();

  get isAvailable(): boolean {
    return this.product.status === "available";
  }

  get categoryName(): string {
    const category = this.product.category as Category | string;
    if (category && typeof category === "object" && "name" in category) {
      return category.name;
    }
    return "";
  }

  assetUrl(path?: string): string {
    return resolveAssetUrl(path);
  }
}
