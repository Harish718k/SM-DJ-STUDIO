import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroStar, heroSparkles, heroArrowRight,
  heroCheckBadge, heroMusicalNote, heroHandThumbUp,
} from '@ng-icons/heroicons/outline';

interface Review {
  id:        number;
  name:      string;
  event:     string;
  location:  string;
  rating:    number;
  date:      string;
  text:      string;
  avatar:    string;   // initials fallback
  avatarBg:  string;   // tailwind bg class
  featured?: boolean;
  videoSrc?: string;   // optional video testimonial
  posterSrc?: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroStar, heroSparkles, heroArrowRight,
    heroCheckBadge, heroMusicalNote, heroHandThumbUp,
  })],
  template: `

    <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
    <!-- Header/footer provided by app shell -->
    <section class="relative bg-navy py-24 overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(220,107,47,0.14),transparent_60%)]"></div>

      <!-- Floating quote marks SVG -->
      <svg class="absolute top-10 right-16 opacity-5 hidden lg:block" width="220" height="180" viewBox="0 0 220 180">
        <text x="0" y="160" font-size="200" font-family="Georgia,serif" fill="white">"</text>
      </svg>

      <div class="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <span class="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
          <ng-icon name="heroHandThumbUp" class="w-3.5 h-3.5"/>
          Client Reviews
        </span>
        <h1 class="font-display text-5xl md:text-6xl font-bold text-white mb-6">
          What Our Clients <span class="text-accent">Say About Us</span>
        </h1>
        <p class="text-white/50 text-lg max-w-xl mx-auto leading-relaxed mb-12">
          Hundreds of events, thousands of memories. Here's what real clients say about working with DJ BookPro.
        </p>

        <!-- Aggregate stats -->
        <div class="flex flex-wrap justify-center gap-6">
          <div *ngFor="let s of aggregateStats"
               class="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl px-8 py-5 min-w-[140px]">
            <div class="font-display text-3xl font-bold text-accent mb-1">{{ s.value }}</div>
            <div class="text-white/40 text-xs uppercase tracking-wide">{{ s.label }}</div>
          </div>
        </div>

        <!-- Star display -->
        <div class="flex items-center justify-center gap-1 mt-8">
          <ng-icon *ngFor="let s of [1,2,3,4,5]" name="heroStar" class="w-7 h-7 text-amber-400"/>
          <span class="text-white/50 text-sm ml-3">4.9 / 5.0 average across all platforms</span>
        </div>
      </div>
    </section>

    <!-- ── Rating breakdown ───────────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-10 items-center">

          <!-- Big score -->
          <div class="text-center md:text-left">
            <div class="font-display text-8xl font-bold text-accent leading-none mb-2">4.9</div>
            <div class="flex items-center gap-1 mb-3 justify-center md:justify-start">
              <ng-icon *ngFor="let s of [1,2,3,4,5]" name="heroStar" class="w-5 h-5 text-amber-400"/>
            </div>
            <p class="text-stone-400 text-sm">Based on {{ totalReviews }} verified reviews</p>
            <div class="flex items-center gap-2 mt-4">
              <ng-icon name="heroCheckBadge" class="w-5 h-5 text-emerald-500"/>
              <span class="text-stone-500 text-sm font-medium">All reviews are from verified bookings</span>
            </div>
          </div>

          <!-- Bar breakdown -->
          <div class="flex flex-col gap-3">
            <div *ngFor="let row of ratingBreakdown" class="flex items-center gap-3">
              <span class="text-sm text-stone-500 w-10 shrink-0 text-right">{{ row.stars }}★</span>
              <div class="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full bg-amber-400 transition-all duration-700"
                     [style.width.%]="row.pct"></div>
              </div>
              <span class="text-xs text-stone-400 w-8 shrink-0">{{ row.pct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Video testimonials ─────────────────────────────────────────────────── -->
    <section class="py-20 bg-cream">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-12">
          <span class="text-xs font-bold uppercase tracking-widest text-accent">In Their Own Words</span>
          <h2 class="font-display text-3xl font-bold text-stone-900 mt-3">Video Testimonials</h2>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <div *ngFor="let vt of videoTestimonials"
               class="relative rounded-3xl overflow-hidden shadow-lg group aspect-[9/14] bg-navy cursor-pointer">
            <video autoplay muted loop playsinline
                   class="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                   [poster]="vt.poster">
              <source [src]="vt.src" type="video/mp4"/>
              <img [src]="vt.poster" class="w-full h-full object-cover" alt=""/>
            </video>
            <!-- Gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <!-- Content -->
            <div class="absolute bottom-0 left-0 right-0 p-5">
              <div class="flex items-center gap-1 mb-2">
                <ng-icon *ngFor="let s of [1,2,3,4,5]" name="heroStar" class="w-3.5 h-3.5 text-amber-400"/>
              </div>
              <p class="text-white text-sm font-semibold leading-relaxed mb-3 italic">"{{ vt.quote }}"</p>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                     [class]="vt.avatarBg">
                  {{ vt.initial }}
                </div>
                <div>
                  <div class="text-white text-xs font-bold">{{ vt.name }}</div>
                  <div class="text-white/50 text-[10px]">{{ vt.event }}</div>
                </div>
              </div>
            </div>
            <!-- Verified badge -->
            <div class="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              <ng-icon name="heroCheckBadge" class="w-3 h-3"/>Verified
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Written reviews grid ───────────────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-accent">Written Reviews</span>
            <h2 class="font-display text-3xl font-bold text-stone-900 mt-2">{{ totalReviews }} Client Reviews</h2>
          </div>
          <!-- Filter tabs -->
          <div class="flex gap-2 flex-wrap">
            <button *ngFor="let f of filterTabs" (click)="activeFilter=f.key"
                    class="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                    [class.bg-accent]="activeFilter===f.key" [class.text-white]="activeFilter===f.key"
                    [class.border-accent]="activeFilter===f.key" [class.bg-white]="activeFilter!==f.key"
                    [class.text-stone-500]="activeFilter!==f.key" [class.border-stone-200]="activeFilter!==f.key">
              {{ f.label }}
            </button>
          </div>
        </div>

        <!-- Featured review — full width -->
        <div *ngIf="featuredReview && (activeFilter==='all' || activeFilter===featuredReview.event.toLowerCase().split(' ')[0])"
             class="card p-8 mb-6 border-l-4 border-accent bg-orange-50/40">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 font-display"
                 [class]="featuredReview.avatarBg">
              {{ featuredReview.avatar }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <span class="font-display text-lg font-bold text-stone-900">{{ featuredReview.name }}</span>
                <span class="badge-confirmed">{{ featuredReview.event }}</span>
                <span class="flex items-center gap-1 ml-auto">
                  <ng-icon *ngFor="let s of starsArray(featuredReview.rating)" name="heroStar" class="w-4 h-4 text-amber-400"/>
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-stone-400 mb-3">
                <ng-icon name="heroCheckBadge" class="w-3.5 h-3.5 text-emerald-500"/>
                Verified booking · {{ featuredReview.location }} · {{ featuredReview.date }}
              </div>
              <p class="text-stone-600 leading-relaxed text-base italic">"{{ featuredReview.text }}"</p>
            </div>
          </div>
        </div>

        <!-- Regular reviews masonry-style grid -->
        <div class="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          <div *ngFor="let r of filteredReviews"
               class="card p-6 break-inside-avoid">
            <!-- Stars -->
            <div class="flex items-center gap-0.5 mb-3">
              <ng-icon *ngFor="let s of starsArray(r.rating)" name="heroStar" class="w-3.5 h-3.5 text-amber-400"/>
            </div>
            <!-- Text -->
            <p class="text-stone-600 text-sm leading-relaxed mb-4 italic">"{{ r.text }}"</p>
            <!-- Author -->
            <div class="flex items-center gap-3 pt-3 border-t border-stone-100">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                   [class]="r.avatarBg">
                {{ r.avatar }}
              </div>
              <div class="min-w-0">
                <div class="font-semibold text-stone-800 text-sm truncate">{{ r.name }}</div>
                <div class="text-stone-400 text-xs">{{ r.event }} · {{ r.date }}</div>
              </div>
              <ng-icon name="heroCheckBadge" class="w-4 h-4 text-emerald-500 shrink-0 ml-auto"/>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Platform badges ────────────────────────────────────────────────────── -->
    <section class="py-16 bg-stone-50 border-t border-stone-100">
      <div class="max-w-4xl mx-auto px-6">
        <p class="text-center text-stone-400 text-sm font-medium uppercase tracking-widest mb-10">Rated 5 stars on</p>
        <div class="flex flex-wrap items-center justify-center gap-8">
          <div *ngFor="let p of platforms"
               class="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-6 py-4 shadow-sm">
            <span class="text-2xl">{{ p.icon }}</span>
            <div>
              <div class="font-bold text-stone-800 text-sm">{{ p.name }}</div>
              <div class="flex items-center gap-1 mt-0.5">
                <ng-icon *ngFor="let s of [1,2,3,4,5]" name="heroStar" class="w-3 h-3 text-amber-400"/>
                <span class="text-xs text-stone-400 ml-1">{{ p.score }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ───────────────────────────────────────────────────────────────── -->
    <section class="py-24 bg-navy relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(220,107,47,0.1),transparent_60%)]"></div>

      <!-- SVG vector: abstract soundwave decoration -->
      <svg class="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0,150 Q60,80 120,150 Q180,220 240,150 Q300,80 360,150 Q420,220 480,150 Q540,80 600,150 Q660,220 720,150 Q780,80 840,150 Q900,220 960,150 Q1020,80 1080,150 Q1140,220 1200,150"
              fill="none" stroke="white" stroke-width="3"/>
        <path d="M0,150 Q60,50 120,150 Q180,250 240,150 Q300,50 360,150 Q420,250 480,150 Q540,50 600,150 Q660,250 720,150 Q780,50 840,150 Q900,250 960,150 Q1020,50 1080,150 Q1140,250 1200,150"
              fill="none" stroke="white" stroke-width="1.5" opacity="0.5"/>
      </svg>

      <div class="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <div class="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ng-icon name="heroMusicalNote" class="w-7 h-7 text-accent"/>
        </div>
        <h2 class="font-display text-4xl font-bold text-white mb-4">
          Join 500+ Happy Clients
        </h2>
        <p class="text-white/50 text-base leading-relaxed mb-10">
          Every review above started with a single booking. Check your date now — it takes less than 5 minutes.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a routerLink="/booking" class="btn-primary text-base px-8 py-3.5">
            Book Your Event <ng-icon name="heroArrowRight" class="w-4 h-4"/>
          </a>
          <a routerLink="/events" class="btn-ghost text-base px-8 py-3.5 border-white/20 text-white hover:border-accent hover:text-accent">
            See Event Types
          </a>
        </div>
      </div>
    </section>
  `
})
export class ReviewsComponent implements OnInit {

