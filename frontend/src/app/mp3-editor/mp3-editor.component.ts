import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
// import { DropdownModule } from 'primeng/dropdown/primeng-dropdown';
import { ButtonModule } from 'primeng/button';
import { Mp3EditorService } from './mp3-editor.service';

@Component({
  selector: 'app-mp3-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './mp3-editor.component.html',
  styleUrls: ['./mp3-editor.component.scss'],
  providers: [Mp3EditorService]
})
export class Mp3EditorComponent {
  theme: 'light' | 'dark' = 'dark';

  constructor(
    private mp3Service: Mp3EditorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      this.theme = saved ?? 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  }

  switchTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', this.theme);
      localStorage.setItem('theme', this.theme);
    }
  }
  selectedFile: File | null = null;
  tags: Record<string, any> | null = null;
  editedTags: Record<string, any> = {};
  downloadUrl: string | null = null;
  loading = false;
  error: string | null = null;
  newFilename: string | null = null;
  showDownloadOnly: boolean = false;
  showWorkflowModal: boolean = false;
  coverArt: File | null = null;
  coverArtPreview: string | null = null;
  onCoverArtSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverArt = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverArtPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.coverArt = null;
      this.coverArtPreview = null;
    }
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.getTags();
    }
  }

  getTags() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = null;
    this.mp3Service.uploadAndGetTags(this.selectedFile).subscribe({
      next: (data: any) => {
        // Backend returns { filename, metadata }
        console.log('File data from backend:', data);
        this.tags = data.metadata || {};
        // Ensure year is in yyyy-MM-dd format for input[type=date]
        const tagsCopy = { ...this.tags };
        // Prefer 'year', but if not present, use 'date' for the date input
        let dateValue = tagsCopy['year'] || tagsCopy['date'];
        if (dateValue) {
          let dateStr = dateValue;
          // If array, use first value
          if (Array.isArray(dateStr)) {
            dateStr = dateStr[0];
          }
          // If only year (e.g. '2022'), add -01-01
          if (/^\d{4}$/.test(dateStr)) {
            dateStr = `${dateStr}-01-01`;
          }
          // If only year-month (e.g. '2022-05'), add -01
          else if (/^\d{4}-\d{2}$/.test(dateStr)) {
            dateStr = `${dateStr}-01`;
          }
          // If not yyyy-MM-dd, try to parse as Date
          else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              // Format as yyyy-MM-dd
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              dateStr = `${yyyy}-${mm}-${dd}`;
            }
          }
          tagsCopy['year'] = dateStr;
        }
        this.editedTags = tagsCopy;
        this.newFilename = data.filename || this.selectedFile?.name || '';
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to read tags.';
        this.loading = false;
      }
    });
  }

  saveTags() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = null;
    const filenameToSend = this.newFilename && this.newFilename.trim() !== '' ? this.newFilename.trim() : this.selectedFile.name;
    // Map 'year' to 'date' for backend compatibility
    const tagsToSend = { ...this.editedTags };
    if (tagsToSend['year']) {
      tagsToSend['date'] = tagsToSend['year'];
      delete tagsToSend['year'];
    }
    // Log the payload being sent to the backend
    console.log('Payload to backend:', {
      filename: filenameToSend,
      tags: tagsToSend,
      coverArt: this.coverArt
    });
    this.mp3Service.editTags(filenameToSend, tagsToSend, this.coverArt || undefined).subscribe({
      next: (res: any) => {
        // Debug: Log backend response and download_url
        console.log('Backend response:', res);
        console.log('Backend download_url:', res.download_url);
        // Backend returns { filename, download_url }
        this.downloadUrl = this.mp3Service.getDownloadUrl(res.filename || filenameToSend);
        this.showDownloadOnly = true;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to save tags.';
        this.loading = false;
      }
    });
  }

  resetEditor() {
    this.selectedFile = null;
    this.tags = null;
    this.editedTags = {};
    this.downloadUrl = null;
    this.loading = false;
    this.error = null;
    this.newFilename = null;
    this.showDownloadOnly = false;
  }

  showWorkflowHelp() {
    this.showWorkflowModal = true;
  }

  closeWorkflowHelp() {
    this.showWorkflowModal = false;
  }
}
