import { Component, computed, signal , inject, effect, DestroyRef} from '@angular/core';
import { DataTableComponent, TableColumn, TableState } from '../../../../shared/components/data-table/data-table.component';
import { Employee } from '../../../../shared/models/employee.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EmployeeListQuery, EmployeesApi, EmployeeSortKey } from '../../../../core/api/employees.api';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DepartmentsApi } from '../../../../core/api/departments.api';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Department } from '../../../../shared/models/department.model';


type Vm = 
| {status: 'loading'; items: Employee[]; total: number}
| {status:'error'; items: Employee[]; total: number; message: string}
| {status:'ready'; items: Employee[]; total: number}

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [NgIf,
    AsyncPipe,
    CardComponent,
    DataTableComponent,
  NgIf, NgFor, RouterLink, DatePipe, CurrencyPipe, CardComponent],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent {
    private readonly api = inject(EmployeesApi);
    private readonly departmentsApi = inject(DepartmentsApi) ;
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    // UI state Signals
    readonly q = signal('');
    readonly status = signal<EmployeeListQuery['status']>('');
    readonly departmentId = signal<number | null> (null);

    readonly page = signal(1);
    readonly pageSize= signal(10);

    readonly sort = signal<EmployeeSortKey>('lastName');
    readonly order = signal<'asc' | 'desc'> ('asc');

    //reload trigger
    private readonly reload$ = new Subject<void>();

    //Departments for filter
    readonly departments = toSignal(
      this.departmentsApi.list$().pipe(catchError(() => of([]))), 
      { initialValue: []}
    )

    constructor() {
      this.route.queryParamMap.pipe(tap(qp => {
        this.q.set(qp.get('q') ?? '');
        this.status.set((qp.get('status')as any) ?? '');
         const dep = qp.get('departmentId');
      this.departmentId.set(dep ? Number(dep) : null);

         this.page.set(Number(qp.get('page') ?? 1));
      this.pageSize.set(Number(qp.get('pageSize') ?? 10));

      this.sort.set((qp.get('sort') as EmployeeSortKey) ?? 'lastName');
      this.order.set((qp.get('order') as 'asc' | 'desc') ?? 'asc');

      })).subscribe();
    }

    //Build a single query object
readonly query = computed<EmployeeListQuery>(() => ({
  q: this.q(),
  status: this.status(),
  departmentId: this.departmentId() ?? undefined,
  page: this.page(),
  pageSize: this.pageSize(),
  sort: this.sort(),
  order: this.order(),
}));

private readonly urlSync = toObservable(this.query).pipe(
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  tap(q => {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q.q || null,
        status: q.status || null,
        departmentId: q.departmentId ?? null,
        page: q.page,
        pageSize: q.pageSize,
        sort: q.sort,
        order: q.order,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  })
).subscribe();

//Data pipeline
 private readonly vm$ = combineLatest([
    toObservable(this.query),
    this.reload$.pipe(startWith(void 0)),
  ]).pipe(
    switchMap(([query]) =>
      this.api.list$(query).pipe(
        map((res): Vm => ({ status: 'ready', items: res.items, total: res.total })),
        startWith({ status: 'loading', items: [], total: 0 } as Vm),
        catchError(() =>
          of<Vm>({
            status: 'error',
            message: 'Failed to load employees',
            items: [],
            total: 0,
          })
        )
      )
    )
  );

  reload(): void {
  this.reload$.next();
}

  readonly vm = toSignal(this.vm$, {initialValue: { status:'loading', items: [], total: 0} as Vm});

  readonly loading= computed(() => this.vm().status ==='loading');
    readonly error = computed(() => {
    const vm = this.vm();
    return vm.status === 'error' ? vm.message : null;
  });

  readonly items = computed(() => this.vm().items);
  readonly total = computed(() => this.vm().total);

  readonly resultsText = computed(() => {
    if (this.loading()) return 'Loading employees';
    if (this.error()) return 'Employees failed to load';
    return `${this.total()} employees found`;
  });

    readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

    onDepartmentChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  this.departmentId.set(value ? parseInt(value, 10) : null);
   this.page.set(1);
}

    // Actions
  setPage(p: number): void {
    const next = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(next);
  }

  setPageSize(n: number): void {
    this.pageSize.set(n);
    this.page.set(1);
  }

  onPageSizeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  this.setPageSize(parseInt(value, 10));
}
  clearFilters(): void {
    this.q.set('');
    this.status.set('');
    this.departmentId.set(null);
    this.page.set(1);
  }

  toggleSort(key: EmployeeSortKey): void {
    if (this.sort() === key) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(key);
      this.order.set('asc');
    }
    this.page.set(1);
  }

  async deleteEmployee(e: Employee): Promise<void> {
    const ok = window.confirm(`Delete ${e.firstName} ${e.lastName}?`);
    if (!ok) return;

    this.api.delete$(e.id).subscribe({
      next: () => this.reload$.next(),
      error: () => alert('Delete failed'),
    });
  }


  trackByEmployeeId = (_: number, e: Employee) => e.id;
trackByDepartmentId = (_: number, d: Department) => d.id;
}
