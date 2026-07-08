import { Injectable, inject, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { Category } from "../models/category.model";

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

/**
 * Lightweight category reader used for the admin product form's dropdown
 * (all categories, including inactive ones) — customer-facing pages
 * continue to fetch `/categories/active` directly as before.
 */
@Injectable({ providedIn: "root" })
export class CategoryService {
  private api = inject(ApiService);

  private categories = signal<Category[]>([]);
  readonly all = this.categories.asReadonly();
  readonly loading = signal(true);

  loadAll(): void {
    this.loading.set(true);
    this.api.get<CategoriesResponse>("/categories").subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
