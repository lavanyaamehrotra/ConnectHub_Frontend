import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService, ChatRoom } from '../../../core/services/room.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    TagModule,
    CardModule,
    TabViewModule,
    ToastModule,
    InputNumberModule,
    AvatarModule
  ],
  providers: [MessageService],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {
  rooms: ChatRoom[] = [];
  myRooms: ChatRoom[] = [];
  activeTab: number = 0;
  
  displayCreateDialog: boolean = false;
  newRoom: any = {
    roomName: '',
    description: '',
    roomType: 'PUBLIC',
    maxMembers: 500
  };

  roomTypes = [
    { label: 'Public', value: 'PUBLIC' },
    { label: 'Private', value: 'PRIVATE' }
  ];

  constructor(
    private roomService: RoomService,
    private router: Router,
    private messageService: MessageService,
    private signalrService: SignalrService
  ) {}

  isMember(roomId: string): boolean {
    return this.myRooms.some(r => r.roomId === roomId);
  }

  ngOnInit(): void {
    this.loadRooms();
    this.signalrService.newRoomAdded$.subscribe(() => {
      this.loadRooms();
    });
  }

  loadRooms(): void {
    this.roomService.getPublicRooms().subscribe(rooms => {
      this.rooms = rooms;
    });

    this.roomService.getRoomsByUser().subscribe(rooms => {
      this.myRooms = rooms;
    });
  }

  showCreateDialog(): void {
    this.displayCreateDialog = true;
  }

  handleRoomAction(roomId: string): void {
    if (this.isMember(roomId)) {
      this.openRoom(roomId);
    } else {
      this.joinRoom(roomId);
    }
  }

  createRoom(): void {
    if (!this.newRoom.roomName) return;

    this.roomService.createRoom(this.newRoom).subscribe({
      next: (room) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Room created successfully' });
        this.displayCreateDialog = false;
        this.loadRooms();
        this.newRoom = { roomName: '', description: '', roomType: 'PUBLIC', maxMembers: 500 };
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create room' });
      }
    });
  }

  joinRoom(roomId: string): void {
    this.roomService.joinRoom(roomId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Joined community!` });
        this.loadRooms();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to join room' });
      }
    });
  }

  openRoom(roomId: string): void {
    this.router.navigate(['/chat'], { queryParams: { roomId: roomId } });
  }

  getSeverity(type: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (type) {
      case 'PUBLIC': return 'success';
      case 'PRIVATE': return 'danger';
      case 'DIRECT': return 'info';
      default: return 'secondary';
    }
  }
}
