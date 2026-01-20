import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, effect, inject, signal} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { CardComponent } from '../../../shared/components/card/card.component';
import { EmployeesApi } from '../../../core/api/employees.api';
import { DepartmentsApi } from '../../../core/api/departments.api';
import { Employee } from '../../../shared/models/employee.model';

type Status = 'active' | 'inactive' | 'on_leave';
type DashboardVm =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; employees: Employee[]; departmentsCount: number };

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    CurrencyPipe,
    CardComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  private employeesApi = inject(EmployeesApi);
  private departmentsApi = inject(DepartmentsApi);

  private readonly reload$ = new Subject<void>();

   private readonly vm$ = this.reload$.pipe(
    startWith(void 0),
    switchMap(() =>
      forkJoin({
        employees: this.employeesApi.all$(),
        departments: this.departmentsApi.list$(),
      }).pipe(
        map(
          ({ employees, departments }): DashboardVm => ({
            status: 'ready',
            employees,
            departmentsCount: departments.length,
          })
        ),
        catchError(() =>
          of<DashboardVm>({
            status: 'error',
            message: 'Failed to load dashboard data',
          })
        ),
        startWith<DashboardVm>({ status: 'loading' })
      )
    )
  );
  
    /** Convert Observable -> Signal*/
  readonly vm = toSignal(this.vm$, { initialValue: { status: 'loading' } as DashboardVm });

   /* * Widgets (computed from vm) */
  readonly employees = computed(() => {
    const vm = this.vm();
    return vm.status === 'ready' ? vm.employees : [];
  });

  readonly departmentsCount = computed(() => {
     const vm = this.vm();
     return vm.status === 'ready' ? vm.departmentsCount : 0;}
  );

  readonly loading = computed(() => this.vm().status === 'loading');
  readonly error = computed(() =>{
    const vm = this.vm();
    return vm.status === 'error' ? vm.message : null;
  });

  readonly headcount = computed(() => this.employees().length);

  readonly activeCount = computed(() => this.countByStatus('active'));
  readonly onLeaveCount = computed(() => this.countByStatus('on_leave'));
  readonly inactiveCount = computed(() => this.countByStatus('inactive'));

  readonly avgSalary = computed(() => {
    const emps = this.employees();
    if (!emps.length) return 0;
    const sum = emps.reduce((acc, e) => acc + (Number(e.salary || 0)),0);
    return Math.round(sum/emps.length);
  })

   private countByStatus(status: Status): number {
    return this.employees().reduce((acc, e) => acc + (e.status === status ? 1 : 0), 0);
  }

   readonly ariaLiveText = computed(() => {
    if (this.loading()) return 'Loading dashboard';
    if (this.error()) return 'Dashboard failed to load';
    return `Dashboard loaded. ${this.headcount()} employees total.`;
  });

  trackById = (_: number, e: Employee) => e.id;


  constructor() {
    effect((): void => {
     console.log('Dashboard vm:', this.vm());
    });
  }

}
