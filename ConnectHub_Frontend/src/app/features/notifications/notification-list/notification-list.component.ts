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
        this.notifications = data.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        this.loading = false;
      },
      error: (err) => {
        this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load notifications' });
        this.loading = false;
      }
    });
  }

  markRead(notification: any): void {
    if (notification.isRead) return;
    this.notificationService.markAsRead(notification.notificationId).subscribe(() => {
      notification.isRead = true;
      
      // Sync with chat if it's a message notification
      if (notification.type.toUpperCase() === 'MESSAGE' && notification.relatedId) {
        this.chatMessageService.markAsRead(notification.relatedId).subscribe();
      }
    });
  }

  deleteNotification(id: string): void {
    this.notificationService.deleteNotification(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.notificationId !== id);
      this.toastService.add({ severity: 'success', summary: 'Deleted', detail: 'Notification removed' });
    });
  }
  markAllRead(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      
      // Global sync with chat
      this.chatMessageService.markAllGlobalAsRead().subscribe();
      
      this.toastService.add({ severity: 'success', summary: 'Success', detail: 'All notifications marked as read' });
    });
  }

  getIcon(type: string): string {
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
