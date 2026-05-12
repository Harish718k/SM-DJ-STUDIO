import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroMusicalNote, heroSparkles, heroCheckCircle,
  heroArrowRight, heroUsers, heroClock, heroMapPin,
} from '@ng-icons/heroicons/outline';

interface EventType {
  id:          string;
  icon:        string;
  title:       string;
  subtitle:    string;
  description: string;
  highlights:  string[];
  videoSrc:    string;      // free Pexels/Pixabay MP4
  posterSrc:   string;      // fallback poster
  accent:      string;      // tailwind bg class for accent strip
  stats: { label: string; value: string }[];
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroMusicalNote, heroSparkles, heroCheckCircle,
    heroArrowRight, heroUsers, heroClock, heroMapPin,
  })],
  template: `
    <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
    <!-- Header/footer provided by app shell. Remove any pt-16 hero compensations. -->
    <section class="relative min-h-[72vh] flex items-center overflow-hidden bg-navy">
      <!-- Looping background video -->
      <video autoplay muted loop playsinline
             class="absolute inset-0 w-full h-full object-cover opacity-30"
             poster="https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&w=1400">
        <source src="https://videos.pexels.com/video-files/2795405/2795405-uhd_2560_1440_25fps.mp4" type="video/mp4"/>
      </video>
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent"></div>

      <div class="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div class="max-w-xl">
          <span class="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <ng-icon name="heroMusicalNote" class="w-3.5 h-3.5"/>
            DJ BookPro Events
          </span>
          <h1 class="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Every Event Deserves <span class="text-accent">Perfect Sound.</span>
          </h1>
          <p class="text-white/60 text-lg leading-relaxed mb-10">
            From intimate birthday dinners to 1,000-person wedding receptions — we bring
            professional DJ performance and sound engineering to every occasion.
          </p>
          <div class="flex flex-wrap gap-4">
            <a routerLink="/booking" class="btn-primary text-base px-7 py-3.5">
              Book Your Event <ng-icon name="heroArrowRight" class="w-4 h-4"/>
            </a>
            <a href="#event-types" class="btn-ghost text-base px-7 py-3.5 border-white/20 text-white hover:border-accent hover:text-accent">
              See Event Types
            </a>
          </div>
        </div>
      </div>

      <!-- Stat chips floating bottom-right -->
      <div class="absolute bottom-8 right-8 hidden lg:flex flex-col gap-3 z-10">
        <div *ngFor="let s of heroStats"
             class="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/10 rounded-2xl px-5 py-3">
          <span class="font-display text-2xl font-bold text-accent">{{ s.value }}</span>
          <span class="text-white/50 text-sm">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- ── Event types grid ───────────────────────────────────────────────────── -->
    <section id="event-types" class="py-24 bg-cream">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-xs font-bold uppercase tracking-widest text-accent">What We Cover</span>
          <h2 class="font-display text-4xl font-bold text-stone-900 mt-3 mb-4">Events We Specialise In</h2>
          <p class="text-stone-400 max-w-xl mx-auto text-sm leading-relaxed">
            Six distinct event categories, each with a curated music approach, tailored setlist planning, and dedicated equipment setup.
          </p>
        </div>

        <div class="flex flex-col gap-20">
          <div *ngFor="let ev of events; let i = index"
               class="grid md:grid-cols-2 gap-10 items-center"
               [ngClass]="{'md:grid-flow-col-dense': i%2!==0}">

            <!-- Video card -->
            <div class="relative rounded-3xl overflow-hidden shadow-2xl aspect-video"
                 [ngClass]="{'md:col-start-2': i%2!==0}">
              <video autoplay muted loop playsinline
                     class="w-full h-full object-cover"
                     [poster]="ev.posterSrc">
                <source [src]="ev.videoSrc" type="video/mp4"/>
                <!-- Fallback image if video fails -->
                <img [src]="ev.posterSrc" [alt]="ev.title" class="w-full h-full object-cover"/>
              </video>
              <!-- Accent strip -->
              <div class="absolute bottom-0 left-0 right-0 h-1" [ngClass]="ev.accent"></div>
              <!-- Event type chip -->
              <div class="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5">
                <span class="text-lg">{{ ev.icon }}</span>
                <span class="text-white text-xs font-bold">{{ ev.title }}</span>
              </div>
            </div>

            <!-- Content -->
            <div [ngClass]="{'md:col-start-1 md:row-start-1': i%2!==0}">
              <span class="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">{{ ev.subtitle }}</span>
              <h3 class="font-display text-3xl font-bold text-stone-900 mb-4">{{ ev.title }}</h3>
              <p class="text-stone-500 leading-relaxed mb-6">{{ ev.description }}</p>

              <!-- Highlight list -->
              <ul class="flex flex-col gap-3 mb-7">
                <li *ngFor="let h of ev.highlights" class="flex items-start gap-3 text-sm text-stone-600">
                  <ng-icon name="heroCheckCircle" class="w-4 h-4 text-accent shrink-0 mt-0.5"/>
                  {{ h }}
                </li>
              </ul>

              <!-- Stats row -->
              <div class="flex gap-5 mb-8 flex-wrap">
                <div *ngFor="let s of ev.stats"
                     class="flex flex-col">
                  <span class="font-display text-2xl font-bold text-accent">{{ s.value }}</span>
                  <span class="text-xs text-stone-400 mt-0.5">{{ s.label }}</span>
                </div>
              </div>

              <a routerLink="/booking" class="btn-primary">
                Book a {{ ev.title }} <ng-icon name="heroArrowRight" class="w-4 h-4"/>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How a typical event runs ───────────────────────────────────────────── -->
    <section class="py-24 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-xs font-bold uppercase tracking-widest text-accent">Our Process</span>
          <h2 class="font-display text-4xl font-bold text-stone-900 mt-3">How Every Event Runs</h2>
        </div>
        <div class="grid md:grid-cols-5 gap-0 relative">
          <!-- Connecting line -->
          <div class="hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-stone-100 z-0"></div>
          <div *ngFor="let step of processSteps; let i = index" class="flex flex-col items-center text-center relative z-10 px-4">
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm border"
                 [class.bg-accent]="i===0 || i===processSteps.length-1"
                 [class.border-accent]="i===0 || i===processSteps.length-1"
                 [class.bg-stone-50]="i>0 && i<processSteps.length-1"
                 [class.border-stone-200]="i>0 && i<processSteps.length-1">
              {{ step.icon }}
            </div>
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-3"
                 [class.bg-accent]="i===0 || i===processSteps.length-1"
                 [class.text-white]="i===0 || i===processSteps.length-1"
                 [class.bg-stone-100]="i>0 && i<processSteps.length-1"
                 [class.text-stone-500]="i>0 && i<processSteps.length-1">
              {{ i+1 }}
            </div>
            <h4 class="font-bold text-stone-800 text-sm mb-1">{{ step.title }}</h4>
            <p class="text-stone-400 text-xs leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Equipment highlight ────────────────────────────────────────────────── -->
    <section class="py-24 bg-navy relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(220,107,47,0.12),transparent_60%)]"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-accent mb-3 block">Professional Grade</span>
          <h2 class="font-display text-4xl font-bold text-white mb-6">State-of-the-Art Equipment</h2>
          <p class="text-white/50 leading-relaxed mb-8">
            Every booking includes professional PA systems, intelligent lighting, DJ controller setup, and on-site sound engineering — no extra charges.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div *ngFor="let item of equipment"
                 class="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
              <span class="text-xl shrink-0">{{ item.icon }}</span>
              <div>
                <div class="text-white text-sm font-semibold mb-0.5">{{ item.name }}</div>
                <div class="text-white/35 text-xs leading-relaxed">{{ item.detail }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG vector illustration — DJ console -->
        <div class="flex justify-center">
          <svg viewBox="0 0 420 360" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-md drop-shadow-2xl">
            <!-- Stage platform -->
            <ellipse cx="210" cy="330" rx="180" ry="18" fill="rgba(220,107,47,0.12)"/>
            <!-- Main console body -->
            <rect x="60" y="180" width="300" height="130" rx="18" fill="#1e2a4a" stroke="rgba(220,107,47,0.3)" stroke-width="1.5"/>
            <!-- Console top surface -->
            <rect x="60" y="180" width="300" height="24" rx="18" fill="#2d3e6b"/>
            <rect x="60" y="195" width="300" height="9" fill="#2d3e6b"/>
            <!-- Left turntable -->
            <circle cx="135" cy="255" r="52" fill="#141927" stroke="rgba(220,107,47,0.25)" stroke-width="1"/>
            <circle cx="135" cy="255" r="42" fill="#0f1520"/>
            <circle cx="135" cy="255" r="28" fill="#1a2236" stroke="rgba(220,107,47,0.15)" stroke-width="1"/>
            <circle cx="135" cy="255" r="8" fill="#dc6b2f"/>
            <circle cx="135" cy="255" r="3" fill="#fff"/>
            <!-- Right turntable -->
            <circle cx="285" cy="255" r="52" fill="#141927" stroke="rgba(220,107,47,0.25)" stroke-width="1"/>
            <circle cx="285" cy="255" r="42" fill="#0f1520"/>
            <circle cx="285" cy="255" r="28" fill="#1a2236" stroke="rgba(220,107,47,0.15)" stroke-width="1"/>
            <circle cx="285" cy="255" r="8" fill="#dc6b2f"/>
            <circle cx="285" cy="255" r="3" fill="#fff"/>
            <!-- Mixer center section -->
            <rect x="170" y="195" width="80" height="110" rx="6" fill="#141927"/>
            <!-- Faders -->
            <rect x="182" y="215" width="4" height="55" rx="2" fill="#2d3e6b"/>
            <rect x="196" y="215" width="4" height="55" rx="2" fill="#2d3e6b"/>
            <rect x="210" y="215" width="4" height="55" rx="2" fill="#2d3e6b"/>
            <rect x="224" y="215" width="4" height="55" rx="2" fill="#2d3e6b"/>
            <rect x="238" y="215" width="4" height="55" rx="2" fill="#2d3e6b"/>
            <!-- Fader knobs -->
            <rect x="180" y="235" width="8" height="6" rx="2" fill="#dc6b2f"/>
            <rect x="194" y="248" width="8" height="6" rx="2" fill="#dc6b2f"/>
            <rect x="208" y="228" width="8" height="6" rx="2" fill="#dc6b2f"/>
            <rect x="222" y="242" width="8" height="6" rx="2" fill="#dc6b2f"/>
            <rect x="236" y="255" width="8" height="6" rx="2" fill="#dc6b2f"/>
            <!-- Knobs row -->
            <circle cx="185" cy="205" r="5" fill="#dc6b2f"/>
            <circle cx="200" cy="205" r="5" fill="#2d3e6b"/>
            <circle cx="215" cy="205" r="5" fill="#dc6b2f"/>
            <circle cx="230" cy="205" r="5" fill="#2d3e6b"/>
            <circle cx="245" cy="205" r="5" fill="#dc6b2f"/>
            <!-- Screen -->
            <rect x="85" y="195" width="68" height="36" rx="5" fill="#0a0e1a"/>
            <rect x="88" y="198" width="62" height="30" rx="4" fill="#060912"/>
            <!-- Waveform on screen -->
            <polyline points="92,213 97,207 102,218 107,205 112,216 117,210 122,213 127,208 132,213 137,218 143,210 148,214" fill="none" stroke="#dc6b2f" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Second screen right -->
            <rect x="267" y="195" width="68" height="36" rx="5" fill="#0a0e1a"/>
            <rect x="270" y="198" width="62" height="30" rx="4" fill="#060912"/>
            <polyline points="274,213 279,218 284,207 289,215 294,209 299,216 304,211 309,214 314,208 319,213 324,217 330,212" fill="none" stroke="#dc6b2f" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Needle arms -->
            <line x1="135" y1="220" x2="160" y2="207" stroke="#dc6b2f" stroke-width="2" stroke-linecap="round"/>
            <line x1="285" y1="220" x2="260" y2="207" stroke="#dc6b2f" stroke-width="2" stroke-linecap="round"/>
            <!-- Glow rings -->
            <circle cx="135" cy="255" r="54" fill="none" stroke="rgba(220,107,47,0.08)" stroke-width="8"/>
            <circle cx="285" cy="255" r="54" fill="none" stroke="rgba(220,107,47,0.08)" stroke-width="8"/>
            <!-- Headphone cable -->
            <path d="M 210 180 Q 210 155 230 148 Q 260 138 265 155" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
            <!-- Headphones -->
            <ellipse cx="270" cy="148" rx="18" ry="14" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
            <circle cx="270" cy="148" r="7" fill="rgba(220,107,47,0.5)"/>
            <!-- Floating music notes -->
            <text x="48" y="155" font-size="18" fill="rgba(220,107,47,0.4)" font-family="serif">♪</text>
            <text x="348" y="140" font-size="14" fill="rgba(220,107,47,0.3)" font-family="serif">♫</text>
            <text x="320" y="170" font-size="10" fill="rgba(220,107,47,0.2)" font-family="serif">♩</text>
            <text x="72" y="130" font-size="12" fill="rgba(220,107,47,0.25)" font-family="serif">♫</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- ── CTA ───────────────────────────────────────────────────────────────── -->
    <section class="py-20 bg-cream">
      <div class="max-w-2xl mx-auto px-6 text-center">
        <div class="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ng-icon name="heroSparkles" class="w-8 h-8 text-accent"/>
        </div>
        <h2 class="font-display text-3xl font-bold text-stone-900 mb-4">Ready to Book Your Event?</h2>
        <p class="text-stone-400 mb-8 leading-relaxed">Check real-time availability and lock in your date in under 5 minutes.</p>
        <a routerLink="/booking" class="btn-primary text-base px-8 py-3.5">
          Book Now — It's Free to Start <ng-icon name="heroArrowRight" class="w-4 h-4"/>
        </a>
      </div>
    </section>
  `
})
export class EventsComponent {

