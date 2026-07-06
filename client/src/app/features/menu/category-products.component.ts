import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { Category } from "../../core/models/category.model";
import { Product } from "../../core/models/product.model";

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
    <div class="category-page" dir="rtl">
      <header class="category-hero">
        <a class="back-link" routerLink="/menu">חזרה לקטגוריות</a>
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
              <article class="card">
                <div
                  class="card__img"
                  [style.background-image]="product.imageUrl ? 'url(' + assetUrl(product.imageUrl) + ')' : ''"
                ></div>
                <div class="card__body">
                  <h2 class="card__name">{{ product.name }}</h2>
                  @if (product.description) {
                    <p class="card__description">{{ product.description }}</p>
                  }
                  <p class="price">{{ product.price | currency: "ILS" }}</p>
                  <button
                    class="card__btn"
                    [disabled]="product.status !== 'available'"
                    (click)="addToCart(product)"
                  >
                    הוספה לסל
                  </button>
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
        --gold-red: #c8102e;
        --gold-cream: #f5f0e8;
        margin: -1.5rem;
        min-height: calc(100vh - 70px);
        background: var(--gold-cream);
        color: #1f2933;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .category-hero {
        position: relative;
        padding: 3.5rem 2rem;
        text-align: center;
        background: #fff;
      }
      .back-link {
        position: absolute;
        top: 1rem;
        right: 1.25rem;
        color: var(--gold-red);
        text-decoration: none;
        font-weight: 700;
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        letter-spacing: 4px;
        color: var(--gold-red);
        font-weight: 800;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 2.4rem;
        line-height: 1.2;
      }
      .category-hero p:last-child {
        margin: 0;
        color: #5b6570;
      }
      .section {
        padding: 2rem;
      }
      .state {
        text-align: center;
        color: #5b6570;
        font-size: 1.1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1.5rem;
        max-width: 1150px;
        margin: 0 auto;
      }
      .card {
        overflow: hidden;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }
      .card__img {
        height: 210px;
        background: #d8c3a5;
        background-size: cover;
        background-position: center;
      }
      .card__body {
        padding: 1.25rem;
        text-align: center;
      }
      .card__name {
        margin: 0 0 0.65rem;
        font-size: 1.25rem;
      }
      .card__description {
        min-height: 4.5rem;
        margin: 0 0 1rem;
        color: #5b6570;
        line-height: 1.5;
      }
      .price {
        margin: 0 0 1rem;
        color: var(--gold-red);
        font-size: 1.25rem;
        font-weight: 800;
      }
      .card__btn {
        width: 100%;
        border: none;
        border-radius: 6px;
        background: var(--gold-red);
        color: #fff;
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-weight: 700;
      }
      .card__btn:disabled {
        background: #cbd2d9;
        cursor: not-allowed;
      }
      @media (max-width: 640px) {
        .category-hero {
          padding: 4rem 1rem 2rem;
        }
        h1 {
          font-size: 1.9rem;
        }
        .section {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class CategoryProductsComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);
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

  addToCart(product: Product): void {
    this.cart.add(product);
  }

  assetUrl(path?: string): string {
    if (!path) return "";
    return path.startsWith("/") ? path : `/${path}`;
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
    this.api
      .get<ProductsResponse>("/products", {
        category: categoryId,
        status: "available",
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data.filter((product) => product.isActive));
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
        },
      });
  }
}
