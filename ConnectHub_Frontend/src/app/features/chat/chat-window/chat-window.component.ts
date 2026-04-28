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
  
  // New Room Management Variables
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
  
  // NEW: Tracking online user IDs globally to avoid races with sidebar loads
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
      console.log('Uploading file:', file.name);
      this.mediaService.upload(file).subscribe({
        next: (res: any) => {
          console.log('Upload success:', res);
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
    
    console.log('Original Media URL:', url);
    
    let fixedUrl = url;
    // Aggressively replace docker/internal hostnames with localhost
    // Using /gi for case-insensitive global replacement
    fixedUrl = fixedUrl.replace(/azurite:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/127\.0\.0\.1:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/host\.docker\.internal:10000/gi, 'localhost:10000');
    
    // Ensure the default Azurite account name is present if it's a local blob URL
    if (fixedUrl.includes('localhost:10000') && !fixedUrl.includes('devstoreaccount1')) {
      fixedUrl = fixedUrl.replace('localhost:10000/', 'localhost:10000/devstoreaccount1/');
    }
    
    if (fixedUrl !== url) {
      console.log('Transformed Media URL:', fixedUrl);
    }
    
    return fixedUrl;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (this.currentUser && this.currentUser.userId) {
      this.currentUser.id = this.currentUser.userId;
    }
    this.loadRecentChats();
    this.loadMyRooms();

    // Once SignalR connects, re-fetch online status from Redis
    // (fixes race: users load before SignalR registers presence)
    this.subs.add(
      this.signalrService.connected$.subscribe(() => {
        // Small delay to let OnConnectedAsync finish writing to Redis
        setTimeout(() => this.refreshOnlineStatus(), 800);
      })
    );

    // Check for roomId in query params
    this.subs.add(
      this.route.queryParams.subscribe(params => {
        const roomId = params['roomId'];
        if (roomId) {
          this.loadRoomById(roomId);
        }
      })
    );

    // Listen for messages received from OTHERS
    this.subs.add(
      this.signalrService.messageReceived$.subscribe(msg => {
        if (!msg) return;
        
        const senderId = msg.senderId?.toLowerCase();
        const receiverId = msg.receiverId?.toLowerCase();
        const selectedId = this.selectedUser?.id?.toLowerCase();
        
        // 1. Update current chat window if it matches
        if (this.selectedUser && (senderId === selectedId || receiverId === selectedId)) {
          msg.mediaUrl = this.transformUrl(msg.mediaUrl);
          this.messages.push(msg);
          this.scrollToBottom();

          // If we received this message from someone else while looking at their chat,
          // mark it as read immediately.
          if (senderId === selectedId) {
            this.signalrService.markMessageAsRead(msg.messageId, msg.senderId);
          }
        }

        // 2. Update/Add sidebar entry
        const partnerId = senderId === this.currentUser?.id?.toLowerCase() ? receiverId : senderId;
        let sidebarUser = this.users.find(u => u.id?.toLowerCase() === partnerId);
        
        if (sidebarUser) {
          console.log('Sidebar: Updating existing user', sidebarUser.id);
          sidebarUser.lastMessage = msg.content || '📷 Media';
          sidebarUser.lastMessageTime = msg.sentAt;
          // Increment unread count if not current selection
          if (partnerId !== selectedId) {
            sidebarUser.unreadCount = (sidebarUser.unreadCount || 0) + 1;
          } else {
            sidebarUser.unreadCount = 0;
          }
          this.sortUsersByTime();
        } else {
          // Create new sidebar entry if not found
          const newUser = {
            id: partnerId,
            displayName: msg.senderDisplayName || 'New Chat',
            lastMessage: msg.content || '📷 Media',
            lastMessageTime: msg.sentAt,
            unreadCount: (partnerId !== selectedId) ? 1 : 0,
            isOnline: false
          };
          this.users = [newUser, ...this.users];
          this.enrichUnknownUsers();
        }
        this.deduplicateSidebar();
      })
    );

    // Listen for confirmation that OUR message was sent
    this.subs.add(
      this.signalrService.messageSent$.subscribe(msg => {
        if (msg && this.selectedUser) {
          const receiverId = msg.receiverId?.toLowerCase();
          const selectedId = this.selectedUser.id?.toLowerCase();
          
          if (receiverId === selectedId) {
            msg.mediaUrl = this.transformUrl(msg.mediaUrl);
            this.messages.push(msg);
            this.scrollToBottom();
          }
          // Update sidebar preview
          const sidebarUser = this.users.find(u => u.id?.toLowerCase() === selectedId);
          if (sidebarUser) {
            sidebarUser.lastMessage = msg.content || '📷 Media';
            sidebarUser.lastMessageTime = msg.sentAt;
          }
        }
      })
    );

    // Listen for messages sent by ME
    this.subs.add(
      this.signalrService.messageSent$.subscribe(msg => {
        if (!msg) return;
        const partnerId = msg.receiverId?.toLowerCase();
        let sidebarUser = this.users.find(u => u.id?.toLowerCase() === partnerId);
        if (sidebarUser) {
          sidebarUser.lastMessage = msg.content || '📷 Media';
          sidebarUser.lastMessageTime = msg.sentAt;
          this.sortUsersByTime();
        }
      })
    );

    // Listen for room messages
    this.subs.add(
      this.signalrService.roomMessageReceived$.subscribe(msg => {
        // Rooms use string IDs or GUIDs but typically case issues are GUIDs. Let's make it robust
        if (msg && this.selectedRoom && msg.roomId?.toString().toLowerCase() === this.selectedRoom.roomId?.toString().toLowerCase()) {
          msg.mediaUrl = this.transformUrl(msg.mediaUrl);
          this.messages.push(msg);
          this.scrollToBottom();
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageEdited$.subscribe(updatedMsg => {
        console.log('Room Message Edited Event:', updatedMsg);
        if (updatedMsg && this.selectedRoom) {
          const incomingRoomId = (updatedMsg.roomId || updatedMsg.RoomId)?.toString().toLowerCase();
          const currentRoomId = this.selectedRoom.roomId?.toString().toLowerCase();
          
          if (incomingRoomId === currentRoomId) {
            const targetId = (updatedMsg.messageId || updatedMsg.MessageId)?.toString().toLowerCase();
            const index = this.messages.findIndex(m => m.messageId?.toString().toLowerCase() === targetId);
            
            if (index !== -1) {
              this.messages[index].content = updatedMsg.content || updatedMsg.Content;
              this.messages[index].isEdited = true;
              this.messages = [...this.messages]; // Force change detection
            }
          }
        }
      })
    );

    this.subs.add(
      this.signalrService.roomMessageDeleted$.subscribe(messageId => {
        console.log('Room Message Deleted Event:', messageId);
        const targetId = messageId?.toString().toLowerCase();
        const index = this.messages.findIndex(m => m.messageId?.toString().toLowerCase() === targetId);
        if (index !== -1) {
          this.messages[index].isDeleted = true;
          this.messages[index].content = 'This message was deleted';
          this.messages[index].mediaUrl = null;
          this.messages = [...this.messages]; // Force change detection
        }
      })
    );

    this.subs.add(
      this.signalrService.typingIndicator$.subscribe(data => {
        if (data && this.selectedUser && data.senderId === this.selectedUser.id) {
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
        const index = this.messages.findIndex(m => m.messageId === msg.messageId);
        if (index !== -1) {
          this.messages[index] = { ...this.messages[index], ...msg, mediaUrl: this.transformUrl(msg.mediaUrl) };
        }
      })
    );

    this.subs.add(
      this.signalrService.messageDeleted$.subscribe(messageId => {
        const msg = this.messages.find(m => m.messageId === messageId);
        if (msg) {
          msg.isDeleted = true;
          msg.content = 'This message was deleted';
          msg.mediaUrl = null;
        }
      })
    );

    this.subs.add(
      this.signalrService.messageRead$.subscribe(data => {
        console.log('SignalR: MessageRead received', data);
        if (!data) return;
        const targetId = (data.messageId || data.MessageId)?.toLowerCase();
        const readTime = data.readAt || data.ReadAt;
        if (!targetId) return;
        
        const msg = this.messages.find(m => m.messageId?.toLowerCase() === targetId);
        if (msg) {
          msg.isRead = true;
          msg.readAt = readTime;
          console.log('Updated message status to read:', targetId);
        }
      })
    );

    this.subs.add(
      this.signalrService.allMessagesRead$.subscribe(data => {
        console.log('SignalR: AllMessagesRead received', data);
        if (!data || !this.selectedUser) return;
        const readerId = (data.readBy || data.ReadBy)?.toString().toLowerCase();
        const selectedId = this.selectedUser.id?.toLowerCase();
        
        if (readerId === selectedId) {
          this.messages.forEach(m => {
            if (m.senderId?.toLowerCase() === this.currentUser.id?.toLowerCase() && !m.isRead) {
              m.isRead = true;
              m.readAt = data.readAt || data.ReadAt;
            }
          });
          console.log('Updated all messages in current chat to read');
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

  startEdit(msg: any): void {
    this.editingMessageId = msg.messageId;
    this.editContent = msg.content;
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
    if (forEveryone) {
      if (this.selectedRoom) {
        this.signalrService.deleteRoomMessage(msg.messageId);
      } else {
        this.signalrService.deleteMessage(msg.messageId);
      }
    } else {
      // Just hide it locally for the current user
      this.messages = this.messages.filter(m => m.messageId !== msg.messageId);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadRecentChats(): void {
    this.messageService.getRecentChats().subscribe((chats: any) => {
      this.users = chats.map((c: any) => ({
        id: c.userId,
        displayName: c.displayName || c.username || 'Unknown User',
        lastMessage: c.lastMessage?.content,
        lastMessageTime: c.lastMessage?.sentAt,
        isOnline: false,
        unreadCount: c.unreadCount || 0
      }));

      this.enrichUnknownUsers();
      this.applyOnlineStatus();
      this.sortUsersByTime();

      // Restore previously selected user if any
      const lastUserId = localStorage.getItem('lastSelectedUserId')?.toLowerCase();
      if (lastUserId && !this.selectedUser && !this.selectedRoom) {
        const found = this.users.find(u => u.id?.toLowerCase() === lastUserId);
        if (found) {
          this.selectUser(found);
        }
      }
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
            const user = this.users.find(u => u.id?.toLowerCase() === ui.userId?.toLowerCase());
            if (user) {
              user.displayName = ui.displayName || ui.username || 'Unknown User';
              user.avatarUrl = ui.avatarUrl;
            }
            if (this.selectedUser && this.selectedUser.id?.toLowerCase() === ui.userId?.toLowerCase()) {
              this.selectedUser.displayName = ui.displayName || ui.username || 'Unknown User';
              this.selectedUser.avatarUrl = ui.avatarUrl;
            }
          });
        },
        error: () => {}
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
      const isOnline = this.onlineUserIds.has(u.id?.toLowerCase());
      u.isOnline = isOnline;
      if (this.selectedUser && this.selectedUser.id?.toLowerCase() === u.id?.toLowerCase()) {
        this.selectedUser.isOnline = isOnline;
      }
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
      },
      error: () => {}
    });
  }

  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.loadRecentChats();
      return;
    }
    this.userService.searchUsers(this.searchQuery).subscribe((res: any) => {
      if (res && res.users) {
        // Show search results but DON'T replace sidebar users permanently yet
        // isOnline=false by default — real-time presence will update it
        const searchResults = res.users
          .filter((u: any) => u.userId !== this.currentUser.userId)
          .map((u: any) => ({
            id: u.userId,
            displayName: u.displayName,
            username: u.username,
            isOnline: false, // Will be updated via SignalR presence events
            lastMessage: 'Start a conversation'
          }));
        this.users = searchResults;
      }
    });
  }

  searchMessages(): void {
    if (!this.messageSearchQuery.trim() || !this.selectedUser) {
      this.loadConversation();
      return;
    }
    this.messageService.searchMessages(this.messageSearchQuery).subscribe((res: any) => {
      if (res && res.messages) {
        // Filter messages to only show those for the current conversation
        this.messages = res.messages.filter((m: any) => 
          m.senderId === this.selectedUser.id || m.receiverId === this.selectedUser.id
        ).map((m: any) => ({
          ...m,
          mediaUrl: this.transformUrl(m.mediaUrl)
        }));
      }
    });
  }

  toggleMessageSearch(): void {
    this.isSearchingMessages = !this.isSearchingMessages;
    if (!this.isSearchingMessages) {
      this.messageSearchQuery = '';
      this.loadConversation();
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
    this.isAdmin = false; // Reset admin status until checked
    this.isEditingRoom = false; // Close edit mode when switching
    this.signalrService.joinRoom(room.roomId);
    this.loadRoomConversation();
    this.loadRoomMembers(room.roomId);
  }

  loadRoomMembers(roomId: string): void {
    this.roomService.getMembers(roomId).subscribe(members => {
      this.roomMembers = members;
      this.enrichRoomMembers();
      this.checkIfAdmin();
    });
  }

  enrichRoomMembers(): void {
    const userIds = this.roomMembers.map(m => m.userId);
    if (userIds.length > 0) {
      this.userService.getUsersByIds(userIds).subscribe({
        next: (usersInfo: any[]) => {
          usersInfo.forEach(ui => {
            const member = this.roomMembers.find(m => m.userId?.toLowerCase() === ui.userId?.toLowerCase());
            if (member) {
              member.displayName = ui.displayName || ui.username;
            }
          });
        },
        error: () => {}
      });
    }
  }

  checkIfAdmin(): void {
    if (!this.roomMembers || !this.currentUser) {
      this.isAdmin = false;
      return;
    }
    const currentUserId = (this.currentUser.userId || this.currentUser.id || this.currentUser.userId)?.toString().toLowerCase();
    console.log('Checking Admin Status:', {
      currentUserId,
      roomMembers: this.roomMembers,
      selectedRoom: this.selectedRoom?.roomName
    });
    
    const me = this.roomMembers.find(m => m.userId?.toString().toLowerCase() === currentUserId);
    this.isAdmin = me?.role === 'ADMIN';
    console.log('Is Admin:', this.isAdmin, 'Role found:', me?.role);
    
    if (this.isAdmin) {
      this.loadAllUsers();
    }
  }

  loadAllUsers(): void {
    this.userService.getUsers().subscribe((users: any[]) => {
      // Filter out users who are already in the room
      this.allUsers = users.filter((u: any) => !this.roomMembers.some((m: any) => m.userId === u.userId));
    });
  }

  addMember(): void {
    if (!this.selectedUserToAdd || !this.selectedRoom) return;

    this.roomService.addMember(this.selectedRoom.roomId, this.selectedUserToAdd.userId, this.selectedUserToAdd.username).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Success', detail: 'User added to community' });
        this.loadRoomMembers(this.selectedRoom.roomId);
        this.selectedUserToAdd = null;
      },
      error: (err) => {
        this.toastService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to add user' });
      }
    });
  }

  // ROOM MANAGEMENT ACTIONS
  editRoom(): void {
    if (!this.selectedRoom) return;
    this.editRoomForm = {
      roomName: this.selectedRoom.roomName,
      description: this.selectedRoom.description,
      maxMembers: this.selectedRoom.maxMembers,
      avatarUrl: this.selectedRoom.avatarUrl
    };
    this.isEditingRoom = true;
  }

  saveRoomUpdate(): void {
    if (!this.selectedRoom) return;
    this.roomService.updateRoom(this.selectedRoom.roomId, this.editRoomForm).subscribe({
      next: (updated) => {
        this.selectedRoom = { ...this.selectedRoom, ...updated };
        this.isEditingRoom = false;
        this.toastService.add({ severity: 'success', summary: 'Success', detail: 'Community updated' });
        this.loadMyRooms(); // Refresh sidebar
      },
      error: () => this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update community' })
    });
  }

  deleteRoom(): void {
    if (!this.selectedRoom || !confirm('Are you sure you want to PERMANENTLY delete this community?')) return;
    this.roomService.deleteRoom(this.selectedRoom.roomId).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Deleted', detail: 'Community has been removed' });
        this.displayRoomInfo = false;
        this.selectedRoom = null;
        this.messages = [];
        this.loadMyRooms();
      },
      error: () => this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete community' })
    });
  }

  kickMember(member: any): void {
    if (!this.selectedRoom || !confirm(`Remove ${member.displayName} from this community?`)) return;
    this.roomService.removeMember(this.selectedRoom.roomId, member.userId).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Kicked', detail: `${member.displayName} removed` });
        this.loadRoomMembers(this.selectedRoom.roomId);
      },
      error: () => this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove member' })
    });
  }

  changeMemberRole(member: any, newRole: string): void {
    if (!this.selectedRoom) return;
    this.roomService.updateMemberRole(this.selectedRoom.roomId, member.userId, newRole).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Role Updated', detail: `${member.displayName} is now ${newRole}` });
        this.loadRoomMembers(this.selectedRoom.roomId);
      },
      error: () => this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update role' })
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
      // Room messages might be an array directly or wrapped
      const msgs = Array.isArray(res) ? res : (res.messages || []);
      this.messages = msgs.map((m: any) => ({
        ...m,
        mediaUrl: this.transformUrl(m.mediaUrl)
      })).reverse(); // API usually returns descending
      this.scrollToBottom();
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.selectedRoom = null;
    
    // Clear search and pin user at top immediately
    this.searchQuery = '';
    const exists = this.users.find(u => u.id?.toLowerCase() === user.id?.toLowerCase());
    if (!exists) {
      this.users = [user, ...this.users];
    } else {
      this.users = [exists, ...this.users.filter(u => u.id?.toLowerCase() !== user.id?.toLowerCase())];
    }
    
    if (user && user.id) {
      localStorage.setItem('lastSelectedUserId', user.id);
      this.signalrService.markAllAsRead(user.id);
      user.unreadCount = 0;
      if (exists) exists.unreadCount = 0;
      this.deduplicateSidebar();
    }
    
    // Load the conversation messages
    this.loadConversation();
    
    // After a short delay, refresh the sidebar from DB so last messages & history persist
    setTimeout(() => {
      const currentSelectedId = this.selectedUser?.id;
      this.messageService.getRecentChats().subscribe((chats: any) => {
        const freshUsers = chats.map((c: any) => ({
          id: c.userId,
          displayName: c.displayName || c.username || 'Unknown User',
          lastMessage: c.lastMessage?.content,
          lastMessageTime: c.lastMessage?.sentAt,
          isOnline: this.users.find(u => u.id?.toLowerCase() === c.userId?.toLowerCase())?.isOnline ?? false,
          unreadCount: (c.userId?.toLowerCase() === currentSelectedId?.toLowerCase()) ? 0 : c.unreadCount
        }));
        // If selected user not in recent chats yet (no messages exchanged), keep them pinned at top
        const inFresh = freshUsers.find((u: any) => u.id?.toLowerCase() === currentSelectedId?.toLowerCase());
        if (!inFresh && currentSelectedId) {
          this.users = [this.selectedUser, ...freshUsers];
        } else {
          // Move selected user to top
          this.users = [
            ...(inFresh ? [inFresh] : []),
            ...freshUsers.filter((u: any) => u.id?.toLowerCase() !== currentSelectedId?.toLowerCase())
          ];
        }
        
        this.enrichUnknownUsers();
        // Refresh online status after update
        this.refreshOnlineStatus();
      });
    }, 500);
  }

  loadConversation(): void {
    if (!this.selectedUser) return;
    this.messageService.getConversation(this.selectedUser.id).subscribe((res: any) => {
      if (res && res.messages) {
        this.messages = res.messages.map((m: any) => ({
          ...m,
          mediaUrl: this.transformUrl(m.mediaUrl)
        }));
        this.scrollToBottom();
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    if (this.selectedUser) {
      this.signalrService.sendMessage(this.selectedUser.id, this.newMessage);
    } else if (this.selectedRoom) {
      this.signalrService.sendRoomMessage(this.selectedRoom.roomId, this.newMessage);
    }

    this.newMessage = '';
  }

  onTyping(): void {
    if (this.selectedUser) {
      this.signalrService.sendTypingIndicator(this.selectedUser.id, true);
    }
  }

  onImageError(event: any): void {
    const img = event.target;
    console.error('Image failed to load:', img.src);
    // Fallback to a professional placeholder instead of showing broken icon
    img.src = 'assets/images/image-placeholder.png'; 
    // If that also fails (e.g. assets not there), hide it or show a generic icon via CSS
    img.style.display = 'none';
    img.parentElement.innerHTML += '<div class="media-error-placeholder"><i class="pi pi-image"></i><span>Image unavailable</span></div>';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.myScrollContainer) {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }
      } catch (err) {}
    }, 100);
  }

  private deduplicateSidebar(): void {
    if (!this.users) return;
    const unique = new Map<string, any>();
    this.users.forEach(u => {
      const id = u.id?.toLowerCase();
      if (id) {
        if (!unique.has(id)) {
          unique.set(id, { ...u });
        } else {
          const existing = unique.get(id);
          // Merge logic
          unique.set(id, {
            ...existing,
            ...u,
            unreadCount: (existing.id === this.selectedUser?.id) ? 0 : Math.max(existing.unreadCount || 0, u.unreadCount || 0),
            lastMessageTime: (u.lastMessageTime > existing.lastMessageTime) ? u.lastMessageTime : existing.lastMessageTime
          });
        }
      }
    });
    this.users = Array.from(unique.values());
    this.sortUsersByTime();
  }
}
