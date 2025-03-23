import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'api/data';

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  /**
   * Get all records
   */
  getAllRecords(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  /**
   * Create a new record with user info
   */
  createRecord(data: any): Observable<any> {
    // Add user tracking data
    const recordWithUser = {
      ...data,
      createdBy: this.userService.getUserDisplayName(),
      createdByEmail: this.userService.getUserEmail(),
      createdAt: new Date(),
      ...this.userService.getUpdatedByInfo()
    };

    return this.http.post<any>(`${this.apiUrl}`, recordWithUser);
  }

  /**
   * Update an existing record with user tracking info
   */
  updateRecord(id: string, data: any): Observable<any> {
    // Add updated by information
    const updatedRecord = {
      ...data,
      ...this.userService.getUpdatedByInfo()
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, updatedRecord);
  }

  /**
   * Delete a record
   */
  deleteRecord(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
