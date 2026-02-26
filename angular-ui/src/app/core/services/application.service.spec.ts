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
    const req = httpMock.expectOne(
      (r) => r.url === '/api/applications'
    );
    expect(req.request.params.get('status')).toBeNull();
    expect(req.request.params.get('sortBy')).toBe('updatedAt');
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('should POST to create application', () => {
    const data = { companyName: 'Test Co', positionTitle: 'Engineer' };
    service.create(data).subscribe();
    const req = httpMock.expectOne('/api/applications');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({ id: '1', ...data });
  });

  it('should POST multipart for importCSV', () => {
    const file = new File(['company,position'], 'test.csv', { type: 'text/csv' });
    service.importCSV(file).subscribe();
    const req = httpMock.expectOne('/api/applications/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ imported: 1, skipped: 0, errors: [] });
  });

  it('should GET blob for exportCSV', () => {
    service.exportCSV().subscribe();
    const req = httpMock.expectOne('/api/applications/export');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
