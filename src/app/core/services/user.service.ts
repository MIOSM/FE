import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SearchUser {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'http://localhost:8083/api/users';

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<SearchUser[]> {
    if (!query || query.trim().length === 0) {
      return throwError(() => new Error('Search query is required'));
    }

    const params = new HttpParams().set('query', query.trim());
    const headers = this.getAuthHeaders();

    return this.http.get<SearchUser[]>(`${this.API_URL}/search`, { 
      headers, 
      params 
    }).pipe(
      catchError(error => {
        console.error('Error searching users:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(id: string): Observable<SearchUser> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<SearchUser>(`${this.API_URL}/id/${id}`, { 
      headers 
    }).pipe(
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        return throwError(() => error);
      })
    );
  }

  getUserByUsername(username: string): Observable<SearchUser> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<SearchUser>(`${this.API_URL}/${username}`, { 
      headers 
    }).pipe(
      catchError(error => {
        console.error('Error fetching user by username:', error);
        return throwError(() => error);
      })
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  getAvatarProxyUrl(avatarUrl: string | null | undefined): string {
    if (!avatarUrl) {
      return '/assets/default-avatar.png';
    }

    if (avatarUrl.startsWith('/api/') || avatarUrl.startsWith('/assets/') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }

    if (avatarUrl.includes('localhost:9002')) {
      const urlParts = avatarUrl.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];
      return `/api/images/${bucketName}/${fileName}`;
    }
    
    return avatarUrl;
  }
}
