import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMediumScreen = false;
  isMobileScreen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    //Maybe will add cleanup
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMediumScreen = window.innerWidth <= 980 && window.innerWidth > 768;
    this.isMobileScreen = window.innerWidth <= 768;
  }

  get showSidebar() {
    return true;
  }

  get sidebarWidth(): string {
    if (this.isMobileScreen) {
      return '0px';
    } else if (this.isMediumScreen) {
      return '60px';
    } else {
      return '200px';
    }
  }
}
