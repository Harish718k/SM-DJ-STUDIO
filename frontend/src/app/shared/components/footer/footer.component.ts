/**
 * footer.component.ts
 *
 * Shared site-wide footer.
 * Place in: src/app/shared/components/footer/footer.component.ts
 *
 * Import FooterComponent in app.component.ts and add <app-footer/> to template.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroMusicalNote, heroEnvelope, heroPhone, heroMapPin,
  heroArrowRight,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroMusicalNote, heroEnvelope, heroPhone, heroMapPin, heroArrowRight,
  })],
  template: `
    <footer style="background:#111827">

      <!-- ── Main footer grid ─────────────────────────────────────────────── -->
      <div class="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div class="grid md:grid-cols-4 gap-10">

          <!-- Brand column -->
          <div class="md:col-span-1">
            <a routerLink="/" class="flex items-center gap-2.5 no-underline mb-5">
              <div class="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-sm shadow-accent/30 shrink-0">
                <ng-icon name="heroMusicalNote" class="w-4.5 h-4.5 text-white"/>
              </div>
              <span class="font-display text-xl font-bold text-white">
                DJ <span class="text-accent">BookPro</span>
              </span>
            </a>
            <p class="text-sm leading-relaxed mb-6" style="color:rgba(255,255,255,.4)">
              Professional DJ services for weddings, corporate events, birthday parties and more.
              Real-time booking, instant confirmation.
            </p>
            <!-- Social icons (SVG inline — no extra lib needed) -->
            <div class="flex gap-3">
              <a *ngFor="let s of socials" [href]="s.href" target="_blank" rel="noopener"
                 class="w-9 h-9 rounded-xl flex items-center justify-center transition-all no-underline"
                 style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.4)"
                 onmouseenter="this.style.background='rgba(220,107,47,.2)';this.style.color='#dc6b2f'"
                 onmouseleave="this.style.background='rgba(255,255,255,.06)';this.style.color='rgba(255,255,255,.4)'"
                 [title]="s.name">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path [attr.d]="s.path"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Navigation column -->
          <div>
            <h4 class="text-white text-xs font-bold uppercase tracking-widest mb-5">Navigation</h4>
            <ul class="flex flex-col gap-3">
              <li *ngFor="let link of navLinks">
                <a [routerLink]="link.path"
                   class="text-sm no-underline transition-colors"
                   style="color:rgba(255,255,255,.45)"
                   onmouseenter="this.style.color='#dc6b2f'"
                   onmouseleave="this.style.color='rgba(255,255,255,.45)'">
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </div>

          <!-- Services column -->
          <div>
            <h4 class="text-white text-xs font-bold uppercase tracking-widest mb-5">Event Types</h4>
            <ul class="flex flex-col gap-3">
              <li *ngFor="let ev of eventTypes">
                <a routerLink="/events"
                   class="text-sm no-underline transition-colors flex items-center gap-2"
                   style="color:rgba(255,255,255,.45)"
                   onmouseenter="this.style.color='#dc6b2f'"
                   onmouseleave="this.style.color='rgba(255,255,255,.45)'">
                  <span>{{ ev.icon }}</span>{{ ev.label }}
                </a>
              </li>
            </ul>
          </div>

          <!-- Contact + newsletter column -->
          <div>
            <h4 class="text-white text-xs font-bold uppercase tracking-widest mb-5">Get in Touch</h4>
            <ul class="flex flex-col gap-3 mb-7">
              <li class="flex items-center gap-2.5 text-sm" style="color:rgba(255,255,255,.45)">
                <ng-icon name="heroEnvelope" class="w-4 h-4 shrink-0" style="color:#dc6b2f"/>
                hello&#64;djbookpro.com
              </li>
              <li class="flex items-center gap-2.5 text-sm" style="color:rgba(255,255,255,.45)">
                <ng-icon name="heroPhone" class="w-4 h-4 shrink-0" style="color:#dc6b2f"/>
                +1 (555) 000-1234
              </li>
              <li class="flex items-center gap-2.5 text-sm" style="color:rgba(255,255,255,.45)">
                <ng-icon name="heroMapPin" class="w-4 h-4 shrink-0" style="color:#dc6b2f"/>
                New York, NY · Available nationwide
              </li>
            </ul>

            <!-- Newsletter mini form -->
            <div>
              <p class="text-white text-xs font-semibold mb-2">Get availability updates</p>
              <div class="flex gap-2">
                <input type="email" placeholder="your@email.com"
                       class="flex-1 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                       style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);min-width:0"/>
                <button (click)="subscribeNewsletter()"
                        class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border-0"
                        style="background:#dc6b2f;color:white"
                        onmouseenter="this.style.background='#c45a22'"
                        onmouseleave="this.style.background='#dc6b2f'">
                  <ng-icon name="heroArrowRight" class="w-3.5 h-3.5"/>
                </button>
              </div>
              <p *ngIf="subscribed" class="text-emerald-400 text-xs mt-2">✓ You're on the list!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Divider + bottom bar ─────────────────────────────────────────── -->
      <div style="border-top:1px solid rgba(255,255,255,.06)">
        <div class="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <span class="text-xs" style="color:rgba(255,255,255,.25)">
            © {{ year }} DJ BookPro. All rights reserved.
          </span>

          <!-- Bottom links -->
          <div class="flex gap-5">
            <a *ngFor="let l of legalLinks" [routerLink]="l.path"
               class="text-xs no-underline transition-colors"
               style="color:rgba(255,255,255,.25)"
               onmouseenter="this.style.color='rgba(255,255,255,.6)'"
               onmouseleave="this.style.color='rgba(255,255,255,.25)'">
              {{ l.label }}
            </a>
          </div>

          <span class="text-xs" style="color:rgba(255,255,255,.18)">Made with ♪ in New York</span>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {

  year = new Date().getFullYear();
  subscribed = false;

  navLinks = [
    { path: '/',        label: 'Home'       },
    { path: '/events',  label: 'Events'     },
    { path: '/reviews', label: 'Reviews'    },
    { path: '/booking', label: 'Book Now'   },
    { path: '/login',   label: 'Sign In'    },
    { path: '/register',label: 'Register'   },
  ];

  eventTypes = [
    { icon: '💍', label: 'Weddings'         },
    { icon: '🎂', label: 'Birthday Parties' },
    { icon: '🏢', label: 'Corporate Events' },
    { icon: '🎉', label: 'Club Nights'      },
    { icon: '🎪', label: 'Festivals'        },
    { icon: '✨', label: 'Private Events'   },
  ];

  legalLinks = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms',   label: 'Terms of Service' },
  ];

  // Inline SVG paths for social icons (no external icon lib needed)
  socials = [
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com',
      path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    },
    {
      name: 'SoundCloud',
      href: 'https://soundcloud.com',
      path: 'M1.175 12.225c-.015 0-.023.01-.03.025l-.315 2.013.315 2c.007.017.015.025.03.025.015 0 .023-.008.03-.025l.36-2-.36-2.013c-.007-.017-.015-.025-.03-.025zm.96-.19c-.02 0-.03.01-.035.03L1.74 14.26l.36 1.985c.005.02.015.03.035.03.02 0 .03-.01.035-.03l.405-1.985-.405-2.005c-.005-.02-.015-.03-.035-.03zm.975-.17c-.025 0-.04.017-.04.04l-.345 2.175.345 1.965c0 .023.015.04.04.04.025 0 .04-.017.04-.04l.39-1.965-.39-2.175c0-.023-.015-.04-.04-.04zm1.005.025c-.03 0-.045.02-.045.05l-.315 2.15.315 1.94c0 .03.015.05.045.05.03 0 .045-.02.045-.05l.355-1.94-.355-2.15c0-.03-.015-.05-.045-.05z',
    },
  ];

  subscribeNewsletter(): void {
    this.subscribed = true;
    setTimeout(() => this.subscribed = false, 4000);
  }
}
