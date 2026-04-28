import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SignalrService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container" [class.sidebar-open]="isSidebarVisible">
      <app-sidebar [class.visible]="isSidebarVisible" (closeSidebar)="isSidebarVisible = false"></app-sidebar>
      <div class="main-content" [class.shifted]="isSidebarVisible">
        <app-header (toggleSidebar)="isSidebarVisible = !isSidebarVisible"></app-header>
        <div class="page-body" (click)="closeSidebarOnMobile()">
          <router-outlet></router-outlet>
        </div>
      </div>
      <!-- MOBILE OVERLAY -->
      <div class="mobile-overlay" *ngIf="isSidebarVisible" (click)="isSidebarVisible = false"></div>
    </div>
  `
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarVisible = false;

  constructor(private signalrService: SignalrService) {}

  ngOnInit(): void {
    this.signalrService.startConnection();
  }

  ngOnDestroy(): void {
    this.signalrService.stopConnection();
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 992) {
      this.isSidebarVisible = false;
    }
  }
}
