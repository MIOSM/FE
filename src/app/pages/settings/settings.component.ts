import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, UpdateUserData } from '../../core/services/auth.service';
import { ImageUploadModalComponent } from '../../shared/components/image-upload-modal/image-upload-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  showAvatarModal = false;
  showCoverModal = false;
  avatarFile: File | null = null;
  coverFile: File | null = null;

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
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      avatar: [''],
      coverPhoto: [''],
      bio: ['']
    });
  }

  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.settingsForm.patchValue({
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatar: currentUser.avatar || '',
        coverPhoto: currentUser.coverPhoto || '',
        bio: currentUser.bio || ''
      });
    }
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.settingsForm.disable();

      const formData = new FormData();
      formData.append('username', this.settingsForm.get('username')?.value);
      formData.append('firstName', this.settingsForm.get('firstName')?.value);
      formData.append('lastName', this.settingsForm.get('lastName')?.value);
      formData.append('bio', this.settingsForm.get('bio')?.value);

      if (this.avatarFile) {
        formData.append('avatar', this.avatarFile);
      } else {
        formData.append('avatar', this.settingsForm.get('avatar')?.value || '');
      }

      if (this.coverFile) {
        formData.append('coverPhoto', this.coverFile);
      } else {
        formData.append('coverPhoto', this.settingsForm.get('coverPhoto')?.value || '');
      }

      const userData: UpdateUserData = {
        username: this.settingsForm.get('username')?.value,
        firstName: this.settingsForm.get('firstName')?.value,
        lastName: this.settingsForm.get('lastName')?.value,
        avatar: this.settingsForm.get('avatar')?.value,
        coverPhoto: this.settingsForm.get('coverPhoto')?.value,
        bio: this.settingsForm.get('bio')?.value
      };

      this.authService.updateUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.settingsForm.enable();
          if (response && response.success) {
            this.successMessage = response.message || 'Profile updated successfully!';
            this.avatarFile = null;
            this.coverFile = null;
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

  openAvatarModal(): void {
    this.showAvatarModal = true;
  }

  openCoverModal(): void {
    this.showCoverModal = true;
  }

  onAvatarSelected(file: File): void {
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      this.settingsForm.patchValue({ avatar: previewUrl });
    };
    reader.readAsDataURL(file);
  }

  onCoverSelected(file: File): void {
    this.coverFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      this.settingsForm.patchValue({ coverPhoto: previewUrl });
    };
    reader.readAsDataURL(file);
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
  }

  closeCoverModal(): void {
    this.showCoverModal = false;
  }

  getCurrentAvatarUrl(): string {
    return this.settingsForm.get('avatar')?.value || '';
  }

  getCurrentCoverUrl(): string {
    return this.settingsForm.get('coverPhoto')?.value || '';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/default-avatar.png';
    }
  }
}
