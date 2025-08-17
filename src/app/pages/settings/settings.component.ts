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
        avatar: this.getProxyImageUrl(currentUser.avatar) || '',
        coverPhoto: this.getProxyImageUrl(currentUser.coverPhoto) || '',
        bio: currentUser.bio || ''
      });
    }
  }

  private getProxyImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl || !imageUrl.startsWith('http://localhost:9000/user-images/')) {
      return null;
    }

    return `http://localhost:8080/auth/public/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
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
        lastName: this.settingsForm.get('lastName')?.value,
        bio: this.settingsForm.get('bio')?.value
      };

      this.authService.updateUser(userData).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.successMessage = 'Profile information updated successfully!';

            if (response.user) {
              this.authService.setCurrentUser(response.user);
              this.settingsForm.patchValue({
                username: response.user.username,
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                bio: response.user.bio || ''
              });
            }
            
            this.handleImageUploads();
          } else {
            this.isLoading = false;
            this.settingsForm.enable();
            this.errorMessage = response?.message || 'Update failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.settingsForm.enable();
          this.errorMessage = 'An error occurred during update. Please try again.';
          console.error('Update error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleImageUploads(): void {
    let uploadCount = 0;
    let completedUploads = 0;
    let hasErrors = false;

    if (this.avatarFile) uploadCount++;
    if (this.coverFile) uploadCount++;

    if (uploadCount === 0) {
      this.isLoading = false;
      this.settingsForm.enable();
      this.avatarFile = null;
      this.coverFile = null;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
      return;
    }

    const checkCompletion = () => {
      completedUploads++;
      if (completedUploads === uploadCount) {
        this.isLoading = false;
        this.settingsForm.enable();
        this.avatarFile = null;
        this.coverFile = null;
        
        if (hasErrors) {
          this.errorMessage = 'Some images failed to upload. Please try again.';
        } else {
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
      }
    };

    if (this.avatarFile) {
      this.authService.uploadAvatar(this.avatarFile).subscribe({
        next: (response) => {
          if (response && response.success) {
            console.log('Avatar uploaded successfully');
            if (response.avatarUrl) {
              this.settingsForm.patchValue({
                avatar: response.avatarUrl
              });
              const currentUser = this.authService.getCurrentUser();
              const formValues = this.settingsForm.value;
              console.log('🔍 Settings: Current user before avatar update:', currentUser);
              console.log('🔍 Settings: Form values:', formValues);
              console.log('🔍 Settings: New avatar URL:', response.avatarUrl);
              if (currentUser) {
                const updatedUser = { 
                  ...currentUser, 
                  avatar: response.avatarUrl,
                  ...(formValues.coverPhoto && formValues.coverPhoto !== 'https://via.placeholder.com/1200x300/2C3E50/FFFFFF?text=Cover+Photo' && { coverPhoto: formValues.coverPhoto })
                };
                console.log('🔍 Settings: Updated user with new avatar:', updatedUser);
                this.authService.setCurrentUser(updatedUser);
                console.log('🔍 Settings: User data updated in AuthService');
              }
            }
          } else {
            hasErrors = true;
            console.error('Avatar upload failed:', response?.message);
          }
          checkCompletion();
        },
        error: (error) => {
          hasErrors = true;
          console.error('Avatar upload error:', error);
          checkCompletion();
        }
      });
    }

    if (this.coverFile) {
      this.authService.uploadCover(this.coverFile).subscribe({
        next: (response) => {
          if (response && response.success) {
            console.log('Cover uploaded successfully');
            if (response.coverUrl) {
              this.settingsForm.patchValue({
                coverPhoto: response.coverUrl
              });
              const currentUser = this.authService.getCurrentUser();
              const formValues = this.settingsForm.value;
              console.log('🔍 Settings: Current user before cover update:', currentUser);
              console.log('🔍 Settings: Form values:', formValues);
              console.log('🔍 Settings: New cover URL:', response.coverUrl);
              if (currentUser) {
                const updatedUser = { 
                  ...currentUser, 
                  coverPhoto: response.coverUrl,
                  ...(formValues.avatar && formValues.avatar !== 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD' && { avatar: formValues.avatar })
                };
                console.log('🔍 Settings: Updated user with new cover:', updatedUser);
                this.authService.setCurrentUser(updatedUser);
                console.log('🔍 Settings: Cover user data updated in AuthService');
              }
            }
          } else {
            hasErrors = true;
            console.error('Cover upload failed:', response?.message);
          }
          checkCompletion();
        },
        error: (error) => {
          hasErrors = true;
          console.error('Cover upload error:', error);
          checkCompletion();
        }
      });
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
    const url = this.settingsForm.get('avatar')?.value || '';
    if (url.startsWith('data:')) {
      return url;
    }
    return this.getProxyImageUrl(url) || url;
  }

  getCurrentCoverUrl(): string {
    const url = this.settingsForm.get('coverPhoto')?.value || '';
    if (url.startsWith('data:')) {
      return url;
    }
    return this.getProxyImageUrl(url) || url;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/default-avatar.png';
    }
  }
}
