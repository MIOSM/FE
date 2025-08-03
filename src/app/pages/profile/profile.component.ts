import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;

  userAvatar: string = 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD';
  userCoverPhoto: string = 'https://via.placeholder.com/1200x300/2C3E50/FFFFFF?text=Cover+Photo';
  userBio: string = 'This is a sample bio. You can edit this to tell people about yourself.';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
    
    this.loadUserProfileData();
  }

  private loadUserProfileData(): void {
    if (this.currentUser) {
      // Will override template data with backend data when available
      this.userAvatar = this.currentUser.avatar || this.userAvatar;
      this.userCoverPhoto = this.currentUser.coverPhoto || this.userCoverPhoto;
      this.userBio = this.currentUser.bio || this.userBio;
    }
  }

  editProfile(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 