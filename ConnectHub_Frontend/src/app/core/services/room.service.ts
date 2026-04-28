import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatRoom {
  roomId: string;
  roomName: string;
  description?: string;
  roomType: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  maxMembers: number;
  memberCount: number;
}

export interface CreateRoomRequest {
  roomName: string;
  description?: string;
  roomType: string;
  avatarUrl?: string;
  maxMembers?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  createRoom(request: CreateRoomRequest): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${this.apiUrl}/create`, request);
  }

  getRoomsByUser(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/by-user`);
  }

  getPublicRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/public`);
  }

  getRoomById(roomId: string): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${this.apiUrl}/by-id/${roomId}`);
  }

  joinRoom(roomId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/join/${roomId}`, {});
  }

  leaveRoom(roomId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leave/${roomId}`);
  }

  getMembers(roomId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${roomId}`);
  }

  getRoomMessages(roomId: string, page: number = 1, pageSize: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${roomId}/messages?page=${page}&pageSize=${pageSize}`);
  }

  addMember(roomId: string, userId: string, username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/addMember?roomId=${roomId}`, { userId, username });
  }

  updateRoom(roomId: string, request: Partial<CreateRoomRequest>): Observable<ChatRoom> {
    return this.http.put<ChatRoom>(`${this.apiUrl}/update?roomId=${roomId}`, request);
  }

  deleteRoom(roomId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/room/${roomId}`);
  }

  removeMember(roomId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/removeMember?roomId=${roomId}&memberUserId=${userId}`);
  }

  updateMemberRole(roomId: string, userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/memberRole?roomId=${roomId}`, { userId, role });
  }
}
