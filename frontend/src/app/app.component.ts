/**
 * app.component.ts  — FULL REPLACEMENT
 *
 * Wires HeaderComponent, FooterComponent, RouterOutlet, and AiChatComponent
 * together as the app shell. Every routed page automatically gets the
 * shared header and footer without any per-component setup.
 *
 * Place in: src/app/app.ts  (or app.component.ts depending on your project)
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AiChatComponent } from './shared/components/chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, AiChatComponent],
  template: `
    <app-header *ngIf="showShell"/>

    <main>
      <router-outlet/>
    </main>

    <app-footer *ngIf="showShell"/>

    <!-- AI chat shown everywhere except auth pages -->
    <app-ai-chat *ngIf="showChat"/>
  `
})
export class AppComponent implements OnInit {
  currentUrl = '/';

  /** Routes that get NO header/footer (full-screen auth layouts) */
  private shellExcluded = ['/login', '/register'];

  /** Routes that also get NO AI chat bubble */
  private chatExcluded  = ['/login', '/register'];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Update currentUrl on every navigation so *ngIf re-evaluates
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
        this.cdr.detectChanges();
      });
  }

  get showShell(): boolean {
    const url = this.currentUrl.split('?')[0];
    return !this.shellExcluded.includes(url) &&
           !url.startsWith('/admin') &&
           !url.startsWith('/dashboard');
  }

  get showChat(): boolean {
    const url = this.currentUrl.split('?')[0];
    return !this.chatExcluded.includes(url);
  }
}
