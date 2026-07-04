import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { Product } from "../../core/models/product.model";

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home" dir="rtl">

      <!-- Hero: split layout -->
      <section class="hero">
        <img
          class="hero__image-side"
          src="/assets/hero.jpg"
          alt="מגוון מגשי אירוח של גולדיס"
        />
        <div class="hero__text-side">
          <h1 class="hero__title">מגוון מגשי אירוח של גולדיס</h1>
          <p class="hero__subtitle">מתוקים, מלוחים, סלטים ועוד...</p>
          <a class="hero__cta" href="#menu-section">הזמינו עכשיו</a>
        </div>
      </section>

      <!-- Category image-card grid -->
      <section class="section section--muted">
        <div class="cat-grid">
          @for (cat of categories(); track cat._id) {
            <a
              class="cat-card"
              [routerLink]="['/menu']"
              [queryParams]="{ category: cat._id }"
              [style.background-image]="'url(' + assetUrl(cat.imageUrl) + ')'"
            >
              <span class="cat-card__overlay"></span>
              <span class="cat-card__name">{{ cat.name }}</span>
            </a>
          }
        </div>
      </section>

      <!-- Real products (all existing logic preserved) -->
      <section id="menu-section" class="section">
        <h2 class="section__title">התפריט שלנו</h2>
        @if (loading()) {
          <p class="state">טוען מוצרים...</p>
        } @else if (products().length === 0) {
          <p class="state">אין מוצרים זמינים כרגע.</p>
        } @else {
          <div class="grid">
            @for (product of products(); track product._id) {
              <article class="card">
                <div
                  class="card__img"
                  [style.background-image]="product.imageUrl ? 'url(' + assetUrl(product.imageUrl) + ')' : ''"
                ></div>
                <div class="card__body">
                  <h3 class="card__name">{{ product.name }}</h3>
                  <p class="price">{{ product.price | currency: "ILS" }}</p>
                  <p
                    class="status"
                    [class.status--available]="product.status === 'available'"
                  >
                    {{ product.status }}
                  </p>
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

      <!-- Footer -->
      <footer class="footer">
        <div class="footer__logo">GOLDY'S</div>
        <nav class="footer__nav">
          <a href="#menu-section">תפריטי שבת וחג</a>
          <a href="#menu-section">מגשי אירוח</a>
          <a href="#menu-section">מארזים ומתנות</a>
          <a href="#menu-section">בייקרי</a>
          <a href="#menu-section">מתחם חגים</a>
        </nav>
        <p class="footer__contact">מאדה 9, בני ברק · עזרת תורה 18, ירושלים · 02-6200100</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .home {
        --gold-red: #c8102e;
        --gold-cream: #f5f0e8;
        margin: -1.5rem;
        color: #1f2933;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }

      /* ── Hero ── */
      .hero {
        display: flex;
        flex-direction: row-reverse;
        min-height: 420px;
        background: #fff;
      }
      .hero__image-side {
        flex: 1 1 60%;
        width: 100%;
        object-fit: cover;
        object-position: center;
        min-height: 420px;
        display: block;
      }
      .hero__text-side {
        flex: 0 0 40%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 3rem 3.5rem;
        background: #fff;
        text-align: right;
      }
      .hero__title {
        font-size: 2.4rem;
        font-weight: 800;
        line-height: 1.25;
        color: #1a1a1a;
        margin: 0 0 1rem;
      }
      .hero__subtitle {
        font-size: 1.1rem;
        color: #5b6570;
        margin: 0 0 2rem;
      }
      .hero__cta {
        display: inline-block;
        background: var(--gold-red);
        color: #fff;
        text-decoration: none;
        padding: 0.85rem 2.5rem;
        border-radius: 4px;
        font-weight: 700;
        font-size: 1rem;
        transition: background 0.2s, transform 0.15s;
      }
      .hero__cta:hover {
        background: #a50d24;
        transform: translateY(-2px);
      }

      /* ── Sections ── */
      .section {
        padding: 3rem 1.5rem;
      }
      .section--muted {
        background: var(--gold-cream);
        padding: 1rem;
      }
      .section__title {
        text-align: center;
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 2.5rem;
        color: #2a2320;
      }

      /* ── Category image-card grid ── */
      .cat-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(2, 200px);
        gap: 6px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .cat-card {
        position: relative;
        display: block;
        overflow: hidden;
        cursor: pointer;
        text-decoration: none;
        background-color: #c9a87a;
        background-size: cover;
        background-position: center;
        transition: transform 0.25s;
      }
      .cat-card:hover {
        transform: scale(1.03);
        z-index: 1;
      }
      .cat-card__overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.65) 0%,
          rgba(0, 0, 0, 0.1) 55%,
          transparent 100%
        );
      }
      .cat-card__name {
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        z-index: 1;
      }

      /* ── Products grid ── */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
      }
      .card {
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
      }
      .card__img {
        height: 150px;
        background-color: #efe3d3;
        background-size: cover;
        background-position: center;
      }
      .card__body {
        padding: 1.1rem;
        text-align: center;
      }
      .card__name {
        margin: 0 0 0.5rem;
        font-size: 1.15rem;
      }
      .price {
        font-weight: 800;
        font-size: 1.2rem;
        color: var(--gold-red);
        margin: 0 0 0.4rem;
      }
      .status {
        font-size: 0.8rem;
        color: #98a1ab;
        margin: 0 0 0.9rem;
      }
      .status--available {
        color: #3f9142;
      }
      .card__btn {
        width: 100%;
        background: var(--gold-red);
        color: #fff;
        border: none;
        padding: 0.7rem;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }
      .card__btn:hover:not(:disabled) {
        background: #a50d24;
      }
      .card__btn:disabled {
        background: #cbd2d9;
        cursor: not-allowed;
      }
      .state {
        text-align: center;
        color: #5b6570;
        font-size: 1.1rem;
      }

      /* ── Footer ── */
      .footer {
        background: var(--gold-red);
        color: #fff;
        text-align: center;
        padding: 2.5rem 1.5rem;
      }
      .footer__logo {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: 4px;
        margin-bottom: 1.25rem;
      }
      .footer__nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.25rem;
        margin-bottom: 1.25rem;
      }
      .footer__nav a {
        color: #fff;
        text-decoration: none;
        font-weight: 600;
        opacity: 0.9;
      }
      .footer__nav a:hover {
        opacity: 1;
        text-decoration: underline;
      }
      .footer__contact {
        font-size: 0.9rem;
        opacity: 0.85;
        margin: 0;
      }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .cat-grid {
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 160px);
        }
        .hero {
          flex-direction: column;
        }
        .hero__image-side {
          flex: none;
          width: 100%;
          min-height: 260px;
        }
        .hero__text-side {
          flex: none;
          padding: 2rem 1.5rem;
        }
      }
      @media (max-width: 560px) {
        .cat-grid {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: auto;
        }
        .cat-card {
          height: 150px;
        }
        .hero__title {
          font-size: 1.75rem;
        }
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<ProductsResponse>("/products").subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.get<CategoriesResponse>("/categories/active").subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.categories.set([]),
    });
  }

  addToCart(product: Product): void {
    this.cart.add(product);
  }

  assetUrl(path?: string): string {
    if (!path) return "";
    return path.startsWith("/") ? path : `/${path}`;
  }
}
