import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h1>Register</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Name <input formControlName="name" /></label>
      <label>Email <input type="email" formControlName="email" /></label>
      <label>Phone <input formControlName="phone" /></label>
      <label>Password <input type="password" formControlName="password" /></label>
      <button type="submit" [disabled]="form.invalid || loading()">
        Create account
      </button>
    </form>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <p>Already have an account? <a routerLink="/auth/login">Login</a></p>
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    email: ["", [Validators.email]],
    phone: [""],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(["/menu"]),
      error: (err) => {
        this.error.set(err.error?.message ?? "Registration failed");
        this.loading.set(false);
      },
    });
  }
}
