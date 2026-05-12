import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule }    from 'primeng/button';
import { RippleModule }    from 'primeng/ripple';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputTextModule, ButtonModule, RippleModule],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh">
      <!-- Left -->
      <div style="background:#1e2a4a;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:64px 48px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%,rgba(220,107,47,.12) 0%,transparent 70%)"></div>
        <div style="position:relative;z-index:1;max-width:380px;width:100%">
          <a routerLink="/" style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:#fff;text-decoration:none;display:block;margin-bottom:64px">🎧 DJ BookPro</a>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:#fff;margin-bottom:16px;line-height:1.2">Start booking<br>your events.</h2>
          <p style="color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:48px">Create a free account and get access to real-time availability, instant booking, and email confirmations.</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div *ngFor="let f of perks" style="display:flex;align-items:center;gap:12px">
              <div style="width:32px;height:32px;background:rgba(220,107,47,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">{{ f.icon }}</div>
              <span style="font-size:14px;color:rgba(255,255,255,.6)">{{ f.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right -->
      <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:64px 48px;background:#faf8f5;overflow-y:auto">
        <div style="width:100%;max-width:420px">
          <h1 style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:#1c1917;margin-bottom:8px">Create Account</h1>
          <p style="color:#78716c;font-size:14px;margin-bottom:32px">Already have an account? <a routerLink="/login" style="color:#dc6b2f;font-weight:600;text-decoration:none">Sign in</a></p>

          <div *ngIf="errorMsg" style="background:#fee2e2;border:1px solid rgba(153,27,27,.2);border-radius:10px;padding:12px 16px;color:#991b1b;font-size:13px;margin-bottom:20px">⚠ {{ errorMsg }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:18px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <div>
                <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Full Name</label>
                <input pInputText formControlName="name" type="text" placeholder="Jane Smith"
                       style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;box-sizing:border-box"
                       onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
                <span *ngIf="f['name'].invalid && f['name'].touched" style="color:#dc2626;font-size:11px;margin-top:3px;display:block">Required</span>
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Phone</label>
                <input pInputText formControlName="phone" type="tel" placeholder="+1 555-0000"
                       style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;box-sizing:border-box"
                       onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
              </div>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Email Address</label>
              <input pInputText formControlName="email" type="email" placeholder="you@example.com"
                     style="width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;box-sizing:border-box"
                     onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
              <span *ngIf="f['email'].invalid && f['email'].touched" style="color:#dc2626;font-size:11px;margin-top:3px;display:block">Valid email required</span>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin-bottom:6px">Password</label>
              <div style="position:relative">
                <input pInputText formControlName="password" [type]="showPw ? 'text':'password'" placeholder="Min. 6 characters"
                       style="width:100%;padding:12px 44px 12px 14px;border-radius:10px;border:1.5px solid #d6d3d1;background:#fff;font-size:14px;outline:none;box-sizing:border-box"
                       onfocus="this.style.borderColor='#dc6b2f'" onblur="this.style.borderColor='#d6d3d1'" />
                <button type="button" (click)="showPw=!showPw" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:.9rem;color:#a8a29e">{{ showPw ? '🙈':'👁' }}</button>
              </div>
              <!-- Strength bar -->
              <div *ngIf="f['password'].value" style="margin-top:8px">
                <div style="display:flex;gap:3px;margin-bottom:4px">
                  <div *ngFor="let s of [1,2,3,4]" style="flex:1;height:3px;border-radius:3px;transition:background .3s"
                       [style.background]="s <= strength ? strengthColor : '#e7e5e4'"></div>
                </div>
                <span style="font-size:11px;font-weight:600" [style.color]="strengthColor">{{ strengthLabel }}</span>
              </div>
              <span *ngIf="f['password'].invalid && f['password'].touched" style="color:#dc2626;font-size:11px;margin-top:3px;display:block">Min. 6 characters</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#f5f5f4;border-radius:10px;border:1px solid #e7e5e4">
              <input type="checkbox" formControlName="terms" id="terms" style="margin-top:2px;accent-color:#dc6b2f" />
              <label for="terms" style="font-size:13px;color:#57534e;cursor:pointer">I agree to the <a href="#" style="color:#dc6b2f;font-weight:600;text-decoration:none">Terms of Service</a> and <a href="#" style="color:#dc6b2f;font-weight:600;text-decoration:none">Privacy Policy</a></label>
            </div>
            <span *ngIf="f['terms'].invalid && f['terms'].touched" style="color:#dc2626;font-size:11px;margin-top:-10px;display:block">You must accept the terms</span>

            <button type="submit" [disabled]="form.invalid || loading"
                    style="width:100%;padding:14px;border-radius:12px;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px"
                    [style.background]="loading || form.invalid ? '#e7e5e4' : '#dc6b2f'"
                    [style.color]="loading || form.invalid ? '#a8a29e' : '#fff'">
              <span *ngIf="!loading">Create Account →</span>
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
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPw = false;

  perks = [
    { icon: '✅', text: 'Free account, no credit card required' },
    { icon: '📅', text: 'Real-time availability calendar' },
    { icon: '📧', text: 'Automatic email confirmations' },
    { icon: '🎧', text: 'Browse all DJ packages instantly' },
  ];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      phone:    [''],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms:    [false, Validators.requiredTrue]
    });
  }

  get f() { return this.form.controls; }

  get strength(): number {
    const v = this.f['password'].value || '';
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    return Math.max(1, s);
  }

  get strengthColor(): string { return ['#dc2626','#f59e0b','#3b82f6','#10b981'][this.strength - 1]; }
  get strengthLabel(): string { return ['Weak','Fair','Good','Strong'][this.strength - 1]; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    const { name, email, password, phone } = this.form.value;
    this.authService.register({ name, email, password, phone }).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: (e) => { this.loading = false; this.errorMsg = e.error?.message || 'Registration failed.'; }
    });
  }
}
