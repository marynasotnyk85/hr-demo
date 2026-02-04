import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmployeesApi, EmployeeListQuery } from './../../../../core/api/employees.api'
import { Employee } from '../../../../shared/models/employee.model';   
import { HttpHeaders, provideHttpClient } from '@angular/common/http';


describe('EmployeesApi.list$', () => {
  let api: EmployeesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmployeesApi,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    api = TestBed.inject(EmployeesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET /api/employees with correct params and return {items,total}', () => {
    // Arrange
    const query: EmployeeListQuery = {
      q: '  costa  ',
      page: 2,
      pageSize: 10,
      sort: 'lastName',
      order: 'asc',
      departmentId: 2,
      status: 'active',
    };

    const pageResponse: Employee[] = [
      { id: 1, firstName: 'Matteo', lastName: 'Costa' } as Employee,
      { id: 2, firstName: 'Luca', lastName: 'Ferrari' } as Employee,
    ];

    let result: any;

    // Act
    api.list$(query).subscribe(res => (result = res));

    // Assert request
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/employees');

    // These match your REAL request in the log
    expect(req.request.params.get('_page')).toBe('2');
    expect(req.request.params.get('_limit')).toBe('10');
    expect(req.request.params.get('_sort')).toBe('lastName');
    expect(req.request.params.get('_order')).toBe('asc');

    // filters
    expect(req.request.params.get('departmentId')).toBe('2');
    expect(req.request.params.get('status')).toBe('active');

    // q trimmed
    expect(req.request.params.get('q')).toBe('costa');

    // Flush response WITH total header
    req.flush(pageResponse, {
      headers: new HttpHeaders({ 'X-Total-Count': '17' }),
    });

    // Final assert
    expect(result).toEqual({
      items: pageResponse,
      total: 17,
    });
  });
});
