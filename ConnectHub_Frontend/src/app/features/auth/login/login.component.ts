import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showReactivateBanner = false;
  reactivating = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.initGoogleSignIn();
  }

  private initGoogleSignIn() {
    if (typeof google === 'undefined') {
      setTimeout(() => this.initGoogleSignIn(), 500);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.ngZone.run(() => this.handleGoogleResponse(response))
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }

  private handleGoogleResponse(response: any) {
    this.loading = true;
    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Google login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.showReactivateBanner = false;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.isDeactivated) {
          // Correct credentials but account is deactivated — show reactivate prompt
          this.showReactivateBanner = true;
          this.loading = false;
        } else {
          this.router.navigate(['/dashboard']);
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }

  reactivateAccount() {
    const { usernameOrEmail, password } = this.loginForm.value;
    this.reactivating = true;

    this.authService.reactivateAccount(usernameOrEmail, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.reactivating = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Reactivation failed. Please try again.';
        this.reactivating = false;
        this.showReactivateBanner = false;
      }
    });
  }
}
