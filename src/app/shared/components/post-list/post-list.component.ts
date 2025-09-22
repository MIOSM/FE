import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { UserService, SearchUser } from '../../../core/services/user.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { PostCardComponent } from '../post-card/post-card.component';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss'],
  exportAs: 'postList'
})
export class PostListComponent implements OnInit, OnChanges {
  @Input() mode: 'feed' | 'profile' | 'likes' = 'feed';
  @Input() username?: string; 
  @Input() pageSize = 10;

  loading = true;
  error: string | null = null;
  posts: PostResponse[] = [];
  likingPosts = new Set<string>();

  showMediaViewer = false;
  currentMediaIndex = 0;
  currentMediaUrls: string[] = [];
  currentMediaType: 'image' | 'video' = 'image';

  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['username'] || changes['pageSize']) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.error = null;

    if (this.mode === 'feed') {
      this.postService.getLatestPosts(this.pageSize).subscribe({
        next: (posts) => this.afterLoad(posts),
        error: (err) => this.onError(err)
      });
      return;
    }

    if ((this.mode === 'profile' || this.mode === 'likes') && !this.username) {
      this.posts = [];
      this.loading = false;
      return;
    }

    if (this.mode === 'profile') {
      this.postService.getPostsByUser(this.username!).subscribe({
        next: (posts) => this.afterLoad(posts),
        error: (err) => this.onError(err)
      });
      return;
    }

    if (this.mode === 'likes') {
      this.postService.getLikedPostsByUser(this.username!).subscribe({
        next: (posts) => this.afterLoad(posts),
        error: (err) => this.onError(err)
      });
      return;
    }
  }

  private onError(error: any): void {
    console.error('Error loading posts:', error);
    this.error = 'Failed to load posts. Please try again.';
    this.loading = false;
  }

  private async afterLoad(posts: PostResponse[]): Promise<void> {

    const mapped = posts.map(p => ({
      ...p,
      imageUrls: (p.imageUrls || []).map(url => this.getProxyMediaUrl(url)),
      videoUrls: (p.videoUrls || []).map(url => this.getProxyMediaUrl(url))
    }));

    const usernamesNeedingAvatars = [...new Set(
      mapped.filter(post => !post.userAvatar).map(post => post.username)
    )];

    if (usernamesNeedingAvatars.length > 0) {
      try {
        const userRequests = usernamesNeedingAvatars.map(username =>
          firstValueFrom(
            this.userService.getUserByUsername(username).pipe(
              catchError((e: any) => {
                console.warn('Failed to fetch user for avatar', username, e);
                return of(null);
              })
            )
          )
        );
        const users = await Promise.all(userRequests);
        const avatarMap = new Map<string, string>();
        users.forEach((user: SearchUser | null) => {
          if (user && user.username) avatarMap.set(user.username, user.avatarUrl || '');
        });
        this.posts = mapped.map(post => ({
          ...post,
          userAvatar: post.userAvatar || avatarMap.get(post.username) || ''
        }));
      } catch (e) {
        console.error('Avatar enrichment error:', e);
        this.posts = mapped;
      }
    } else {
      this.posts = mapped;
    }

    this.loading = false;
  }

  private getProxyMediaUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('/api/') || imageUrl.startsWith('/assets/') || imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/post-media/')) return `http://localhost:8080/post-service${imageUrl}`;
    if (imageUrl.includes('localhost:9002')) {
      const urlParts = imageUrl.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];
      return `http://localhost:8080/post-service/${bucketName}/images/${fileName}`;
    }
    return imageUrl;
  }

  trackByPostId(_idx: number, post: PostResponse) { return post.postId; }

  async onLikeToggled(post: PostResponse): Promise<void> {
    if (this.likingPosts.has(post.postId)) return;
    this.likingPosts.add(post.postId);
    try {
      if (post.isLikedByCurrentUser) {
        const res = await firstValueFrom(this.postService.unlikePost(post.postId));
        if (res.success) {
          post.isLikedByCurrentUser = false;
          post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
        }
      } else {
        const res = await firstValueFrom(this.postService.likePost(post.postId));
        if (res.success) {
          post.isLikedByCurrentUser = true;
          post.likeCount = (post.likeCount || 0) + 1;
        }
      }
    } catch (e) {
      console.error('Error toggling like:', e);
    } finally {
      this.likingPosts.delete(post.postId);
    }
  }

  isLiking(postId: string): boolean { return this.likingPosts.has(postId); }

  onOpenUser(username: string): void {
    if (!username) return;
    this.router.navigate(['/profile', username]);
  }

  openMediaViewer(mediaUrls: string[], initialIndex: number = 0, type: 'image' | 'video' = 'image'): void {
    if (!mediaUrls?.length) return;
    this.currentMediaUrls = mediaUrls.map(url => this.getProxyMediaUrl(url));
    this.currentMediaIndex = Math.min(Math.max(0, initialIndex), this.currentMediaUrls.length - 1);
    this.currentMediaType = type;
    this.showMediaViewer = true;
    document.body.style.overflow = 'hidden';
  }
  closeMediaViewer(): void {
    this.showMediaViewer = false;
    document.body.style.overflow = '';
  }
  navigateMedia(direction: 'prev' | 'next'): void {
    if (!this.currentMediaUrls.length) return;
    if (direction === 'prev') this.currentMediaIndex = (this.currentMediaIndex - 1 + this.currentMediaUrls.length) % this.currentMediaUrls.length;
    else this.currentMediaIndex = (this.currentMediaIndex + 1) % this.currentMediaUrls.length;
  }

  isOwner(post: PostResponse): boolean {
    const currentUser: User | null = this.authService.getCurrentUser();
    if (!currentUser) return false;
    const byId = !!currentUser?.id && post.userId === currentUser?.id;
    const byUsername = !!currentUser?.username && post.username === currentUser?.username;
    return !!(byId || byUsername);
  }

  onDeletePost(post: PostResponse): void {
    if (!post?.postId) return;
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    this.postService.deletePost(post.postId).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.postId !== post.postId);
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    });
  }
}
