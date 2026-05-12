// ── login.component.ts ───────────────────────────────────────────────────────
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

// SHARED STYLES for auth pages
const authStyles = [`
  .auth-page { min-height: 100vh; background: #0a0a0a; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { background: #111; border: 1px solid #222; border-radius: 20px; padding: 48px; width: 100%; max-width: 440px; }
  .auth-logo { text-align: center; font-size: 3rem; margin-bottom: 8px; }
  .auth-title { color: #fff; font-size: 1.8rem; font-weight: 800; text-align: center; margin-bottom: 6px; }
  .auth-sub { color: #666; text-align: center; font-size: 14px; margin-bottom: 32px; }
  .form-field { margin-bottom: 16px; }
  .form-field label { display: block; color: #888; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .form-field input { width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; color: #fff; padding: 14px 16px; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; }
  .form-field input:focus { border-color: #a855f7; }
  .form-field input.error { border-color: #e74c3c; }
  .field-error { color: #e74c3c; font-size: 12px; margin-top: 4px; }
  .btn-submit { width: 100%; background: linear-gradient(135deg, #a855f7, #3b82f6); color: #fff; border: none; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; }
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-footer { text-align: center; margin-top: 24px; color: #666; font-size: 14px; }
  .auth-footer a { color: #a855f7; text-decoration: none; font-weight: 600; }
  .error-alert { background: #2a0a0a; border: 1px solid #e74c3c; border-radius: 8px; padding: 12px 16px; color: #e74c3c; font-size: 13px; margin-bottom: 16px; }
`];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🎧</div>
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-sub">Sign in to manage your bookings</p>

        <div class="error-alert" *ngIf="errorMsg">{{ errorMsg }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="you@example.com"
                   [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
          </div>
          <div class="form-field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="••••••••"
                   [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
          </div>
          <button class="btn-submit" type="submit" [disabled]="form.invalid || isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register">Create one</a>
        </div>
      </div>
    </div>
  `,
  styles: authStyles
})
export class LoginComponent {
  form: FormGroup;
  isLoading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMsg = '';

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.router.navigate([returnUrl || (res.user.role === 'admin' ? '/admin' : '/dashboard')]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Invalid email or password';
      }
    });
  }
}

// ── register.component.ts ─────────────────────────────────────────────────────
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🎉</div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-sub">Join to book your next event</p>

        <div class="error-alert" *ngIf="errorMsg">{{ errorMsg }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>Full Name</label>
            <input type="text" formControlName="name" placeholder="Jane Smith">
          </div>
          <div class="form-field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="you@example.com">
          </div>
          <div class="form-field">
            <label>Phone (optional)</label>
            <input type="tel" formControlName="phone" placeholder="+1 555-0000">
          </div>
          <div class="form-field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Min. 6 characters">
          </div>
          <button class="btn-submit" type="submit" [disabled]="form.invalid || isLoading">
            {{ isLoading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: authStyles
})
export class RegisterComponent {
  form: FormGroup;
  isLoading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMsg = '';

    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
