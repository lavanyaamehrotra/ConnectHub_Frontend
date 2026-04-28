import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private authApi = `${environment.apiUrl}/user`;
  private notifyApi = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.authApi}/all`);
  }

  toggleUserStatus(userId: string): Observable<any> {
    return this.http.post(`${this.authApi}/${userId}/toggle-active`, {});
  }

  sendBulkNotification(title: string, message: string, recipientIds: string[]): Observable<any> {
    return this.http.post(`${this.notifyApi}/sendBulk`, {
      title,
      message,
      type: 'BROADCAST',
      recipientIds
    });
  }

  getSystemStats(): Observable<any> {
    // Optional: could call different services to get counts
    return this.http.get(`${environment.apiUrl}/auth/stats`); // Hypothetical
  }
}
