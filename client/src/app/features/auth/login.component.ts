import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h1>Login</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Email <input type="email" formControlName="email" /></label>
      <label>Password <input type="password" formControlName="password" /></label>
      <button type="submit" [disabled]="form.invalid || loading()">Login</button>
    </form>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <p>No account? <a routerLink="/auth/register">Register</a></p>
  `,
  styles: [
    `
      form {
        display: grid;
        gap: 0.75rem;
        max-width: 320px;
      }
      .error {
        color: var(--brand);
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(["/menu"]),
      error: (err) => {
        this.error.set(err.error?.message ?? "Login failed");
        this.loading.set(false);
      },
    });
  }
}
