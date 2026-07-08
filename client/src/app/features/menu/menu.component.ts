import { Component, OnDestroy, OnInit, computed, inject, signal } from "@angular/core";
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

/** Static promo copy for each hero slide; the actual category id it links to
 * is resolved at runtime from the loaded categories (by slug) since ids come
 * from the database and can't be hardcoded here. */
interface HeroSlideDef {
  title: string;
  subtitle: string;
  imageUrl: string;
  categorySlug: string;
}

interface HeroSlide extends HeroSlideDef {
  categoryRoute: (string | number)[];
}

const HERO_SLIDE_DEFS: HeroSlideDef[] = [
  {
    title: "מגוון מגשי אירוח של גולדיס",
    subtitle: "מתוקים, מלוחים, סלטים ועוד...",
    imageUrl: "/assets/hero.jpg",
    categorySlug: "serving-trays",
  },
  {
    title: "מבחר בשרים עשיר וטרי",
    subtitle: "כריכים, פיצות ומעדני בשר תוצרת בית",
    imageUrl: "/assets/categories/meats.jpg",
    categorySlug: "meats",
  },
  {
    title: "קינוחים מפנקים לכל אירוע",
    subtitle: "מתוקים ברמה מלונאית לכל שולחן חגיגי",
    imageUrl: "/assets/categories/desserts.jpg",
    categorySlug: "desserts",
  },
];

const AUTOPLAY_INTERVAL_MS = 5000;

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <section class="hero">
        @for (slide of [currentSlide()]; track activeSlideIndex()) {
          <div class="hero__content fade-in">
            <h1 class="hero__title">{{ slide.title }}</h1>
            <p class="hero__subtitle">{{ slide.subtitle }}</p>
            <a class="hero__cta" [routerLink]="slide.categoryRoute">הזמינו עכשיו</a>
          </div>
        }

        <div class="hero__media">
          @for (slide of [currentSlide()]; track activeSlideIndex()) {
            <img class="hero__image fade-in" [src]="slide.imageUrl" [alt]="slide.title" />
          }
        </div>

        <div class="hero__dots">
          @for (slide of slides(); track slide.categorySlug; let i = $index) {
            <button
              type="button"
              class="hero__dot"
              [class.hero__dot--active]="i === activeSlideIndex()"
              (click)="goToSlide(i)"
              [attr.aria-label]="'שקופית ' + (i + 1)"
            ></button>
          }
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
        position: relative;
        display: grid;
        grid-template-columns: 42% 58%;
        grid-template-areas: "content media";
        height: 450px;
        max-height: 500px;
        overflow: hidden;
        background: var(--color-bg);
      }
      .hero__content {
        grid-area: content;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 3rem 3.5rem;
        background: var(--color-bg);
        text-align: right;
      }
      .hero__media {
        grid-area: media;
        overflow: hidden;
      }
      .hero__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
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

      /* ── Slide transition ── */
      .fade-in {
        animation: hero-fade 0.6s ease;
      }
      @keyframes hero-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* ── Carousel dots ── */
      .hero__dots {
        position: absolute;
        bottom: 1.1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 2;
      }
      .hero__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        padding: 0;
        background: rgba(255, 255, 255, 0.6);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: background 0.2s, width 0.2s;
      }
      .hero__dot:hover {
        background: rgba(255, 255, 255, 0.9);
      }
      .hero__dot--active {
        width: 22px;
        border-radius: 999px;
        background: var(--color-primary);
        box-shadow: none;
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
          grid-template-columns: 1fr;
          grid-template-areas:
            "content"
            "media";
          height: auto;
          max-height: none;
        }
        .hero__media {
          height: 250px;
        }
        .hero__content {
          padding: 2rem 1.5rem;
        }
        .hero__dots {
          bottom: 0.75rem;
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
export class MenuComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);

  categories = signal<Category[]>([]);
  loading = signal(true);

  activeSlideIndex = signal(0);
  private autoplayId: ReturnType<typeof setInterval> | null = null;

  /** Resolves each slide's static promo copy against the loaded categories
   * to find the real category id it should link to; falls back to /menu if
   * the category hasn't loaded yet or its slug isn't found. */
  slides = computed<HeroSlide[]>(() => {
    const cats = this.categories();
    return HERO_SLIDE_DEFS.map((def) => {
      const match = cats.find((c) => c.slug === def.categorySlug);
      return {
        ...def,
        categoryRoute: match ? ["/category", match._id] : ["/menu"],
      };
    });
  });

  currentSlide = computed<HeroSlide>(() => this.slides()[this.activeSlideIndex()]);

  ngOnInit(): void {
    this.api.get<CategoriesResponse>("/categories/active").subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  goToSlide(index: number): void {
    this.activeSlideIndex.set(index);
    this.restartAutoplay(); // manual selection shouldn't be immediately overridden by the timer
  }

  private startAutoplay(): void {
    this.autoplayId = setInterval(() => {
      const total = this.slides().length;
      this.activeSlideIndex.update((i) => (i + 1) % total);
    }, AUTOPLAY_INTERVAL_MS);
  }

  private stopAutoplay(): void {
    if (this.autoplayId !== null) {
      clearInterval(this.autoplayId);
      this.autoplayId = null;
    }
  }

  private restartAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  assetUrl(path?: string): string {
    return resolveAssetUrl(path);
  }
}
