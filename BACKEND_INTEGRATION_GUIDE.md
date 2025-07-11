# Backend Integration Guide

## Current Setup (Template Data)

The application is currently using **template data** for development and testing purposes. This allows you to work on the frontend without waiting for the backend to be ready.

### How It Works

1. **Template Endpoints**: The auth service has placeholder endpoints that will be replaced with real ones later
2. **Mock Data**: Uses realistic mock data that simulates backend responses
3. **Realistic Delays**: Simulates network delays to provide a realistic user experience
4. **Error Handling**: Includes proper error handling and user feedback

### Current Features

**Login Component**
- Form validation
- Demo users (click to fill)
- Mock authentication
- Success/error messages
- Navigation to user info page

**Registration Component**
- Complete form validation
- Password confirmation matching
- Mock user creation
- Success/error messages
- Navigation to login after registration

**Auth Service**
- Template endpoints ready for backend integration
- Mock user management
- Token storage
- User state management

## Demo Users

You can test the login with these demo users:
- **Email**: `admin@example.com` | **Password**: `password123`
- **Email**: `user@example.com` | **Password**: `password123`
- **Email**: `john@example.com` | **Password**: `password123`

## Switching to Real Backend

When your coworkers create the Spring Boot backend with Swagger, you'll need to:

### 1. Update Auth Service

Replace the template methods in `src/app/core/services/auth.service.ts`:

```typescript
// Replace this:
login(credentials: LoginCredentials): Observable<AuthResponse> {
  return this.mockLoginWithTemplateData(credentials);
}

// With this:
login(credentials: LoginCredentials): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(this.LOGIN_ENDPOINT, credentials);
}
```

### 2. Update Endpoints

Replace the template endpoints with your actual Swagger-generated endpoints:

```typescript
// Update these URLs to match your backend:
private readonly LOGIN_ENDPOINT = `${this.API_BASE_URL}/auth/login`;
private readonly REGISTER_ENDPOINT = `${this.API_BASE_URL}/auth/register`;
private readonly USER_PROFILE_ENDPOINT = `${this.API_BASE_URL}/user/profile`;
```

### 3. Update Response Interfaces

Make sure the `AuthResponse` interface matches your backend response structure:

```typescript
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  // Add any additional fields from your backend
}
```

### 4. Update User Interface

Ensure the `User` interface matches your backend user model:

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  // Add any additional fields from your backend
}
```

## File Structure

```
src/app/
├── core/
│   └── services/
│       └── auth.service.ts          # Main authentication service
├── pages/
│   ├── login/
│   │   ├── login.component.ts       # Login logic
│   │   ├── login.component.html     # Login template
│   │   └── login.component.scss     # Login styles
│   └── registration/
│       ├── registration.component.ts # Registration logic
│       ├── registration.component.html # Registration template
│       └── registration.component.scss # Registration styles
└── app.config.ts                    # HTTP client configuration
```

## Testing

1. **Start the application**: `ng serve`
2. **Navigate to registration**: `http://localhost:4200/registration`
3. **Create a new account**
4. **Navigate to login**: `http://localhost:4200/login`
5. **Login with your credentials**

## Notes

- The `user.service.ts` file was removed as it's not needed at this point
- All HTTP requests are currently mocked but follow the same patterns as real requests
- The application is ready for backend integration with minimal changes
- Error handling and user feedback are already implemented
- The UI is fully responsive and production-ready

## Next Steps

1. Wait for your coworkers to create the Spring Boot backend
2. Get the Swagger documentation or API endpoints
3. Update the auth service with real HTTP calls
4. Test the integration
5. Deploy when ready! 