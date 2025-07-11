import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, delay } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
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

  private readonly API_BASE_URL = 'http://localhost:8080/api';
  private readonly LOGIN_ENDPOINT = `${this.API_BASE_URL}/auth/login`;
  private readonly REGISTER_ENDPOINT = `${this.API_BASE_URL}/auth/register`;
  private readonly USER_PROFILE_ENDPOINT = `${this.API_BASE_URL}/user/profile`;

  private mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    },
    {
      id: 2,
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user'
    },
    {
      id: 3,
      email: 'john@example.com',
      name: 'John Doe',
      role: 'user'
    }
  ];

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
    return this.mockLogin(credentials);
  }

  register(userData: RegistrationData): Observable<AuthResponse> {
    return this.mockRegister(userData);
  }

  private mockLoginWithTemplateData(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.mockLogin(credentials);
  }

  private mockRegisterWithTemplateData(userData: RegistrationData): Observable<AuthResponse> {
    return this.mockRegister(userData);
  }

  private mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.password === 'password123') {
          const user = this.mockUsers.find(u => u.email === credentials.email);
          
          if (user) {
            const token = `mock_token_${user.id}_${Date.now()}`;

            localStorage.setItem('access_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            this.currentUserSubject.next(user);
            
            observer.next({ success: true, message: 'Login successful!', user, token });
          } else {
            observer.next({ success: false, message: 'User not found. Please register first.' });
          }
        } else {
          observer.next({ success: false, message: 'Invalid password. Use "password123" for all users.' });
        }
        observer.complete();
      }, 1000);
    });
  }

  private mockRegister(userData: RegistrationData): Observable<AuthResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        const existingUser = this.mockUsers.find(u => u.email === userData.email);
        
        if (existingUser) {
          observer.next({ success: false, message: 'User with this email already exists.' });
        } else {
          const newUser: User = {
            id: this.mockUsers.length + 1,
            email: userData.email,
            name: userData.name,
            role: 'user'
          };
          
          this.mockUsers.push(newUser);
          const token = `mock_token_${newUser.id}_${Date.now()}`;

          localStorage.setItem('access_token', token);
          localStorage.setItem('user_data', JSON.stringify(newUser));

          this.currentUserSubject.next(newUser);
          
          observer.next({ 
            success: true, 
            message: 'Registration successful! You can now login.', 
            user: newUser, 
            token 
          });
        }
        observer.complete();
      }, 1000);
    });
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

  getAvailableUsers(): User[] {
    return this.mockUsers;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getUserProfile(): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          observer.next(currentUser);
        } else {
          observer.error('User not authenticated');
        }
        observer.complete();
      }, 500);
    });
  }

  switchToRealBackend(): void {
    console.log('Switching to real backend endpoints...');
  }
}
