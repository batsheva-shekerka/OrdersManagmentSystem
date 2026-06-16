import { Injectable, computed, inject, signal } from "@angular/core";
import { tap } from "rxjs";
import { ApiService } from "./api.service";
import { AuthResponse, User } from "../models/user.model";

const TOKEN_KEY = "goldis_token";
const USER_KEY = "goldis_user";

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
