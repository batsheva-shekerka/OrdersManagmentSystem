import { Injectable, computed, inject, signal } from "@angular/core";
import { Observable, map, of, tap } from "rxjs";
import { ApiService } from "./api.service";
import { AuthResponse, User } from "../models/user.model";

const TOKEN_KEY = "goldis_token";
const USER_KEY = "goldis_user";

interface MeResponse {
  success: boolean;
  user: User;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private api = inject(ApiService);

  private currentUser = signal<User | null>(this.readStoredUser());
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === "admin");

  register(payload: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }) {
    return this.api
      .post<AuthResponse>("/auth/register", payload)
      .pipe(tap((res) => this.persist(res)));
  }

  login(payload: { email: string; password: string }) {
    return this.api
      .post<AuthResponse>("/auth/login", payload)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  /**
   * Re-fetches the current user from `GET /auth/me` and updates the stored
   * snapshot. The user object cached at login time (and echoed by every
   * request) goes stale the moment `loyaltyBalance` changes server-side —
   * e.g. after earning/redeeming points on an order — so any screen that
   * needs an up-to-date balance (checkout, in particular) should call this
   * before reading `user()`. No-ops for guests since there's no session to
   * refresh.
   */
  refreshProfile(): Observable<User | null> {
    if (!this.isLoggedIn()) return of(null);
    return this.api.get<MeResponse>("/auth/me").pipe(
      tap((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
      map((res) => res.user)
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
