import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

import { ChatWindowComponent } from './features/chat/chat-window/chat-window.component';
import { RoomListComponent } from './features/rooms/room-list/room-list.component';
import { MediaGalleryComponent } from './features/media/media-gallery/media-gallery.component';
import { NotificationListComponent } from './features/notifications/notification-list/notification-list.component';
import { SettingsComponent } from './features/settings/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'chat', component: ChatWindowComponent },
      { path: 'rooms', component: RoomListComponent },
      { path: 'media', component: MediaGalleryComponent },
      { path: 'notifications', component: NotificationListComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'admin', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
