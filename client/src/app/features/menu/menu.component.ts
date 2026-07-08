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

      <!-- ══════════════════════════════════════════
           How It Works — loyalty & ordering guide
           ══════════════════════════════════════════ -->
      <section class="section section--how">
        <div class="section__inner">
          <div class="section__head">
            <h2 class="section__title">איך זה עובד?</h2>
            <p class="section__lead">הזמנה קלה, תגמולים אמיתיים — כל מה שצריך לדעת</p>
          </div>

          <div class="steps">

            <!-- step 1 -->
            <div class="step">
              <div class="step__icon-wrap">
                <div class="step__icon step__icon--1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div class="step__connector"></div>
              </div>
              <span class="step__num">01</span>
              <h3 class="step__title">אורח או חבר?</h3>
              <p class="step__body">
                ניתן להזמין בקלות כאורח, בלי להירשם כלל. אך כשנרשמים — כל הטבות מועדון החברים נפתחות: נקודות, היסטוריית הזמנות ועדיפות בשירות.
              </p>
            </div>

            <!-- step 2 -->
            <div class="step">
              <div class="step__icon-wrap">
                <div class="step__icon step__icon--2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div class="step__connector"></div>
              </div>
              <span class="step__num">02</span>
              <h3 class="step__title">צבירת נקודות</h3>
              <p class="step__body">
                בכל הזמנה שמבצע חבר מועדון — מצטברות נקודות תגמול אוטומטית לפי גובה הסכום. ככל שמזמינים יותר, כך הנקודות מצטברות מהר יותר.
              </p>
            </div>

            <!-- step 3 -->
            <div class="step step--last">
              <div class="step__icon-wrap">
                <div class="step__icon step__icon--3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                    <line x1="6" y1="15" x2="10" y2="15"/>
                  </svg>
                </div>
              </div>
              <span class="step__num">03</span>
              <h3 class="step__title">מימוש נקודות</h3>
              <p class="step__body">
                בהזמנה הבאה, פשוט מפעילים את המתג במסך התשלום — הנקודות שנצברו הופכות להנחה ישירה על הסכום הסופי. כל שקל שנחסך, גדול!
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════
           Blog / Our Story
           ══════════════════════════════════════════ -->
      <section class="section section--blog">
        <div class="section__inner">
          <div class="section__head">
            <h2 class="section__title">מהמטבח שלנו</h2>
            <p class="section__lead">סיפורים, טיפים ואהבה לאוכל ולאירוח פרימיום</p>
          </div>

          <div class="blog-grid">

            <!-- card 1 -->
            <article class="blog-card">
              <div class="blog-card__img blog-card__img--1" role="img" aria-label="חומרי גלם טריים">
                <svg class="blog-card__img-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <div class="blog-card__body">
                <span class="blog-card__tag">חומרי גלם</span>
                <h3 class="blog-card__title">הסוד הוא בטריות — מקומיים, עונתיים, אמיתיים</h3>
                <p class="blog-card__snippet">
                  אצלנו לא מפשרים: כל ירק, כל גבינה, כל פרי — נבחרים מייצרנים מקומיים ומגיעים טריים מדי בוקר. הטעם מדבר בעד עצמו.
                </p>
                <a href="javascript:void(0)" class="blog-card__cta">קרא עוד ←</a>
              </div>
            </article>

            <!-- card 2 -->
            <article class="blog-card">
              <div class="blog-card__img blog-card__img--2" role="img" aria-label="טיפים לאירוח">
                <svg class="blog-card__img-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div class="blog-card__body">
                <span class="blog-card__tag">טיפים לאירוח</span>
                <h3 class="blog-card__title">5 סודות לשולחן שבת שיגרום לכולם להתאהב</h3>
                <p class="blog-card__snippet">
                  מסידור המגשים ועד הגעת האורחים — כמה טיפים קטנים שהופכים את השבת לחוויה בלתי נשכחת. עם הנגיעות הנכונות, האוכל מדבר בעד עצמו.
                </p>
                <a href="javascript:void(0)" class="blog-card__cta">קרא עוד ←</a>
              </div>
            </article>

            <!-- card 3 -->
            <article class="blog-card">
              <div class="blog-card__img blog-card__img--3" role="img" aria-label="הסיפור שלנו">
                <svg class="blog-card__img-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div class="blog-card__body">
                <span class="blog-card__tag">הסיפור שלנו</span>
                <h3 class="blog-card__title">מטבח ביתי שהפך למותג — הסיפור של גולדיס</h3>
                <p class="blog-card__snippet">
                  מה שהתחיל כמטבח ביתי קטן עם אהבה גדולה לאוכל, הפך עם השנים לאחד המותגים המוכרים והאהובים ביותר בתחום האירוח הפרימיום.
                </p>
                <a href="javascript:void(0)" class="blog-card__cta">קרא עוד ←</a>
              </div>
            </article>

          </div>
        </div>
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

      /* ══════════════════════════════════════════
         Shared section layout
         ══════════════════════════════════════════ */
      .section__inner {
        max-width: 1100px;
        margin: 0 auto;
      }
      .section__head {
        text-align: center;
        margin-bottom: 3rem;
      }
      .section__title {
        font-size: 2rem;
        font-weight: 800;
        color: var(--color-text);
        margin: 0 0 0.6rem;
      }
      .section__lead {
        font-size: 1.05rem;
        color: var(--color-text-muted);
        margin: 0;
      }

      /* ══════════════════════════════════════════
         How It Works
         ══════════════════════════════════════════ */
      .section--how {
        background: var(--color-surface);
        padding: 4.5rem 1.5rem;
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        position: relative;
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.75rem;
      }

      .step__icon-wrap {
        display: flex;
        align-items: center;
        width: 100%;
        justify-content: center;
        position: relative;
        margin-bottom: 0.25rem;
      }

      .step__icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #fff;
        position: relative;
        z-index: 1;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      }
      .step__icon--1 { background: var(--color-primary); }
      .step__icon--2 {
        background: linear-gradient(135deg, var(--color-primary), #e86835);
      }
      .step__icon--3 {
        background: linear-gradient(135deg, #e86835, #c0392b);
      }

      /* Horizontal connector line between steps */
      .step__connector {
        flex: 1;
        height: 2px;
        background: linear-gradient(to left, var(--color-border), var(--color-primary-light));
        margin-inline-start: -1px;
        opacity: 0.7;
      }

      .step__num {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 2px;
        color: var(--color-primary);
        opacity: 0.6;
      }
      .step__title {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--color-text);
        margin: 0;
      }
      .step__body {
        font-size: 0.9rem;
        color: var(--color-text-muted);
        line-height: 1.7;
        margin: 0;
        max-width: 260px;
      }

      /* ══════════════════════════════════════════
         Blog / Our Story
         ══════════════════════════════════════════ */
      .section--blog {
        background: var(--color-bg);
        padding: 4.5rem 1.5rem;
      }

      .blog-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.75rem;
      }

      .blog-card {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .blog-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }

      .blog-card__img {
        height: 180px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .blog-card__img--1 {
        background: linear-gradient(135deg, #fff3e0, #ffe0b2);
        color: #e65100;
      }
      .blog-card__img--2 {
        background: linear-gradient(135deg, #fce4ec, #f8bbd0);
        color: #c62828;
      }
      .blog-card__img--3 {
        background: linear-gradient(135deg, #fdf3e7, #fde8cf);
        color: #bf360c;
      }
      .blog-card__img-icon {
        opacity: 0.55;
      }

      .blog-card__body {
        padding: 1.4rem 1.25rem 1.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        flex: 1;
      }

      .blog-card__tag {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--color-primary);
        background: var(--color-primary-light);
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        width: fit-content;
      }

      .blog-card__title {
        font-size: 1rem;
        font-weight: 800;
        color: var(--color-text);
        margin: 0;
        line-height: 1.4;
      }

      .blog-card__snippet {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        line-height: 1.65;
        margin: 0;
        flex: 1;
      }

      .blog-card__cta {
        display: inline-block;
        margin-top: 0.4rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-primary);
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .blog-card__cta:hover {
        opacity: 0.75;
        text-decoration: underline;
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
        .steps {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        .step__connector {
          display: none;
        }
        .blog-grid {
          grid-template-columns: 1fr;
          max-width: 480px;
          margin: 0 auto;
        }
        .section__title {
          font-size: 1.6rem;
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
        .section--how,
        .section--blog {
          padding: 3rem 1rem;
        }
        .step__body {
          max-width: 100%;
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
