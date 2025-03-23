import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from './user.service';
import { DataService } from './data.service';
import { UserProfile } from './auth.service';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <mat-card class="user-card">
      <mat-card-header>
        <mat-card-title>Current User</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="currentUser">
          <p><strong>Name:</strong> {{ currentUser.displayName }}</p>
          <p><strong>Email:</strong> {{ currentUser.email }}</p>
        </div>
        <div *ngIf="!currentUser">
          <p>No user is currently logged in</p>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="createSampleRecord()">CREATE RECORD</button>
        <button mat-button (click)="updateSampleRecord()">UPDATE RECORD</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .user-card {
      max-width: 400px;
      margin: 20px auto;
    }
  `]
})
export class ExampleComponent implements OnInit {
  currentUser: UserProfile | null = null;

  constructor(
    private userService: UserService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    // Method 1: Get current user synchronously (may be null initially)
    this.currentUser = this.userService.currentUser;

    // Method 2: Subscribe to user changes (preferred approach for components)
    this.userService.user$.subscribe(user => {
      this.currentUser = user;
      console.log('User updated:', user);
    });
  }

  createSampleRecord(): void {
    const newRecord = {
      title: 'Sample Record',
      description: 'Created with current user data'
    };

    this.dataService.createRecord(newRecord).subscribe({
      next: (result) => console.log('Record created:', result),
      error: (err) => console.error('Error creating record:', err)
    });
  }

  updateSampleRecord(): void {
    const recordId = 'sample-id';
    const updatedData = {
      title: 'Updated Record',
      description: 'Updated with current user data'
    };

    this.dataService.updateRecord(recordId, updatedData).subscribe({
      next: (result) => console.log('Record updated:', result),
      error: (err) => console.error('Error updating record:', err)
    });
  }
}
