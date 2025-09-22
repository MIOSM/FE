import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostResponse } from '../../../core/services/post.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: PostResponse;
  @Input() liking = false;
  @Input() showOwnerActions = false;

  @Output() like = new EventEmitter<PostResponse>();
  @Output() openUser = new EventEmitter<string>();
  @Output() openMedia = new EventEmitter<{ urls: string[]; index: number; type: 'image' | 'video' }>();
  @Output() delete = new EventEmitter<PostResponse>();

  constructor(private userService: UserService) {}

  trackByIndex(_i: number, _v: unknown) { return _i; }

  openMenu = false;

  getAvatarUrl(avatarUrl?: string | null): string {
    return this.userService.getAvatarProxyUrl(avatarUrl || '');
  }

  hasValidAvatar(avatarUrl?: string | null): boolean {
    return !!(avatarUrl && avatarUrl.trim() && !avatarUrl.includes('default-avatar'));
  }

  getAvatarInitial(username: string): string {
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  getAvatarColor(username: string): string {
    if (!username) return 'var(--primary-500)';
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

  onLikeClicked() {
    this.like.emit(this.post);
  }

  onOpenUser() {
    this.openUser.emit(this.post.username);
  }

  onOpenImage(i: number) {
    if (!this.post.imageUrls?.length) return;
    this.openMedia.emit({ urls: this.post.imageUrls, index: i, type: 'image' });
  }

  onOpenVideo(i: number) {
    if (!this.post.videoUrls?.length) return;
    this.openMedia.emit({ urls: this.post.videoUrls, index: i, type: 'video' });
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.openMenu = !this.openMenu;
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.openMenu = false;
    this.delete.emit(this.post);
  }
}
