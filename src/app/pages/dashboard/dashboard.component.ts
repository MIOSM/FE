import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PostService, PostResponse } from '../../core/services/post.service';
import { UserService, SearchUser } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { catchError, firstValueFrom } from 'rxjs';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  posts: PostResponse[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private postService: PostService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLatestPosts();
  }

  loadLatestPosts(): void {
    this.loading = true;
    this.error = null;

    this.postService.getLatestPosts(10).subscribe({
      next: (posts) => {
        this.enrichPostsWithAvatars(posts);
      },
      error: (error) => {
        console.error('Error loading latest posts:', error);
        this.error = 'Failed to load posts. Please try again.';
        this.loading = false;
      }
    });
  }

  private async enrichPostsWithAvatars(posts: PostResponse[]): Promise<void> {
    const usernamesNeedingAvatars = [...new Set(
      posts
        .filter(post => !post.userAvatar)
        .map(post => post.username)
    )];

    if (usernamesNeedingAvatars.length === 0) {
      this.posts = posts;
      this.loading = false;
      return;
    }

    try {
      const userRequests = usernamesNeedingAvatars.map(username =>
        firstValueFrom(
          this.userService.getUserByUsername(username).pipe(
            catchError((error: any) => {
              console.warn(`Failed to fetch user data for ${username}:`, error);
              return of(null);
            })
          )
        )
      );

      const users = await Promise.all(userRequests);

      const avatarMap = new Map<string, string>();
      users.forEach((user: SearchUser | null) => {
        if (user && user.username) {
          avatarMap.set(user.username, user.avatarUrl || '');
        }
      });

      this.posts = posts.map(post => ({
        ...post,
        userAvatar: post.userAvatar || avatarMap.get(post.username) || ''
      }));

      this.loading = false;
    } catch (error: any) {
      console.error('Error enriching posts with avatars:', error);
      this.posts = posts;
      this.loading = false;
    }
  }

  getAvatarUrl(avatarUrl: string | null | undefined): string {
    return this.userService.getAvatarProxyUrl(avatarUrl);
  }

  getImageProxyUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('/api/') || imageUrl.startsWith('/assets/') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/post-media/')) {
      return `http://localhost:8080/post-service${imageUrl}`;
    }

    if (imageUrl.includes('localhost:9002')) {
      const urlParts = imageUrl.split('/');
      const bucketName = urlParts[urlParts.length - 2]; 
      const fileName = urlParts[urlParts.length - 1];
      return `http://localhost:8080/post-service/${bucketName}/images/${fileName}`;
    }
    
    return imageUrl;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  onRefresh(): void {
    this.loadLatestPosts();
  }

  trackByPostId(index: number, post: PostResponse): string {
    return post.postId;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  hasValidAvatar(avatarUrl: string | null | undefined): boolean {
    return !!(avatarUrl && avatarUrl.trim() && !avatarUrl.includes('default-avatar'));
  }

  getAvatarInitial(username: string): string {
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  getAvatarColor(username: string): string {
    if (!username) {
      return 'var(--primary-500)';
    }

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
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

  navigateToProfile(username: string): void {
    this.router.navigate(['/profile', username]);
  }
}
