import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroSquares2x2, heroClipboardDocumentList, heroCalendarDays,
  heroArchiveBox, heroPlusCircle, heroUser, heroArrowRightOnRectangle
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NgIconComponent],
  viewProviders: [provideIcons({
    heroSquares2x2, heroClipboardDocumentList, heroCalendarDays,
    heroArchiveBox, heroPlusCircle, heroUser, heroArrowRightOnRectangle
  })],
  template: `
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-56 bg-navy flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/[.06]">
          <span class="text-2xl leading-none">🎧</span>
          <div>
            <div class="font-display text-base font-bold text-white leading-tight">DJ BookPro</div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/20 px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
          </div>
        </div>

        <nav class="flex flex-col gap-1 p-3 flex-1">
          <p class="text-[9px] font-bold uppercase tracking-[.2em] text-white/20 px-2 pt-3 pb-1">Overview</p>
          <a class="sidebar-link" routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <ng-icon name="heroSquares2x2" class="w-4 h-4 shrink-0"/>
            Dashboard
          </a>
          <a class="sidebar-link" routerLink="/admin/bookings" routerLinkActive="active">
            <ng-icon name="heroClipboardDocumentList" class="w-4 h-4 shrink-0"/>
            Bookings
          </a>
          <a class="sidebar-link" routerLink="/admin/calendar" routerLinkActive="active">
            <ng-icon name="heroCalendarDays" class="w-4 h-4 shrink-0"/>
            Calendar
          </a>
          <a class="sidebar-link" routerLink="/admin/packages" routerLinkActive="active">
            <ng-icon name="heroArchiveBox" class="w-4 h-4 shrink-0"/>
            Packages
          </a>

          <p class="text-[9px] font-bold uppercase tracking-[.2em] text-white/20 px-2 pt-5 pb-1">Actions</p>
          <a class="sidebar-link border border-dashed border-accent/30 text-accent/80 hover:bg-accent/10 hover:text-accent hover:border-accent/60" routerLink="/admin/new-booking" routerLinkActive="active">
            <ng-icon name="heroPlusCircle" class="w-4 h-4 shrink-0"/>
            New Booking
          </a>
        </nav>

        <div class="border-t border-white/[.06] p-3">
          <a routerLink="/admin/profile" class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors no-underline mb-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              <img *ngIf="authService.currentUser?.profilePicture" [src]="authService.currentUser!.profilePicture!" class="w-full h-full object-cover" alt=""/>
              <span *ngIf="!authService.currentUser?.profilePicture">{{ initial }}</span>
            </div>
            <div class="min-w-0">
              <div class="text-white text-xs font-semibold truncate">{{ authService.currentUser?.name }}</div>
              <div class="text-white/30 text-[10px]">View profile →</div>
            </div>
          </a>
          <button (click)="logout()" class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white/30 text-xs font-medium hover:bg-white/5 hover:text-accent transition-all border-0 bg-transparent">
            <ng-icon name="heroArrowRightOnRectangle" class="w-4 h-4"/>
            Sign Out
          </button>
        </div>
      </aside>

      <main class="flex-1 overflow-y-auto bg-cream">
        <router-outlet/>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  constructor(public authService: AuthService) {}
  get initial() { return (this.authService.currentUser?.name || 'A')[0].toUpperCase(); }
  logout() { this.authService.logout(); }
}
