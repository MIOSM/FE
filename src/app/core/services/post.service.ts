import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PostResponse {
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;  
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  likeCount: number;
  isLikedByCurrentUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    if (currentUser.avatar) {
      formData.append('userAvatar', currentUser.avatar);
    }
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
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    const encodedUsername = encodeURIComponent(username);
    let url = `${this.apiUrl}/api/posts/user/username/${encodedUsername}`;

    if (currentUser?.username) {
      url += `?currentUserId=${encodeURIComponent(currentUser.username)}`;
    }
    
    console.log('Fetching posts from URL:', url);
    
    return this.http.get<PostResponse[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((rawPosts: any) => console.log('Raw posts from API:', JSON.stringify(rawPosts, null, 2))),
      map((posts: any[]) => 
        posts.map(post => {
          console.log('Original createdAt:', post.createdAt, 'type:', typeof post.createdAt);
          const parsedPost = {
            ...post,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
            likeCount: post.likeCount || 0,
            isLikedByCurrentUser: post.isLikedByCurrentUser || false
          };
          console.log('Parsed post:', parsedPost);
          return parsedPost;
        })
      ),
      tap({
        next: (response: PostResponse[]) => console.log('Processed posts:', response),
        error: (error: any) => console.error('Posts API error:', error)
      })
    );
  }

  private generateUUIDFromString(str: string): string {
    const md5 = this.hashString('md5', str);

    return `${md5.substring(0,8)}-${md5.substring(8,12)}-4${md5.substring(13,16)}-a${md5.substring(17,20)}-${md5.substring(20)}`;
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/posts/${postId}`, {
      headers: this.getAuthHeaders()
    });
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

  getLatestPosts(limit: number = 10): Observable<PostResponse[]> {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    let url = `${this.apiUrl}/api/posts/latest?limit=${limit}`;
    
    // Add current user ID for like status if available
    if (currentUser?.username) {
      url += `&currentUserId=${encodeURIComponent(currentUser.username)}`;
    }
    
    console.log('Fetching latest posts from URL:', url);
    
    return this.http.get<PostResponse[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((rawPosts: any) => console.log('Raw latest posts from API:', JSON.stringify(rawPosts, null, 2))),
      map((posts: any[]) => 
        posts.map(post => {
          console.log('Original createdAt:', post.createdAt, 'type:', typeof post.createdAt);
          const parsedPost = {
            ...post,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
            likeCount: post.likeCount || 0,
            isLikedByCurrentUser: post.isLikedByCurrentUser || false
          };
          console.log('Parsed post:', parsedPost);
          return parsedPost;
        })
      ),
      tap({
        next: (response: PostResponse[]) => console.log('Processed latest posts:', response),
        error: (error: any) => console.error('Latest posts API error:', error)
      })
    );
  }

  likePost(postId: string): Observable<any> {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('userId', currentUser.username);
    params.append('username', currentUser.username);

    return this.http.post<any>(`${this.apiUrl}/api/posts/${postId}/like?${params.toString()}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  unlikePost(postId: string): Observable<any> {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('userId', currentUser.username);

    return this.http.delete<any>(`${this.apiUrl}/api/posts/${postId}/like?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  getLikeStatus(postId: string): Observable<{isLiked: boolean}> {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('userId', currentUser.username);

    return this.http.get<{isLiked: boolean}>(`${this.apiUrl}/api/posts/${postId}/like-status?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  getLikedPostsByUser(username: string): Observable<PostResponse[]> {
    const encodedUsername = encodeURIComponent(username);
    return this.http.get<PostResponse[]>(`${this.apiUrl}/api/posts/liked/user/username/${encodedUsername}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((posts: any[]) => 
        posts.map(post => ({
          ...post,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
          likeCount: post.likeCount || 0,
          isLikedByCurrentUser: post.isLikedByCurrentUser || false
        }))
      )
    );
  }

  getTotalLikesForUserPosts(username: string): Observable<{totalLikes: number}> {
    const encodedUsername = encodeURIComponent(username);
    return this.http.get<{totalLikes: number}>(`${this.apiUrl}/api/posts/user/username/${encodedUsername}/total-likes`, {
      headers: this.getAuthHeaders()
    });
  }
}
