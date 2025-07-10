import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

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

  constructor() {
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

  login(credentials: LoginCredentials): Observable<{ success: boolean; message: string; user?: User }> {
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.password === 'password123') {
          const user = this.mockUsers.find(u => u.email === credentials.email);
          
          if (user) {
            const token = `mock_token_${user.id}_${Date.now()}`;

            localStorage.setItem('access_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            this.currentUserSubject.next(user);
            
            observer.next({ success: true, message: 'Login successful!', user });
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
}
