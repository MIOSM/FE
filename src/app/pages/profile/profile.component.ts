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
  isLoadingUserProfile: boolean = false;

  followersCount: number = 0;
  followingCount: number = 0;
  isFollowing: boolean = false;
  isLoadingFollow: boolean = false;

  showFollowersModal: boolean = false;
  showFollowingModal: boolean = false;
  followersList: any[] = [];
  followingList: any[] = [];
  isLoadingModal: boolean = false;

  showMediaViewer: boolean = false;
  currentMediaIndex: number = 0;
  currentMediaUrls: string[] = [];
  currentMediaType: 'image' | 'video' = 'image';
  openMenuPostId: string | null = null;

  userAvatar: string | null = null;
  userCoverPhoto: string | null = null;

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
      } else if (!this.currentUser.id && !this.isLoadingUserProfile) {
        this.isLoadingUserProfile = true;
        this.authService.getUserProfile().subscribe({
          next: (fullUser) => {
            this.currentUser = fullUser;
            this.isLoadingUserProfile = false;
            console.log('Updated currentUser with full profile:', this.currentUser);
          },
          error: (error) => {
            console.error('Error fetching user profile:', error);
            this.isLoadingUserProfile = false;
          }
        });
      }
    });

    this.routeSubscription = this.route.params.subscribe(params => {
      const username = params['username'];
      console.log('Route params - username:', username);
      console.log('Current user:', this.currentUser);
      
      if (username) {
        if (this.currentUser && username === this.currentUser.username) {
          console.log('Loading own profile');
          this.isOwnProfile = true;
          this.profileUser = this.currentUser;
          this.loadUserProfileData();
          this.loadUserPosts();
          this.loadSubscriptionData();
        } else {
          console.log('Loading other user profile');
          this.isOwnProfile = false;
          this.loadOtherUserProfile(username);
        }
      } else {
        console.log('No username in route, redirecting to own profile');
        if (this.currentUser?.username) {
          this.router.navigate(['/profile', this.currentUser.username], { replaceUrl: true });
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
        this.loadSubscriptionData();
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
      
      this.userAvatar = avatar ? this.getProxyImageUrl(avatar) : null;
      this.userCoverPhoto = coverPhoto ? this.getProxyImageUrl(coverPhoto) : null;
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

  navigateToUserProfile(username: string): void {
    if (username) {
      this.router.navigate(['/profile', username]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadSubscriptionData(): void {
    
    let userId = this.profileUser?.id || this.currentUser?.id;
    
    if (!userId && (this.profileUser?.username || this.currentUser?.username)) {
      const username = this.profileUser?.username || this.currentUser?.username;
      this.userService.getUserByUsername(username!).subscribe({
        next: (user) => {
          if (this.isOwnProfile) {
            this.currentUser = { ...this.currentUser!, id: user.id } as User;
            this.profileUser = this.currentUser;
          } else {
            this.profileUser = user;
          }
          this.loadSubscriptionDataWithId(user.id);
        },
        error: (error) => {
          console.error('Error getting user by username for subscription data:', error);
        }
      });
      return;
    }
    
    if (!userId) {
      console.warn('No user ID available for subscription data');
      return;
    }

    this.loadSubscriptionDataWithId(userId);
  }

  private loadSubscriptionDataWithId(userId: string): void {
    this.userService.getFollowersCount(userId).subscribe({
      next: (response) => {
        this.followersCount = response.count;
        console.log('Loaded followers count:', response.count);
      },
      error: (error) => {
        console.error('Error loading followers count:', error);
        this.followersCount = 0;
      }
    });

    this.userService.getFollowingCount(userId).subscribe({
      next: (response) => {
        this.followingCount = response.count;
        console.log('Loaded following count:', response.count);
      },
      error: (error) => {
        console.error('Error loading following count:', error);
        this.followingCount = 0;
      }
    });

    if (!this.isOwnProfile && this.currentUser?.id && userId) {
      this.userService.isFollowing(this.currentUser.id, userId).subscribe({
        next: (response) => {
          this.isFollowing = response.isFollowing;
        },
        error: (error) => {
          console.error('Error checking follow status:', error);
        }
      });
    } else if (this.isOwnProfile) {
      this.isFollowing = false;
    }
  }

  toggleFollow(): void {
    console.log('toggleFollow() called');
    console.log('currentUser:', this.currentUser);
    console.log('profileUser:', this.profileUser);
    console.log('isLoadingFollow:', this.isLoadingFollow);
    console.log('isOwnProfile:', this.isOwnProfile);

    if (!this.currentUser?.id && this.currentUser?.username) {
      console.log('Attempting to get currentUser by username');
      this.userService.getUserByUsername(this.currentUser.username).subscribe({
        next: (user) => {
          this.currentUser = { ...this.currentUser!, id: user.id } as User;
          console.log('Updated currentUser with id:', this.currentUser);
          this.executeFollowAction();
        },
        error: (error) => {
          console.error('Error getting current user by username:', error);
        }
      });
      return;
    }
    
    if (!this.currentUser?.id || !this.profileUser?.id || this.isLoadingFollow) {
      console.log('Early return - missing data or loading');
      return;
    }

    this.executeFollowAction();
  }

  private executeFollowAction(): void {
    if (!this.currentUser?.id || !this.profileUser?.id || this.isLoadingFollow) {
      return;
    }

    this.isLoadingFollow = true;
    console.log('Starting follow action, isFollowing:', this.isFollowing);

    const action = this.isFollowing 
      ? this.userService.unfollowUser(this.currentUser.id, this.profileUser.id)
      : this.userService.followUser(this.currentUser.id, this.profileUser.id);

    action.subscribe({
      next: () => {
        console.log('Follow action successful');
        this.isFollowing = !this.isFollowing;
        this.loadSubscriptionData();
        this.isLoadingFollow = false;
        console.log('New follow status:', this.isFollowing);
      },
      error: (error) => {
        console.error('Error toggling follow:', error);
        this.isLoadingFollow = false;
      }
    });
  }

  openFollowersModal(): void {
    let userId = this.profileUser?.id || this.currentUser?.id;
    
    if (!userId && this.currentUser?.username) {
      this.userService.getUserByUsername(this.currentUser.username).subscribe({
        next: (user) => {
          this.currentUser = { ...this.currentUser!, id: user.id } as User;
          this.openFollowersModalWithId(user.id);
        },
        error: (error) => {
          console.error('Error getting current user by username:', error);
        }
      });
      return;
    }
    
    if (!userId) {
      console.error('No user ID available for followers modal');
      return;
    }
    
    this.openFollowersModalWithId(userId);
  }

  private openFollowersModalWithId(userId: string): void {
    this.showFollowersModal = true;
    this.isLoadingModal = true;
    this.followersList = [];
    
    this.userService.getFollowers(userId).subscribe({
      next: (followers) => {
        this.followersList = followers;
        this.isLoadingModal = false;
      },
      error: (error) => {
        console.error('Error loading followers:', error);
        this.isLoadingModal = false;
      }
    });
  }

  openFollowingModal(): void {
    let userId = this.profileUser?.id || this.currentUser?.id;
    
    if (!userId && this.currentUser?.username) {
      this.userService.getUserByUsername(this.currentUser.username).subscribe({
        next: (user) => {
          this.currentUser = { ...this.currentUser!, id: user.id } as User;
          this.openFollowingModalWithId(user.id);
        },
        error: (error) => {
          console.error('Error getting current user by username:', error);
        }
      });
      return;
    }
    
    if (!userId) {
      console.error('No user ID available for following modal');
      return;
    }
    
    this.openFollowingModalWithId(userId);
  }

  private openFollowingModalWithId(userId: string): void {
    this.showFollowingModal = true;
    this.isLoadingModal = true;
    this.followingList = [];
    
    this.userService.getFollowing(userId).subscribe({
      next: (following) => {
        this.followingList = following;
        this.isLoadingModal = false;
      },
      error: (error) => {
        console.error('Error loading following:', error);
        this.isLoadingModal = false;
      }
    });
  }

  closeFollowersModal(): void {
    this.showFollowersModal = false;
    this.followersList = [];
  }

  closeFollowingModal(): void {
    this.showFollowingModal = false;
    this.followingList = [];
  }

  getUserAvatarUrl(user: any): string {
    return this.userService.getAvatarProxyUrl(user.avatarUrl);
  }

  navigateToUser(username: string): void {
    this.closeFollowersModal();
    this.closeFollowingModal();
    this.router.navigate(['/profile', username]);
  }

  getAvatarInitial(): string {
    if (this.profileUser?.username) {
      return this.profileUser.username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getAvatarColor(): string {
    if (!this.profileUser?.username) {
      return 'var(--primary-500)';
    }

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < this.profileUser.username.length; i++) {
      hash = this.profileUser.username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  getTextColor(backgroundColor: string): string {

    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#333333' : '#FFFFFF';
  }

  hasValidAvatar(): boolean {
    return !!(this.userAvatar && this.userAvatar.trim());
  }

  hasValidCoverPhoto(): boolean {
    return !!(this.userCoverPhoto && this.userCoverPhoto.trim());
  }
}
