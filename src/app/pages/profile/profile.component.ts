import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  userAvatar: string = 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD';
  userCoverPhoto: string = 'https://via.placeholder.com/1200x300/2C3E50/FFFFFF?text=Cover+Photo';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        this.router.navigate(['/login']);
      } else {
        this.loadUserProfileData();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  private loadUserProfileData(): void {
    if (this.currentUser) {
      const proxyAvatarUrl = this.getProxyImageUrl(this.currentUser.avatar);
      const proxyCoverUrl = this.getProxyImageUrl(this.currentUser.coverPhoto);
      
      this.userAvatar = proxyAvatarUrl || this.userAvatar;
      this.userCoverPhoto = proxyCoverUrl || this.userCoverPhoto;

      console.log('Profile Display Debug:');
      console.log('Original avatar URL:', this.currentUser.avatar);
      console.log('Proxy avatar URL:', proxyAvatarUrl);
      console.log('Final userAvatar variable:', this.userAvatar);
      console.log('Original cover URL:', this.currentUser.coverPhoto);
      console.log('Proxy cover URL:', proxyCoverUrl);
      console.log('Final userCoverPhoto variable:', this.userCoverPhoto);
    }
  }

  private getProxyImageUrl(imageUrl: string | null | undefined): string | null {
    console.log('getProxyImageUrl called with:', imageUrl);
    
    if (!imageUrl) {
      console.log('No imageUrl provided');
      return null;
    }
    
    if (!imageUrl.startsWith('http://localhost:9000/user-images/')) {
      console.log('URL does not start with MinIO prefix:', imageUrl);
      return null;
    }

    const proxyUrl = `http://localhost:8080/auth/public/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
    console.log('Generated auth-service public proxy URL:', proxyUrl);
    return proxyUrl;
  }

  editProfile(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
