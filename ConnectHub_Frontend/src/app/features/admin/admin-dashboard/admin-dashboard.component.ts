import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    InputTextareaModule, 
    CardModule, 
    BadgeModule,
    ToastModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="admin-wrapper fade-in">
      <!-- PAGE HEADER -->
      <div class="admin-header">
        <h1 class="glow-text">Admin Command Center 🛠️</h1>
        <p>Manage users, broadcast announcements, and monitor system health.</p>
      </div>

      <!-- STATS OVERVIEW -->
      <div class="stats-grid">
        <div class="glass-card stat-item">
          <div class="stat-icon users"><i class="pi pi-users"></i></div>
          <div class="stat-data">
            <span class="label">Total Users</span>
            <span class="value">{{ users.length }}</span>
          </div>
        </div>
        <div class="glass-card stat-item">
          <div class="stat-icon online"><i class="pi pi-bolt"></i></div>
          <div class="stat-data">
            <span class="label">Online Now</span>
            <span class="value">{{ onlineCount }}</span>
          </div>
        </div>
        <div class="glass-card stat-item">
          <div class="stat-icon alerts"><i class="pi pi-shield"></i></div>
          <div class="stat-data">
            <span class="label">System Status</span>
            <span class="value healthy">Optimal</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- USER MANAGEMENT SECTION -->
        <div class="glass-card table-section">
          <div class="card-header">
            <div class="header-icon"><i class="pi pi-users"></i></div>
            <div class="header-text">
              <h2>User Management</h2>
              <p>View and manage all registered members</p>
            </div>
            <div class="header-actions">
              <button pButton icon="pi pi-refresh" 
                      class="p-button-rounded p-button-text" 
                      [class.rotating]="isRefreshing"
                      (click)="loadUsers()"></button>
            </div>
          </div>

          <p-table [value]="users" [paginator]="true" [rows]="8" responsiveLayout="scroll" styleClass="p-datatable-custom">
            <ng-template pTemplate="header">
              <tr>
                <th>User Details</th>
                <th>Status</th>
                <th>Role</th>
                <th>Activity</th>
                <th style="width: 80px">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <div class="user-info">
                    <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.displayName + '&background=random'" class="user-avatar">
                    <div class="user-meta">
                      <span class="name">{{ user.displayName }}</span>
                      <span class="email">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <p-tag [severity]="getStatus(user) ? 'success' : 'danger'" 
                         [value]="getStatus(user) ? 'Active' : 'Disabled'"
                         [styleClass]="'status-tag ' + (getStatus(user) ? 'active' : 'disabled')">
                  </p-tag>
                </td>
                <td>
                  <span class="role-badge" [class.admin]="getRole(user) === 'Admin'">
                    {{ getRole(user) || 'User' }}
                  </span>
                </td>
                <td>
                  <div class="activity-info">
                    <span class="date">{{ getLastSeen(user) | date:'MMM d, h:mm a' }}</span>
                    <span class="status-indicator" [class.online]="isOnline(user)"></span>
                  </div>
                </td>
                <td>
                  <button pButton [icon]="getStatus(user) ? 'pi pi-ban' : 'pi pi-check-circle'" 
                          [class]="(getStatus(user) ? 'p-button-rounded p-button-danger p-button-secondary ' : 'p-button-rounded p-button-success p-button-secondary ') + 'action-btn-main'"
                          (click)="toggleUser(user)">
                  </button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- BROADCAST SECTION -->
        <div class="glass-card broadcast-section">
          <div class="card-header">
            <div class="header-icon broadcast"><i class="pi pi-megaphone"></i></div>
            <div class="header-text">
              <h2>System Broadcast</h2>
              <p>Alert all users instantly</p>
            </div>
          </div>

          <div class="broadcast-form">
            <div class="form-group">
              <label>Announcement Title</label>
              <div class="input-wrapper">
                <i class="pi pi-bookmark"></i>
                <input pInputText [(ngModel)]="broadcastTitle" placeholder="e.g. Server Maintenance">
              </div>
            </div>

            <div class="form-group">
              <label>Message Content</label>
              <div class="input-wrapper">
                <i class="pi pi-align-left"></i>
                <textarea pInputTextarea [(ngModel)]="broadcastMessage" rows="5" placeholder="Details of the announcement..."></textarea>
              </div>
            </div>

            <button pButton label="Send to Everyone" icon="pi pi-send" 
                    class="p-button-rounded glow-button w-full"
                    [loading]="sendingBroadcast"
                    (click)="sendBroadcast()"></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use "../../../../assets/styles/variables" as *;

    .admin-wrapper {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .admin-header {
      margin-bottom: 2.5rem;
      h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
      p { color: $text-secondary; font-size: 1.1rem; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 1.5rem;
      box-shadow: 0 8px 32px 0 rgba($primary-color, 0.08);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        &.users { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        &.online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        &.alerts { background: rgba($primary-color, 0.1); color: $primary-color; }
      }
      .stat-data {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.9rem; color: $text-secondary; font-weight: 500; }
        .value { font-size: 2rem; font-weight: 800; color: $text-primary; }
        .healthy { color: #10b981; }
      }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      @media (max-width: 1200px) { grid-template-columns: 1fr; }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      .header-icon {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        background: rgba($primary-color, 0.1);
        color: $primary-color;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        &.broadcast { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      }
      .header-text {
        h2 { font-size: 1.3rem; margin: 0; }
        p { font-size: 0.9rem; color: $text-secondary; margin: 0; }
      }
      .header-actions { margin-left: auto; }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      .user-avatar { width: 40px; height: 40px; border-radius: 12px; border: 2px solid $surface-color; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
      .user-meta {
        display: flex;
        flex-direction: column;
        .name { font-weight: 600; color: $text-primary; }
        .email { font-size: 0.8rem; color: $text-secondary; }
      }
    }

    .status-tag { 
      padding: 0.25rem 0.85rem;
      border-radius: 20px; 
      font-weight: 600; 
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 85px;
      background: rgba(107, 114, 128, 0.1) !important;
      color: #374151 !important;
      border: none !important;

      &.active { background: rgba(16, 185, 129, 0.1) !important; color: #10b981 !important; }
      &.disabled { background: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }

      ::ng-deep .p-tag-value { line-height: 1.5; }
    }

    .role-badge {
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      background: rgba(107, 114, 128, 0.1);
      color: #374151;
      font-weight: 600;
      &.admin { background: rgba($primary-color, 0.1); color: $primary-color; }
    }

    .activity-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      .date { font-size: 0.85rem; color: $text-secondary; }
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        &.online { background: #10b981; box-shadow: 0 0 8px #10b981; }
      }
    }

    .broadcast-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      label { font-weight: 600; font-size: 0.9rem; color: $text-primary; }
    }

    .input-wrapper {
      position: relative;
      i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: $text-secondary; }
      input, textarea {
        width: 100%;
        padding: 0.8rem 1rem 0.8rem 2.8rem;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        transition: all 0.2s;
        &:focus { border-color: $primary-color; background: white; outline: none; box-shadow: 0 0 0 4px rgba($primary-color, 0.1); }
      }
    }

    .glow-button {
      background: $primary-color;
      border: none;
      padding: 1rem;
      font-weight: 700;
      box-shadow: 0 10px 20px -10px $primary-color;
      transition: all 0.3s;
      &:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -10px $primary-color; }
    }

    .action-btn-main {
      width: 40px !important;
      height: 40px !important;
      transition: all 0.3s ease !important;
      &:hover { transform: scale(1.1); }
    }

    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .rotating ::ng-deep .p-button-icon { animation: rotate 1s linear infinite; }

    .w-full { width: 100%; }

    ::ng-deep .p-datatable-custom {
      .p-datatable-thead > tr > th { 
        background: transparent; 
        border: none; 
        color: $text-secondary; 
        font-weight: 600; 
        padding: 1.5rem 1.5rem; 
        font-size: 0.85rem; 
        text-transform: uppercase; 
        letter-spacing: 1.2px; 
      }
      .p-datatable-tbody > tr { 
        background: transparent; 
        border-bottom: 1px solid rgba(0, 0, 0, 0.03); 
        transition: background 0.2s; 
        &:hover { background: rgba($primary-color, 0.02); } 
      }
      .p-datatable-tbody > tr > td { 
        padding: 1.5rem 1.5rem; 
        border: none; 
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  users: any[] = [];
  onlineCount = 0;
  broadcastTitle = '';
  broadcastMessage = '';
  sendingBroadcast = false;
  isRefreshing = false;
  private presenceSubscription: Subscription | undefined;
  private lastReceivedPresence: any = null;

  constructor(
    private adminService: AdminService,
    private signalrService: SignalrService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.setupPresenceListener();
  }

  ngOnDestroy() {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }
  }

  setupPresenceListener() {
    this.presenceSubscription = this.signalrService.userPresence$.subscribe((presence: any) => {
      if (!presence) return;
      
      console.log('Admin Dashboard: Presence update received', presence.isBulk ? 'Bulk' : 'Single');
      this.lastReceivedPresence = presence;

      // If users aren't loaded yet, we'll apply this later in loadUsers()
      if (this.users.length > 0) {
        this.applyPresenceUpdate(presence);
      }
    });
  }

  private applyPresenceUpdate(presence: any) {
    if (presence.isBulk) {
      // Bulk update from OnlineUsers event
      const onlineIds = (presence.userIds as string[] || []).map(id => id.toLowerCase());
      const onlineSet = new Set(onlineIds);
      
      this.users.forEach(u => {
        const uid = (u.userId || u.UserId || u.id || '')?.toString().toLowerCase();
        if (uid) {
          const isOnline = onlineSet.has(uid);
          this.updateUserPresence(u, isOnline);
        }
      });
    } else {
      // Individual update
      const presenceId = (presence.userId || '')?.toString().toLowerCase();
      if (presenceId) {
        const user = this.users.find(u => 
          (u.userId || u.UserId || u.id || '')?.toString().toLowerCase() === presenceId
        );
        if (user) {
          this.updateUserPresence(user, presence.isOnline);
        }
      }
    }
    this.calculateOnlineCount();
  }

  private updateUserPresence(user: any, isOnline: boolean) {
    user.isOnline = isOnline;
    user.IsOnline = isOnline;
  }

  loadUsers() {
    this.isRefreshing = true;
    console.log('Admin Dashboard: Refreshing user list...');
    
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        // Map users and preserve current online status if we have it from DB
        this.users = (data || []).map(u => ({ 
          ...u, 
          isOnline: u.isOnline || u.IsOnline || false, 
          IsOnline: u.isOnline || u.IsOnline || false 
        }));
        
        // If we have a buffered SignalR presence update, apply it now (it's more accurate than DB)
        if (this.lastReceivedPresence) {
          console.log('Admin Dashboard: Applying buffered presence update to new user list');
          this.applyPresenceUpdate(this.lastReceivedPresence);
        }
        
        // Request fresh list from Hub just in case
        this.signalrService.requestOnlineUsers().then(() => {
          console.log('Admin Dashboard: Fresh presence list requested');
        }).catch(err => {
          console.warn('Admin Dashboard: Failed to request presence list:', err);
        });
        
        this.calculateOnlineCount();
        this.isRefreshing = false;
        this.showToast('success', 'Refreshed', 'User list updated');
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Admin Dashboard: Failed to load users:', err);
        this.showToast('error', 'Error', 'Failed to load users');
      }
    });
  }

  calculateOnlineCount() {
    // Count users who are currently marked as online
    this.onlineCount = this.users.filter(u => this.isOnline(u)).length;
  }

  // HELPER METHODS to handle case-sensitivity and different field naming
  getStatus(user: any): boolean {
    return user.isActive === true || user.IsActive === true;
  }

  getRole(user: any): string {
    return user.role || user.Role || 'User';
  }

  isOnline(user: any): boolean {
    return user.isOnline === true || user.IsOnline === true;
  }

  getLastSeen(user: any): any {
    return user.lastSeen || user.LastSeen;
  }

  toggleUser(user: any) {
    const uid = user.userId || user.UserId || user.id;
    if (!uid) return;

    this.adminService.toggleUserStatus(uid).subscribe({
      next: (res: any) => {
        if (user.isActive !== undefined) user.isActive = !user.isActive;
        if (user.IsActive !== undefined) user.IsActive = !user.IsActive;
        this.showToast('success', 'Success', res.message || 'Status updated');
      },
      error: () => this.showToast('error', 'Error', 'Operation failed')
    });
  }

  sendBroadcast() {
    if (!this.broadcastTitle || !this.broadcastMessage) {
      this.showToast('warn', 'Warning', 'Please fill in both fields');
      return;
    }

    this.sendingBroadcast = true;
    const recipientIds = this.users.map(u => u.userId || u.UserId || u.id).filter(id => !!id);
    
    this.adminService.sendBulkNotification(this.broadcastTitle, this.broadcastMessage, recipientIds).subscribe({
      next: () => {
        this.showToast('success', 'Sent', `Broadcast message sent to ${recipientIds.length} users`);
        this.broadcastTitle = '';
        this.broadcastMessage = '';
        this.sendingBroadcast = false;
      },
      error: (err) => {
        this.showToast('error', 'Error', err.error?.message || 'Failed to send broadcast');
        this.sendingBroadcast = false;
      }
    });
  }

  private showToast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
  }
}
