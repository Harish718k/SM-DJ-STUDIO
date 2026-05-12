import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroClipboardDocumentList, heroPlusCircle, heroHome,
  heroArrowRightOnRectangle, heroCalendarDays, heroClock,
  heroCheckCircle, heroTrophy, heroChartBar, heroChevronRight,
  heroStar,
} from '@ng-icons/heroicons/outline';
import { BookingService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIconComponent],
  viewProviders: [provideIcons({
    heroClipboardDocumentList, heroPlusCircle, heroHome,
    heroArrowRightOnRectangle, heroCalendarDays, heroClock,
    heroCheckCircle, heroTrophy, heroChartBar, heroChevronRight,
    heroStar,
  })],
  template: `
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-56 bg-navy flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/[.06]">
          <span class="text-2xl leading-none">🎧</span>
          <div>
            <div class="font-display text-base font-bold text-white leading-tight">DJ BookPro</div>
            <div class="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Client Portal</div>
          </div>
        </div>

        <nav class="flex flex-col gap-1 p-3 flex-1">
          <p class="text-[9px] font-bold uppercase tracking-[.2em] text-white/20 px-2 pt-3 pb-1">Menu</p>
          <a class="sidebar-link" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <ng-icon name="heroClipboardDocumentList" class="w-4 h-4 shrink-0"/>
            My Bookings
            <span *ngIf="bookings.length" class="ml-auto text-[10px] font-bold bg-accent/25 text-accent px-2 py-0.5 rounded-full">{{ bookings.length }}</span>
          </a>
          <p class="text-[9px] font-bold uppercase tracking-[.2em] text-white/20 px-2 pt-4 pb-1">Actions</p>
          <a class="sidebar-link border border-dashed border-accent/30 text-accent/80 hover:bg-accent/10 hover:text-accent" routerLink="/booking">
            <ng-icon name="heroPlusCircle" class="w-4 h-4 shrink-0"/>
            New Booking
          </a>
          <a class="sidebar-link" routerLink="/">
            <ng-icon name="heroHome" class="w-4 h-4 shrink-0"/>
            Back to Home
          </a>
        </nav>

        <div class="border-t border-white/[.06] p-3">
          <a routerLink="/dashboard/profile" class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors no-underline mb-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              <img *ngIf="user?.profilePicture" [src]="user!.profilePicture!" class="w-full h-full object-cover" alt=""/>
              <span *ngIf="!user?.profilePicture">{{ (user?.name||'U')[0] }}</span>
            </div>
            <div class="min-w-0">
              <div class="text-white text-xs font-semibold truncate">{{ user?.name }}</div>
              <div class="text-white/30 text-[10px] truncate">{{ user?.email }}</div>
            </div>
          </a>
          <button (click)="logout()" class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white/30 text-xs font-medium hover:bg-white/5 hover:text-accent transition-all border-0 bg-transparent">
            <ng-icon name="heroArrowRightOnRectangle" class="w-4 h-4"/>
            Sign Out
          </button>
        </div>
      </aside>

      <!-- Main -->
      <main class="flex-1 p-8 overflow-y-auto">
        <!-- Top bar -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">My Bookings</h1>
            <p class="text-stone-400 text-sm">Welcome back, <span class="font-semibold text-stone-600">{{ firstName }}</span></p>
          </div>
          <a routerLink="/booking" class="btn-primary">
            <ng-icon name="heroPlusCircle" class="w-4 h-4"/>
            New Booking
          </a>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <ng-icon name="heroChartBar" class="w-5 h-5 text-blue-500"/>
            </div>
            <div>
              <div class="font-display text-2xl font-bold text-stone-900">{{ bookings.length }}</div>
              <div class="text-xs text-stone-400">Total</div>
            </div>
          </div>
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <ng-icon name="heroClock" class="w-5 h-5 text-amber-500"/>
            </div>
            <div>
              <div class="font-display text-2xl font-bold text-stone-900">{{ pendingCount }}</div>
              <div class="text-xs text-stone-400">Pending</div>
            </div>
          </div>
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <ng-icon name="heroCheckCircle" class="w-5 h-5 text-emerald-500"/>
            </div>
            <div>
              <div class="font-display text-2xl font-bold text-stone-900">{{ confirmedCount }}</div>
              <div class="text-xs text-stone-400">Confirmed</div>
            </div>
          </div>
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <ng-icon name="heroTrophy" class="w-5 h-5 text-accent"/>
            </div>
            <div>
              <div class="font-display text-2xl font-bold text-stone-900">{{ completedCount }}</div>
              <div class="text-xs text-stone-400">Completed</div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex gap-2 mb-5 flex-wrap">
          <button *ngFor="let f of filters" (click)="activeFilter=f.key"
                  class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all"
                  [class.bg-accent]="activeFilter===f.key" [class.text-white]="activeFilter===f.key"
                  [class.border-accent]="activeFilter===f.key" [class.bg-white]="activeFilter!==f.key"
                  [class.text-stone-500]="activeFilter!==f.key" [class.border-stone-200]="activeFilter!==f.key">
            {{ f.label }}
            <div *ngIf="f.key !== 'all' && getCount(f.key) > 0">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" [ngClass]="{'bg-white/25': activeFilter===f.key, 'bg-stone-100': activeFilter!==f.key}">{{ getCount(f.key) }}</span>
            </div>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoading" class="flex items-center justify-center gap-3 py-20 text-stone-400">
          <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
          <span>Loading your bookings…</span>
        </div>

        <!-- Empty -->
        <div *ngIf="!isLoading && filteredBookings.length===0" class="text-center py-20">
          <div class="text-5xl mb-4">📭</div>
          <h3 class="font-display text-xl font-bold text-stone-700 mb-2">No bookings {{ activeFilter==='all' ? 'yet' : 'here' }}</h3>
          <p class="text-stone-400 text-sm mb-6">Ready to book your first event?</p>
          <a *ngIf="activeFilter==='all'" routerLink="/booking" class="btn-primary">Book an Event →</a>
        </div>

        <!-- Cards -->
        <div *ngIf="!isLoading && filteredBookings.length>0" class="flex flex-col gap-3">
          <a *ngFor="let b of filteredBookings" [routerLink]="['/dashboard/booking', b._id]"
             class="card overflow-hidden hover:shadow-md transition-shadow no-underline">
            <div class="p-5 flex items-start gap-4">
              <div class="w-12 h-12 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {{ getEventIcon(b.eventType) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-stone-900 text-base">{{ b.eventType | titlecase }}</span>
                  <span [class]="'badge-' + b.status">{{ b.status | titlecase }}</span>
                </div>
                <div class="text-sm text-stone-400 mb-2">{{ b.venue.name }}, {{ b.venue.city }}</div>
                <div class="flex flex-wrap gap-4 text-xs text-stone-400">
                  <span class="flex items-center gap-1"><ng-icon name="heroCalendarDays" class="w-3.5 h-3.5"/>{{ b.eventDate | date:'EEE, MMM d, y' }}</span>
                  <span class="flex items-center gap-1"><ng-icon name="heroClock" class="w-3.5 h-3.5"/>{{ b.startTime }} – {{ b.endTime }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-display text-xl font-bold text-accent">\${{ b.totalPrice }}</div>
              </div>
            </div>

            <div *ngIf="canReview(b)"
                 class="border-t border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-bold text-stone-800 mb-0.5">How was your event?</div>
                <div class="text-xs text-stone-400">Share your experience — it only takes a minute.</div>
              </div>
              <button (click)="goToReview(b); $event.stopPropagation()"
                      class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold border-0 cursor-pointer transition-all hover:bg-accent-dark shrink-0"
                      style="box-shadow:0 2px 8px rgba(220,107,47,.3)">
                <ng-icon name="heroStar" class="w-4 h-4"/>Leave a Review
              </button>
            </div>

            <div *ngIf="isReviewed(b)"
                 class="border-t border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-2">
              <ng-icon name="heroCheckCircle" class="w-4 h-4 text-emerald-500 shrink-0"/>
              <span class="text-sm font-semibold text-emerald-700">Review Submitted — Thank you!</span>
            </div>
          </a>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = true;
  activeFilter = 'all';
  user = this.authService.currentUser;
  filters = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' }, { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ];
  constructor(private bookingService: BookingService, private authService: AuthService, private router: Router) {}
  ngOnInit() {
    this.bookingService.getMyBookings().subscribe({
      next: r => { this.bookings = r.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
  get filteredBookings() { return this.activeFilter === 'all' ? this.bookings : this.bookings.filter(b => b.status === this.activeFilter); }
  get pendingCount()   { return this.bookings.filter(b => b.status === 'pending').length; }
  get confirmedCount() { return this.bookings.filter(b => b.status === 'confirmed').length; }
  get completedCount() { return this.bookings.filter(b => b.status === 'completed').length; }
  getCount(k: string) { return this.bookings.filter(b => b.status === k).length; }

  canReview(b: Booking): boolean {
    return b.status === 'completed' && b.reviewStatus !== 'submitted';
  }

  isReviewed(b: Booking): boolean {
    return b.status === 'completed' && b.reviewStatus === 'submitted';
  }

  getPackageId(b: Booking): string {
    if (!b.package) return '';
    return typeof b.package === 'string' ? b.package : b.package._id;
  }

  goToReview(b: Booking): void {
    this.router.navigate(['/dashboard/review', b._id], { queryParams: { packageId: this.getPackageId(b) } });
  }

  getEventIcon(t: string) { return ({wedding:'💍',birthday:'🎂',corporate:'🏢',club:'🎉',festival:'🎪',private:'✨'} as any)[t] || '🎧'; }
  get firstName() { return this.user?.name?.split(' ')[0] || 'there'; }
  logout() { this.authService.logout(); }
}
