/**
 * review-list.component.ts
 * Place at: src/app/shared/components/review-list/review-list.component.ts
 *
 * Reusable component — drop it anywhere:
 *   <app-review-list/>                        — all reviews
 *   <app-review-list [packageId]="pkg._id"/>  — filtered to one package
 *   <app-review-list [showFilters]="false"/>  — no filter UI (e.g. home page)
 *   <app-review-list [limit]="3"/>            — preview strip
 */

import {
  Component, Input, OnInit, OnChanges, SimpleChanges,
  Injectable,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCheckBadge, heroChevronLeft, heroChevronRight, heroFunnel,
} from '@ng-icons/heroicons/outline';
import { ReviewService, ReviewQueryParams } from 'src/app/core/services/review.service';
import { Review } from '../../models';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroCheckBadge, heroChevronLeft, heroChevronRight, heroFunnel,
  })],
  template: `
    <div>

      <!-- ── Filter bar ───────────────────────────────────────────────────── -->
      <div *ngIf="showFilters" class="flex flex-wrap items-center gap-3 mb-8">
        <ng-icon name="heroFunnel" class="w-4 h-4 text-stone-400 shrink-0"/>

        <!-- Event type filter -->
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let f of eventFilters"
                  (click)="setEventTypeFilter(f.value)"
                  class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  [class.bg-accent]="activeEventType===f.value"
                  [class.text-white]="activeEventType===f.value"
                  [class.border-accent]="activeEventType===f.value"
                  [class.bg-white]="activeEventType!==f.value"
                  [class.text-stone-600]="activeEventType!==f.value"
                  [class.border-stone-200]="activeEventType!==f.value">
            {{ f.label }}
          </button>
        </div>

        <!-- Star filter -->
        <div class="flex gap-1.5 ml-auto">
          <button *ngFor="let s of [5,4,3,2,1]"
                  (click)="setRatingFilter(s)"
                  class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1"
                  [class.bg-amber-400]="activeRating===s"
                  [class.text-white]="activeRating===s"
                  [class.border-amber-400]="activeRating===s"
                  [class.bg-white]="activeRating!==s"
                  [class.text-stone-600]="activeRating!==s"
                  [class.border-stone-200]="activeRating!==s">
            {{ s }}★
          </button>
          <button *ngIf="activeRating || activeEventType"
                  (click)="clearFilters()"
                  class="px-3 py-1.5 rounded-full text-xs font-semibold border border-stone-200 bg-white text-stone-400 hover:text-red-500 transition-colors">
            ✕ Clear
          </button>
        </div>
      </div>

      <!-- ── Loading ───────────────────────────────────────────────────────── -->
      <div *ngIf="isLoading" class="grid md:grid-cols-3 gap-5">
        <div *ngFor="let s of [1,2,3]"
             class="card p-6 animate-pulse">
          <div class="flex gap-1 mb-4">
            <div *ngFor="let x of [1,2,3,4,5]" class="w-4 h-4 bg-stone-200 rounded"></div>
          </div>
          <div class="h-3 bg-stone-200 rounded mb-2 w-full"></div>
          <div class="h-3 bg-stone-200 rounded mb-2 w-4/5"></div>
          <div class="h-3 bg-stone-200 rounded w-3/5"></div>
          <div class="flex items-center gap-3 mt-5 pt-4 border-t border-stone-100">
            <div class="w-9 h-9 bg-stone-200 rounded-xl"></div>
            <div class="space-y-1.5">
              <div class="h-2.5 bg-stone-200 rounded w-20"></div>
              <div class="h-2 bg-stone-200 rounded w-28"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty ─────────────────────────────────────────────────────────── -->
      <div *ngIf="!isLoading && reviews.length===0"
           class="text-center py-16">
        <div class="text-5xl mb-4">⭐</div>
        <p class="text-stone-400 text-sm">
          {{ activeEventType || activeRating ? 'No reviews match those filters.' : 'No reviews yet.' }}
        </p>
        <button *ngIf="activeEventType || activeRating"
                (click)="clearFilters()"
                class="mt-4 text-accent text-sm font-semibold border-0 bg-transparent underline cursor-pointer">
          Clear filters
        </button>
      </div>

      <!-- ── Reviews grid ──────────────────────────────────────────────────── -->
      <div *ngIf="!isLoading && reviews.length>0"
           class="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
        <div *ngFor="let r of reviews"
             class="card p-6 break-inside-avoid hover:shadow-md transition-shadow">

          <!-- Stars -->
          <div class="flex items-center gap-0.5 mb-3">
            <svg *ngFor="let s of starsArray(r.rating)"
                 viewBox="0 0 24 24" fill="currentColor"
                 class="w-4 h-4 text-amber-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <svg *ngFor="let s of emptyStarsArray(r.rating)"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 class="w-4 h-4 text-stone-300">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>

          <!-- Comment -->
          <p class="text-stone-600 text-sm leading-relaxed italic mb-4">
            "{{ r.comment }}"
          </p>

          <!-- Event type tag -->
          <div *ngIf="r.eventType" class="flex items-center gap-1.5 mb-4">
            <span class="text-sm">{{ getEventIcon(r.eventType) }}</span>
            <span class="text-xs font-semibold text-stone-500">
              {{ r.eventType | titlecase }}
              <span *ngIf="r.eventDate"> · {{ r.eventDate | date:'MMM y' }}</span>
            </span>
          </div>

          <!-- Author -->
          <div class="flex items-center gap-3 pt-4 border-t border-stone-100">
            <!-- Avatar -->
            <div class="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <img *ngIf="r.client?.profilePicture"
                   [src]="r.client.profilePicture!" alt=""
                   class="w-full h-full object-cover"/>
              <div *ngIf="!r.client?.profilePicture"
                   class="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                   [style.background]="avatarColor(r.client?.name || '')">
                {{ (r.client?.name || 'U')[0].toUpperCase() }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-stone-800 text-sm truncate">
                {{ r.client?.name }}
              </div>
              <div class="text-stone-400 text-xs mt-0.5">
                {{ r.createdAt | date:'MMMM d, y' }}
              </div>
            </div>
            <!-- Verified badge -->
            <ng-icon name="heroCheckBadge" class="w-4 h-4 text-emerald-500 shrink-0"
                     title="Verified booking"/>
          </div>
        </div>
      </div>

      <!-- ── Pagination ────────────────────────────────────────────────────── -->
      <div *ngIf="!isLoading && totalPages > 1"
           class="flex items-center justify-center gap-3 mt-10">
        <button (click)="goToPage(currentPage-1)" [disabled]="currentPage===1"
                class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:border-accent hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ng-icon name="heroChevronLeft" class="w-4 h-4"/>
        </button>

        <div class="flex gap-2">
          <button *ngFor="let p of pageNumbers"
                  (click)="goToPage(p)"
                  class="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-semibold transition-all"
                  [class.bg-accent]="p===currentPage" [class.text-white]="p===currentPage"
                  [class.border-accent]="p===currentPage"
                  [class.bg-white]="p!==currentPage" [class.text-stone-600]="p!==currentPage"
                  [class.border-stone-200]="p!==currentPage"
                  [class.hover:border-accent]="p!==currentPage">
            {{ p }}
          </button>
        </div>

        <button (click)="goToPage(currentPage+1)" [disabled]="currentPage===totalPages"
                class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:border-accent hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ng-icon name="heroChevronRight" class="w-4 h-4"/>
        </button>

        <span class="text-xs text-stone-400 ml-2">
          Page {{ currentPage }} of {{ totalPages }}
          ({{ totalReviews }} review{{ totalReviews !== 1 ? 's' : '' }})
        </span>
      </div>

    </div>
  `
})

