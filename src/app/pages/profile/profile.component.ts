import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
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
  profileUser: User | any = null; 
  userPosts: PostResponse[] = [];
  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();
  isLoadingPosts: boolean = false;
  isLoadingProfile: boolean = false;
  isOwnProfile: boolean = true;

  showMediaViewer: boolean = false;
  currentMediaIndex: number = 0;
  currentMediaUrls: string[] = [];
  currentMediaType: 'image' | 'video' = 'image';
  openMenuPostId: string | null = null;

  userAvatar: string = 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD';
  userCoverPhoto: string = 'https://via.placeholder.com/1200x300/2C3E50/FFFFFF?text=Cover+Photo';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private postService: PostService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        this.router.navigate(['/login']);
      }
    });

    this.routeSubscription = this.route.params.subscribe(params => {
      const username = params['username'];
      if (username) {
        this.isOwnProfile = false;
        this.loadOtherUserProfile(username);
      } else {
        this.isOwnProfile = true;
        if (this.currentUser) {
          this.profileUser = this.currentUser;
          this.loadUserProfileData();
          this.loadUserPosts();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  private loadOtherUserProfile(username: string): void {
    this.isLoadingProfile = true;
    this.userService.getUserByUsername(username).subscribe({
      next: (user) => {
        this.profileUser = user;
        this.loadUserProfileData();
        this.loadUserPosts();
        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.isLoadingProfile = false;
      }
    });
  }

  private loadUserProfileData(): void {
    if (this.profileUser) {
      const avatar = this.profileUser.avatar || this.profileUser.avatarUrl;
      const coverPhoto = this.profileUser.coverPhoto || this.profileUser.coverImageUrl;
      
      if (avatar) {
        this.userAvatar = this.getProxyImageUrl(avatar) || this.userAvatar;
      }
      if (coverPhoto) {
        this.userCoverPhoto = this.getProxyImageUrl(coverPhoto) || this.userCoverPhoto;
      }
    }
  }

  private loadUserPosts(): void {
    if (this.profileUser) {
      const username = this.profileUser.username;
      console.log('Loading posts for user:', username);
      this.isLoadingPosts = true;
      this.postService.getPostsByUser(username).subscribe({
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

  onDeletePost(postId: string, event: Event): void {
    event.stopPropagation();
    this.closeAllMenus();
    
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.userPosts = this.userPosts.filter(post => post.postId !== postId);
          console.log('Post deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          alert('Failed to delete post. Please try again.');
        }
      });
    }
  }

  isCurrentUserPost(post: PostResponse): boolean {
    return this.currentUser?.username === post.username;
  }

  togglePostMenu(postId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuPostId = this.openMenuPostId === postId ? null : postId;
  }

  isMenuOpen(postId: string): boolean {
    return this.openMenuPostId === postId;
  }

  closeAllMenus(): void {
    this.openMenuPostId = null;
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.post-actions-right') && this.openMenuPostId) {
      this.closeAllMenus();
    }
  }

  createPost(): void {
    this.router.navigate(['/create-post']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
