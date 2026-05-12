import {
  Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroBars3, heroXMark, heroChevronDown,
  heroArrowRightOnRectangle, heroUser,
  heroMusicalNote, heroStar, heroCalendarDays,
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIconComponent],
  viewProviders: [provideIcons({
    heroBars3, heroXMark, heroChevronDown,
    heroArrowRightOnRectangle, heroUser,
    heroMusicalNote, heroStar, heroCalendarDays,
  })],
  template: `
    <header class="fixed top-0 inset-x-0 z-40 transition-all duration-300 bg-white border-b border-stone-300 shadow-sm">

      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <!-- ── Logo ──────────────────────────────────────────────────────── -->
        <a routerLink="/" class="flex items-center gap-2.5 no-underline shrink-0">
          <div class="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-sm">
            <ng-icon name="heroMusicalNote" class="w-4 h-4 text-white"/>
          </div>
          <span class="font-display text-xl font-bold text-stone-900">
            DJ <span class="text-accent">BookPro</span>
          </span>
        </a>

        <!-- ── Desktop nav ────────────────────────────────────────────────── -->
        <nav class="hidden md:flex items-center gap-1">
          <a *ngFor="let link of navLinks"
             [routerLink]="link.path"
             routerLinkActive="nav-link-active"
             [routerLinkActiveOptions]="{exact: link.exact}"
             class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-stone-700 no-underline transition-colors"
             onmouseenter="this.style.color='#dc6b2f';this.style.background='rgba(220,107,47,.07)'"
             onmouseleave="this.style.color='';this.style.background=''">
            <ng-icon [name]="link.icon" class="w-3.5 h-3.5 opacity-50"/>
            {{ link.label }}
          </a>
        </nav>

        <!-- ── Desktop right ──────────────────────────────────────────────── -->
        <div class="hidden md:flex items-center gap-3">

          <!-- Guest -->
          <ng-container *ngIf="!isLoggedIn">
            <a routerLink="/login"
               class="text-sm font-semibold text-stone-700 px-4 py-2 rounded-xl no-underline transition-colors"
               onmouseenter="this.style.color='#dc6b2f';this.style.background='rgba(220,107,47,.07)'"
               onmouseleave="this.style.color='';this.style.background=''">
              Sign In
            </a>
            <a routerLink="/booking"
               class="flex items-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline transition-all"
               style="background:#dc6b2f;box-shadow:0 2px 8px rgba(220,107,47,.3)"
               onmouseenter="this.style.background='#c45a22'"
               onmouseleave="this.style.background='#dc6b2f'">
              <ng-icon name="heroCalendarDays" class="w-3.5 h-3.5"/>
              Book Now
            </a>
          </ng-container>

          <!-- Logged in -->
          <ng-container *ngIf="isLoggedIn">
            <a [routerLink]="isAdmin ? '/admin' : '/dashboard'"
               class="text-sm font-semibold text-stone-700 px-4 py-2 rounded-xl no-underline transition-colors"
               onmouseenter="this.style.color='#dc6b2f';this.style.background='rgba(220,107,47,.07)'"
               onmouseleave="this.style.color='';this.style.background=''">
              {{ isAdmin ? 'Admin Panel' : 'My Bookings' }}
            </a>

            <!-- Avatar dropdown -->
            <div class="relative"
                 (mouseenter)="isDropdownOpen=true"
                 (mouseleave)="isDropdownOpen=false">
              <button class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white transition-all"
                      (click)="isDropdownOpen=!isDropdownOpen">
                <div class="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                  <img *ngIf="user?.profilePicture" [src]="user!.profilePicture!"
                       alt="" class="w-full h-full object-cover"/>
                  <div *ngIf="!user?.profilePicture"
                       class="w-full h-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                    {{ userInitial }}
                  </div>
                </div>
                <span class="text-sm font-semibold text-stone-800 max-w-20 truncate">
                  {{ firstName }}
                </span>
                <ng-icon name="heroChevronDown"
                         class="w-3.5 h-3.5 text-stone-500 transition-transform"
                         [class.rotate-180]="isDropdownOpen"/>
              </button>

              <!-- Dropdown -->
              <div *ngIf="isDropdownOpen"
                   class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
                   style="animation:fadeDown .15s ease">
                <div class="px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <div class="text-sm font-bold text-stone-900 truncate">{{ user?.name }}</div>
                  <div class="text-xs text-stone-500 truncate">{{ user?.email }}</div>
                </div>
                <div class="py-1.5">
                  <a [routerLink]="isAdmin ? '/admin/profile' : '/dashboard/profile'"
                     (click)="isDropdownOpen=false"
                     class="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 no-underline"
                     onmouseenter="this.style.background='rgba(220,107,47,.06)';this.style.color='#dc6b2f'"
                     onmouseleave="this.style.background='';this.style.color=''">
                    <ng-icon name="heroUser" class="w-4 h-4"/>Profile
                  </a>
                  <a [routerLink]="isAdmin ? '/admin' : '/dashboard'"
                     (click)="isDropdownOpen=false"
                     class="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 no-underline"
                     onmouseenter="this.style.background='rgba(220,107,47,.06)';this.style.color='#dc6b2f'"
                     onmouseleave="this.style.background='';this.style.color=''">
                    <ng-icon name="heroCalendarDays" class="w-4 h-4"/>
                    {{ isAdmin ? 'Admin Panel' : 'My Bookings' }}
                  </a>
                </div>
                <div class="border-t border-stone-100 py-1.5">
                  <button (click)="logout()"
                          class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 bg-transparent border-0 text-left"
                          onmouseenter="this.style.background='#fef2f2'"
                          onmouseleave="this.style.background=''">
                    <ng-icon name="heroArrowRightOnRectangle" class="w-4 h-4"/>Sign Out
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- ── Mobile hamburger ───────────────────────────────────────────── -->
        <button class="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 border-0 transition-all"
                (click)="isMobileMenuOpen=!isMobileMenuOpen">
          <ng-icon [name]="isMobileMenuOpen ? 'heroXMark' : 'heroBars3'" class="w-5 h-5 text-stone-700"/>
        </button>
      </div>

      <!-- ── Mobile menu ────────────────────────────────────────────────── -->
      <div *ngIf="isMobileMenuOpen"
           class="md:hidden bg-white border-t border-stone-200 px-6 py-4"
           style="animation:slideDown .18s ease">

        <div *ngIf="isLoggedIn" class="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
          <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img *ngIf="user?.profilePicture" [src]="user!.profilePicture!"
                 alt="" class="w-full h-full object-cover"/>
            <div *ngIf="!user?.profilePicture"
                 class="w-full h-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white text-sm font-bold">
              {{ userInitial }}
            </div>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-stone-900 text-sm truncate">{{ user?.name }}</div>
            <div class="text-xs text-stone-500 truncate">{{ user?.email }}</div>
          </div>
        </div>

        <nav class="flex flex-col gap-1 mb-4">
          <a *ngFor="let link of navLinks"
             [routerLink]="link.path"
             routerLinkActive="mobile-nav-active"
             (click)="isMobileMenuOpen=false"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-stone-700 no-underline"
             onmouseenter="this.style.background='rgba(220,107,47,.07)';this.style.color='#dc6b2f'"
             onmouseleave="this.style.background='';this.style.color=''">
            <ng-icon [name]="link.icon" class="w-4 h-4 text-stone-400"/>
            {{ link.label }}
          </a>
        </nav>

        <div class="flex flex-col gap-2 pt-4 border-t border-stone-100">
          <ng-container *ngIf="!isLoggedIn">
            <a routerLink="/login" (click)="isMobileMenuOpen=false"
               class="btn-ghost justify-center no-underline">Sign In</a>
            <a routerLink="/booking" (click)="isMobileMenuOpen=false"
               class="btn-primary justify-center no-underline">
              <ng-icon name="heroCalendarDays" class="w-4 h-4"/>Book Now
            </a>
          </ng-container>
          <ng-container *ngIf="isLoggedIn">
            <a [routerLink]="isAdmin ? '/admin/profile' : '/dashboard/profile'"
               (click)="isMobileMenuOpen=false"
               class="btn-ghost justify-center no-underline">
              <ng-icon name="heroUser" class="w-4 h-4"/>My Profile
            </a>
            <button (click)="logout()"
                    class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold transition-all"
                    onmouseenter="this.style.background='#dc2626';this.style.color='white'"
                    onmouseleave="this.style.background='#fef2f2';this.style.color='#dc2626'">
              <ng-icon name="heroArrowRightOnRectangle" class="w-4 h-4"/>Sign Out
            </button>
          </ng-container>
        </div>
      </div>
    </header>

    <div class="h-16"></div>
  `,
  styles: [`
    @keyframes fadeDown {
      from { opacity:0; transform:translateY(-8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes slideDown {
      from { opacity:0; transform:translateY(-6px); }
      to   { opacity:1; transform:translateY(0); }
    }
    :host ::ng-deep .nav-link-active {
      color: #dc6b2f !important;
      background: rgba(220,107,47,.08) !important;
    }
    :host ::ng-deep .mobile-nav-active {
      color: #dc6b2f !important;
      background: rgba(220,107,47,.06) !important;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {

  isScrolled        = false;
  isMobileMenuOpen  = false;
  isDropdownOpen    = false;
  isLoggedIn        = false;
  isAdmin           = false;
  user: User | null = null;

  private authSub!: Subscription;

  navLinks: { path: string; label: string; icon: string; exact: boolean }[] = [
    { path: '/',        label: 'Home',     icon: 'heroMusicalNote',  exact: true  },
    { path: '/events',  label: 'Events',   icon: 'heroCalendarDays', exact: false },
    { path: '/reviews', label: 'Reviews',  icon: 'heroStar',         exact: false },
    { path: '/booking', label: 'Book Now', icon: 'heroCalendarDays', exact: false },
  ];

  constructor(
    private authService: AuthService,
    private router:      Router,
    private cdr:         ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe((u: User | null) => {
      this.user       = u;
      this.isLoggedIn = !!u && !!localStorage.getItem('token');
      this.isAdmin    = u?.role === 'admin';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void { this.authSub?.unsubscribe(); }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
    if (this.isScrolled) this.isMobileMenuOpen = false;
    this.cdr.detectChanges();
  }

  get userInitial(): string { return (this.user?.name || 'U')[0].toUpperCase(); }
  get firstName():   string { return this.user?.name?.split(' ')[0] || ''; }

  logout(): void {
    this.isDropdownOpen   = false;
    this.isMobileMenuOpen = false;
    this.authService.logout();
  }
}
