import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginCredentials } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.loginForm.disable();

      const loginValue = this.loginForm.get('login')?.value;
      const credentials: any = {
        password: this.loginForm.get('password')?.value
      };

      if (loginValue && loginValue.includes('@')) {
        credentials.email = loginValue;
      } else {
        credentials.username = loginValue;
      }

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.loginForm.enable();
          if (response && response.success) {
            this.successMessage = response.message;
            if (response.token) {
              localStorage.setItem('access_token', response.token);
            }
            if (response.user) {
              localStorage.setItem('user_data', JSON.stringify(response.user));
            }
            setTimeout(() => {
              this.router.navigate(['/profile']);
            }, 1000);
          } else {
            this.errorMessage = response?.message || 'Login failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.loginForm.enable();
          this.errorMessage = 'An error occurred during login. Please try again.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  trackByEmail(index: number, user: { email: string; name: string }): string {
    return user.email;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    
    if (controlName === 'login' && control?.value && control.value.includes('@')) {
      // Optionally, will email format validation if needed
      // if (!/.+@.+\..+/.test(control.value)) {
      //   return 'Please enter a valid email address';
      // }
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }
    
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
