import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { Category } from "../../core/models/category.model";
import { Product } from "../../core/models/product.model";
import { resolveAssetUrl } from "../../core/utils/asset-url";

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

@Component({
  selector: "app-category-products",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="category-page">
      <header class="category-hero">
        <a class="back-link" routerLink="/menu">← חזרה לקטגוריות</a>
        <p class="eyebrow">GOLDY'S</p>
        <h1>{{ categoryName() || "מוצרי הקטגוריה" }}</h1>
        <p>כל המנות בקטגוריה שבחרתם, מוכנות להזמנה ישירה.</p>
      </header>

      <section class="section">
        @if (loading()) {
          <p class="state">טוען מוצרים...</p>
        } @else if (products().length === 0) {
          <p class="state">אין מוצרים זמינים בקטגוריה הזו כרגע.</p>
        } @else {
          <div class="grid">
            @for (product of products(); track product._id) {
              <article class="product-card" [class.product-card--out]="product.status !== 'available'">
                <div
                  class="product-card__media"
                  [style.background-image]="product.imageUrl ? 'url(' + assetUrl(product.imageUrl) + ')' : ''"
                >
                  @if (product.status !== "available") {
                    <div class="product-card__overlay">
                      <span class="product-card__badge">אזל המלאי</span>
                    </div>
                  }
                </div>
                <div class="product-card__body">
                  <h2 class="product-card__title">{{ product.name }}</h2>
                  @if (product.description) {
                    <p class="product-card__desc">{{ product.description }}</p>
                  }
                  <div class="product-card__footer">
                    <span class="product-card__price">{{ product.price | currency: "ILS" }}</span>

                    @if (product.status !== "available") {
                      <button class="btn btn-primary product-card__add" disabled>אזל</button>
                    } @else if (cart.quantityOf(product._id) > 0) {
                      <div class="qty-stepper">
                        <button
                          class="qty-stepper__btn"
                          type="button"
                          (click)="cart.decrement(product._id)"
                          aria-label="הפחת כמות"
                        >
                          −
                        </button>
                        <span class="qty-stepper__value">{{ cart.quantityOf(product._id) }}</span>
                        <button
                          class="qty-stepper__btn"
                          type="button"
                          (click)="cart.add(product)"
                          aria-label="הוסף כמות"
                        >
                          +
                        </button>
                      </div>
                    } @else {
                      <button class="btn btn-primary product-card__add" (click)="cart.add(product)">
                        הוספה לסל
                      </button>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .category-page {
        margin: -1.5rem;
        min-height: calc(100vh - 70px);
        background: var(--color-bg);
        color: var(--color-text);
        font-family: var(--font-family);
      }
      .category-hero {
        position: relative;
        padding: 3.5rem 2rem;
        text-align: center;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
      }
      .back-link {
        position: absolute;
        top: 1.25rem;
        right: 1.5rem;
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        letter-spacing: 4px;
        color: var(--color-primary);
        font-weight: 800;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 2.4rem;
        line-height: 1.2;
        font-weight: 800;
      }
      .category-hero p:last-child {
        margin: 0;
        color: var(--color-text-muted);
      }
      .section {
        padding: 2.5rem 2rem;
      }
      .state {
        text-align: center;
        color: var(--color-text-muted);
        font-size: 1.1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* ---- Product card ---- */
      .product-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: var(--color-surface);
        box-shadow: var(--shadow-sm);
        transition: box-shadow 0.2s, transform 0.2s;
      }
      .product-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      .product-card--out {
        opacity: 0.7;
      }
      .product-card--out:hover {
        box-shadow: var(--shadow-sm);
        transform: none;
      }
      .product-card__media {
        position: relative;
        aspect-ratio: 1 / 1;
        background-color: #ede4d3;
        background-size: cover;
        background-position: center;
      }
      .product-card--out .product-card__media {
        filter: grayscale(0.5);
      }
      .product-card__overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(26, 26, 26, 0.35);
      }
      .product-card__badge {
        background: rgba(26, 26, 26, 0.85);
        color: #fff;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        padding: 0.45rem 1.1rem;
        border-radius: 999px;
        box-shadow: var(--shadow-sm);
      }
      .product-card__body {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: 1rem 1.1rem 1.1rem;
        text-align: right;
      }
      .product-card__title {
        margin: 0 0 0.35rem;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--color-text);
      }
      .product-card__desc {
        flex: 1;
        margin: 0 0 0.9rem;
        color: var(--color-text-muted);
        font-size: 0.85rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .product-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: auto;
      }
      .product-card__price {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--color-primary);
        white-space: nowrap;
      }
      .product-card__add {
        padding: 0.55rem 1.1rem;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      /* ---- Quantity stepper ---- */
      .qty-stepper {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
        padding: 0.15rem 0.5rem;
      }
      .qty-stepper__btn {
        width: 1.6rem;
        height: 1.6rem;
        border: none;
        background: transparent;
        color: var(--color-primary);
        font-size: 1.1rem;
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
        min-width: 1rem;
        text-align: center;
        font-weight: 700;
      }

      @media (max-width: 640px) {
        .category-hero {
          padding: 4rem 1rem 2rem;
        }
        h1 {
          font-size: 1.9rem;
        }
        .section {
          padding: 1.25rem 1rem;
        }
      }
    `,
  ],
})
export class CategoryProductsComponent implements OnInit {
  private api = inject(ApiService);
  protected cart = inject(CartService);
  private route = inject(ActivatedRoute);

  categoryName = signal("");
  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const categoryId = params.get("categoryId");
      if (!categoryId) return;
      this.loadCategoryName(categoryId);
      this.loadProducts(categoryId);
    });
  }

  assetUrl(path?: string): string {
    return resolveAssetUrl(path);
  }

  private loadCategoryName(categoryId: string): void {
    this.api.get<CategoriesResponse>("/categories/active").subscribe({
      next: (res) => {
        const category = res.data.find((c) => c._id === categoryId);
        this.categoryName.set(category?.name || "");
      },
      error: () => this.categoryName.set(""),
    });
  }

  private loadProducts(categoryId: string): void {
    this.loading.set(true);
    // "all" (an admin-oriented listing mode) is used here too, since the
    // default `status=available` filter would silently drop out-of-stock
    // products before they ever reach the template — we now want those to
    // stay visible (grayed out, see template) rather than disappear.
    // "discontinued" items are excluded client-side; they're meant to be
    // gone from the menu entirely, not just temporarily unavailable.
    this.api
      .get<ProductsResponse>("/products", {
        category: categoryId,
        status: "all",
      })
      .subscribe({
        next: (res) => {
          this.products.set(
            res.data.filter((product) => product.isActive && product.status !== "discontinued")
          );
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
        },
      });
  }
}
