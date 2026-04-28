import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection | undefined;
  
  // Use Subject instead of BehaviorSubject to avoid receiving null/old values on subscribe
  public messageReceived$ = new Subject<any>();
  public messageSent$ = new Subject<any>();
  public messageEdited$ = new Subject<any>();
  public messageDeleted$ = new Subject<string>();
  public typingIndicator$ = new Subject<any>();
  public userPresence$ = new Subject<any>();
  public messageRead$ = new Subject<any>();
  public allMessagesRead$ = new Subject<any>();
  public roomMessageReceived$ = new Subject<any>();
  public roomMessageEdited$ = new Subject<any>();
  public roomMessageDeleted$ = new Subject<string>();

  constructor(private authService: AuthService) {
    // Initialization is handled by LayoutComponent to control lifecycle
  }

  public connected$ = new Subject<void>();

  public startConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR connection already started.');
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started successfully. Current state:', this.hubConnection?.state);
        this.registerOnEvents();
        this.connected$.next(); // Signal that connection is ready
      })
      .catch(err => {
        console.error('SignalR connection failed to start:', err);
        // Retry logic is already handled by withAutomaticReconnect for transient errors,
        // but explicit start failures need to be visible.
      });

    // Also emit on reconnect
    this.hubConnection.onreconnected(() => {
      this.connected$.next();
    });
  }

  public stopConnection(): void {
    this.hubConnection?.stop()
      .then(() => console.log('SignalR connection stopped'))
      .catch(err => console.error('Error while stopping connection: ' + err));
  }

  private registerOnEvents(): void {
    // DO NOT re-assign the subjects here! Just call .next()
    this.hubConnection?.on('ReceiveMessage', (data) => {
      this.messageReceived$.next(data);
    });

    this.hubConnection?.on('MessageSent', (data) => {
      this.messageSent$.next(data);
    });
    
    this.hubConnection?.on('MessageRead', (data) => {
      this.messageRead$.next(data);
    });

    this.hubConnection?.on('AllMessagesRead', (data) => {
      this.allMessagesRead$.next(data);
    });
    
    this.hubConnection?.on('MessageEdited', (data) => {
      this.messageEdited$.next(data);
    });

    this.hubConnection?.on('MessageDeleted', (messageId) => {
      this.messageDeleted$.next(messageId);
    });

    this.hubConnection?.on('UserTyping', (data) => {
      this.typingIndicator$.next(data);
    });

    this.hubConnection?.on('UserOnline', (userId) => {
      this.userPresence$.next({ userId, isOnline: true });
    });

    this.hubConnection?.on('UserOffline', (userId) => {
      this.userPresence$.next({ userId, isOnline: false });
    });

    this.hubConnection?.on('OnlineUsers', (userIds: string[]) => {
      this.userPresence$.next({ userIds, isBulk: true });
    });

    this.hubConnection?.on('ReceiveRoomMessage', (data) => {
      this.roomMessageReceived$.next(data);
    });

    this.hubConnection?.on('RoomMessageEdited', (data) => {
      this.roomMessageEdited$.next(data);
    });

    this.hubConnection?.on('RoomMessageDeleted', (messageId) => {
      this.roomMessageDeleted$.next(messageId);
    });
  }

  public async requestOnlineUsers(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('RequestOnlineUsers');
    }
  }

  public async sendMessage(receiverId: string, content: string): Promise<void> {
    const state = this.hubConnection?.state;
    if (state === signalR.HubConnectionState.Connected) {
      await this.hubConnection?.invoke('SendDirectMessage', receiverId, content);
    } else {
      console.error(`Cannot send message: SignalR is in '${state}' state (not Connected)`);
      // If we are disconnected, try to restart
      if (state === signalR.HubConnectionState.Disconnected) {
        this.startConnection();
      }
    }
  }

  public async sendMediaMessage(receiverId: string, content: string, mediaUrl: string, messageType: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendMediaMessage', receiverId, content, mediaUrl, messageType);
    } else {
      console.error('Cannot send media message: SignalR not connected');
    }
  }

  public sendTypingIndicator(receiverId: string, isTyping: boolean): void {
    this.hubConnection?.invoke('TypingIndicator', receiverId, isTyping)
      .catch(err => console.error(err));
  }

  public async editMessage(messageId: string, newContent: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('EditMessage', messageId, newContent);
    }
  }

  public async deleteMessage(messageId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('DeleteMessage', messageId);
    }
  }

  public async joinRoom(roomId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinRoom', roomId);
    }
  }

  public async leaveRoom(roomId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveRoom', roomId);
    }
  }

  public async sendRoomMessage(roomId: string, content: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendRoomMessage', roomId, content);
    }
  }

  public async sendRoomMediaMessage(roomId: string, content: string, mediaUrl: string, messageType: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendRoomMediaMessage', roomId, content, mediaUrl, messageType);
    }
  }

  public async editRoomMessage(messageId: string, newContent: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('EditRoomMessage', messageId, newContent);
    }
  }

  public async deleteRoomMessage(messageId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('DeleteRoomMessage', messageId);
    }
  }

  public async markMessageAsRead(messageId: string, senderId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('MarkMessageRead', messageId, senderId);
    }
  }

  public async markAllAsRead(otherUserId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('MarkAllAsRead', otherUserId);
    }
  }
}