export class ReviewListComponent implements OnInit, OnChanges {

  @Input() packageId?:   string;
  @Input() showFilters   = true;
  @Input() limit         = 12;

  reviews:     Review[] = [];
  isLoading    = true;
  totalReviews = 0;
  totalPages   = 1;
  currentPage  = 1;

  activeEventType = '';
  activeRating    = 0;

  eventFilters = [
    { value: '',          label: 'All Events'      },
    { value: 'wedding',   label: '💍 Weddings'      },
    { value: 'birthday',  label: '🎂 Birthdays'     },
    { value: 'corporate', label: '🏢 Corporate'     },
    { value: 'club',      label: '🎉 Club Nights'   },
    { value: 'festival',  label: '🎪 Festivals'     },
    { value: 'other',     label: '✨ Private'       },
  ];

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void  { this.loadReviews(); }
  ngOnChanges(_: SimpleChanges): void { this.loadReviews(); }

  loadReviews(): void {
    this.isLoading = true;

    const params: ReviewQueryParams = {
      page:  this.currentPage,
      limit: this.limit,
      sort:  'newest',
    };
    if (this.packageId)   params.packageId = this.packageId;
    if (this.activeEventType) params.eventType = this.activeEventType;
    if (this.activeRating)    params.rating    = this.activeRating;

    this.reviewService.getReviews(params).subscribe({
      next: res => {
        this.reviews     = res.data;
        this.totalReviews = res.total;
        this.totalPages  = res.pages;
        this.isLoading   = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  setEventTypeFilter(type: string): void {
    this.activeEventType = type;
    this.currentPage     = 1;
    this.loadReviews();
  }

  setRatingFilter(rating: number): void {
    this.activeRating = this.activeRating === rating ? 0 : rating;
    this.currentPage  = 1;
    this.loadReviews();
  }

  clearFilters(): void {
    this.activeEventType = '';
    this.activeRating    = 0;
    this.currentPage     = 1;
    this.loadReviews();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadReviews();
  }

  get pageNumbers(): number[] {
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, this.currentPage - delta);
         i <= Math.min(this.totalPages, this.currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  starsArray(n: number):      number[] { return Array(Math.max(0, n)).fill(0); }
  emptyStarsArray(n: number): number[] { return Array(Math.max(0, 5 - n)).fill(0); }

  getEventIcon(type: string): string {
    const map: Record<string, string> = {
      wedding: '💍', birthday: '🎂', corporate: '🏢',
      club: '🎉', festival: '🎪', other: '✨',
    };
    return map[type] ?? '🎧';
  }

  /** Deterministic avatar colour from name — same user always gets same colour */
  avatarColor(name: string): string {
    const palette = [
      '#dc6b2f','#7c3aed','#059669','#2563eb',
      '#db2777','#d97706','#0891b2','#65a30d',
    ];
    let hash = 0;
    for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }
}
