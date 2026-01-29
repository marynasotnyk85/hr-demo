import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeesApi } from '../../../../core/api/employees.api';
import { DepartmentsApi } from '../../../../core/api/departments.api';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  Employee,
  EmployeeStatus,
} from '../../../../shared/models/employee.model';

@Component({
  selector: 'app-employees-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CardComponent],
  templateUrl: './employees-form.component.html',
  styleUrl: './employees-form.component.scss',
})
export class EmployeesFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EmployeesApi);
  private readonly departmentsApi = inject(DepartmentsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  //UI state
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly employeeId = toSignal(
    this.route.paramMap.pipe(map((pm) => Number(pm.get('id')) || null)),
    { initialValue: null },
  );

  readonly isEdit = computed(() => this.employeeId() != null);

  readonly departments = toSignal(
    this.departmentsApi.list$().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly form = this.fb.nonNullable.group({
    firstName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    lastName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    email: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    title: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    departmentId: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
    ]),
    status: this.fb.nonNullable.control<EmployeeStatus>('active', [
      Validators.required,
    ]),
    salary: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    hireDate: this.fb.nonNullable.control('', [Validators.required]),
  });

  readonly loading = signal(false);

  constructor() {
    //if edit -> load employee
    this.route.paramMap
      .pipe(
        tap(() => this.serverError.set(null)),
        map((pm) => Number(pm.get('id')) || null),
        tap((id) => {
          if (id) this.loading.set(true);
        }),
        switchMap((id) => {
          if (!id) return of(null);

          return this.api.getById$(id).pipe(
            catchError(() => {
              this.serverError.set('Failed to load employee');
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((emp) => {
        if (!emp) return;
        this.patchForm(emp);
      });
  }

  private patchForm(emp: Employee): void {
    this.form.patchValue({
      firstName: emp.firstName ?? '',
      lastName: emp.lastName ?? '',
      email: emp.email ?? '',
      title: emp.title ?? '',
      departmentId: emp.departmentId ?? null,
      status: (emp.status as EmployeeStatus) ?? 'active',
      salary: emp.salary != null ? Number(emp.salary) : null,
      hireDate: emp.hireDate ?? new Date(),
    });
  }

  get f() {
    return this.form.controls;
  }

  hasError(name: keyof typeof this.form.controls, error: string): boolean {
    const c = this.form.controls[name];
    return c.touched && c.hasError(error);
  }

  submit(): void {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const payload = this.form.getRawValue();
    const dto: Omit<Employee, 'id'> = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      title: payload.title,
      departmentId: Number(payload.departmentId),
      status: payload.status,
      salary: Number(payload.salary),
      hireDate: payload.hireDate, 
    };

    const id = this.employeeId();
    const req$ = id ? this.api.update$(id, dto) : this.api.create$(dto);

    req$
      .pipe(
        catchError(() => {
          this.serverError.set('Save failed. Please try again.');
          return of(null);
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((saved) => {
        if (!saved) return;
        void this.router.navigate(['/employees'], { replaceUrl: true });
      });
  }

  cancel(): void {
    void this.router.navigate(['/employees']);
  }

}
