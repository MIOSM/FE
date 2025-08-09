import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserData {
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_BASE_URL = 'http://localhost:8080';
  private readonly LOGIN_ENDPOINT = `${this.API_BASE_URL}/auth/login`;
  private readonly REGISTER_ENDPOINT = `${this.API_BASE_URL}/auth/register`;
  private readonly REFRESH_TOKEN_ENDPOINT = `${this.API_BASE_URL}/auth/refresh`;
  private readonly USER_PROFILE_ENDPOINT = `${this.API_BASE_URL}/user/profile`;
  private readonly UPDATE_USER_ENDPOINT = `${this.API_BASE_URL}/auth/update`;
  private readonly UPLOAD_AVATAR_ENDPOINT = `${this.API_BASE_URL}/auth/upload-avatar`;
  private readonly UPLOAD_COVER_ENDPOINT = `${this.API_BASE_URL}/auth/upload-cover`;

  constructor(private http: HttpClient) {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.LOGIN_ENDPOINT, credentials).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.token && response.user) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('refresh_token', response.refreshToken || '');
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error.error || { success: false, message: 'Login failed.' });
      })
    );
  }

  register(userData: RegistrationData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.REGISTER_ENDPOINT, userData).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.token && response.user) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('refresh_token', response.refreshToken || '');
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error.error || { success: false, message: 'Registration failed.' });
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => ({ success: false, message: 'No refresh token available' }));
    }

    return this.http.post<AuthResponse>(this.REFRESH_TOKEN_ENDPOINT, { refreshToken }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.token) {
          localStorage.setItem('access_token', response.token);
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
        }
        return response;
      }),
      catchError(error => {
        this.logout(); 
        return throwError(() => error.error || { success: false, message: 'Token refresh failed' });
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    console.log('Creating headers with token:', token ? token.substring(0, 20) + '...' : 'null');
    
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(this.USER_PROFILE_ENDPOINT, { headers: this.getAuthHeaders() }).pipe(
      map((user: User) => {
        if (user) {
          this.currentUserSubject.next(user);
        }
        return user;
      }),
      catchError(error => {
        return throwError(() => error.error || 'User not authenticated');
      })
    );
  }

  updateUser(userData: UpdateUserData): Observable<AuthResponse> {
    const token = this.getAccessToken();
    const headers = this.getAuthHeaders();
    
    return this.http.patch<AuthResponse>(this.UPDATE_USER_ENDPOINT, userData, { headers }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        console.error('Update user error:', error);

        if (error.status === 401) {
          console.log('Token expired, attempting to refresh...');
          return this.refreshToken().pipe(
            switchMap(() => {
              const newHeaders = this.getAuthHeaders();
              return this.http.patch<AuthResponse>(this.UPDATE_USER_ENDPOINT, userData, { headers: newHeaders });
            }),
            map((response: AuthResponse) => {
              if (response.success && response.user) {
                localStorage.setItem('user_data', JSON.stringify(response.user));
                this.currentUserSubject.next(response.user);
              }
              return response;
            }),
            catchError(refreshError => {
              console.error('Token refresh failed:', refreshError);
              this.logout(); 
              return throwError(() => ({ success: false, message: 'Authentication failed. Please login again.' }));
            })
          );
        }
        
        return throwError(() => error.error || { success: false, message: 'Update failed.' });
      })
    );
  }

  uploadAvatar(file: File): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = this.getAuthHeaders();
    headers.delete('Content-Type');
    
    return this.http.post<AuthResponse>(this.UPLOAD_AVATAR_ENDPOINT, formData, { headers }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        console.error('Avatar upload error:', error);

        if (error.status === 401) {
          console.log('Token expired during avatar upload, attempting to refresh...');
          return this.refreshToken().pipe(
            switchMap(() => {
              const newHeaders = this.getAuthHeaders();
              newHeaders.delete('Content-Type');
              return this.http.post<AuthResponse>(this.UPLOAD_AVATAR_ENDPOINT, formData, { headers: newHeaders });
            }),
            map((response: AuthResponse) => {
              if (response.success && response.user) {
                localStorage.setItem('user_data', JSON.stringify(response.user));
                this.currentUserSubject.next(response.user);
              }
              return response;
            }),
            catchError(refreshError => {
              console.error('Token refresh failed during avatar upload:', refreshError);
              this.logout();
              return throwError(() => ({ success: false, message: 'Authentication failed. Please login again.' }));
            })
          );
        }
        
        return throwError(() => error.error || { success: false, message: 'Avatar upload failed.' });
      })
    );
  }

  uploadCover(file: File): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = this.getAuthHeaders();
    headers.delete('Content-Type');
    
    return this.http.post<AuthResponse>(this.UPLOAD_COVER_ENDPOINT, formData, { headers }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        console.error('Cover upload error:', error);

        if (error.status === 401) {
          console.log('Token expired during cover upload, attempting to refresh...');
          return this.refreshToken().pipe(
            switchMap(() => {
              const newHeaders = this.getAuthHeaders();
              newHeaders.delete('Content-Type');
              return this.http.post<AuthResponse>(this.UPLOAD_COVER_ENDPOINT, formData, { headers: newHeaders });
            }),
            map((response: AuthResponse) => {
              if (response.success && response.user) {
                localStorage.setItem('user_data', JSON.stringify(response.user));
                this.currentUserSubject.next(response.user);
              }
              return response;
            }),
            catchError(refreshError => {
              console.error('Token refresh failed during cover upload:', refreshError);
              this.logout();
              return throwError(() => ({ success: false, message: 'Authentication failed. Please login again.' }));
            })
          );
        }
        
        return throwError(() => error.error || { success: false, message: 'Cover upload failed.' });
      })
    );
  }
}