  activeFilter = 'all';
  totalReviews = 124;

  aggregateStats = [
    { value: '4.9★',  label: 'Average Rating'    },
    { value: '124',   label: 'Verified Reviews'  },
    { value: '98%',   label: 'Recommend Us'      },
    { value: '500+',  label: 'Events Performed'  },
  ];

  ratingBreakdown = [
    { stars: 5, pct: 87 },
    { stars: 4, pct: 10 },
    { stars: 3, pct: 2  },
    { stars: 2, pct: 1  },
    { stars: 1, pct: 0  },
  ];

  filterTabs = [
    { key: 'all',       label: 'All Reviews'      },
    { key: 'wedding',   label: '💍 Weddings'       },
    { key: 'birthday',  label: '🎂 Birthdays'      },
    { key: 'corporate', label: '🏢 Corporate'      },
    { key: 'club',      label: '🎉 Club Nights'    },
  ];

  videoTestimonials = [
    {
      src:      'https://videos.pexels.com/video-files/3044477/3044477-uhd_2560_1440_25fps.mp4',
      poster:   'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&w=600',
      quote:    'Best decision we made for our wedding — the dancefloor was packed all night!',
      name:     'Sarah & James M.',
      event:    'Wedding Reception',
      initial:  'S',
      avatarBg: 'bg-pink-500',
    },
    {
      src:      'https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_25fps.mp4',
      poster:   'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&w=600',
      quote:    'He read the crowd perfectly. Every transition was flawless. Absolutely incredible.',
      name:     'Marcus T.',
      event:    'Club Night — Saturate',
      initial:  'M',
      avatarBg: 'bg-purple-500',
    },
    {
      src:      'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
      poster:   'https://images.pexels.com/photos/3171804/pexels-photo-3171804.jpeg?auto=compress&w=600',
      quote:    'Our staff are still talking about that party. Professional, punctual, and so talented.',
      name:     'Priya K.',
      event:    'Corporate Gala — TechCorp',
      initial:  'P',
      avatarBg: 'bg-blue-500',
    },
  ];

