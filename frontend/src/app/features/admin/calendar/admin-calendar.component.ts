import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroChevronLeft, heroChevronRight, heroCalendarDays,
  heroXMark, heroNoSymbol
} from '@ng-icons/heroicons/outline';
import { CalendarService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  viewProviders: [provideIcons({ heroChevronLeft, heroChevronRight, heroCalendarDays, heroXMark, heroNoSymbol })],
  template: `
    <div class="p-8">
      <div class="mb-7">
        <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">Availability Calendar</h1>
        <p class="text-stone-400 text-sm">Click any future date to block or unblock it from client bookings</p>
      </div>

      <div class="grid grid-cols-[1fr_320px] gap-6 items-start">

        <!-- Calendar card -->
        <div class="card p-6">
          <!-- Nav -->
          <div class="flex items-center justify-between mb-5">
            <button (click)="prevMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 hover:border-accent hover:text-accent transition-all bg-white">
              <ng-icon name="heroChevronLeft" class="w-4 h-4"/>
            </button>
            <span class="font-display text-lg font-bold text-stone-800">{{ monthLabel }}</span>
            <button (click)="nextMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 hover:border-accent hover:text-accent transition-all bg-white">
              <ng-icon name="heroChevronRight" class="w-4 h-4"/>
            </button>
          </div>

          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-2">
            <div *ngFor="let d of dayNames" class="text-center text-[11px] font-bold uppercase tracking-wide text-stone-400 py-2">{{ d }}</div>
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-1">
            <div *ngFor="let cell of calCells"
                 class="aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative"
                 [class.cursor-default]="!cell.date || cell.isPast"
                 [class.cursor-pointer]="cell.date && !cell.isPast"
                 [class.opacity-0]="!cell.date"
                 [class.bg-stone-50]="cell.date && !cell.isPast && !cell.isToday && !cell.isBlocked && !cell.isBooked"
                 [class.text-stone-400]="cell.isPast"
                 [class.bg-stone-50]="cell.isPast"
                 [class.bg-navy]="cell.isToday && !cell.isBlocked"
                 [class.text-white]="cell.isToday && !cell.isBlocked"
                 [class.bg-red-100]="cell.isBlocked"
                 [class.text-red-600]="cell.isBlocked"
                 [class.border]="cell.isBlocked"
                 [class.border-red-200]="cell.isBlocked"
                 [class.bg-emerald-50]="cell.isBooked"
                 [class.text-emerald-700]="cell.isBooked"
                 [class.hover:bg-orange-50]="cell.date && !cell.isPast && !cell.isBlocked && !cell.isBooked"
                 [class.hover:text-accent]="cell.date && !cell.isPast && !cell.isBlocked && !cell.isBooked"
                 (click)="onCellClick(cell)">
              <span *ngIf="cell.date">{{ cell.date | date:'d' }}</span>
              <div *ngIf="cell.isBlocked" class="absolute bottom-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <div *ngIf="cell.isBooked"  class="absolute bottom-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap gap-4 mt-5 pt-4 border-t border-stone-100">
            <div class="flex items-center gap-2 text-xs text-stone-500"><div class="w-3 h-3 rounded-sm bg-stone-100 border border-stone-200"></div>Available</div>
            <div class="flex items-center gap-2 text-xs text-stone-500"><div class="w-3 h-3 rounded-sm bg-red-100 border border-red-200"></div>Blocked</div>
            <div class="flex items-center gap-2 text-xs text-stone-500"><div class="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200"></div>Booked</div>
            <div class="flex items-center gap-2 text-xs text-stone-500"><div class="w-3 h-3 rounded-sm bg-navy"></div>Today</div>
            <div class="flex items-center gap-2 text-xs text-stone-400"><div class="w-3 h-3 rounded-sm bg-stone-50"></div>Past</div>
          </div>
        </div>

        <!-- Side panel -->
        <div class="flex flex-col gap-4">

          <!-- Block form -->
          <div class="card p-5">
            <h3 class="font-display text-base font-bold text-stone-800 mb-1">Block a Date</h3>
            <p class="text-xs text-stone-400 mb-4">Select a date on the calendar, add an optional reason, then confirm.</p>

            <div *ngIf="pendingDate" class="flex items-center justify-between gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 mb-4">
              <div class="flex items-center gap-2 text-sm font-semibold text-accent">
                <ng-icon name="heroCalendarDays" class="w-4 h-4"/>
                {{ pendingDate | date:'EEE, MMM d, y' }}
              </div>
              <button (click)="pendingDate=null" class="text-stone-400 hover:text-red-500 transition-colors border-0 bg-transparent">
                <ng-icon name="heroXMark" class="w-4 h-4"/>
              </button>
            </div>
            <div *ngIf="!pendingDate" class="text-sm text-stone-400 bg-stone-50 rounded-xl px-4 py-3 mb-4 text-center">
              ← Click a date on the calendar
            </div>

            <div *ngIf="pendingDate" class="mb-4">
              <label class="form-label">Reason (optional)</label>
              <input type="text" [(ngModel)]="blockReason" class="form-input" placeholder="e.g. Personal event…"/>
            </div>

            <button [disabled]="!pendingDate || isBlocking" (click)="blockSelected()"
                    class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all border-0"
                    [class.bg-accent]="pendingDate && !isBlocking"
                    [class.text-white]="pendingDate && !isBlocking"
                    [class.hover:bg-accent-dark]="pendingDate && !isBlocking"
                    [class.bg-stone-100]="!pendingDate || isBlocking"
                    [class.text-stone-400]="!pendingDate || isBlocking"
                    [class.cursor-not-allowed]="!pendingDate || isBlocking">
              <ng-icon name="heroNoSymbol" class="w-4 h-4"/>
              {{ isBlocking ? 'Blocking…' : 'Block This Date' }}
            </button>
          </div>

          <!-- Blocked list -->
          <div class="card p-5">
            <h3 class="font-display text-base font-bold text-stone-800 mb-4">Currently Blocked</h3>
            <div *ngIf="isLoading" class="flex items-center gap-2 text-stone-400 text-sm py-4 justify-center">
              <div class="w-4 h-4 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>Loading…
            </div>
            <div *ngIf="!isLoading && blockedDates.length===0" class="text-center text-stone-400 text-sm py-4">No blocked dates.</div>
            <div *ngIf="!isLoading" class="flex flex-col gap-2 max-h-72 overflow-y-auto">
              <div *ngFor="let d of blockedDates" class="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <div>
                  <div class="text-sm font-semibold text-stone-700">{{ d.date | date:'EEE, MMM d, y' }}</div>
                  <div *ngIf="d.reason" class="text-xs text-stone-400 mt-0.5">{{ d.reason }}</div>
                </div>
                <button (click)="unblock(d)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-600 hover:text-white text-red-400 transition-all border-0 bg-transparent shrink-0">
                  <ng-icon name="heroXMark" class="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminCalendarComponent implements OnInit {
  currentDate = new Date();
  blockedDates: any[] = [];
  pendingDate: Date | null = null;
  blockReason = '';
  isBlocking = false;
  isLoading = true;
  dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.calendarService.getBlockedDates().subscribe({
      next: r => { this.blockedDates = r.data || []; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get monthLabel() { return this.currentDate.toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
  prevMonth() { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth()-1, 1); }
  nextMonth() { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth()+1, 1); }

  private toLocalDateStr(d: Date) {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  private sameDay(stored: string, local: Date) {
    const s = new Date(stored);
    return s.getUTCFullYear()===local.getFullYear() && s.getUTCMonth()===local.getMonth() && s.getUTCDate()===local.getDate();
  }

  get calCells(): any[] {
    const y = this.currentDate.getFullYear(), mo = this.currentDate.getMonth();
    const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const cells: any[] = [];
    for (let i=0;i<first;i++) cells.push({date:null});
    for (let d=1;d<=days;d++) {
      const dt = new Date(y,mo,d);
      cells.push({ date:dt, isToday:dt.toDateString()===today.toDateString(), isPast:dt<today, isBlocked:this.blockedDates.some(b=>this.sameDay(b.date,dt)), isBooked:false });
    }
    return cells;
  }

  onCellClick(cell: any) {
    if (!cell.date || cell.isPast) return;
    if (cell.isBlocked) { const e = this.blockedDates.find(b=>this.sameDay(b.date,cell.date)); if (e) this.unblock(e); }
    else { this.pendingDate = cell.date; this.blockReason = ''; }
  }

  blockSelected() {
    if (!this.pendingDate) return;
    this.isBlocking = true;
    this.calendarService.blockDate(this.toLocalDateStr(this.pendingDate), this.blockReason).subscribe({
      next: r => { if (r?.data) this.blockedDates.push(r.data); this.pendingDate=null; this.blockReason=''; this.isBlocking=false; },
      error: () => { this.isBlocking=false; }
    });
  }

  unblock(d: any) {
    this.calendarService.unblockDate(d._id).subscribe({ next: () => { this.blockedDates = this.blockedDates.filter(x=>x._id!==d._id); } });
  }
}
