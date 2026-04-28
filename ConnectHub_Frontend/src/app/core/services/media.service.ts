import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private baseUrl = `${environment.apiUrl}/media`;

  constructor(private http: HttpClient) { }

  upload(file: File, messageId?: number, roomId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${this.baseUrl}/upload`;
    const params = [];
    if (messageId) params.push(`messageId=${messageId}`);
    if (roomId) params.push(`roomId=${roomId}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.post(url, formData);
  }

  getByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/byUser`);
  }

  getSasUrl(fileId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sasUrl/${fileId}`);
  }

  delete(fileId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${fileId}`);
  }
}
