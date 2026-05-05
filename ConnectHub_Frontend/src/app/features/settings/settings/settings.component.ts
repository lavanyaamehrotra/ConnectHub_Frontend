import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { TransformMediaUrlPipe } from '../../../shared/pipes/transform-media-url.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    PasswordModule, 
    CardModule, 
    ToastModule,
    AvatarModule,
    AvatarModule,
    TooltipModule,
    TransformMediaUrlPipe
  ],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loadingProfile = false;
  loadingPassword = false;
  loadingDeactivate = false;
  loadingAvatar = false;
  currentUser: any;
  tempAvatarUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private mediaService: MediaService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required]],
      bio: ['']
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = {
          ...user,
          id: user.id || user.userId || user.UserId,
          displayName: user.displayName || user.DisplayName || user.username || user.Username,
          avatarUrl: user.avatarUrl || user.AvatarUrl,
          username: user.username || user.Username,
          bio: user.bio || user.Bio || ''
        };
        this.profileForm.patchValue({
          displayName: this.currentUser.displayName,
          bio: this.currentUser.bio
        });
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.loadingAvatar = true;
      this.mediaService.upload(file).subscribe({
        next: (res: any) => {
          const rawUrl = res.blobUrl || res.fileUrl;
          this.tempAvatarUrl = this.transformUrl(rawUrl);
          
          // Automatically update profile with new avatar URL
          this.userService.updateProfile({ avatarUrl: this.tempAvatarUrl }).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Avatar updated' });
              this.loadingAvatar = false;
              // Update local user data
              if (this.currentUser) {
                this.currentUser.avatarUrl = this.tempAvatarUrl;
              }
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update avatar link' });
              this.loadingAvatar = false;
            }
          });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' });
          this.loadingAvatar = false;
        }
      });
    }
  }

  private transformUrl(url: string): string {
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

  updateProfile() {
    if (this.profileForm.invalid) return;
    this.loadingProfile = true;

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully' });
        this.loadingProfile = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update profile' });
        this.loadingProfile = false;
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    this.loadingPassword = true;

    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully' });
        this.passwordForm.reset();
        this.loadingPassword = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to change password' });
        this.loadingPassword = false;
      }
    });
  }

  deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? You will be logged out immediately.')) {
      this.loadingDeactivate = true;
      this.userService.deactivateAccount().subscribe({
        next: () => {
          this.authService.clearLocalData();
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to deactivate account' });
          this.loadingDeactivate = false;
        }
      });
    }
  }
}
