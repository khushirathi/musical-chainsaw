// src/app/profile/profile.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { UserService, UserProfile } from '../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule],
  template: `
    <div class="max-w-3xl mx-auto my-8">
      <mat-card>
        <mat-card-header class="flex items-center">
          <div class="flex-1">
            <mat-card-title class="text-2xl">My Profile</mat-card-title>
            <mat-card-subtitle>Your personal information</mat-card-subtitle>
          </div>
          <!-- Fixed: Added proper null checking for userProfile -->
          @if (userProfile) {
            @if (userProfile.photo) {
              <img 
                [src]="userProfile.photo" 
                alt="Profile photo" 
                class="h-20 w-20 rounded-full object-cover"
              />
            } @else {
              <div class="h-20 w-20 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-medium text-3xl">
                {{ (userProfile.givenName || userProfile.displayName || 'U')?.charAt(0) }}
              </div>
            }
          } @else {
            <!-- Show placeholder when userProfile is null -->
            <div class="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-3xl">
              ?
            </div>
          }
        </mat-card-header>
        
        <mat-card-content class="p-4">
          @if (userProfile) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-gray-500">Display Name</div>
                  <div class="text-lg">{{ userProfile.displayName || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">First Name</div>
                  <div class="text-lg">{{ userProfile.givenName || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">Last Name</div>
                  <div class="text-lg">{{ userProfile.surname || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">Email</div>
                  <div class="text-lg">{{ userProfile.userPrincipalName || 'Not provided' }}</div>
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-gray-500">Job Title</div>
                  <div class="text-lg">{{ userProfile.jobTitle || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">Office Location</div>
                  <div class="text-lg">{{ userProfile.officeLocation || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">Mobile Phone</div>
                  <div class="text-lg">{{ userProfile.mobilePhone || 'Not provided' }}</div>
                </div>
                
                <div>
                  <div class="text-sm text-gray-500">Preferred Language</div>
                  <div class="text-lg">{{ userProfile.preferredLanguage || 'Not provided' }}</div>
                </div>
              </div>
            </div>
            
          } @else {
            <div class="text-center py-8">
              <mat-icon class="text-4xl text-gray-400">account_circle</mat-icon>
              <p class="mt-2 text-gray-500">Unable to load profile information</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Try to get the cached profile first
    this.userProfile = this.userService.getCurrentUserProfile();
    
    // If no cached profile, fetch it
    if (!this.userProfile) {
      this.userService.getUserProfile().subscribe(profile => {
        this.userProfile = profile;
      });
    }
  }
}