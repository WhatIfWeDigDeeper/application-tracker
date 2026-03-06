import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Application,
  PaginatedResponse,
  HistoryEntry,
  ImportResult,
  InterviewStage,
  FilterParams,
} from '../models/application.model';

// Raw response types from the Go API

interface RawStage {
  id: string;
  stageName: string;
  stageOrder: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;
}

interface RawApplication extends Omit<Application, 'interviewStages'> {
  interviewStages: RawStage[];
}

interface RawDiffEntry {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

interface RawHistoryEntry {
  id: string;
  sequenceNumber: number;
  description: string;
  createdAt: string;
  diffs: RawDiffEntry[];
}

function mapStage(s: RawStage): InterviewStage {
  return {
    id: s.id,
    name: s.stageName,
    order: s.stageOrder,
    isCompleted: s.isCompleted,
    completedDate: s.completedDate,
    notes: s.notes,
    performanceRating: s.performanceRating,
  };
}

function mapApplication(raw: RawApplication): Application {
  return {
    ...raw,
    interviewStages: (raw.interviewStages ?? []).map(mapStage),
  };
}

function mapHistory(entries: RawHistoryEntry[]): HistoryEntry[] {
  return entries.map(e => ({
    id: e.id,
    sequence: e.sequenceNumber,
    description: e.description,
    createdAt: e.createdAt,
    changes: (e.diffs ?? []).map(d => ({
      field: d.field,
      label: d.field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()),
      oldValue: d.oldValue ?? null,
      newValue: d.newValue ?? null,
    })),
  }));
}

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
    return this.http
      .get<PaginatedResponse<RawApplication>>(this.baseUrl, { params: httpParams })
      .pipe(map(res => ({ ...res, items: res.items.map(mapApplication) })));
  }

  get(id: string): Observable<Application> {
    return this.http.get<RawApplication>(`${this.baseUrl}/${id}`).pipe(map(mapApplication));
  }

  create(data: Partial<Application>): Observable<Application> {
    return this.http.post<RawApplication>(this.baseUrl, data).pipe(map(mapApplication));
  }

  update(id: string, data: Partial<Application>): Observable<Application> {
    return this.http.patch<RawApplication>(`${this.baseUrl}/${id}`, data).pipe(map(mapApplication));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  archive(id: string): Observable<Application> {
    return this.http
      .post<RawApplication>(`${this.baseUrl}/${id}/archive`, {})
      .pipe(map(mapApplication));
  }

  restore(id: string): Observable<Application> {
    return this.http
      .post<RawApplication>(`${this.baseUrl}/${id}/restore`, {})
      .pipe(map(mapApplication));
  }

  getHistory(id: string): Observable<HistoryEntry[]> {
    return this.http
      .get<RawHistoryEntry[]>(`${this.baseUrl}/${id}/history`)
      .pipe(map(mapHistory));
  }

  restoreHistory(id: string, historyId: string): Observable<Application> {
    return this.http
      .post<RawApplication>(`${this.baseUrl}/${id}/history/${historyId}/restore`, {})
      .pipe(map(mapApplication));
  }

  addStage(id: string, stage: Partial<InterviewStage>): Observable<Application> {
    const payload = {
      name: stage.name,
      order: stage.order,
      isCompleted: stage.isCompleted ?? false,
    };
    return this.http
      .post<RawApplication>(`${this.baseUrl}/${id}/interview-stages`, payload)
      .pipe(map(mapApplication));
  }

  updateStage(
    id: string,
    stageId: string,
    stage: Partial<InterviewStage>
  ): Observable<Application> {
    const payload = {
      name: stage.name,
      order: stage.order,
      isCompleted: stage.isCompleted ?? false,
    };
    return this.http
      .patch<RawApplication>(`${this.baseUrl}/${id}/interview-stages/${stageId}`, payload)
      .pipe(map(mapApplication));
  }

  removeStage(id: string, stageId: string): Observable<Application> {
    return this.http
      .delete<RawApplication>(`${this.baseUrl}/${id}/interview-stages/${stageId}`)
      .pipe(map(mapApplication));
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
