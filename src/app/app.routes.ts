import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { UserInfoComponent } from './pages/user-info/user-info.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [authGuard],
    children: [
      { path: 'user-info', component: UserInfoComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'user-info', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];

