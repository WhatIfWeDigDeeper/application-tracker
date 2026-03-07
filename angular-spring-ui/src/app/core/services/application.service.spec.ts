import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicationService],
    });
    service = TestBed.inject(ApplicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should call list with correct params', () => {
    service.list({ status: 'applied' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url.includes('/api/applications') && r.params.get('status') === 'applied'
    );
    expect(req.request.params.get('status')).toBe('applied');
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('should call list without undefined params', () => {
    service.list({ sortBy: 'updatedAt', status: undefined }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/applications');
    expect(req.request.params.get('status')).toBeNull();
    expect(req.request.params.get('sortBy')).toBe('updatedAt');
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('should GET a single application by id', () => {
    service.get('abc123').subscribe();
    const req = httpMock.expectOne('/api/applications/abc123');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'abc123' });
  });

  it('should POST to create application', () => {
    const data = { companyName: 'Test Co', positionTitle: 'Engineer' };
    service.create(data).subscribe();
    const req = httpMock.expectOne('/api/applications');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({ id: '1', ...data });
  });

  it('should PATCH to update application', () => {
    const data = { companyName: 'Updated Co' };
    service.update('1', data).subscribe();
    const req = httpMock.expectOne('/api/applications/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(data);
    req.flush({ id: '1', ...data });
  });

  it('should DELETE an application', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne('/api/applications/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST to archive an application', () => {
    service.archive('1').subscribe();
    const req = httpMock.expectOne('/api/applications/1/archive');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1' });
  });

  it('should POST to restore an application', () => {
    service.restore('1').subscribe();
    const req = httpMock.expectOne('/api/applications/1/restore');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1' });
  });

  it('should GET history for an application', () => {
    service.getHistory('1').subscribe();
    const req = httpMock.expectOne('/api/applications/1/history');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST to restore a history entry', () => {
    service.restoreHistory('1', 'h1').subscribe();
    const req = httpMock.expectOne('/api/applications/1/history/h1/restore');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1' });
  });

  it('should POST multipart for importCSV', () => {
    const file = new File(['company,position'], 'test.csv', { type: 'text/csv' });
    service.importCSV(file).subscribe();
    const req = httpMock.expectOne('/api/applications/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ imported: 1, skipped: 0, errors: [] });
  });

  it('should POST to add an interview stage', () => {
    service.addStage('1', { name: 'Phone Screen', order: 1 }).subscribe();
    const req = httpMock.expectOne('/api/applications/1/interview-stages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Phone Screen');
    req.flush({ id: '1', interviewStages: [] });
  });

  it('should PATCH to update an interview stage', () => {
    service.updateStage('1', 's1', { name: 'On-site', isCompleted: true }).subscribe();
    const req = httpMock.expectOne('/api/applications/1/interview-stages/s1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.name).toBe('On-site');
    expect(req.request.body.isCompleted).toBe(true);
    req.flush({ id: '1', interviewStages: [] });
  });

  it('should DELETE an interview stage', () => {
    service.removeStage('1', 's1').subscribe();
    const req = httpMock.expectOne('/api/applications/1/interview-stages/s1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: '1', interviewStages: [] });
  });
});
