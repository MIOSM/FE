import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService, SearchUser } from '../../core/services/user.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  searchResults: SearchUser[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.trim()) {
        this.performSearch();
      } else {
        this.searchResults = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.errorMessage = '';
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.errorMessage = '';
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.errorMessage = 'Failed to search users. Please try again.';
        this.searchResults = [];
        this.isLoading = false;
      }
    });
  }

  viewUserProfile(user: SearchUser): void {
    console.log('Viewing profile for user:', user);
    this.router.navigate(['/profile', user.username]);
  }

  getUserAvatarUrl(user: SearchUser): string {
    return this.userService.getAvatarProxyUrl(user.avatarUrl);
  }

  onImageError(event: any): void {
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
}
