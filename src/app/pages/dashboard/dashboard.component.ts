import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PostService, PostResponse } from '../../core/services/post.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

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
        this.posts = posts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading latest posts:', error);
        this.error = 'Failed to load posts. Please try again.';
        this.loading = false;
      }
    });
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

  navigateToProfile(username: string): void {
    this.router.navigate(['/profile', username]);
  }
}