  heroStats = [
    { value: '500+', label: 'Events performed'  },
    { value: '8+',   label: 'Years experience'  },
    { value: '100%', label: 'Client satisfaction' },
  ];

  events: EventType[] = [
    {
      id:       'wedding',
      icon:     '💍',
      title:    'Weddings',
      subtitle: 'Love & Celebration',
      description: 'Your wedding day deserves a soundtrack as extraordinary as the moment itself. We handle everything from the ceremony processional to the last dance — reading the room, managing energy, and creating memories that last a lifetime.',
      highlights: [
        'Pre-event consultation & custom setlist planning',
        'Ceremony, cocktail hour & reception coverage',
        'Wireless microphone for vows & speeches',
        'Seamless coordination with your wedding planner',
        'Emergency backup equipment on every booking',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/3044477/3044477-uhd_2560_1440_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&w=800',
      accent:    'bg-pink-400',
      stats: [
        { value: '200+', label: 'Weddings played' },
        { value: '6h',   label: 'Avg. coverage'   },
        { value: '4.9★', label: 'Avg. rating'      },
      ],
    },
    {
      id:       'birthday',
      icon:     '🎂',
      title:    'Birthday Parties',
      subtitle: 'Celebrate in Style',
      description: 'From intimate 30th gatherings to milestone 50th blow-outs — we curate the perfect playlist for your crowd, keep the energy high, and make sure everyone is dancing from start to finish.',
      highlights: [
        'Era-specific or genre-specific playlists on request',
        'Crowd-reading and real-time setlist adjustments',
        'Karaoke integration available as an add-on',
        'Birthday shoutouts and personalised mic moments',
        'Setup available for indoor and outdoor venues',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/3754903/3754903-uhd_2560_1440_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&w=800',
      accent:    'bg-purple-400',
      stats: [
        { value: '150+', label: 'Parties played'  },
        { value: '4h',   label: 'Avg. set length' },
        { value: '98%',  label: 'Re-booking rate' },
      ],
    },
    {
      id:       'corporate',
      icon:     '🏢',
      title:    'Corporate Events',
      subtitle: 'Elevate Your Brand',
      description: 'Company galas, product launches, team celebrations, and award ceremonies — we deliver polished, professional entertainment that reflects well on your brand and keeps attendees engaged.',
      highlights: [
        'Background music during networking and dining',
        'High-energy sets for awards ceremonies & galas',
        'Branded playlists aligned with your company culture',
        'MC services for structured programmes',
        'Fully insured and professional at all times',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/3214070/3214070-uhd_2560_1440_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&w=800',
      accent:    'bg-blue-400',
      stats: [
        { value: '80+',  label: 'Corporate events' },
        { value: '500+', label: 'Max guest count'  },
        { value: '100%', label: 'On-time setup'    },
      ],
    },
    {
      id:       'club',
      icon:     '🎉',
      title:    'Club Nights',
      subtitle: 'Peak-Hour Energy',
      description: 'Resident sets, special events, takeovers — we bring technical precision, flawless transitions, and the ability to read a dancefloor. Every track is mixed live for maximum impact.',
      highlights: [
        'Live mixing with professional CDJ / controller setup',
        'Genre expertise: House, Techno, Hip-Hop, RnB, Afrobeats',
        'Beatmatch and harmonic mixing for seamless sets',
        'Pre-event warm-up and post-event cool-down sets',
        'Lighting and visual synchronisation available',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&w=800',
      accent:    'bg-accent',
      stats: [
        { value: '300+', label: 'Club nights'   },
        { value: '6h',   label: 'Longest set'   },
        { value: '128',  label: 'Avg. BPM'      },
      ],
    },
    {
      id:       'festival',
      icon:     '🎪',
      title:    'Festivals',
      subtitle: 'Scale Without Limits',
      description: 'Outdoor stages, multi-room festivals, and large-scale public events — we bring the experience and equipment to perform at any scale, rain or shine.',
      highlights: [
        'Large-format PA system with line-array speakers',
        'Weatherproofed equipment for outdoor stages',
        'Multiple set compatibility across one event day',
        'Coordination with event production teams',
        'Stage presence and crowd engagement expertise',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/2795405/2795405-uhd_2560_1440_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&w=800',
      accent:    'bg-emerald-400',
      stats: [
        { value: '40+',   label: 'Festivals'       },
        { value: '5k+',   label: 'Max crowd size'  },
        { value: '12h',   label: 'Longest event'   },
      ],
    },
    {
      id:       'private',
      icon:     '✨',
      title:    'Private Events',
      subtitle: 'Exclusively Yours',
      description: 'House parties, garden gatherings, anniversary dinners, and any occasion that deserves outstanding music — we tailor everything to your taste and setting.',
      highlights: [
        'Compact setup options for home and garden venues',
        'Fully customisable setlist built around your taste',
        'Flexible timing — we work around your schedule',
        'Discreet, professional service at all times',
        'Available at short notice for last-minute bookings',
      ],
      videoSrc:  'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
      posterSrc: 'https://images.pexels.com/photos/3171804/pexels-photo-3171804.jpeg?auto=compress&w=800',
      accent:    'bg-gold',
      stats: [
        { value: '120+', label: 'Private events' },
        { value: '2h',   label: 'Min. booking'   },
        { value: '24h',  label: 'Short notice'   },
      ],
    },
  ];

  processSteps = [
    { icon: '📋', title: 'Enquire',    desc: 'Book online or ask Maya our AI assistant'    },
    { icon: '📞', title: 'Consult',   desc: 'We discuss your vision and playlist preferences' },
    { icon: '🎵', title: 'Plan',      desc: 'Custom setlist and event schedule prepared'   },
    { icon: '🔊', title: 'Set Up',    desc: 'Arrive 2 hours early for full sound check'   },
    { icon: '🎧', title: 'Perform',   desc: 'Live mixing tailored to your crowd in real time' },
  ];

  equipment = [
    { icon: '🔊', name: 'PA System',       detail: 'Line-array & subwoofer rigs up to 15kW'       },
    { icon: '🎛️', name: 'DJ Controller',   detail: 'Pioneer CDJ-3000 & DJM-900 NXS2'              },
    { icon: '💡', name: 'Intelligent Lighting', detail: 'Moving heads, LED pars & laser effects'   },
    { icon: '🎤', name: 'Wireless Mic',    detail: 'Shure dual-channel wireless handheld/headset'  },
    { icon: '🔌', name: 'Power Backup',    detail: 'UPS system prevents mid-set power cuts'        },
    { icon: '🎚️', name: 'Live Monitoring', detail: 'Real-time SPL management for any venue'        },
  ];
}
