import { Routes } from '@angular/router';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/employees-list/employees-list.component').then(
        (m) => m.EmployeesListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/employees-form/employees-form.component').then(
        (m) => m.EmployeesFormComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/employees-form/employees-form.component').then(
        (m) => m.EmployeesFormComponent
      ),
  },
];
