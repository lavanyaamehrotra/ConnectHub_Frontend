import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { SignalrService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(
    private http: HttpClient,
    private signalrService: SignalrService
  ) { }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/markAsRead/${id}`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/markAllRead`, {});
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
