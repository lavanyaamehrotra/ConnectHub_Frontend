import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  services = [
    {
      title: 'Real-time Chat',
      description: 'Connect with colleagues instantly with 1-on-1 private messaging.',
      icon: 'pi-comments',
      link: '/chat',
      color: '#9400D3'
    },
    {
      title: 'Public Rooms',
      description: 'Join themed channels and collaborate with the entire team.',
      icon: 'pi-users',
      link: '/rooms',
      color: '#ED80E9'
    },
    {
      title: 'Media Library',
      description: 'Upload, manage, and share images securely via Azure Blob.',
      icon: 'pi-cloud-upload',
      link: '/media',
      color: '#A855F7'
    },
    {
      title: 'Notifications',
      description: 'Never miss an update with real-time push notifications.',
      icon: 'pi-bell',
      link: '/notifications',
      color: '#D8BFD8'
    }
  ];
}
