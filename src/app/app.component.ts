import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from './site-header/site-header.component';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SiteHeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'musical-chainsaw';

  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    console.log('App component initializing');
    // Initialize authentication when the app starts with auto-login enabled
    this.authService.initAuth(true).subscribe(result => {
      console.log('Auth initialization result:', result);
    });
  }
}
