import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Application,
  PaginatedResponse,
  HistoryEntry,
  ImportResult,
  InterviewStage,
  FilterParams,
} from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private baseUrl = '/api/applications';

  list(params: FilterParams = {}): Observable<PaginatedResponse<Application>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Application>>(this.baseUrl, {
      params: httpParams,
    });
  }

  get(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Application>): Observable<Application> {
    return this.http.post<Application>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Application>): Observable<Application> {
    return this.http.patch<Application>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  archive(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.baseUrl}/${id}/archive`, {});
  }

  restore(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.baseUrl}/${id}/restore`, {});
  }

  getHistory(id: string): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(`${this.baseUrl}/${id}/history`);
  }

  restoreHistory(id: string, historyId: string): Observable<Application> {
    return this.http.post<Application>(
      `${this.baseUrl}/${id}/history/${historyId}/restore`,
      {}
    );
  }

  addStage(id: string, stage: Partial<InterviewStage>): Observable<Application> {
    return this.http.post<Application>(
      `${this.baseUrl}/${id}/interview-stages`,
      stage
    );
  }

  updateStage(
    id: string,
    stageId: string,
    stage: Partial<InterviewStage>
  ): Observable<Application> {
    return this.http.patch<Application>(
      `${this.baseUrl}/${id}/interview-stages/${stageId}`,
      stage
    );
  }

  removeStage(id: string, stageId: string): Observable<Application> {
    return this.http.delete<Application>(
      `${this.baseUrl}/${id}/interview-stages/${stageId}`
    );
  }

  importCSV(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.baseUrl}/import`, formData);
  }

  exportCSV(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }

  getTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sample-csv`, { responseType: 'blob' });
  }
}
