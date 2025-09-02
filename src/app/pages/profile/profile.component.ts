import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { PostService, PostResponse } from '../../core/services/post.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userPosts: PostResponse[] = [];
  private userSubscription: Subscription = new Subscription();
  isLoadingPosts: boolean = false;

  showMediaViewer: boolean = false;
  currentMediaIndex: number = 0;
  currentMediaUrls: string[] = [];
  currentMediaType: 'image' | 'video' = 'image';

  userAvatar: string = 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD';
  userCoverPhoto: string = 'https://via.placeholder.com/1200x300/2C3E50/FFFFFF?text=Cover+Photo';

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        this.router.navigate(['/login']);
      } else {
        this.loadUserProfileData();
        this.loadUserPosts();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  private loadUserProfileData(): void {
    if (this.currentUser) {
      if (this.currentUser.avatar) {
        this.userAvatar = this.getProxyImageUrl(this.currentUser.avatar) || this.userAvatar;
      }
      if (this.currentUser.coverPhoto) {
        this.userCoverPhoto = this.getProxyImageUrl(this.currentUser.coverPhoto) || this.userCoverPhoto;
      }
    }
  }

  private loadUserPosts(): void {
    if (this.currentUser) {
      console.log('Loading posts for user:', this.currentUser.username);
      this.isLoadingPosts = true;
      this.postService.getPostsByUser(this.currentUser.username).subscribe({
        next: (posts) => {
          console.log('Received posts:', posts);
          this.userPosts = posts;
          this.isLoadingPosts = false;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.isLoadingPosts = false;
        },
        complete: () => {
          console.log('Post loading completed');
        }
      });
    }
  }

  getPostImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `http://localhost:8080/post-service${imageUrl}`;
  }
  
  openMediaViewer(mediaUrls: string[], initialIndex: number = 0, type: 'image' | 'video' = 'image'): void {
    this.currentMediaUrls = mediaUrls.map(url => this.getPostImageUrl(url));
    this.currentMediaIndex = initialIndex;
    this.currentMediaType = type;
    this.showMediaViewer = true;

    document.body.style.overflow = 'hidden';
  }
  
  closeMediaViewer(): void {
    this.showMediaViewer = false;
    document.body.style.overflow = '';
  }
  
  navigateMedia(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      this.currentMediaIndex = (this.currentMediaIndex - 1 + this.currentMediaUrls.length) % this.currentMediaUrls.length;
    } else {
      this.currentMediaIndex = (this.currentMediaIndex + 1) % this.currentMediaUrls.length;
    }
  }
  
  getCurrentMediaUrl(): SafeUrl {
    if (!this.currentMediaUrls.length) return '';
    const url = this.currentMediaUrls[this.currentMediaIndex];
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  private getProxyImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/user-images/')) {
      return `http://localhost:8080/user-service${imageUrl}`;
    }

    if (imageUrl.startsWith('/post-media/')) {
      return `http://localhost:8080/post-service${imageUrl}`;
    }
    
    return null;
  }

  editProfile(): void {
    this.router.navigate(['/settings']);
  }

  openImagePreview(imageUrl: string): void {
    console.log('Opening image preview:', imageUrl);
    window.open(imageUrl, '_blank');
  }

  createPost(): void {
    this.router.navigate(['/create-post']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
