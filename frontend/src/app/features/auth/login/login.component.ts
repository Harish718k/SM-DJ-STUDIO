import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule }    from 'primeng/button';
import { MessageModule }   from 'primeng/message';
import { RippleModule }    from 'primeng/ripple';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputTextModule, ButtonModule, MessageModule, RippleModule],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh">
      <!-- Left panel -->
      <div style="background:#1e2a4a;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:64px 48px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(220,107,47,.15) 0%,transparent 70%)"></div>
        <div style="position:relative;z-index:1;max-width:380px;width:100%">
          <a routerLink="/" style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:#fff;text-decoration:none;display:block;margin-bottom:64px">🎧 DJ BookPro</a>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:#fff;margin-bottom:16px;line-height:1.2">Welcome back.</h2>
          <p style="color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:48px">Sign in to manage your bookings and account.</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div *ngFor="let f of features" style="display:flex;align-items:center;gap:12px">
              <div style="width:36px;height:36px;background:rgba(220,107,47,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">{{ f.icon }}</div>
              <span style="font-size:14px;color:rgba(255,255,255,.6)">{{ f.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:64px 48px;background:#faf8f5">
        <div style="width:100%;max-width:400px">
          <h1 style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:#1c1917;margin-bottom:8px">Sign In</h1>
          <p style="color:#78716c;font-size:14px;margin-bottom:36px">Don't have an account? <a routerLink="/register" style="color:#dc6b2f;font-weight:600;text-decoration:none">Create one free</a></p>

          <div *ngIf="errorMsg" style="background:#fee2e2;border:1px solid rgba(153,27,27,.2);border-radius:10px;padding:12px 16px;color:#991b1b;font-size:13px;margin-bottom:20px;display:flex;align-items:center;gap:8px">
            ⚠ {{ errorMsg }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:20px">
            <div>
              <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Email Address</label>
              <input pInputText formControlName="email" type="email" placeholder="you@example.com"
                     style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;transition:border-color .15s;box-sizing:border-box"
                     onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
              <span *ngIf="f['email'].invalid && f['email'].touched" style="color:#dc2626;font-size:12px;margin-top:4px;display:block">Valid email required</span>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Password</label>
              <div style="position:relative">
                <input pInputText formControlName="password" [type]="showPw ? 'text' : 'password'" placeholder="Your password"
                       style="width:100%;padding:12px 44px 12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;transition:border-color .15s;box-sizing:border-box"
                       onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
                <button type="button" (click)="showPw=!showPw" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:.9rem;color:#a8a29e">{{ showPw ? '🙈' : '👁' }}</button>
              </div>
              <span *ngIf="f['password'].invalid && f['password'].touched" style="color:#dc2626;font-size:12px;margin-top:4px;display:block">Password required</span>
            </div>

            <!-- Demo credentials -->
            <div style="background:#f5f5f4;border:1px solid #e7e5e4;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#a8a29e;margin-bottom:10px">Quick Demo Login</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" (click)="fillDemo('client')" style="font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #e7e5e4;background:#fff;color:#57534e;cursor:pointer;transition:all .15s" onmouseenter="this.style.borderColor='#dc6b2f';this.style.color='#dc6b2f'" onmouseleave="this.style.borderColor='#e7e5e4';this.style.color='#57534e'">👤 Client</button>
                <button type="button" (click)="fillDemo('admin')"  style="font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #e7e5e4;background:#fff;color:#57534e;cursor:pointer;transition:all .15s" onmouseenter="this.style.borderColor='#dc6b2f';this.style.color='#dc6b2f'" onmouseleave="this.style.borderColor='#e7e5e4';this.style.color='#57534e'">⚙ Admin</button>
              </div>
            </div>

            <button type="submit" [disabled]="form.invalid || loading"
                    style="width:100%;padding:14px;border-radius:12px;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px"
                    [style.background]="loading || form.invalid ? '#e7e5e4' : '#dc6b2f'"
                    [style.color]="loading || form.invalid ? '#a8a29e' : '#fff'">
              <span *ngIf="!loading">Sign In →</span>
              <span *ngIf="loading" style="display:flex;gap:4px">
                <span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:bt .9s infinite"></span>
                <span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:bt .9s infinite;animation-delay:.15s"></span>
                <span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:bt .9s infinite;animation-delay:.3s"></span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`@keyframes bt{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPw = false;

  features = [
    { icon: '📅', text: 'View and manage all your bookings in one place' },
    { icon: '🔔', text: 'Automatic email confirmations and reminders' },
    { icon: '🎧', text: 'Browse packages and check live availability' },
  ];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() { return this.form.controls; }

  fillDemo(role: 'client' | 'admin'): void {
    const creds = role === 'admin'
      ? { email: 'admin@djbooking.com', password: 'Admin@123' }
      : { email: 'client@example.com',  password: 'Client@123' };
    this.form.patchValue(creds);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    this.authService.login(this.form.value).subscribe({
      next: () => { this.router.navigate([this.authService.isAdmin ? '/admin' : '/dashboard']); },
      error: (e) => { this.loading = false; this.errorMsg = e.error?.message || 'Invalid credentials.'; }
    });
  }
}
