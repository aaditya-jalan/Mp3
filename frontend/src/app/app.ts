import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mp3EditorComponent } from './mp3-editor/mp3-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Mp3EditorComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>🎵 MP3 Tag Editor</h1>
        <p>Upload, edit metadata, and download your MP3 files</p>
      </header>
      <main class="app-main">
        <app-mp3-editor></app-mp3-editor>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .app-header {
      text-align: center;
      padding: 2rem 1rem;
      color: white;
    }
    
    .app-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      font-weight: 300;
    }
    
    .app-header p {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .app-main {
      padding: 0 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {
  title = 'MP3 Tag Editor';
}

// Export AppComponent as App for SSR/main.server.ts compatibility
export { AppComponent as App };
