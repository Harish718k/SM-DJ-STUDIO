import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroMapPin, heroUsers, heroClock,
  heroArchiveBox, heroCurrencyDollar, heroChatBubbleBottomCenter, heroCheckCircle,
  heroStar,
} from '@ng-icons/heroicons/outline';
import { BookingService } from '../../../core/services/api.service';
import { Booking } from '../../../shared/models';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ heroArrowLeft, heroMapPin, heroUsers, heroClock, heroArchiveBox, heroCurrencyDollar, heroChatBubbleBottomCenter, heroCheckCircle, heroStar })],
  template: `
    <div class="min-h-screen bg-cream">
      <!-- Top bar -->
      <div class="bg-white border-b border-stone-200 px-8 py-4">
        <a routerLink="/dashboard" class="flex items-center gap-2 text-stone-400 hover:text-accent text-sm font-medium no-underline transition-colors">
          <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back to Dashboard
        </a>
      </div>
      <!-- <a *ngIf="booking?.status==='completed' && !hasReview"
          [routerLink]="['/dashboard/review', booking._id]"
          class="btn-primary">
        ⭐ Leave a Review
          </a>
      <span *ngIf="booking?.status==='completed' && hasReview"
            class="text-sm text-emerald-600 font-semibold">
        ✓ Review submitted
      </span> -->

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex items-center justify-center gap-3 py-24 text-stone-400">
        <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>Loading…
      </div>
      <div *ngIf="!isLoading && !booking" class="px-8 py-16 text-stone-400 text-center">Booking not found.</div>

      <div *ngIf="!isLoading && booking" class="max-w-4xl mx-auto px-8 py-10">
        <!-- Hero -->
        <div class="flex items-start justify-between mb-8 pb-8 border-b border-stone-200">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest text-accent mb-2">{{ booking.eventType | titlecase }} Event</div>
            <h1 class="font-display text-3xl font-bold text-stone-900 mb-2">{{ booking.venue.name }}, {{ booking.venue.city }}</h1>
            <p class="text-stone-400 text-sm">{{ booking.eventDate | date:'EEEE, MMMM d, y' }} · {{ booking.startTime }} – {{ booking.endTime }}</p>
          </div>
          <span [class]="'badge-'+booking.status" class="text-sm px-4 py-1.5 shrink-0">{{ booking.status | titlecase }}</span>
        </div>

        <!-- Cards grid -->
        <div class="grid grid-cols-2 gap-5">

          <!-- Event details -->
          <div class="card p-6">
            <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Event Details</h3>
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="flex items-center gap-2 text-stone-400"><ng-icon name="heroMapPin" class="w-4 h-4"/>Venue</span>
                <strong class="text-stone-800 text-right">{{ booking.venue.name }}</strong>
              </div>
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="text-stone-400">Address</span>
                <strong class="text-stone-800 text-right max-w-[200px]">{{ booking.venue.address }}, {{ booking.venue.city }}</strong>
              </div>
              <div *ngIf="booking.guestCount" class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="flex items-center gap-2 text-stone-400"><ng-icon name="heroUsers" class="w-4 h-4"/>Guests</span>
                <strong class="text-stone-800">{{ booking.guestCount }}</strong>
              </div>
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="flex items-center gap-2 text-stone-400"><ng-icon name="heroClock" class="w-4 h-4"/>Time</span>
                <strong class="text-stone-800">{{ booking.startTime }} – {{ booking.endTime }}</strong>
              </div>
            </div>
          </div>

          <!-- Package & pricing -->
          <div class="card p-6">
            <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Package & Pricing</h3>
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="flex items-center gap-2 text-stone-400"><ng-icon name="heroArchiveBox" class="w-4 h-4"/>Package</span>
                <strong class="text-stone-800">{{ booking.package.name }}</strong>
              </div>
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="text-stone-400">Duration</span>
                <strong class="text-stone-800">{{ booking.package.duration }} hours</strong>
              </div>
              <div class="flex justify-between items-start py-2 border-b border-stone-50 text-sm">
                <span class="flex items-center gap-2 text-stone-400"><ng-icon name="heroCurrencyDollar" class="w-4 h-4"/>Total Price</span>
                <strong class="font-display text-xl text-accent">\${{ booking.totalPrice }}</strong>
              </div>
              <div class="flex justify-between items-start py-2 text-sm">
                <span class="text-stone-400">Deposit (30%)</span>
                <strong [class.text-emerald-600]="booking.depositPaid" [class.text-amber-600]="!booking.depositPaid">
                  \${{ booking.depositAmount }} · {{ booking.depositPaid ? 'Paid ✓' : 'Pending' }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Special requests -->
          <div *ngIf="booking.specialRequests" class="card p-6">
            <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Special Requests</h3>
            <p class="text-stone-600 text-sm leading-relaxed">{{ booking.specialRequests }}</p>
          </div>

          <!-- DJ notes -->
          <div *ngIf="booking.adminNotes" class="card p-6 border-l-4 border-emerald-400">
            <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Note from DJ</h3>
            <p class="text-stone-600 text-sm leading-relaxed">{{ booking.adminNotes }}</p>
          </div>

          <!-- Timeline -->
          <div class="card p-6 col-span-2">
            <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-5">Booking Timeline</h3>
            <div class="flex flex-col gap-0">
              <div *ngFor="let step of timeline; let last = last" class="flex gap-4 relative" [class.pb-5]="!last">
                <div class="flex flex-col items-center">
                  <div class="w-4 h-4 rounded-full border-2 transition-colors flex-shrink-0"
                       [class.bg-accent]="step.done" [class.border-accent]="step.done"
                       [class.bg-white]="!step.done" [class.border-stone-300]="!step.done"></div>
                  <div *ngIf="!last" class="w-0.5 flex-1 mt-1" [class.bg-accent]="step.done" [class.bg-stone-200]="!step.done"></div>
                </div>
                <div class="pb-1">
                  <div class="text-sm font-semibold text-stone-800">{{ step.title }}</div>
                  <div class="text-xs mt-0.5" [class.text-stone-400]="!step.pending" [class.text-amber-500]="step.pending">{{ step.sub }}</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Review section -->
        <div *ngIf="canReview(booking!)" class="mt-8">
          <div class="flex items-center justify-between
                      bg-gradient-to-r from-amber-50 to-orange-50
                      border border-amber-200 rounded-2xl p-6 gap-6">
            <div class="min-w-0">
              <div class="font-display text-lg font-bold text-stone-900 mb-1">
                How was your event?
              </div>
              <p class="text-stone-500 text-sm leading-relaxed">
                Your honest feedback helps other clients and helps us improve.
                It takes less than a minute.
              </p>
            </div>
            <button (click)="goToReview(booking!)"
                    class="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent
                           text-white font-bold text-sm border-0 cursor-pointer transition-all
                           hover:bg-accent-dark shrink-0"
                    style="box-shadow:0 4px 14px rgba(220,107,47,.35)">
              <ng-icon name="heroStar" class="w-5 h-5"/>
              Leave a Review
            </button>
          </div>
        </div>

        <div *ngIf="isReviewed(booking!)" class="mt-8">
          <div class="flex items-center gap-4 bg-emerald-50 border border-emerald-200
                      rounded-2xl px-6 py-4">
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <ng-icon name="heroCheckCircle" class="w-6 h-6 text-emerald-500"/>
            </div>
            <div>
              <div class="font-bold text-stone-800 text-sm mb-0.5">Review Submitted</div>
              <div class="text-stone-500 text-xs">
                Thank you! Your review has been published. We really appreciate your feedback.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingDetailComponent implements OnInit {
  booking: Booking | null = null;
  isLoading = true;

  constructor(private route: ActivatedRoute, private bookingService: BookingService, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.bookingService.getBooking(id).subscribe({
      next: r => { this.booking = r.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });

  }

  get timeline() {
    if (!this.booking) return [];
    return [
      { title: 'Booking Submitted', sub: new Date(this.booking.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), done: true, pending: false },
      { title: 'Booking Reviewed', sub: this.booking.status!=='pending' ? 'Confirmed by DJ' : 'Awaiting review (within 24h)', done: this.booking.status!=='pending', pending: this.booking.status==='pending' },
      { title: 'Event Day', sub: new Date(this.booking.eventDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), done: this.booking.status==='completed', pending: false }
    ];
  }

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
}
