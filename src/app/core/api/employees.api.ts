import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Employee, PagedResult } from '../../shared/models/employee.model';

export interface EmployeeQuery {
  q?: string;
  page: number;
  size: number;
  sort?: keyof Employee;
  dir?: 'asc' | 'desc';
  departmentId?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeesApi {
  private http = inject(HttpClient);
  private baseUrl = '/api/employees';

  list$(query: EmployeeQuery): Observable<PagedResult<Employee>> {
    let params = new HttpParams()
      .set('_page', query.page)
      .set('_limit', query.size);

    if (query.sort) params = params.set('_sort', String(query.sort));
    if (query.dir) params = params.set('_order', query.dir);

    if (query.q?.trim()) params = params.set('q', query.q.trim());

    if (query.departmentId)
      params = params.set('departmentId', query.departmentId);
    if (query.status) params = params.set('status', query.status);

    return this.http
      .get<Employee[]>(this.baseUrl, { params, observe: 'response' })
      .pipe(
        map((res: HttpResponse<Employee[]>) => {
          const total = Number(res.headers.get('X-Total-Count') ?? '0');
          return { items: res.body ?? [], total };
        })
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
}
