import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Employee, PagedResult } from '../../shared/models/employee.model';

export type EmployeeSortKey = 'lastName' | 'firstName' | 'salary' | 'hireDate' | 'status';
export interface EmployeeListQuery {
  q?: string;
  page: number;
  pageSize: number;
  sort?: keyof Employee;
  order?: 'asc' | 'desc';
  departmentId?: number;
  status?: 'active' | 'inactive' | 'on_leave' | '';
}

@Injectable({ providedIn: 'root' })
export class EmployeesApi {
  private http = inject(HttpClient);
  private baseUrl = '/api/employees';

list$(query: EmployeeListQuery): Observable<PagedResult<Employee>> {
  const start = (query.page - 1) * query.pageSize;

  const makeParams = (includePaging: boolean) => {
    let params = new HttpParams();

    if (includePaging) {
      params = params
        .set('_start', String(start))
        .set('_limit', String(query.pageSize));
    }

    if (query.sort) params = params.set('_sort', String(query.sort));
    if (query.order) params = params.set('_order', query.order);

    const q = query.q?.trim();
    if (q) params = params.set('q', q);

    if (query.departmentId != null) params = params.set('departmentId', String(query.departmentId));
    if (query.status) params = params.set('status', query.status);

    return params;
  };

  const page$ = this.http.get<Employee[]>(this.baseUrl, { params: makeParams(true) });
  const total$ = this.http
    .get<Employee[]>(this.baseUrl, { params: makeParams(false) })
    .pipe(map((all) => all.length));

  return forkJoin({ items: page$, total: total$ }).pipe(
    map(({ items, total }) => ({ items, total }))
  );
}

  getById$(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  create$(payload: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, payload);
  }

  update$(id: number, payload: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, payload);
  }

  delete$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  all$() {
    return this.http.get<Employee[]>(this.baseUrl);
  }
}
