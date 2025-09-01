import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PostResponse {
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;  
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly apiUrl = 'http://localhost:8080/post-service';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getAuthHeadersForFileUpload(): HttpHeaders {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createPost(content: string, mediaFiles: File[]): Observable<PostResponse> {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('userId', currentUser.username);
    formData.append('username', currentUser.username);
    formData.append('content', content);

    const images = mediaFiles.filter(file => file.type.startsWith('image/'));
    const videos = mediaFiles.filter(file => file.type.startsWith('video/'));

    images.forEach(image => {
      formData.append('images', image);
    });

    videos.forEach(video => {
      formData.append('videos', video);
    });

    return this.http.post<PostResponse>(`${this.apiUrl}/api/posts`, formData, {
      headers: this.getAuthHeadersForFileUpload()
    });
  }

  getPostsByUser(username: string): Observable<PostResponse[]> {
    const encodedUsername = encodeURIComponent(username);
    const url = `${this.apiUrl}/api/posts/user/username/${encodedUsername}`;
    console.log('Fetching posts from URL:', url);
    
    return this.http.get<PostResponse[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap({
        next: (response: PostResponse[]) => console.log('Posts API response:', response),
        error: (error: any) => console.error('Posts API error:', error)
      })
    );
  }

  private generateUUIDFromString(str: string): string {
    const md5 = this.hashString('md5', str);

    return `${md5.substring(0,8)}-${md5.substring(8,12)}-4${md5.substring(13,16)}-a${md5.substring(17,20)}-${md5.substring(20)}`;
  }

  private hashString(algorithm: string, str: string): string {

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }

    let result = Math.abs(hash).toString(16);
    while (result.length < 32) {
      result = '0' + result;
    }
    return result.substring(0, 32); 
  }

  getPostById(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/api/posts/${postId}`, {
      headers: this.getAuthHeaders()
    });
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/posts/${postId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
