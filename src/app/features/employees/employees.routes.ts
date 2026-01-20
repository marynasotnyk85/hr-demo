import { Routes } from "@angular/router";

export const EMPLOYEES_ROUTES: Routes = [
    {
        path:'',
        loadComponent: () =>
            import('./pages/employees-list/employees-list.component').then(m => m.EmployeesListComponent)
    }

]