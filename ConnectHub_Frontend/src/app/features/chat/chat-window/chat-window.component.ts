import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { MenuItem, MessageService as ToastService } from 'primeng/api';
import { MessageService as AppMessageService } from '../../../core/services/message.service';
import { UserService } from '../../../core/services/user.service';
import { RoomService } from '../../../core/services/room.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TransformMediaUrlPipe } from '../../../shared/pipes/transform-media-url.pipe';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AvatarModule,
    ScrollPanelModule,
    BadgeModule,
    MenuModule,
    TooltipModule,
    DialogModule,
    TagModule,
    DividerModule,
    DropdownModule,
    TransformMediaUrlPipe
  ],
  providers: [ToastService],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  users: any[] = [];
  selectedUser: any = null;
  selectedRoom: any = null;
  myRooms: any[] = [];
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any;
  typingUser: string | null = null;
  searchQuery: string = '';
  messageSearchQuery: string = '';
  isSearchingMessages: boolean = false;
  isAdmin: boolean = false;
  allUsers: any[] = [];
  selectedUserToAdd: any = null;

  editingMessageId: string | null = null;
  editContent: string = '';
  deleteMenuItems: MenuItem[] = [];
  selectedMessageForMenu: any = null;
  displayRoomInfo: boolean = false;
  roomMembers: any[] = [];
  
  isEditingRoom: boolean = false;
  editRoomForm: any = {
    roomName: '',
    description: '',
    maxMembers: 500,
    avatarUrl: ''
  };
  availableRoles: any[] = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Moderator', value: 'MODERATOR' },
    { label: 'Member', value: 'MEMBER' }
  ];
  
  private onlineUserIds: Set<string> = new Set<string>();
  private subs = new Subscription();

  constructor(
    private messageService: AppMessageService,
    private toastService: ToastService,
    private userService: UserService,
    private signalrService: SignalrService,
    private authService: AuthService,
    private mediaService: MediaService,
    private roomService: RoomService,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getUser();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (this.selectedUser || this.selectedRoom)) {
      this.mediaService.upload(file).subscribe({
        next: (res: any) => {
          const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
          const rawUrl = res.blobUrl || res.fileUrl;
          const mediaUrl = this.transformUrl(rawUrl);
          
          if (this.selectedRoom) {
            this.signalrService.sendRoomMediaMessage(this.selectedRoom.roomId, '', mediaUrl, messageType);
          } else if (this.selectedUser) {
            this.signalrService.sendMediaMessage(this.selectedUser.id, '', mediaUrl, messageType);
          }
        },
        error: (err) => console.error('Upload failed:', err)
      });
    }
  }

  transformUrl(url: string): string {
    if (!url) return '';
    let fixedUrl = url;
    fixedUrl = fixedUrl.replace(/azurite:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/127\.0\.0\.1:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/host\.docker\.internal:10000/gi, 'localhost:10000');
    if (fixedUrl.includes('localhost:10000') && !fixedUrl.includes('devstoreaccount1')) {
      fixedUrl = fixedUrl.replace('localhost:10000/', 'localhost:10000/devstoreaccount1/');
    }
    return fixedUrl;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = {
          ...user,
          id: user.id || user.userId || user.UserId,
          displayName: user.displayName || user.DisplayName,
          avatarUrl: user.avatarUrl || user.AvatarUrl
        };
      }
    });
    this.loadRecentChats();
    this.loadMyRooms();

    this.subs.add(
      this.signalrService.connected$.subscribe(() => {
        setTimeout(() => this.refreshOnlineStatus(), 800);
      })
    );

    this.subs.add(
      this.route.queryParams.subscribe(params => {
        const roomId = params['roomId'];
        if (roomId) {
          this.loadRoomById(roomId);
        }
      })
    );

    this.subs.add(
      this.signalrService.messageReceived$.subscribe(msg => {
        if (!msg) return;
        const msgId = (msg.messageId || msg.MessageId)?.toString().toLowerCase();
        const senderId = (msg.senderId || msg.SenderId)?.toString().toLowerCase();
        const receiverId = (msg.receiverId || msg.ReceiverId)?.toString().toLowerCase();
        const currentUserId = this.currentUser.id?.toString().toLowerCase();
        const selectedId = this.selectedUser?.id?.toString().toLowerCase();
        
        // 1. If this message belongs to the current open chat, add it to the window
        if (this.selectedUser && (senderId === selectedId || receiverId === selectedId)) {
          const exists = this.messages.some(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === msgId);
          if (!exists) {
            msg.mediaUrl = this.transformUrl(msg.mediaUrl || msg.MediaUrl);
            this.messages.push(msg);
            this.scrollToBottom();

            if (senderId === selectedId) {
              this.signalrService.markMessageAsRead(msg.messageId || msg.MessageId, msg.senderId || msg.SenderId);
            }
          }
        }

        const partnerId = senderId === currentUserId ? receiverId : senderId;
        let sidebarUser = this.users.find(u => u.id?.toString().toLowerCase() === partnerId);
        
        if (sidebarUser) {
          sidebarUser.lastMessage = msg.content || msg.Content || '📷 Media';
          sidebarUser.lastMessageTime = msg.sentAt || msg.SentAt;
          if (partnerId !== selectedId) {
            sidebarUser.unreadCount = (sidebarUser.unreadCount || 0) + 1;
          } else {
            sidebarUser.unreadCount = 0;
          }
          this.sortUsersByTime();
        } else {
          const newUser = {
            id: partnerId,
            displayName: msg.senderDisplayName || msg.SenderDisplayName || 'New Chat',
            lastMessage: msg.content || msg.Content || '📷 Media',
            lastMessageTime: msg.sentAt || msg.SentAt,
            unreadCount: (partnerId !== selectedId) ? 1 : 0,
            isOnline: false
          };
          this.users = [newUser, ...this.users];
          this.enrichUnknownUsers();
        }
        this.deduplicateSidebar();
      })
    );

    this.subs.add(
      this.signalrService.messageSent$.subscribe(msg => {
        if (msg && this.selectedUser) {
          const msgId = (msg.messageId || msg.MessageId)?.toString().toLowerCase();
          const receiverId = (msg.receiverId || msg.ReceiverId)?.toString().toLowerCase();
          const selectedId = this.selectedUser.id?.toString().toLowerCase();
          
          if (receiverId === selectedId) {
            const exists = this.messages.some(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === msgId);
            if (!exists) {
              msg.mediaUrl = this.transformUrl(msg.mediaUrl || msg.MediaUrl);
              this.messages.push(msg);
              this.scrollToBottom();
            }
          }
          const sidebarUser = this.users.find(u => u.id?.toString().toLowerCase() === selectedId);
          if (sidebarUser) {
            sidebarUser.lastMessage = msg.content || msg.Content || '📷 Media';
            sidebarUser.lastMessageTime = msg.sentAt || msg.SentAt;
          }
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageReceived$.subscribe(msg => {
        if (!msg) return;
        console.log('SignalR: ReceiveRoomMessage', msg);
        const roomId = (msg.roomId || msg.RoomId)?.toString().toLowerCase();
        const currentRoomId = this.selectedRoom?.roomId?.toString().toLowerCase();
        const messageId = msg.messageId || msg.MessageId;

        if (roomId && currentRoomId && roomId === currentRoomId) {
          if (!this.messages.find(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === messageId?.toString().toLowerCase())) {
            msg.mediaUrl = this.transformUrl(msg.mediaUrl || msg.MediaUrl);
            this.messages.push(msg);
            this.scrollToBottom();
          }

          const senderId = (msg.senderId || msg.SenderId)?.toString().toLowerCase();
          const currentUserId = this.currentUser.id?.toString().toLowerCase();
          if (senderId !== currentUserId) {
            console.log('Marking room message as read:', messageId);
            this.signalrService.markRoomMessageAsRead(roomId, messageId);
          }
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageEdited$.subscribe(updatedMsg => {
        if (updatedMsg && this.selectedRoom) {
          const incomingRoomId = (updatedMsg.roomId || updatedMsg.RoomId)?.toString().toLowerCase();
          const currentRoomId = this.selectedRoom.roomId?.toString().toLowerCase();
          
          if (incomingRoomId === currentRoomId) {
            const targetId = (updatedMsg.messageId || updatedMsg.MessageId)?.toString().toLowerCase();
            const index = this.messages.findIndex(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
            
            if (index !== -1) {
              this.messages[index].content = updatedMsg.content || updatedMsg.Content;
              this.messages[index].isEdited = true;
              this.messages = [...this.messages];
            }
          }
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageDeleted$.subscribe(messageId => {
        const targetId = messageId?.toString().toLowerCase();
        const index = this.messages.findIndex(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
        if (index !== -1) {
          this.messages[index].isDeleted = true;
          this.messages[index].content = 'This message was deleted';
          this.messages[index].mediaUrl = null;
          this.messages = [...this.messages];
        }
      })
    );

    this.subs.add(
      this.signalrService.typingIndicator$.subscribe(data => {
        if (data && this.selectedUser && data.senderId?.toString().toLowerCase() === this.selectedUser.id?.toString().toLowerCase()) {
          this.typingUser = data.isTyping ? this.selectedUser.displayName : null;
          if (data.isTyping) {
            setTimeout(() => this.typingUser = null, 5000);
          }
        }
      })
    );

    this.subs.add(
      this.signalrService.messageEdited$.subscribe(msg => {
        if (!msg) return;
        const targetId = (msg.messageId || msg.MessageId)?.toString().toLowerCase();
        const index = this.messages.findIndex(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
        if (index !== -1) {
          this.messages[index] = { ...this.messages[index], ...msg, mediaUrl: this.transformUrl(msg.mediaUrl || msg.MediaUrl) };
          this.messages = [...this.messages];
        }
      })
    );

    this.subs.add(
      this.signalrService.messageDeleted$.subscribe(messageId => {
        const targetId = messageId?.toString().toLowerCase();
        const msg = this.messages.find(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
        if (msg) {
          msg.isDeleted = true;
          msg.content = 'This message was deleted';
          msg.mediaUrl = null;
          this.messages = [...this.messages];
        }
      })
    );

    this.subs.add(
      this.signalrService.messageRead$.subscribe(data => {
        if (!data) return;
        const targetId = (data.messageId || data.MessageId)?.toString().toLowerCase();
        const readTime = data.readAt || data.ReadAt;
        if (!targetId) return;
        
        const msg = this.messages.find(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
        if (msg) {
          msg.isRead = true;
          msg.readAt = readTime;
          this.messages = [...this.messages];
        }
      })
    );

    this.subs.add(
      this.signalrService.allMessagesRead$.subscribe(data => {
        if (!data || !this.selectedUser) return;
        const readerId = (data.readBy || data.ReadBy)?.toString().toLowerCase();
        const selectedId = this.selectedUser.id?.toString().toLowerCase();
        const currentUserId = this.currentUser.id?.toString().toLowerCase();
        
        if (readerId === selectedId) {
          this.messages.forEach(m => {
            if (m.senderId?.toString().toLowerCase() === currentUserId && !m.isRead) {
              m.isRead = true;
              m.readAt = data.readAt || data.ReadAt;
            }
          });
          this.messages = [...this.messages];
        }
      })
    );

    this.subs.add(
      this.signalrService.userPresence$.subscribe(data => {
        if (!data) return;
        if (data.isBulk) {
          this.onlineUserIds = new Set((data.userIds as string[]).map(id => id.toLowerCase()));
          this.applyOnlineStatus();
        } else {
          const userId = data.userId?.toString().toLowerCase();
          if (data.isOnline) {
            this.onlineUserIds.add(userId);
          } else {
            this.onlineUserIds.delete(userId);
          }
          this.applyOnlineStatus();
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageRead$.subscribe(data => {
        console.log('SignalR: RoomMessageRead received', data);
        if (!data) return;
        const targetId = (data.messageId || data.MessageId)?.toString().toLowerCase();
        const readTime = data.readAt || data.ReadAt;
        if (!targetId) return;
        
        const targetMsg = this.messages.find(m => (m.messageId || m.MessageId)?.toString().toLowerCase() === targetId);
        if (targetMsg) {
          const targetSentAt = new Date(targetMsg.sentAt || targetMsg.SentAt).getTime();
          const currentUserId = this.currentUser.id?.toString().toLowerCase();
          
          this.messages.forEach(m => {
            const mId = (m.messageId || m.MessageId)?.toString().toLowerCase();
            const mSentAt = new Date(m.sentAt || m.SentAt).getTime();
            const mSenderId = (m.senderId || m.SenderId)?.toString().toLowerCase();
            
            if (mSentAt <= targetSentAt && mSenderId === currentUserId) {
              m.isRead = true;
              m.readAt = m.readAt || readTime;
            }
          });
          this.messages = [...this.messages];
        }
      })
    );

    this.deleteMenuItems = [
      {
        label: 'Delete for me',
        icon: 'pi pi-user',
        command: () => this.deleteMessage(this.selectedMessageForMenu, false)
      },
      {
        label: 'Delete for everyone',
        icon: 'pi pi-users',
        styleClass: 'p-menuitem-link-danger',
        command: () => this.deleteMessage(this.selectedMessageForMenu, true)
      }
    ];
  }

  // --- UI Helpers ---
  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }, 100);
    } catch(err) { }
  }

  onTyping(): void {
    if (this.selectedUser) {
      this.signalrService.sendTypingIndicator(this.selectedUser.id, true);
    } else if (this.selectedRoom) {
      // Need Room Typing implementation in SignalR
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    if (this.selectedRoom) {
      this.signalrService.sendRoomMessage(this.selectedRoom.roomId, this.newMessage);
    } else if (this.selectedUser) {
      this.signalrService.sendMessage(this.selectedUser.id, this.newMessage);
    }
    this.newMessage = '';
  }

  startEdit(msg: any): void {
    this.editingMessageId = msg.messageId || msg.MessageId;
    this.editContent = msg.content || msg.Content;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editContent = '';
  }

  saveEdit(): void {
    if (!this.editingMessageId || !this.editContent.trim()) return;
    if (this.selectedRoom) {
      this.signalrService.editRoomMessage(this.editingMessageId, this.editContent);
    } else {
      this.signalrService.editMessage(this.editingMessageId, this.editContent);
    }
    this.cancelEdit();
  }

  deleteMessage(msg: any, forEveryone: boolean): void {
    if (!msg) return;
    const mId = msg.messageId || msg.MessageId;
    if (forEveryone) {
      if (this.selectedRoom) {
        this.signalrService.deleteRoomMessage(mId);
      } else {
        this.signalrService.deleteMessage(mId);
      }
    } else {
      this.messages = this.messages.filter(m => (m.messageId || m.MessageId) !== mId);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadRecentChats(): void {
    this.messageService.getRecentChats().subscribe((chats: any) => {
      this.users = chats.map((c: any) => ({
        id: c.userId || c.UserId,
        displayName: c.displayName || c.DisplayName || c.username || c.Username || 'Unknown User',
        avatarUrl: this.transformUrl(c.avatarUrl || c.AvatarUrl),
        lastMessage: c.lastMessage?.content || c.LastMessage?.content,
        lastMessageTime: c.lastMessage?.sentAt || c.LastMessage?.sentAt,
        isOnline: c.isOnline || c.IsOnline || false,
        unreadCount: c.unreadCount || c.UnreadCount || 0
      }));
      this.enrichUnknownUsers();
      this.applyOnlineStatus();
      this.sortUsersByTime();
    });
  }

  enrichUnknownUsers(): void {
    const unknownUserIds = this.users
      .filter(u => u.displayName === 'Unknown User' && u.id)
      .map(u => u.id);
    if (unknownUserIds.length > 0) {
      this.userService.getUsersByIds(unknownUserIds).subscribe({
        next: (usersInfo: any[]) => {
          usersInfo.forEach(ui => {
            const user = this.users.find(u => u.id?.toString().toLowerCase() === ui.userId?.toString().toLowerCase());
            if (user) {
              user.displayName = ui.displayName || ui.DisplayName || ui.username || ui.Username || 'Unknown User';
              user.avatarUrl = this.transformUrl(ui.avatarUrl || ui.AvatarUrl);
            }
          });
        }
      });
    }
  }

  loadMyRooms(): void {
    this.roomService.getRoomsByUser().subscribe(rooms => {
      this.myRooms = rooms;
    });
  }

  applyOnlineStatus(): void {
    this.users.forEach(u => {
      u.isOnline = this.onlineUserIds.has(u.id?.toString().toLowerCase());
    });
  }

  sortUsersByTime(): void {
    this.users.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }

  refreshOnlineStatus(): void {
    this.userService.getOnlineUserIds().subscribe({
      next: (onlineIds: string[]) => {
        this.onlineUserIds = new Set(onlineIds.map(id => id.toLowerCase()));
        this.applyOnlineStatus();
      }
    });
  }

  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.loadRecentChats();
      return;
    }
    this.userService.searchUsers(this.searchQuery).subscribe((res: any) => {
      const usersList = Array.isArray(res) ? res : (res?.users || []);
      this.users = usersList.filter((u: any) => (u.userId || u.UserId) !== this.currentUser.id).map((u: any) => ({
        id: u.userId || u.UserId,
        displayName: u.displayName || u.DisplayName || u.username || u.Username,
        avatarUrl: this.transformUrl(u.avatarUrl || u.AvatarUrl),
        isOnline: u.isOnline || u.IsOnline || false,
        lastMessage: 'Start a conversation'
      }));
    });
  }

  searchMessages(): void {
    if (!this.messageSearchQuery.trim() || !this.selectedUser) return;
    this.messageService.searchMessages(this.messageSearchQuery).subscribe((res: any) => {
      const msgs = Array.isArray(res) ? res : (res?.messages || []);
      this.messages = msgs.filter((m: any) => 
        (m.senderId === this.selectedUser.id || m.receiverId === this.selectedUser.id)
      ).map((m: any) => ({
        ...m,
        mediaUrl: this.transformUrl(m.mediaUrl || m.MediaUrl)
      }));
    });
  }

  toggleMessageSearch(): void {
    this.isSearchingMessages = !this.isSearchingMessages;
    if (!this.isSearchingMessages) {
      this.messageSearchQuery = '';
      if (this.selectedUser) this.loadConversation();
      else if (this.selectedRoom) this.loadRoomConversation();
    }
  }

  loadRoomById(roomId: string): void {
    this.roomService.getRoomById(roomId).subscribe(room => {
      this.selectRoom(room);
    });
  }

  selectRoom(room: any): void {
    this.selectedUser = null;
    this.selectedRoom = room;
    this.messages = [];
    this.roomMembers = [];
    this.isAdmin = false;
    this.isEditingRoom = false;
    this.signalrService.joinRoom(room.roomId);
    this.loadRoomConversation();
    this.loadRoomMembers(room.roomId);
  }

  loadRoomMembers(roomId: string): void {
    this.roomService.getMembers(roomId).subscribe(members => {
      this.roomMembers = members;
      this.checkIfAdmin();
      this.enrichRoomMembers();
    });
  }

  enrichRoomMembers(): void {
    const userIds = this.roomMembers.map(m => m.userId);
    if (userIds.length > 0) {
      this.userService.getUsersByIds(userIds).subscribe({
        next: (usersInfo: any[]) => {
          usersInfo.forEach(ui => {
            const member = this.roomMembers.find(m => m.userId?.toString().toLowerCase() === ui.userId?.toString().toLowerCase());
            if (member) {
              member.displayName = ui.displayName || ui.DisplayName || ui.username || ui.Username;
              member.avatarUrl = this.transformUrl(ui.avatarUrl || ui.AvatarUrl);
            }
          });
        }
      });
    }
  }

  checkIfAdmin(): void {
    const currentUserId = this.currentUser?.id?.toString().toLowerCase();
    const me = this.roomMembers.find(m => m.userId?.toString().toLowerCase() === currentUserId);
    this.isAdmin = me?.role === 'ADMIN';
    if (this.isAdmin) this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.userService.getUsers().subscribe((res: any) => {
      const usersList = Array.isArray(res) ? res : (res?.users || []);
      const memberIds = this.roomMembers.map(m => m.userId?.toString().toLowerCase());
      this.allUsers = usersList.filter((u: any) => !memberIds.includes((u.userId || u.id)?.toString().toLowerCase()));
    });
  }

  addMember(): void {
    if (!this.selectedUserToAdd || !this.selectedRoom) return;
    this.roomService.addMember(this.selectedRoom.roomId, this.selectedUserToAdd.userId, this.selectedUserToAdd.username).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Success', detail: 'User added' });
        this.loadRoomMembers(this.selectedRoom.roomId);
        this.selectedUserToAdd = null;
      }
    });
  }

  editRoom(): void {
    if (!this.selectedRoom) return;
    this.editRoomForm = { ...this.selectedRoom };
    this.isEditingRoom = true;
  }

  saveRoomUpdate(): void {
    if (!this.selectedRoom) return;
    this.roomService.updateRoom(this.selectedRoom.roomId, this.editRoomForm).subscribe({
      next: (updated) => {
        this.selectedRoom = { ...this.selectedRoom, ...updated };
        this.isEditingRoom = false;
        this.loadMyRooms();
      }
    });
  }

  deleteRoom(): void {
    if (!this.selectedRoom || !confirm('Delete this community?')) return;
    this.roomService.deleteRoom(this.selectedRoom.roomId).subscribe({
      next: () => {
        this.displayRoomInfo = false;
        this.selectedRoom = null;
        this.loadMyRooms();
      }
    });
  }

  kickMember(member: any): void {
    if (!this.selectedRoom || !confirm(`Remove ${member.displayName}?`)) return;
    this.roomService.removeMember(this.selectedRoom.roomId, member.userId).subscribe({
      next: () => this.loadRoomMembers(this.selectedRoom.roomId)
    });
  }

  changeMemberRole(member: any, newRole: string): void {
    if (!this.selectedRoom) return;
    this.roomService.updateMemberRole(this.selectedRoom.roomId, member.userId, newRole).subscribe({
      next: () => this.loadRoomMembers(this.selectedRoom.roomId)
    });
  }

  showRoomInfo(): void {
    if (this.selectedRoom) {
      this.loadRoomMembers(this.selectedRoom.roomId);
      this.displayRoomInfo = true;
    }
  }

  loadRoomConversation(): void {
    if (!this.selectedRoom) return;
    this.roomService.getRoomMessages(this.selectedRoom.roomId).subscribe((res: any) => {
      const msgs = Array.isArray(res) ? res : (res.messages || []);
      this.messages = msgs.map((m: any) => ({
        ...m,
        mediaUrl: this.transformUrl(m.mediaUrl || m.MediaUrl)
      })).sort((a: any, b: any) => {
        const timeA = new Date(a.sentAt || a.SentAt || 0).getTime();
        const timeB = new Date(b.sentAt || b.SentAt || 0).getTime();
        return timeA - timeB;
      });
      this.scrollToBottom();
      
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        const senderId = (lastMsg.senderId || lastMsg.SenderId)?.toString().toLowerCase();
        const currentUserId = this.currentUser?.id?.toString().toLowerCase();
        if (senderId !== currentUserId) {
          this.signalrService.markRoomMessageAsRead(this.selectedRoom.roomId, lastMsg.messageId || lastMsg.MessageId);
        }
      }
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.selectedRoom = null;
    this.messages = [];
    this.loadConversation();
  }

  loadConversation(): void {
    if (!this.selectedUser) return;
    this.messageService.getConversation(this.selectedUser.id).subscribe((res: any) => {
      const msgs = Array.isArray(res) ? res : (res.messages || []);
      this.messages = msgs.map((m: any) => ({
        ...m,
        mediaUrl: this.transformUrl(m.mediaUrl || m.MediaUrl)
      })).sort((a: any, b: any) => {
        const timeA = new Date(a.sentAt || a.SentAt || 0).getTime();
        const timeB = new Date(b.sentAt || b.SentAt || 0).getTime();
        return timeA - timeB;
      });
      this.scrollToBottom();
      this.signalrService.markAllAsRead(this.selectedUser.id);
    });
  }

  deduplicateSidebar(): void {
    const seen = new Set();
    this.users = this.users.filter(u => {
      const id = u.id?.toString().toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
}
