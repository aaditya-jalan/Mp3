import { Component, OnInit, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Mp3EditorComponent } from './mp3-editor/mp3-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Mp3EditorComponent],
  template: `
    <div class="app-container" [attr.data-theme]="theme">
      <header class="main-header">
        <div class="header-left">
          <span class="music-icon">♪</span>
          <span class="main-logo">MP3</span>
          <span class="tag-editor-text clickable" (click)="resetMp3Editor()">Tag Editor</span>
        </div>
        <div class="header-right">
          <span class="about-text" (click)="showAboutUs()">About Us</span>
        </div>
      </header>
      <main class="app-main">
        <app-mp3-editor #mp3Editor></app-mp3-editor>
      </main>
      
      <!-- About Us Modal -->
      <div class="about-modal" *ngIf="showAboutModal" (click)="closeAboutUs()">
        <div class="about-content" (click)="$event.stopPropagation()">
          <div class="about-header">
            <h2>About Us</h2>
            <button class="close-btn" (click)="closeAboutUs()">×</button>
          </div>
          <div class="about-body">
            <p>Welcome to MP3 Tag Editor, your go-to solution for managing and editing MP3 metadata with ease and precision.</p>
            
            <h3>What We Do</h3>
            <p>Our application allows you to edit various metadata tags in your MP3 files, including:</p>
            <ul>
              <li>Song title and artist information</li>
              <li>Album name and track numbers</li>
              <li>Genre classification</li>
              <li>Release dates</li>
              <li>Album artwork</li>
              <li>And much more!</li>
            </ul>
            
            <h3>Features</h3>
            <ul>
              <li>Simple and intuitive user interface</li>
              <li>Fast and efficient processing</li>
              <li>Support for all major MP3 formats</li>
              <li>High-quality output files</li>
              <li>Secure file handling</li>
            </ul>
            
            <h3>How It Works</h3>
            <p>Simply upload your MP3 file, edit the metadata tags as needed, and download your updated file. Our system preserves audio quality while updating only the metadata information.</p>
            
            <p class="footer-note">Thank you for choosing MP3 Tag Editor for your audio file management needs!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('mp3Editor') mp3EditorComponent?: Mp3EditorComponent;

  resetMp3Editor() {
    this.mp3EditorComponent?.resetEditor();
  }
  
  showAboutModal = false;
  theme: 'light' | 'dark' = 'dark';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      this.theme = saved ?? 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
    }
    // Listen for scroll state changes
    setTimeout(() => this.updateScroll(), 0);
  }

  ngAfterViewChecked(): void {
    this.updateScroll();
  }

  updateScroll() {
    // If in upload or download state, disable scroll
    const editor = this.mp3EditorComponent;
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (editor && (!editor.selectedFile || editor.showDownloadOnly)) {
      document.body.style.overflow = 'hidden';
      if (appContainer) appContainer.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (appContainer) appContainer.style.overflow = '';
    }
  }

  toggleTheme(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      const isDark = (event.target as HTMLInputElement).checked;
      this.theme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      localStorage.setItem('theme', this.theme);
    }
  }

  showAboutUs() {
    this.showAboutModal = true;
  }

  closeAboutUs() {
    this.showAboutModal = false;
  }
}

export { AppComponent as App };
