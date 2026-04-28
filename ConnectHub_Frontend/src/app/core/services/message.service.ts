import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) { }

  getConversation(otherUserId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/direct/${otherUserId}`);
  }

  getRoomMessages(roomId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/room/${roomId}`);
  }

  getRecentChats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/recent`);
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/unread`);
  }

  searchMessages(query: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/search?q=${query}`);
  }

  markAsRead(messageId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/markRead/${messageId}`, {});
  }

  markAllAsRead(otherUserId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/mark-all-read/${otherUserId}`, {});
  }

  markAllGlobalAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/mark-all-read`, {});
  }

  editMessage(messageId: string, content: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/edit/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${messageId}`);
  }
}
