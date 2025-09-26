import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostListComponent } from '../../shared/components/post-list/post-list.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PostListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {}
