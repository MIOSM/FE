import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
}

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  postText: string = '';
  mediaFiles: MediaFile[] = [];
  isSubmitting: boolean = false;

  readonly maxCharacters = 300;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.mediaFiles.forEach(media => {
      URL.revokeObjectURL(media.url);
    });
  }

  get remainingCharacters(): number {
    return this.maxCharacters - this.postText.length;
  }

  get isPostValid(): boolean {
    return (this.postText.trim().length > 0 || this.mediaFiles.length > 0) && 
           this.postText.length <= this.maxCharacters;
  }

  get userAvatar(): string {
    if (this.currentUser?.avatar) {
      const proxyUrl = this.getProxyImageUrl(this.currentUser.avatar);
      return proxyUrl || 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=U';
    }
    return 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=U';
  }

  private getProxyImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }
    
    if (!imageUrl.startsWith('http://localhost:9000/user-images/')) {
      return null;
    }

    const proxyUrl = `http://localhost:8080/auth/public/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
    return proxyUrl;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        if (this.isValidMediaFile(file)) {
          const mediaFile: MediaFile = {
            file: file,
            url: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video'
          };
          this.mediaFiles.push(mediaFile);
        }
      });
    }
    input.value = '';
  }

  private isValidMediaFile(file: File): boolean {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const maxSize = 10 * 1024 * 1024; 

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }

    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      alert('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG) are allowed');
      return false;
    }

    return true;
  }

  removeMediaFile(index: number): void {
    const mediaFile = this.mediaFiles[index];
    URL.revokeObjectURL(mediaFile.url);
    this.mediaFiles.splice(index, 1);
  }

  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  async createPost(): Promise<void> {
    if (!this.isPostValid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      console.log('Creating post with:', {
        text: this.postText,
        mediaFiles: this.mediaFiles.map(m => ({
          name: m.file.name,
          type: m.type,
          size: m.file.size
        }))
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      alert('Post created successfully! (This is a placeholder - actual posting will be implemented when the post service is ready)');

      this.resetForm();

      this.router.navigate(['/profile']);

    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm(): void {
    this.postText = '';
    this.mediaFiles.forEach(media => {
      URL.revokeObjectURL(media.url);
    });
    this.mediaFiles = [];
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
