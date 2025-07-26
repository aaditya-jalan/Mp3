import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Mp3EditorService } from './mp3-editor.service';

@Component({
  selector: 'app-mp3-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mp3-editor.component.html',
  styleUrls: ['./mp3-editor.component.scss'],
  providers: [Mp3EditorService]
})
export class Mp3EditorComponent {
  selectedFile: File | null = null;
  tags: Record<string, any> | null = null;
  editedTags: Record<string, any> = {};
  downloadUrl: string | null = null;
  loading = false;
  error: string | null = null;
  newFilename: string | null = null;
  showDownloadOnly: boolean = false;
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

  constructor(private mp3Service: Mp3EditorService) {}

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
        this.tags = data.metadata || {};
        this.editedTags = { ...this.tags };
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
    this.mp3Service.editTags(filenameToSend, this.editedTags, this.coverArt || undefined).subscribe({
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
}