  reviews: Review[] = [
    {
      id: 1, name: 'Sarah & James M.',  event: 'Wedding',   location: 'New York, NY',
      rating: 5, date: 'March 2025', featured: true, avatarBg: 'bg-pink-500', avatar: 'S',
      text: 'We cannot say enough about how perfect the music was at our wedding. He consulted with us three times beforehand, built a playlist that took our guests on an emotional journey, and kept the dancefloor packed until midnight. The ceremony processional made our guests cry. Absolutely the best wedding decision we made.',
    },
    {
      id: 2, name: 'Marcus T.',  event: 'Club Night',  location: 'Brooklyn, NY',
      rating: 5, date: 'Feb 2025', avatarBg: 'bg-purple-500', avatar: 'M',
      text: 'Resident set was absolutely insane. He built the energy perfectly from 11pm through to 3am. Flawless beatmatching, incredible selection. Our crowd went wild.',
    },
    {
      id: 3, name: 'Priya K.',   event: 'Corporate',  location: 'Manhattan, NY',
      rating: 5, date: 'Jan 2025', avatarBg: 'bg-blue-500', avatar: 'P',
      text: 'Professional, punctual, and the music was perfectly calibrated for our crowd. Our annual gala has never had such great energy. We\'ve already rebooked for next year.',
    },
    {
      id: 4, name: 'Michelle T.', event: 'Birthday', location: 'Queens, NY',
      rating: 5, date: 'Dec 2024', avatarBg: 'bg-accent', avatar: 'M',
      text: 'My 30th was legendary. He took my playlist suggestions and turned them into something incredible. Everyone is still talking about it three months later.',
    },
    {
      id: 5, name: 'David K.',   event: 'Wedding',   location: 'NJ',
      rating: 5, date: 'Nov 2024', avatarBg: 'bg-emerald-500', avatar: 'D',
      text: 'Exceeded every expectation. Our guests didn\'t want to leave. The transition from ceremony to reception music was seamless and so well planned.',
    },
    {
      id: 6, name: 'Aisha R.',   event: 'Birthday',  location: 'Harlem, NY',
      rating: 5, date: 'Oct 2024', avatarBg: 'bg-violet-500', avatar: 'A',
      text: 'He knew exactly what Afrobeats and RnB classics to play for our crowd. Dance floor was never empty. Will definitely book again.',
    },
    {
      id: 7, name: 'Tom & Lisa B.', event: 'Wedding', location: 'Long Island, NY',
      rating: 5, date: 'Sep 2024', avatarBg: 'bg-rose-500', avatar: 'T',
      text: 'From the first consultation to the last song, everything was seamless. The guest compliments kept coming for weeks. Could not recommend more highly.',
    },
    {
      id: 8, name: 'Carlos M.',  event: 'Club Night', location: 'Bushwick, NY',
      rating: 5, date: 'Aug 2024', avatarBg: 'bg-orange-500', avatar: 'C',
      text: 'Booked for a house party and he absolutely crushed it. Tight mixing, perfect energy management, guests were blown away.',
    },
    {
      id: 9, name: 'Linda H.',   event: 'Corporate', location: 'Midtown, NY',
      rating: 4, date: 'Jul 2024', avatarBg: 'bg-teal-500', avatar: 'L',
      text: 'Great background music during our awards ceremony. Professional setup and really good communication in the lead-up. Would use again.',
    },
    {
      id: 10, name: 'Jake & Amy W.', event: 'Wedding', location: 'Westchester, NY',
      rating: 5, date: 'Jun 2024', avatarBg: 'bg-indigo-500', avatar: 'J',
      text: 'He made our wedding night absolutely magical. The lighting package was a great add-on too — the room looked incredible.',
    },
    {
      id: 11, name: 'Naomi S.',  event: 'Birthday',  location: 'Bronx, NY',
      rating: 5, date: 'May 2024', avatarBg: 'bg-amber-500', avatar: 'N',
      text: 'My daughter\'s 18th was everything she dreamed of. He took her playlist requests seriously and wove them in brilliantly.',
    },
    {
      id: 12, name: 'Ryan P.',   event: 'Club Night', location: 'Lower East Side, NY',
      rating: 5, date: 'Apr 2024', avatarBg: 'bg-red-500', avatar: 'R',
      text: 'Techno set was on another level. Technical skills are elite — harmonic mixing throughout, no clashes. Our best night this year.',
    },
  ];

  platforms = [
    { icon: '🌟', name: 'Google',    score: '4.9 · 82 reviews'  },
    { icon: '📘', name: 'Facebook',  score: '4.8 · 31 reviews'  },
    { icon: '💒', name: 'WeddingWire', score: '5.0 · 18 reviews' },
    { icon: '🎵', name: 'GigSalad',  score: '4.9 · 24 reviews'  },
  ];

  get featuredReview(): Review | undefined {
    return this.reviews.find(r => r.featured);
  }

  get filteredReviews(): Review[] {
    const nonFeatured = this.reviews.filter(r => !r.featured);
    if (this.activeFilter === 'all') return nonFeatured;
    return nonFeatured.filter(r =>
      r.event.toLowerCase().includes(this.activeFilter)
    );
  }

  starsArray(n: number): number[] {
    return Array(n).fill(0);
  }

  ngOnInit(): void {}
}
