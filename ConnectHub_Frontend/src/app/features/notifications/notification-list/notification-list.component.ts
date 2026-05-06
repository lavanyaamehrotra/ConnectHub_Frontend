import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService as ChatMessageService } from '../../../core/services/message.service';
import { MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, BadgeModule, TooltipModule, ToastModule],
  providers: [MessageService],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit {
  notifications: any[] = [];
  loading: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private chatMessageService: ChatMessageService,
    private toastService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.notifications = data.sort((a, b) => {
            const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
            const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
            return timeB - timeA;
          });
        } else {
          this.notifications = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.toastService.add({ 
          severity: 'error', 
          summary: 'Connection Error', 
          detail: 'Could not fetch notifications. Please try again.' 
        });
        this.loading = false;
      }
    });
  }

  markRead(notification: any): void {
    if (!notification || notification.isRead) return;
    this.notificationService.markAsRead(notification.notificationId).subscribe({
      next: () => {
        notification.isRead = true;
        // Sync with chat if it's a message notification
        if (notification.type && notification.type.toUpperCase() === 'MESSAGE' && notification.relatedId) {
          this.chatMessageService.markAsRead(notification.relatedId).subscribe({
            error: (e) => console.warn('Chat sync failed:', e)
          });
        }
      },
      error: (err) => console.error('Mark read failed:', err)
    });
  }

  deleteNotification(id: string): void {
    if (!id) return;
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.notificationId !== id);
        this.toastService.add({ severity: 'success', summary: 'Deleted', detail: 'Notification removed' });
      },
      error: (err) => console.error('Delete failed:', err)
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        // Global sync with chat
        this.chatMessageService.markAllGlobalAsRead().subscribe({
          error: (e) => console.warn('Global chat sync failed:', e)
        });
        this.toastService.add({ severity: 'success', summary: 'Success', detail: 'All notifications marked as read' });
      },
      error: (err) => console.error('Mark all read failed:', err)
    });
  }

  getIcon(type: string): string {
    if (!type) return 'pi pi-bell';
    switch (type.toUpperCase()) {
      case 'MESSAGE': return 'pi pi-envelope';
      case 'ROOM_INVITE': return 'pi pi-users';
      case 'MENTION': return 'pi pi-at';
      case 'SYSTEM': return 'pi pi-info-circle';
      case 'BROADCAST': return 'pi pi-megaphone';
      default: return 'pi pi-bell';
    }
  }
}
