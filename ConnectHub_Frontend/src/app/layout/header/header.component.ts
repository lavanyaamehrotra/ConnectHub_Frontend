import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';
import { TransformMediaUrlPipe } from '../../shared/pipes/transform-media-url.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, TransformMediaUrlPipe],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button class="mobile-toggle" (click)="onToggleSidebar($event)">
          <i class="pi pi-bars"></i>
        </button>
        <h2 class="page-title">{{ pageTitle }}</h2>
      </div>
      <div class="header-right">
        <div class="profile-dropdown-container">
          <div class="user-profile">
            <p-avatar [image]="transformedAvatarUrl" 
                      [label]="!transformedAvatarUrl ? userName?.charAt(0) : ''"
                      (onImageError)="transformedAvatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userName"
                      shape="circle" size="large"></p-avatar>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">Online <i class="pi pi-chevron-down ml-1" style="font-size: 0.7rem"></i></span>
            </div>
          </div>

          <!-- DROPDOWN MENU -->
          <div class="dropdown-menu">
            <div class="dropdown-header">
              <span class="full-name">{{ userName }}</span>
              <span class="user-email">{{ userEmail }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <a routerLink="/settings" class="dropdown-item">
              <i class="pi pi-user"></i>
              <span>My Profile</span>
            </a>
            <a routerLink="/settings" class="dropdown-item">
              <i class="pi pi-lock"></i>
              <span>Change Password</span>
            </a>
            <div class="dropdown-divider"></div>
            <a (click)="deactivateAccount()" class="dropdown-item danger">
              <i class="pi pi-user-minus"></i>
              <span>Deactivate Account</span>
            </a>
            <a (click)="logout()" class="dropdown-item logout">
              <i class="pi pi-power-off"></i>
              <span>Log Out</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    @use "../../../assets/styles/variables" as *;

    .app-header {
      height: $header-height;
      background: rgba($surface-color, 0.4);
      backdrop-filter: blur(15px);
      border-bottom: 1px solid $border-color;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      z-index: 100;
      position: relative;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-toggle {
      display: none;
      background: transparent;
      border: none;
      color: $text-primary;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;

      @media (max-width: 992px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:hover {
        background: rgba($primary-color, 0.1);
      }
    }

    .page-title {
      color: $text-primary;
      font-weight: 600;
      margin: 0;
      font-size: 1.25rem;

      @media (max-width: 576px) {
        font-size: 1.1rem;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .profile-dropdown-container {
      position: relative;
      padding: 0.5rem 0;

      &:hover {
        .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .user-profile {
          background: rgba($primary-color, 0.1);
        }
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      transition: all 0.3s ease;

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-weight: 600;
          color: $text-primary;
          font-size: 0.95rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: $primary-color;
          display: flex;
          align-items: center;
        }
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      width: 240px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      border: 1px solid $border-color;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1000;
      overflow: hidden;
      padding: 0.5rem;
    }

    .dropdown-header {
      padding: 1rem;
      display: flex;
      flex-direction: column;

      .full-name {
        font-weight: 700;
        color: $text-primary;
        font-size: 1rem;
      }
      .user-email {
        font-size: 0.8rem;
        color: $text-secondary;
      }
    }

    .dropdown-divider {
      height: 1px;
      background: $border-color;
      margin: 0.5rem 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: $text-primary;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
      font-size: 0.9rem;

      i {
        font-size: 1rem;
        color: $text-secondary;
      }

      &:hover {
        background: rgba($primary-color, 0.05);
        color: $primary-color;
        i { color: $primary-color; }
      }

      &.danger:hover {
        background: rgba(239, 68, 68, 0.05);
        color: #ef4444;
        i { color: #ef4444; }
      }

      &.logout {
        margin-top: 0.25rem;
        font-weight: 600;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  userName = 'Welcome User';
  userEmail = '';
  avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
  transformedAvatarUrl = '';
  pageTitle = 'Dashboard';

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.displayName || user.DisplayName || user.username || user.Username || user.email || user.Email || 'User';
        this.userEmail = user.email || user.Email || '';
        const rawAvatar = user.avatarUrl || user.AvatarUrl;
        const seed = user.username || user.Username || user.displayName || user.DisplayName || 'User';
        this.avatarUrl = rawAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        this.transformedAvatarUrl = this.transformUrl(this.avatarUrl);
      }
    });
    this.updatePageTitle();
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

  onToggleSidebar(event: Event) {
    event.stopPropagation();
    this.toggleSidebar.emit();
  }

  updatePageTitle() {
    const url = this.router.url;
    if (url.includes('/dashboard')) this.pageTitle = 'Dashboard';
    else if (url.includes('/chat')) this.pageTitle = 'Messages';
    else if (url.includes('/rooms')) this.pageTitle = 'Chat Rooms';
    else if (url.includes('/settings')) this.pageTitle = 'Settings';
    else if (url.includes('/media')) this.pageTitle = 'Media Gallery';
    else if (url.includes('/notifications')) this.pageTitle = 'Notifications';
    else this.pageTitle = 'ConnectHub';
  }

  deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? This action is reversible by contacting support.')) {
      // Logic for deactivation can be added here
      this.router.navigate(['/settings']);
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.authService.clearLocalData();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
