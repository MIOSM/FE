import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, UpdateUserData } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login...');
      return;
    }
    
    this.initForm();
    this.loadUserData();
  }

  private initForm(): void {
    this.settingsForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.settingsForm.patchValue({
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName
      });
    }
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.settingsForm.disable();

      const userData: UpdateUserData = {
        username: this.settingsForm.get('username')?.value,
        firstName: this.settingsForm.get('firstName')?.value,
        lastName: this.settingsForm.get('lastName')?.value
      };

      this.authService.updateUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.settingsForm.enable();
          if (response && response.success) {
            this.successMessage = response.message || 'Profile updated successfully!';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = response?.message || 'Update failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.settingsForm.enable();
          
          if (error.status === 401) {
            console.log('Authentication error, user needs to login again');
            this.errorMessage = 'Your session has expired. Please login again.';
            this.authService.logout();
          } else {
            this.errorMessage = 'An error occurred during update. Please try again.';
          }
          console.error('Update error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.settingsForm.controls).forEach(key => {
      const control = this.settingsForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.settingsForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }
    
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
