import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCurrencyDollar, heroClipboardDocumentList, heroClock,
  heroChartBar, heroArrowRight
} from '@ng-icons/heroicons/outline';
import { AnalyticsService, BookingService } from '../../../core/services/api.service';
import { AnalyticsSummary, MonthlyData, EventTypeData, Booking } from '../../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ heroCurrencyDollar, heroClipboardDocumentList, heroClock, heroChartBar, heroArrowRight })],
  template: `
    <div class="p-8">
      <div class="mb-7">
        <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">Dashboard</h1>
        <p class="text-stone-400 text-sm">Overview of your booking business</p>
      </div>

      <!-- KPI -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card p-5 flex items-center gap-4">
          <div class="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <ng-icon name="heroCurrencyDollar" class="w-5 h-5 text-amber-500"/>
          </div>
          <div>
            <div class="font-display text-2xl font-bold text-stone-900">\${{ summary?.totalRevenue | number:'1.0-0' }}</div>
            <div class="text-xs text-stone-400">Total Revenue</div>
          </div>
        </div>
        <div class="card p-5 flex items-center gap-4">
          <div class="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <ng-icon name="heroClipboardDocumentList" class="w-5 h-5 text-blue-500"/>
          </div>
          <div>
            <div class="font-display text-2xl font-bold text-stone-900">{{ summary?.totalBookings }}</div>
            <div class="text-xs text-stone-400">Total Bookings</div>
          </div>
        </div>
        <div class="card p-5 flex items-center gap-4">
          <div class="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <ng-icon name="heroClock" class="w-5 h-5 text-accent"/>
          </div>
          <div>
            <div class="font-display text-2xl font-bold text-stone-900">{{ summary?.pendingCount }}</div>
            <div class="text-xs text-stone-400">Pending Review</div>
          </div>
        </div>
        <div class="card p-5 flex items-center gap-4">
          <div class="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <ng-icon name="heroChartBar" class="w-5 h-5 text-emerald-500"/>
          </div>
          <div>
            <div class="font-display text-2xl font-bold text-stone-900">\${{ summary?.monthlyRevenue | number:'1.0-0' }}</div>
            <div class="text-xs text-stone-400">This Month</div>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-3 gap-5 mb-6">
        <!-- Bar chart -->
        <div class="card p-6 col-span-2">
          <h3 class="font-display text-base font-bold text-stone-800 mb-5">Monthly Revenue</h3>
          <div *ngIf="monthly.length===0" class="text-center text-stone-400 text-sm py-8">No data yet.</div>
          <div *ngIf="monthly.length>0" class="flex items-end gap-2 h-36">
            <div *ngFor="let m of monthly" class="flex flex-col items-center flex-1 h-full">
              <div class="flex-1 w-full flex items-end">
                <div class="w-full bg-accent rounded-t-md min-h-[4px] transition-all hover:opacity-75"
                     [style.height.%]="getBarHeight(m.revenue)" [title]="'$'+m.revenue"></div>
              </div>
              <div class="text-[9px] text-stone-400 mt-1.5">{{ m.monthName | slice:0:3 }}</div>
            </div>
          </div>
        </div>
        <!-- Event types -->
        <div class="card p-6">
          <h3 class="font-display text-base font-bold text-stone-800 mb-5">Event Types</h3>
          <div *ngIf="eventTypes.length===0" class="text-center text-stone-400 text-sm py-8">No data yet.</div>
          <div class="flex flex-col gap-4">
            <div *ngFor="let et of eventTypes">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="font-medium text-stone-600">{{ et.eventType | titlecase }}</span>
                <span class="text-stone-400">{{ et.count }}</span>
              </div>
              <div class="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div class="h-full bg-accent rounded-full transition-all" [style.width.%]="getTypePercent(et.count)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 class="font-display text-base font-bold text-stone-800">Upcoming Confirmed Events</h3>
          <a routerLink="/admin/bookings" class="flex items-center gap-1 text-accent text-sm font-semibold no-underline">
            View All <ng-icon name="heroArrowRight" class="w-4 h-4"/>
          </a>
        </div>
        <div *ngIf="loadingUpcoming" class="flex items-center gap-3 px-6 py-6 text-stone-400 text-sm">
          <div class="w-4 h-4 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div> Loading…
        </div>
        <div *ngIf="!loadingUpcoming && upcoming.length===0" class="px-6 py-8 text-center text-stone-400 text-sm">No upcoming events.</div>
        <table *ngIf="!loadingUpcoming && upcoming.length>0" class="w-full border-collapse">
          <thead>
            <tr class="bg-stone-50">
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-6 py-3">Event</th>
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 py-3">Client</th>
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 py-3">Date</th>
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 py-3">Package</th>
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 py-3">Value</th>
              <th class="text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of upcoming" class="border-t border-stone-100 hover:bg-stone-50 transition-colors">
              <td class="px-6 py-3 font-semibold text-stone-800 text-sm">{{ b.eventType | titlecase }}</td>
              <td class="px-4 py-3 text-stone-500 text-sm">{{ b.client?.name }}</td>
              <td class="px-4 py-3 text-stone-500 text-sm">{{ b.eventDate | date:'MMM d, y' }}</td>
              <td class="px-4 py-3 text-stone-500 text-sm">{{ b.package?.name }}</td>
              <td class="px-4 py-3 font-display font-bold text-accent text-sm">\${{ b.totalPrice }}</td>
              <td class="px-4 py-3"><span [class]="'badge-'+b.status">{{ b.status | titlecase }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  summary: AnalyticsSummary | null = null;
  monthly: MonthlyData[] = [];
  eventTypes: EventTypeData[] = [];
  upcoming: Booking[] = [];
  loadingUpcoming = true;
  constructor(private analyticsService: AnalyticsService, private bookingService: BookingService) {}
  ngOnInit() {
    this.analyticsService.getSummary().subscribe({ next: r => this.summary = r.data });
    this.analyticsService.getMonthly(new Date().getFullYear()).subscribe({ next: r => this.monthly = r.data });
    this.analyticsService.getEventTypes().subscribe({ next: r => this.eventTypes = r.data });
    this.analyticsService.getUpcoming().subscribe({ next: r => { this.upcoming = r.data; this.loadingUpcoming = false; }, error: () => { this.loadingUpcoming = false; } });
  }
  getBarHeight(v: number) { const max = Math.max(...this.monthly.map(m => m.revenue), 1); return Math.round((v/max)*100); }
  getTypePercent(c: number) { const max = Math.max(...this.eventTypes.map(e => e.count), 1); return Math.round((c/max)*100); }
}
