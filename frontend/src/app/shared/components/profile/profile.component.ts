import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroUser, heroLockClosed, heroPencilSquare,
  heroArrowRightOnRectangle, heroPhone, heroEnvelope, heroCheckCircle,
  heroCamera, heroEye, heroEyeSlash
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  viewProviders: [provideIcons({ heroArrowLeft, heroUser, heroLockClosed, heroPencilSquare, heroArrowRightOnRectangle, heroPhone, heroEnvelope, heroCheckCircle, heroCamera, heroEye, heroEyeSlash })],
  template: `
    <div class="min-h-screen bg-cream p-8">

      <!-- Back link -->
      <button (click)="goBack()" class="flex items-center gap-2 text-stone-400 hover:text-accent text-sm font-medium transition-colors mb-6 border-0 bg-transparent">
        <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
      </button>

      <div class="mb-7">
        <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">My Profile</h1>
        <p class="text-stone-400 text-sm">Manage your account information and security settings</p>
      </div>

      <div class="grid grid-cols-[280px_1fr] gap-6 items-start">

        <!-- Identity card -->
        <div class="card p-6 sticky top-6">
          <!-- Avatar -->
          <div class="flex flex-col items-center mb-5">
            <div class="relative mb-2">
              <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-200 shadow-md">
                <img *ngIf="avatarPreview" [src]="avatarPreview" alt="Profile" class="w-full h-full object-cover"/>
                <div *ngIf="!avatarPreview" class="w-full h-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-display text-4xl font-bold">{{ initial }}</div>
              </div>
              <label class="absolute bottom-0 right-0 w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-accent transition-colors border-2 border-white">
                <ng-icon name="heroCamera" class="w-3.5 h-3.5"/>
                <input type="file" accept="image/*" (change)="onFileChange($event)" class="hidden"/>
              </label>
            </div>
            <div class="text-[10px] text-stone-400 text-center">JPG, PNG or GIF · max 2 MB</div>
          </div>

          <!-- Info -->
          <div class="text-center mb-4">
            <div class="font-display text-lg font-bold text-stone-900 mb-1">{{ user?.name }}</div>
            <div class="text-sm text-stone-400 mb-3 break-all">{{ user?.email }}</div>
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-full"
                  [class.bg-orange-100]="user?.role==='admin'" [class.text-accent]="user?.role==='admin'"
                  [class.bg-stone-100]="user?.role!=='admin'" [class.text-stone-600]="user?.role!=='admin'">
              {{ user?.role==='admin' ? '⚙ Administrator' : '👤 Client' }}
            </span>
          </div>

          <div *ngIf="user?.phone" class="flex items-center gap-2 text-sm text-stone-400 justify-center mb-4">
            <ng-icon name="heroPhone" class="w-4 h-4"/>{{ user?.phone }}
          </div>

          <button (click)="signOut()" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
            <ng-icon name="heroArrowRightOnRectangle" class="w-4 h-4"/>Sign Out
          </button>
        </div>

        <!-- Forms -->
        <div class="flex flex-col gap-5">

          <!-- Personal info -->
          <div class="card overflow-hidden">
            <div class="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
              <ng-icon name="heroUser" class="w-5 h-5 text-accent"/>
              <span class="font-display text-base font-bold text-stone-800">Personal Information</span>
            </div>

            <div *ngIf="profileSuccess" class="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-sm font-medium">
              <ng-icon name="heroCheckCircle" class="w-4 h-4"/>Profile updated successfully!
            </div>
            <div *ngIf="profileError" class="px-6 py-3 bg-red-50 border-b border-red-100 text-red-600 text-sm">⚠ {{ profileError }}</div>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="p-6">
              <div class="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label class="form-label">Full Name</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="Your full name"/>
                  <span *ngIf="pf['name'].invalid && pf['name'].touched" class="text-red-500 text-xs mt-1 block">Required</span>
                </div>
                <div>
                  <label class="form-label">Phone Number</label>
                  <input type="tel" formControlName="phone" class="form-input" placeholder="+1 555-0000"/>
                </div>
              </div>
              <div class="mb-5">
                <label class="form-label">Email Address</label>
                <input type="email" [value]="user?.email||''" disabled class="form-input opacity-60 cursor-not-allowed bg-stone-100"/>
                <span class="text-xs text-stone-400 mt-1 block">Email cannot be changed</span>
              </div>
              <div class="flex justify-end">
                <button type="submit" [disabled]="profileForm.invalid || isSavingProfile"
                        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                  <span *ngIf="!isSavingProfile">Save Changes</span>
                  <span *ngIf="isSavingProfile" class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Saving…</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Change password -->
          <div class="card overflow-hidden">
            <div class="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
              <ng-icon name="heroLockClosed" class="w-5 h-5 text-accent"/>
              <span class="font-display text-base font-bold text-stone-800">Change Password</span>
            </div>

            <div *ngIf="pwSuccess" class="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-sm font-medium">
              <ng-icon name="heroCheckCircle" class="w-4 h-4"/>Password changed successfully!
            </div>
            <div *ngIf="pwError" class="px-6 py-3 bg-red-50 border-b border-red-100 text-red-600 text-sm">⚠ {{ pwError }}</div>

            <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="p-6">
              <div class="flex flex-col gap-5">
                <div>
                  <label class="form-label">Current Password</label>
                  <div class="relative">
                    <input [type]="showCurrent?'text':'password'" formControlName="currentPassword" class="form-input pr-11" placeholder="Enter current password"/>
                    <button type="button" (click)="showCurrent=!showCurrent" class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 border-0 bg-transparent">
                      <ng-icon [name]="showCurrent?'heroEyeSlash':'heroEye'" class="w-4 h-4"/>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="form-label">New Password</label>
                  <div class="relative">
                    <input [type]="showNew?'text':'password'" formControlName="newPassword" class="form-input pr-11" placeholder="Min. 6 characters"/>
                    <button type="button" (click)="showNew=!showNew" class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 border-0 bg-transparent">
                      <ng-icon [name]="showNew?'heroEyeSlash':'heroEye'" class="w-4 h-4"/>
                    </button>
                  </div>
                  <!-- Strength bar -->
                  <div *ngIf="pw['newPassword'].value" class="mt-2">
                    <div class="flex gap-1 mb-1">
                      <div *ngFor="let s of [1,2,3,4]" class="flex-1 h-1 rounded-full transition-all"
                           [class.bg-red-400]="s<=pwStr && pwStr===1"
                           [class.bg-amber-400]="s<=pwStr && pwStr===2"
                           [class.bg-blue-400]="s<=pwStr && pwStr===3"
                           [class.bg-emerald-500]="s<=pwStr && pwStr===4"
                           [class.bg-stone-100]="s>pwStr"></div>
                    </div>
                    <span class="text-xs font-semibold" [class.text-red-400]="pwStr===1" [class.text-amber-500]="pwStr===2" [class.text-blue-500]="pwStr===3" [class.text-emerald-600]="pwStr===4">
                      {{ ['','Weak','Fair','Good','Strong'][pwStr] }}
                    </span>
                  </div>
                </div>
                <div>
                  <label class="form-label">Confirm New Password</label>
                  <input type="password" formControlName="confirmPassword" class="form-input" placeholder="Repeat new password"/>
                  <span *ngIf="pwForm.hasError('mismatch') && pw['confirmPassword'].touched" class="text-red-500 text-xs mt-1 block">Passwords do not match</span>
                </div>
              </div>
              <div class="flex justify-end mt-5">
                <button type="submit" [disabled]="pwForm.invalid || isChangingPw"
                        class="flex items-center gap-2 bg-navy text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-0">
                  <span *ngIf="!isChangingPw">Update Password</span>
                  <span *ngIf="isChangingPw" class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Updating…</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  avatarPreview: string | null = null;
  profileForm: FormGroup;
  pwForm: FormGroup;
  isSavingProfile = false;
  isChangingPw = false;
  profileSuccess = false;
  profileError = '';
  pwSuccess = false;
  pwError = '';
  showCurrent = false;
  showNew = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['']
    });
    this.pwForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: (g: AbstractControl) => {
        const np = g.get('newPassword')?.value, cp = g.get('confirmPassword')?.value;
        return np && cp && np !== cp ? { mismatch: true } : null;
      }
    });
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    if (this.user) {
      this.profileForm.patchValue({ name: this.user.name, phone: this.user.phone || '' });
      this.avatarPreview = this.user.profilePicture || null;
    }
  }

  get initial() { return (this.user?.name || 'U')[0].toUpperCase(); }
  get pf() { return this.profileForm.controls; }
  get pw() { return this.pwForm.controls; }
  get pwStr() {
    const v = this.pw['newPassword'].value || '';
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    return Math.max(1, s);
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.profileError = 'Image must be under 2 MB.'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.authService.updateProfile({ profilePicture: this.avatarPreview }).subscribe({
        next: () => { this.profileSuccess = true; setTimeout(() => this.profileSuccess = false, 3000); },
        error: () => { this.profileError = 'Failed to upload photo.'; }
      });
    };
    reader.readAsDataURL(file);
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSavingProfile = true; this.profileError = ''; this.profileSuccess = false;
    this.authService.updateProfile({ name: this.pf['name'].value, phone: this.pf['phone'].value }).subscribe({
      next: () => { this.isSavingProfile = false; this.profileSuccess = true; this.user = this.authService.currentUser; setTimeout(() => this.profileSuccess = false, 3000); },
      error: err => { this.isSavingProfile = false; this.profileError = err.error?.message || 'Update failed.'; }
    });
  }

  changePassword() {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    this.isChangingPw = true; this.pwError = ''; this.pwSuccess = false;
    this.authService.changePassword(this.pw['currentPassword'].value, this.pw['newPassword'].value).subscribe({
      next: () => { this.isChangingPw = false; this.pwSuccess = true; this.pwForm.reset(); setTimeout(() => this.pwSuccess = false, 4000); },
      error: err => { this.isChangingPw = false; this.pwError = err.error?.message || 'Password change failed.'; }
    });
  }

  goBack() { window.history.back(); }
  signOut() { this.authService.logout(); }
}
