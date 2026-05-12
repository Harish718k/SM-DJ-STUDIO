import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule }  from 'primeng/button';
import { CardModule }    from 'primeng/card';
import { RippleModule }  from 'primeng/ripple';
import { PackageService } from '../../core/services/api.service';
import { AuthService }    from '../../core/services/auth.service';
import { User, Package }  from '../../shared/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, RippleModule],
  template: `
    <!-- NAVBAR
    <nav style="position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-bottom:1px solid #e7e5e4">
      <div style="max-width:1140px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between">
        <a routerLink="/" style="font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:#1c1917;text-decoration:none">
          🎧 DJ <span style="color:#dc6b2f">BookPro</span>
        </a>
        <div style="display:flex;align-items:center;gap:24px;font-size:14px;font-weight:600;color:#78716c">
          <a href="#packages" style="color:#78716c;text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#78716c'">Packages</a>
          <a routerLink="/events"   style="color:#78716c;text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#78716c'">Events</a>
          <a routerLink="/reviews"  style="color:#78716c;text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#78716c'">Reviews</a>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <ng-container *ngIf="!isLoggedIn">
            <a routerLink="/login" style="font-size:14px;font-weight:600;color:#57534e;padding:8px 16px;border-radius:8px;text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#57534e'">Sign In</a>
            <a routerLink="/booking" style="font-size:14px;font-weight:700;color:#fff;background:#dc6b2f;padding:10px 20px;border-radius:12px;text-decoration:none;transition:background .15s" onmouseenter="this.style.background='#c45a22'" onmouseleave="this.style.background='#dc6b2f'">Book Now</a>
          </ng-container>
          <ng-container *ngIf="isLoggedIn">
            <a [routerLink]="isAdmin ? '/admin' : '/dashboard'" style="font-size:14px;font-weight:600;color:#57534e;padding:8px 16px;border-radius:8px;text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#57534e'">{{ isAdmin ? 'Admin Panel' : 'My Bookings' }}</a>
            <a [routerLink]="isAdmin ? '/admin/profile' : '/dashboard/profile'" style="display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:999px;border:1.5px solid #e7e5e4;background:#f5f5f4;text-decoration:none;transition:border-color .15s" onmouseenter="this.style.borderColor='#dc6b2f'" onmouseleave="this.style.borderColor='#e7e5e4'">
              <img *ngIf="user?.profilePicture" [src]="user!.profilePicture!" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover" />
              <span *ngIf="!user?.profilePicture" style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#dc6b2f,#e8922a);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center">{{ userInitial }}</span>
              <span style="font-size:13px;font-weight:600;color:#1c1917;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ firstName }}</span>
            </a>
          </ng-container>
        </div>
      </div>
    </nav> -->

    <!-- HERO -->
    <section style="min-height:100vh;display:flex;align-items:center;background:linear-gradient(135deg,#faf8f5 0%,#f4f1ec 60%,#fff4ee 100%)">
      <div style="max-width:1140px;margin:0 auto;padding:80px 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
        <div>
          <span style="display:inline-flex;align-items:center;gap:8px;background:#fff4ee;color:#dc6b2f;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;padding:8px 16px;border-radius:999px;margin-bottom:24px">✦ Available for bookings</span>
          <h1 style="font-family:'Playfair Display',serif;font-size:3.5rem;font-weight:900;color:#1c1917;line-height:1.1;margin-bottom:24px">Your Event.<br><span style="color:#dc6b2f">Your Music.</span><br>Perfectly Mixed.</h1>
          <p style="color:#78716c;font-size:1.1rem;line-height:1.75;margin-bottom:40px;max-width:480px">Professional DJ services for weddings, corporate events, birthday parties and more. Real-time booking, instant confirmation.</p>
          <div style="display:flex;flex-wrap:wrap;gap:16px">
            <a routerLink="/booking" style="display:inline-flex;align-items:center;gap:8px;background:#dc6b2f;color:#fff;font-weight:700;padding:16px 32px;border-radius:16px;font-size:1rem;text-decoration:none;transition:all .15s;box-shadow:0 8px 24px rgba(220,107,47,.25)" onmouseenter="this.style.background='#c45a22';this.style.transform='translateY(-2px)'" onmouseleave="this.style.background='#dc6b2f';this.style.transform=''">Check Availability →</a>
            <a href="#packages" style="display:inline-flex;align-items:center;font-weight:700;padding:16px 32px;border-radius:16px;font-size:1rem;text-decoration:none;border:2px solid #d6d3d1;color:#57534e;transition:all .15s" onmouseenter="this.style.borderColor='#dc6b2f';this.style.color='#dc6b2f'" onmouseleave="this.style.borderColor='#d6d3d1';this.style.color='#57534e'">View Packages</a>
          </div>
          <div style="display:flex;align-items:center;gap:32px;margin-top:40px;padding-top:40px;border-top:1px solid #e7e5e4">
            <div><div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:#1c1917">500+</div><div style="font-size:11px;color:#a8a29e;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Events Done</div></div>
            <div style="width:1px;height:32px;background:#e7e5e4"></div>
            <div><div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:#1c1917">8+</div><div style="font-size:11px;color:#a8a29e;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Years Exp.</div></div>
            <div style="width:1px;height:32px;background:#e7e5e4"></div>
            <div><div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:#1c1917">4.9★</div><div style="font-size:11px;color:#a8a29e;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Avg Rating</div></div>
          </div>
        </div>
        <!-- DJ Card -->
        <div style="display:flex;justify-content:center">
          <div style="position:relative">
            <div style="width:280px;background:#1e2a4a;border-radius:24px;padding:28px;box-shadow:0 24px 64px rgba(30,42,74,.4);color:#fff">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#dc6b2f">Now Playing</span>
                <div style="display:flex;gap:3px;align-items:flex-end;height:20px">
                  <div *ngFor="let b of bars" style="width:4px;border-radius:2px;background:#dc6b2f;animation:eq .8s ease-in-out infinite alternate" [style.height.px]="b"></div>
                </div>
              </div>
              <div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">Summer Vibes Mix</div>
              <div style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px">Live Set · 128 BPM</div>
              <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.3);margin-bottom:6px"><span>2:34</span><span>5:12</span></div>
              <div style="height:4px;background:rgba(255,255,255,.1);border-radius:4px;margin-bottom:24px">
                <div style="height:100%;width:50%;background:#dc6b2f;border-radius:4px"></div>
              </div>
              <div style="display:flex;justify-content:center;gap:24px;font-size:1.4rem">
                <button style="background:none;border:none;color:#fff;cursor:pointer;transition:color .15s;font-size:1.2rem" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#fff'">⏮</button>
                <button style="width:48px;height:48px;background:#dc6b2f;border:none;border-radius:50%;color:#fff;cursor:pointer;font-size:1rem;transition:background .15s" onmouseenter="this.style.background='#c45a22'" onmouseleave="this.style.background='#dc6b2f'">▶</button>
                <button style="background:none;border:none;color:#fff;cursor:pointer;transition:color .15s;font-size:1.2rem" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='#fff'">⏭</button>
              </div>
            </div>
            <div style="position:absolute;bottom:-16px;right:-24px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(28,25,23,.12);padding:12px 20px;border:1px solid #f5f5f4">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:10px;height:10px;background:#10b981;border-radius:50%;animation:pulse 2s infinite"></div>
                <span style="font-size:13px;font-weight:600;color:#1c1917">Available this weekend</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section style="padding:96px 0;background:#fff">
      <div style="max-width:1140px;margin:0 auto;padding:0 24px">
        <div style="text-align:center;margin-bottom:64px">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#dc6b2f">Simple Process</span>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#1c1917;margin-top:12px">Book in 4 Easy Steps</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px">
          <div *ngFor="let s of steps; let i = index" style="text-align:center">
            <div style="width:64px;height:64px;background:#fff4ee;border:2px solid rgba(220,107,47,.2);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 16px">{{ s.icon }}</div>
            <div style="width:28px;height:28px;background:#dc6b2f;color:#fff;font-size:12px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">{{ i + 1 }}</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#1c1917;margin-bottom:8px">{{ s.title }}</h3>
            <p style="font-size:13px;color:#a8a29e;line-height:1.65">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PACKAGES -->
    <section id="packages" style="padding:96px 0;background:#faf8f5">
      <div style="max-width:1140px;margin:0 auto;padding:0 24px">
        <div style="text-align:center;margin-bottom:64px">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#dc6b2f">Transparent Pricing</span>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#1c1917;margin-top:12px">Choose Your Package</h2>
        </div>
        <div *ngIf="isLoadingPackages" style="text-align:center;padding:48px 0;color:#a8a29e">Loading packages…</div>
        <div *ngIf="!isLoadingPackages" style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
          <div *ngFor="let p of packages; let i = index"
               style="position:relative;background:#fff;border-radius:24px;padding:32px;border:2px solid;transition:box-shadow .2s"
               [style.border-color]="i===1 ? '#dc6b2f' : '#e7e5e4'"
               [style.box-shadow]="i===1 ? '0 16px 48px rgba(220,107,47,.15)' : '0 2px 8px rgba(28,25,23,.05)'">
            <div *ngIf="i===1" style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:#dc6b2f;color:#fff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:999px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">Most Popular</div>
            <div style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#dc6b2f;margin-bottom:4px">\${{ p.basePrice }}</div>
            <div style="font-size:12px;color:#a8a29e;margin-bottom:16px">starting price</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:#1c1917;margin-bottom:8px">{{ p.name }}</h3>
            <p style="font-size:13px;color:#a8a29e;margin-bottom:20px;line-height:1.65">{{ p.description }}</p>
            <div style="font-size:12px;font-weight:700;color:#a8a29e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">⏱ Up to {{ p.duration }} hours</div>
            <ul style="list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:10px">
              <li *ngFor="let f of p.features" style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#57534e">
                <span style="color:#10b981;font-weight:700;margin-top:2px">✓</span>{{ f }}
              </li>
            </ul>
            <a routerLink="/booking" style="display:block;text-align:center;font-weight:700;padding:12px;border-radius:12px;font-size:14px;text-decoration:none;transition:all .15s"
               [style.background]="i===1 ? '#dc6b2f' : 'transparent'"
               [style.color]="i===1 ? '#fff' : '#57534e'"
               [style.border]="i!==1 ? '2px solid #d6d3d1' : 'none'">
              Book This Package
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- EVENT TYPES -->
    <section id="events" style="padding:96px 0;background:#fff">
      <div style="max-width:1140px;margin:0 auto;padding:0 24px">
        <div style="text-align:center;margin-bottom:64px">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#dc6b2f">All Occasions</span>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#1c1917;margin-top:12px">We Play at Every Event</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
          <div *ngFor="let e of events" style="display:flex;align-items:flex-start;gap:16px;background:#f5f5f4;border:1px solid #e7e5e4;border-radius:16px;padding:24px;transition:all .15s;cursor:default" onmouseenter="this.style.background='#fff4ee';this.style.borderColor='rgba(220,107,47,.3)'" onmouseleave="this.style.background='#f5f5f4';this.style.borderColor='#e7e5e4'">
            <div style="font-size:2rem;flex-shrink:0">{{ e.icon }}</div>
            <div>
              <h3 style="font-weight:700;color:#1c1917;margin-bottom:4px;font-size:15px">{{ e.title }}</h3>
              <p style="font-size:13px;color:#a8a29e;line-height:1.6;margin:0">{{ e.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- REVIEWS -->
    <section id="reviews" style="padding:96px 0;background:#faf8f5">
      <div style="max-width:1140px;margin:0 auto;padding:0 24px">
        <div style="text-align:center;margin-bottom:64px">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#dc6b2f">Testimonials</span>
          <h2 style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#1c1917;margin-top:12px">What Clients Say</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
          <div *ngFor="let r of reviews" style="background:#fff;border-radius:24px;padding:32px;border:1px solid #e7e5e4;box-shadow:0 2px 8px rgba(28,25,23,.05)">
            <div style="color:#f59e0b;letter-spacing:.15em;margin-bottom:16px;font-size:14px">★★★★★</div>
            <p style="color:#78716c;font-size:14px;line-height:1.75;font-style:italic;margin-bottom:24px">"{{ r.text }}"</p>
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#dc6b2f,#e8922a);color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">{{ r.name[0] }}</div>
              <div>
                <div style="font-weight:600;color:#1c1917;font-size:14px">{{ r.name }}</div>
                <div style="font-size:12px;color:#a8a29e;margin-top:2px">{{ r.event }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section style="padding:96px 0;background:#1e2a4a">
      <div style="max-width:680px;margin:0 auto;padding:0 24px;text-align:center">
        <h2 style="font-family:'Playfair Display',serif;font-size:2.8rem;font-weight:700;color:#fff;margin-bottom:20px">Ready to Make Your Event Unforgettable?</h2>
        <p style="color:rgba(255,255,255,.6);font-size:1.1rem;margin-bottom:40px">Check real-time availability and book in minutes.</p>
        <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">
          <a routerLink="/booking" style="display:inline-flex;align-items:center;background:#dc6b2f;color:#fff;font-weight:700;padding:16px 40px;border-radius:16px;text-decoration:none;transition:all .15s" onmouseenter="this.style.background='#c45a22'" onmouseleave="this.style.background='#dc6b2f'">Book Now →</a>
          <a routerLink="/register" style="display:inline-flex;align-items:center;color:rgba(255,255,255,.8);font-weight:700;padding:16px 40px;border-radius:16px;border:2px solid rgba(255,255,255,.25);text-decoration:none;transition:all .15s" onmouseenter="this.style.borderColor='white';this.style.color='white'" onmouseleave="this.style.borderColor='rgba(255,255,255,.25)';this.style.color='rgba(255,255,255,.8)'">Create Account</a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <!-- <footer style="background:#111827;border-top:1px solid rgba(255,255,255,.06)">
      <div style="max-width:1140px;margin:0 auto;padding:64px 24px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:48px">
        <div style="max-width:260px">
          <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:#fff;margin-bottom:12px">🎧 DJ BookPro</div>
          <p style="color:rgba(255,255,255,.4);font-size:13px;line-height:1.65;margin:0">Professional DJ services for every occasion. Book online, get confirmed fast.</p>
        </div>
        <div style="display:flex;gap:56px;font-size:14px">
          <div style="display:flex;flex-direction:column;gap:12px">
            <span style="color:rgba(255,255,255,.25);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em">Services</span>
            <span *ngFor="let e of events" style="color:rgba(255,255,255,.5);cursor:default">{{ e.title }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <span style="color:rgba(255,255,255,.25);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em">Account</span>
            <a routerLink="/login"    style="color:rgba(255,255,255,.5);text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='rgba(255,255,255,.5)'">Sign In</a>
            <a routerLink="/register" style="color:rgba(255,255,255,.5);text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='rgba(255,255,255,.5)'">Register</a>
            <a routerLink="/booking"  style="color:rgba(255,255,255,.5);text-decoration:none;transition:color .15s" onmouseenter="this.style.color='#dc6b2f'" onmouseleave="this.style.color='rgba(255,255,255,.5)'">Book Now</a>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.06);padding:20px 24px;max-width:1140px;margin:0 auto;display:flex;justify-content:space-between;color:rgba(255,255,255,.25);font-size:12px">
        <span>© {{ year }} DJ BookPro. All rights reserved.</span>
        <span>Made with ♪</span>
      </div>
    </footer> -->
  `,
  styles: [`
    @keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  packages: Package[] = [];
  isLoadingPackages = true;
  year = new Date().getFullYear();
  bars = Array.from({ length: 8 }, () => Math.floor(Math.random() * 14) + 6);

  steps = [
    { icon: '📦', title: 'Choose a Package', desc: 'Browse service packages and select one that fits your event and budget.' },
    { icon: '📅', title: 'Pick a Date',      desc: 'View real-time availability and choose your event date.' },
    { icon: '📝', title: 'Share Details',    desc: 'Tell us about your event — venue, timing, guest count, and requests.' },
    { icon: '✅', title: 'Get Confirmed',    desc: 'We review and confirm within 24 hours with a full email confirmation.' }
  ];

  events = [
    { icon: '💍', title: 'Weddings',         desc: 'From ceremony to last dance, the perfect soundtrack for your day.' },
    { icon: '🎂', title: 'Birthday Parties', desc: 'Keep the energy and dancefloor packed all night long.' },
    { icon: '🏢', title: 'Corporate Events', desc: 'Elevate your galas with professional, polished entertainment.' },
    { icon: '🎉', title: 'Club Nights',      desc: 'High-energy mixes, flawless transitions, crowd that never stops.' },
    { icon: '🎪', title: 'Festivals',        desc: 'Intimate garden parties to large-scale outdoor events.' },
    { icon: '✨', title: 'Private Events',   desc: 'Any occasion worth celebrating deserves exceptional music.' }
  ];

  reviews = [
    { text: 'The DJ read the crowd perfectly and kept everyone on the dancefloor all night. Best wedding decision we made!', name: 'Sarah & James M.', event: 'Wedding Reception' },
    { text: 'Professional, punctual, and the music was flawless. Our corporate gala was a huge success.', name: 'David K.', event: 'Corporate Gala' },
    { text: 'My 30th birthday was legendary! Everyone is still talking about the music. So easy to book.', name: 'Michelle T.', event: 'Birthday Party' }
  ];

  isLoggedIn = false;
  isAdmin    = false;
  user: User | null = null;
  private _sub!: Subscription;

  constructor(
    private packageService: PackageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this._sub = this.authService.currentUser$.subscribe((u: User | null) => {
      this.user       = u;
      this.isLoggedIn = !!u && !!localStorage.getItem('token');
      this.isAdmin    = u?.role === 'admin';
    });
    this.packageService.getPackages().subscribe({
      next: (res) => { this.packages = res.data; this.isLoadingPackages = false; },
      error: ()   => { this.isLoadingPackages = false; }
    });
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  get userInitial(): string { return (this.user?.name || 'U')[0].toUpperCase(); }
  get firstName():   string { return this.user?.name?.split(' ')[0] || ''; }
}
