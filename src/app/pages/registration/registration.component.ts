import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegistrationData } from '../../core/services/auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
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
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.registrationForm.disable();

      const userData = {
        username: this.registrationForm.get('username')?.value,
        email: this.registrationForm.get('email')?.value,
        password: this.registrationForm.get('password')?.value,
        firstName: this.registrationForm.get('firstName')?.value,
        lastName: this.registrationForm.get('lastName')?.value
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          if (response && response.success) {
            const credentials: any = {
              password: userData.password
            };

            if (userData.email) {
              credentials.email = userData.email;
            } else {
              credentials.username = userData.username;
            }
            this.authService.login(credentials).subscribe({
              next: (loginResponse) => {
                this.isLoading = false;
                this.registrationForm.enable();
                if (loginResponse && loginResponse.success) {
                  this.successMessage = 'Registration and login successful! Redirecting...';
                  setTimeout(() => {
                    if (loginResponse.user?.username) {
                      this.router.navigate(['/profile', loginResponse.user.username]);
                    } else {
                      this.router.navigate(['/search']);
                    }
                  }, 1000);
                } else {
                  this.errorMessage = loginResponse?.message || 'Login after registration failed. Please try to login manually.';
                }
              },
              error: (loginError) => {
                this.isLoading = false;
                this.registrationForm.enable();
                this.errorMessage = 'Registration succeeded, but auto-login failed. Please try to login manually.';
                console.error('Auto-login error:', loginError);
              }
            });
          } else {
            this.isLoading = false;
            this.registrationForm.enable();
            this.errorMessage = response?.message || 'Registration failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.registrationForm.enable();
          this.errorMessage = 'An error occurred during registration. Please try again.';
          console.error('Registration error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registrationForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }
    
    return '';
  }

  getPasswordMismatchError(): string {
    if (this.registrationForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isPasswordMismatch(): boolean {
    return this.registrationForm.hasError('passwordMismatch') && 
           this.registrationForm.get('confirmPassword')?.touched === true;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
