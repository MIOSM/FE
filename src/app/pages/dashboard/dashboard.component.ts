import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostListComponent } from '../../shared/components/post-list/post-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PostListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {}
