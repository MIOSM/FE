import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
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
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
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
  private readonly USER_PROFILE_ENDPOINT = `${this.API_BASE_URL}/user/profile`;
  private readonly UPDATE_USER_ENDPOINT = `${this.API_BASE_URL}/user/update`;

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
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
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
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
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
    return this.http.put<AuthResponse>(this.UPDATE_USER_ENDPOINT, userData, { headers: this.getAuthHeaders() }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          localStorage.setItem('user_data', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error.error || { success: false, message: 'Update failed.' });
      })
    );
  }
}
