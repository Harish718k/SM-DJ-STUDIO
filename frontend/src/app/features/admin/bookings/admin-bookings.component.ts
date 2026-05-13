import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCheckCircle, heroXCircle, heroTrophy, heroXMark,
  heroCalendarDays, heroClock, heroUser, heroArchiveBox
} from '@ng-icons/heroicons/outline';
import { BookingService } from '../../../core/services/api.service';
import { Booking } from '../../../shared/models';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  viewProviders: [provideIcons({ heroCheckCircle, heroXCircle, heroTrophy, heroXMark, heroCalendarDays, heroClock, heroUser, heroArchiveBox })],
  template: `
    <div class="p-8">
      <div class="flex items-start justify-between mb-7">
        <div>
          <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">Bookings</h1>
          <p class="text-stone-400 text-sm">Review and manage all client bookings</p>
        </div>
        <div class="flex gap-6">
          <div class="text-center"><div class="font-display text-2xl font-bold text-stone-900">{{ pendingCount }}</div><div class="text-xs text-stone-400">Pending</div></div>
          <div class="text-center"><div class="font-display text-2xl font-bold text-stone-900">{{ confirmedCount }}</div><div class="text-xs text-stone-400">Confirmed</div></div>
          <div class="text-center"><div class="font-display text-2xl font-bold text-stone-900">{{ bookings.length }}</div><div class="text-xs text-stone-400">Total</div></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button *ngFor="let f of filters" (click)="activeFilter=f.key"
                class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all"
                [class.bg-accent]="activeFilter===f.key" [class.text-white]="activeFilter===f.key" [class.border-accent]="activeFilter===f.key"
                [class.bg-white]="activeFilter!==f.key" [class.text-stone-500]="activeFilter!==f.key" [class.border-stone-200]="activeFilter!==f.key">
          {{ f.label }}
          <div *ngIf="f.key !== 'all' && getCount(f.key) > 0">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" [ngClass]="{'bg-white/25': activeFilter===f.key, 'bg-stone-100': activeFilter!==f.key}">{{ getCount(f.key) }}</span>
          </div>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-20 text-stone-400 gap-3">
        <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
        <span>Loading…</span>
      </div>
      <div *ngIf="!isLoading && filteredBookings.length===0" class="text-center py-20 text-stone-400">
        <div class="text-4xl mb-3">📭</div><p>No bookings in this category.</p>
      </div>

      <!-- Cards -->
      <div *ngIf="!isLoading" class="flex flex-col gap-4">
        <div *ngFor="let b of filteredBookings" class="card p-5 hover:shadow-md transition-shadow">
          <!-- Top row -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center text-2xl shrink-0">{{ getEventIcon(b.eventType) }}</div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-stone-900 text-base">{{ b.eventType | titlecase }}</span>
                  <span [class]="'badge-'+b.status">{{ b.status | titlecase }}</span>
                </div>
                <div class="text-sm text-stone-400">{{ b.venue?.name }}, {{ b.venue?.city }}</div>
              </div>
            </div>
            <div class="font-display text-2xl font-bold text-accent">INR {{ b.totalPrice }}</div>
          </div>

          <!-- Meta -->
          <div class="flex flex-wrap gap-5 py-3 border-t border-b border-stone-100 mb-4 text-xs text-stone-400">
            <span class="flex items-center gap-1.5"><ng-icon name="heroCalendarDays" class="w-3.5 h-3.5"/>{{ b.eventDate | date:'EEE, MMM d, y' }}</span>
            <span class="flex items-center gap-1.5"><ng-icon name="heroClock" class="w-3.5 h-3.5"/>{{ b.startTime }} – {{ b.endTime }}</span>
            <span class="flex items-center gap-1.5"><ng-icon name="heroUser" class="w-3.5 h-3.5"/><strong class="text-stone-600">{{ b.client?.name }}</strong>&nbsp;·&nbsp;{{ b.client?.email }}</span>
            <span class="flex items-center gap-1.5"><ng-icon name="heroArchiveBox" class="w-3.5 h-3.5"/>{{ b.package?.name }}</span>
          </div>

          <!-- Special request -->
          <div *ngIf="b.specialRequests" class="bg-navy/5 border border-navy/10 rounded-xl px-4 py-3 text-sm text-stone-600 mb-4">
            <span class="font-bold text-navy text-xs uppercase tracking-wide">Special request: </span>{{ b.specialRequests }}
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-wrap">
            <ng-container *ngIf="b.status==='pending'">
              <button (click)="confirm(b)" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all">
                <ng-icon name="heroCheckCircle" class="w-4 h-4"/>Confirm
              </button>
              <button (click)="openDecline(b)" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-all">
                <ng-icon name="heroXCircle" class="w-4 h-4"/>Decline
              </button>
            </ng-container>
            <button *ngIf="b.status==='confirmed'" (click)="complete(b)" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all">
              <ng-icon name="heroTrophy" class="w-4 h-4"/>Mark Complete
            </button>
            <span *ngIf="b.status==='completed'" class="text-sm font-semibold text-emerald-600">✓ Completed</span>
            <span *ngIf="b.status==='cancelled'" class="text-sm font-semibold text-red-500">✕ Cancelled</span>
            <span class="ml-auto text-xs font-bold px-3 py-1.5 rounded-xl"
                  [class.bg-emerald-50]="b.depositPaid" [class.text-emerald-700]="b.depositPaid"
                  [class.bg-amber-50]="!b.depositPaid" [class.text-amber-700]="!b.depositPaid">
              Deposit: {{ b.depositPaid ? 'Paid ✓' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Decline modal -->
      <div *ngIf="showDeclineModal" class="fixed inset-0 bg-navy/50 backdrop-blur-sm flex items-center justify-center z-50" (click)="closeDecline()">
        <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-[pop_.18s_ease]" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-display text-xl font-bold text-stone-900">Decline Booking</h3>
            <button (click)="closeDecline()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors border-0 bg-transparent">
              <ng-icon name="heroXMark" class="w-5 h-5 text-stone-400"/>
            </button>
          </div>
          <p class="text-stone-400 text-sm mb-4">Provide a reason — this will be emailed to the client automatically.</p>
          <textarea [(ngModel)]="declineNote" rows="4" class="form-input resize-none" placeholder="e.g. Date no longer available…"></textarea>
          <div class="flex gap-3 justify-end mt-5">
            <button (click)="closeDecline()" class="btn-ghost">Cancel</button>
            <button (click)="confirmDecline()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors border-0">
              <ng-icon name="heroXCircle" class="w-4 h-4"/>Decline Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`@keyframes pop{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`]
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = true;
  activeFilter = 'all';
  showDeclineModal = false;
  declineNote = '';
  selectedBooking: Booking | null = null;
  filters = [
    { key: 'all', label: 'All Bookings' }, { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' }
  ];
  constructor(private bookingService: BookingService) {}
  ngOnInit() {
    this.bookingService.getAllBookings().subscribe({ next: r => { this.bookings = r.data; this.isLoading = false; }, error: () => { this.isLoading = false; } });
  }
  get filteredBookings() { return this.activeFilter === 'all' ? this.bookings : this.bookings.filter(b => b.status === this.activeFilter); }
  get pendingCount() { return this.bookings.filter(b => b.status === 'pending').length; }
  get confirmedCount() { return this.bookings.filter(b => b.status === 'confirmed').length; }
  getCount(k: string) { return this.bookings.filter(b => b.status === k).length; }
  getEventIcon(t: string) { return ({wedding:'💍',birthday:'🎂',corporate:'🏢',club:'🎉',festival:'🎪',private:'✨'} as any)[t] || '🎧'; }
  confirm(b: Booking) { this.bookingService.updateStatus(b._id, 'confirmed').subscribe({ next: r => { const i = this.bookings.findIndex(x => x._id === b._id); if (i > -1) this.bookings[i] = r.data; } }); }
  complete(b: Booking) { this.bookingService.updateStatus(b._id, 'completed').subscribe({ next: r => { const i = this.bookings.findIndex(x => x._id === b._id); if (i > -1) this.bookings[i] = r.data; } }); }
  openDecline(b: Booking) { this.selectedBooking = b; this.declineNote = ''; this.showDeclineModal = true; }
  closeDecline() { this.showDeclineModal = false; this.selectedBooking = null; }
  confirmDecline() {
    if (!this.selectedBooking) return;
    this.bookingService.updateStatus(this.selectedBooking._id, 'cancelled', this.declineNote).subscribe({ next: r => { const i = this.bookings.findIndex(x => x._id === this.selectedBooking!._id); if (i > -1) this.bookings[i] = r.data; this.closeDecline(); } });
  }
}
