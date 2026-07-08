import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { resolveAssetUrl } from "../../core/utils/asset-url";

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
    <div class="home">
      <section class="hero">
        <img
          class="hero__image-side"
          src="/assets/hero.jpg"
          alt="מגוון מגשי אירוח של גולדיס"
        />
        <div class="hero__text-side">
          <h1 class="hero__title">מגוון מגשי אירוח של גולדיס</h1>
          <p class="hero__subtitle">מתוקים, מלוחים, סלטים ועוד...</p>
          <a class="hero__cta" href="#categories-section">בחרו קטגוריה</a>
        </div>
      </section>

      <section id="categories-section" class="section section--muted">
        @if (loading()) {
          <p class="state">טוען קטגוריות...</p>
        } @else if (categories().length === 0) {
          <p class="state">אין קטגוריות זמינות כרגע.</p>
        } @else {
          <div class="cat-grid">
            @for (cat of categories(); track cat._id) {
              <a
                class="cat-card"
                [routerLink]="['/category', cat._id]"
                [style.background-image]="'url(' + assetUrl(cat.imageUrl) + ')'"
                [attr.aria-label]="'צפייה במוצרי קטגוריית ' + cat.name"
              >
                <span class="cat-card__overlay"></span>
                <span class="cat-card__name">{{ cat.name }}</span>
              </a>
            }
          </div>
        }
      </section>

      <footer class="footer">
        <div class="footer__logo">GOLDY'S</div>
        <nav class="footer__nav">
          <a href="#categories-section">תפריטי שבת וחג</a>
          <a href="#categories-section">מגשי אירוח</a>
          <a href="#categories-section">מארזים ומתנות</a>
          <a href="#categories-section">בייקרי</a>
          <a href="#categories-section">מתחם חגים</a>
        </nav>
        <p class="footer__contact">מאדה 9, בני ברק · עזרת תורה 18, ירושלים · 02-6200100</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .home {
        margin: -1.5rem;
        color: var(--color-text);
        font-family: var(--font-family);
      }

      .hero {
        display: flex;
        flex-direction: row-reverse;
        min-height: 420px;
        background: #fff;
      }
      .hero__image-side {
        flex: 1 1 60%;
        width: 100%;
        min-height: 420px;
        object-fit: cover;
        object-position: center;
        display: block;
      }
      .hero__text-side {
        flex: 0 0 40%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 3rem 3.5rem;
        background: var(--color-surface);
        text-align: right;
      }
      .hero__title {
        font-size: 2.4rem;
        font-weight: 800;
        line-height: 1.25;
        color: var(--color-text);
        margin: 0 0 1rem;
      }
      .hero__subtitle {
        font-size: 1.1rem;
        color: var(--color-text-muted);
        margin: 0 0 2rem;
      }
      .hero__cta {
        display: inline-block;
        background: var(--color-primary);
        color: var(--color-text-on-primary);
        text-decoration: none;
        padding: 0.85rem 2.5rem;
        border-radius: var(--radius-sm);
        font-weight: 700;
        font-size: 1rem;
        transition: background 0.2s, transform 0.15s;
      }
      .hero__cta:hover {
        background: var(--color-primary-dark);
        transform: translateY(-2px);
      }

      .section {
        padding: 3rem 1.5rem;
      }
      .section--muted {
        background: var(--color-bg);
        padding: 1rem;
      }
      .state {
        text-align: center;
        color: var(--color-text-muted);
        font-size: 1.1rem;
      }

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

      .footer {
        background: var(--color-primary);
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

  categories = signal<Category[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<CategoriesResponse>("/categories/active").subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  assetUrl(path?: string): string {
    return resolveAssetUrl(path);
  }
}
