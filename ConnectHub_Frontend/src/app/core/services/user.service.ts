import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;
  constructor(private http: HttpClient, private authService: AuthService) { }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, data).pipe(
      tap((res: any) => {
        if (res.success || res) {
          // Update global reactive user state
          this.authService.updateUserLocal(data);
        }
      })
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password`, data);
  }

  deactivateAccount(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deactivate`);
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/search?q=${query}`);
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }

  getOnlineUserIds(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/presence/online`);
  }

  getUsersByIds(userIds: string[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/by-ids`, userIds);
  }
}
