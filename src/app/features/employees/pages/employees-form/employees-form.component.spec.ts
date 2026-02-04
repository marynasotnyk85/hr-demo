import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeesFormComponent } from './employees-form.component';
import { EmployeesApi } from '../../../../core/api/employees.api';
import { DepartmentsApi } from '../../../../core/api/departments.api';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Employee } from '../../../../shared/models/employee.model';

// Small helper: create a route paramMap stream we can change per test
function createParamMap$() {
  return new BehaviorSubject(convertToParamMap({}));
}

describe('EmployeesFormComponent', () => {
  let fixture: ComponentFixture<EmployeesFormComponent>;
  let component: EmployeesFormComponent;

  // Mocks
  let employeesApi: jasmine.SpyObj<EmployeesApi>;
  let departmentsApi: jasmine.SpyObj<DepartmentsApi>;
  let router: Router;

  // Route control
  let paramMap$: BehaviorSubject<any>;

  beforeEach(async () => {
    employeesApi = jasmine.createSpyObj<EmployeesApi>('EmployeesApi', [
      'getById$',
      'create$',
      'update$',
    ]);

    departmentsApi = jasmine.createSpyObj<DepartmentsApi>('DepartmentsApi', ['list$']);

    // default behaviors
    departmentsApi.list$.and.returnValue(of([
      { id: 1, name: 'Engineering' },
      { id: 2, name: 'HR' },
    ]) as any);

    employeesApi.getById$.and.returnValue(of(null as any));
    employeesApi.create$.and.returnValue(of({ id: 999 } as any));
    employeesApi.update$.and.returnValue(of({ id: 1 } as any));

    paramMap$ = createParamMap$();

    await TestBed.configureTestingModule({
      imports: [EmployeesFormComponent],
      providers: [
        provideRouter([]),
        { provide: EmployeesApi, useValue: employeesApi },
        { provide: DepartmentsApi, useValue: departmentsApi },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(EmployeesFormComponent);
    component = fixture.componentInstance;
  });

  it('should create (create mode)', () => {
    // create mode = no id in route
    paramMap$.next(convertToParamMap({}));
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.isEdit()).toBeFalse();
  });

  it('should load employee and patch form in edit mode', () => {
    const emp: Employee = {
      id: 7,
      firstName: 'Maryna',
      lastName: 'Sotnyk',
      email: 'maryna@test.com',
      title: 'Frontend Engineer',
      departmentId: 1,
      status: 'active',
      salary: 50000,
      hireDate: '2026-01-01',
    };

    employeesApi.getById$.and.returnValue(of(emp));

    // edit mode = route has id
    paramMap$.next(convertToParamMap({ id: '7' }));
    fixture.detectChanges();

    expect(employeesApi.getById$).toHaveBeenCalledWith(7);

    // form patched
    expect(component.form.value.firstName).toBe('Maryna');
    expect(component.form.value.lastName).toBe('Sotnyk');
    expect(component.form.value.email).toBe('maryna@test.com');
    expect(component.form.value.departmentId).toBe(1);
    expect(component.isEdit()).toBeTrue();
  });

  it('should NOT submit when form invalid, and should mark all as touched', () => {
    paramMap$.next(convertToParamMap({})); // create mode
    fixture.detectChanges();

    // form is invalid by default (empty)
    expect(component.form.invalid).toBeTrue();

    component.submit();

    expect(employeesApi.create$).not.toHaveBeenCalled();
    expect(employeesApi.update$).not.toHaveBeenCalled();

    // check "markAllAsTouched" effect: at least one control touched
    expect(component.f.firstName.touched).toBeTrue();
    expect(component.serverError()).toBeNull();
  });

  it('should create employee in create mode and navigate back to /employees', () => {
    paramMap$.next(convertToParamMap({}));
    fixture.detectChanges();

    // fill valid form
    component.form.setValue({
      firstName: 'Anna',
      lastName: 'Koval',
      email: 'anna@test.com',
      title: 'HR Specialist',
      departmentId: 2,
      status: 'active',
      salary: 40000,
      hireDate: '2026-02-01',
    });

    expect(component.form.valid).toBeTrue();

    component.submit();

    expect(employeesApi.create$).toHaveBeenCalled();
    expect(employeesApi.update$).not.toHaveBeenCalled();

    expect(router.navigate).toHaveBeenCalledWith(['/employees'], { replaceUrl: true });
    expect(component.saving()).toBeFalse(); // finalize should set it back
  });

  it('should update employee in edit mode and navigate back to /employees', () => {
    // simulate edit mode id=5
    paramMap$.next(convertToParamMap({ id: '5' }));
    fixture.detectChanges();

    component.form.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      title: 'Dev',
      departmentId: 1,
      status: 'on_leave',
      salary: 60000,
      hireDate: '2025-12-10',
    });

    component.submit();

    expect(employeesApi.update$).toHaveBeenCalled();
    expect(employeesApi.create$).not.toHaveBeenCalled();

    expect(router.navigate).toHaveBeenCalledWith(['/employees'], { replaceUrl: true });
    expect(component.saving()).toBeFalse();
  });

  it('should set serverError when save fails', () => {
    employeesApi.create$.and.returnValue(throwError(() => new Error('boom')));

    paramMap$.next(convertToParamMap({}));
    fixture.detectChanges();

    component.form.setValue({
      firstName: 'Kate',
      lastName: 'Fox',
      email: 'kate@test.com',
      title: 'QA',
      departmentId: 1,
      status: 'active',
      salary: 30000,
      hireDate: '2026-02-01',
    });

    component.submit();

    expect(component.serverError()).toBe('Save failed. Please try again.');
    expect(component.saving()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
