import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <i class="pi pi-comments logo-icon"></i>
          <span>ConnectHub</span>
        </div>
        <button class="mobile-close" (click)="onClose($event)">
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onClose()">
          <i class="pi pi-home"></i>
          <span>Dashboard</span>
        </a>
        <a routerLink="/chat" routerLinkActive="active" class="nav-item" (click)="onClose()">
          <i class="pi pi-send"></i>
          <span>Chat</span>
        </a>
        <a routerLink="/rooms" routerLinkActive="active" class="nav-item" (click)="onClose()">
          <i class="pi pi-users"></i>
          <span>Rooms</span>
        </a>
        <a routerLink="/notifications" routerLinkActive="active" class="nav-item" (click)="onClose()">
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="onClose()">
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </a>
 
        <a *ngIf="authService.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-item admin-link" (click)="onClose()">
          <i class="pi pi-shield"></i>
          <span>Admin</span>
        </a>

        <div class="nav-spacer"></div>

        <a (click)="logout()" class="nav-item logout-item">
          <i class="pi pi-power-off"></i>
          <span>Logout</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="system-status">
          <div class="status-dot"></div>
          <span>All systems operational</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    @use "../../../assets/styles/variables" as *;

    .app-sidebar {
      width: 100%;
      height: 100%;
      background: rgba($surface-color, 0.3);
      border-right: 1px solid $border-color;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      transition: all $transition-base;
      z-index: 2000;

      @media (max-width: 992px) {
        background: rgba($surface-color, 0.95);
        backdrop-filter: blur(10px);
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      margin-bottom: 2.5rem;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .logo-icon {
        font-size: 1.8rem;
        color: $primary-color;
      }

      span {
        font-size: 1.4rem;
        font-weight: 700;
        color: $text-primary;
        letter-spacing: -0.5px;
      }
    }

    .mobile-close {
      display: none;
      background: transparent;
      border: none;
      color: $text-secondary;
      font-size: 1.2rem;
      cursor: pointer;

      @media (max-width: 992px) {
        display: block;
      }
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0 1rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1rem;
      border-radius: 10px;
      color: $text-secondary;
      font-weight: 500;
      transition: all 0.2s ease;
      text-decoration: none;

      i {
        font-size: 1.2rem;
        transition: transform 0.2s ease;
      }

      &:hover {
        background: rgba($primary-color, 0.08);
        color: $primary-color;

        i {
          transform: scale(1.1);
        }
      }

      &.active {
        background: $primary-color;
        color: white;
        box-shadow: 0 4px 15px rgba($primary-color, 0.3);

        i {
          color: white;
        }
      }
    }

    .nav-spacer {
      flex: 1;
    }

    .logout-item {
      cursor: pointer;
      margin-top: auto;
      color: #ef4444 !important; // Red

      &:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }
    }

    .admin-link {
      color: $primary-color;
      margin-top: 0.5rem;
      border: 1px dashed rgba($primary-color, 0.3);
      
      &:hover {
        background: rgba($primary-color, 0.1);
      }

      &.active {
        background: $primary-color;
        color: white !important;
        border-style: solid;

        i { color: white !important; }
      }
    }

    .sidebar-footer {
      padding: 0 1.5rem;
      
      .system-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: $text-secondary;
        padding: 0.75rem;
        background: rgba(255,255,255,0.5);
        border-radius: 8px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981; // Green
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
      }
    }
  `]
})
export class SidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();
  constructor(public authService: AuthService, private router: Router) {}

  onClose(event?: Event) {
    if (event) event.stopPropagation();
    if (window.innerWidth <= 992) {
      this.closeSidebar.emit();
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.authService.clearLocalData();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
