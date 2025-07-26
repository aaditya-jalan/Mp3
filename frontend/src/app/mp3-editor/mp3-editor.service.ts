import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class Mp3EditorService {
  private apiUrl = 'http://localhost:8000'; // Adjust if backend runs elsewhere

  constructor(private http: HttpClient) {}

  uploadAndGetTags(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload/`, formData);
  }

  editTags(filename: string, tags: any, coverArt?: File): Observable<any> {
    const formData = new FormData();
    formData.append('filename', filename);
    Object.keys(tags).forEach(key => {
      if (tags[key] !== undefined && tags[key] !== null) {
        formData.append(key, tags[key]);
      }
    });
    if (coverArt) {
      formData.append('cover_art', coverArt);
    }
    return this.http.post<any>(`${this.apiUrl}/update-tags/`, formData);
  }

  getDownloadUrl(filename: string): string {
    return `${this.apiUrl}/download/${encodeURIComponent(filename)}`;
  }
}
