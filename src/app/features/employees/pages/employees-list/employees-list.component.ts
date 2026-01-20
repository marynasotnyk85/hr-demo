import { Component, computed, signal , inject, effect} from '@angular/core';
import { DataTableComponent, TableColumn, TableState } from '../../../../shared/components/data-table/data-table.component';
import { Employee } from '../../../../shared/models/employee.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmployeesApi } from '../../../../core/api/employees.api';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsApi } from '../../../../core/api/departments.api';
import { AsyncPipe, NgIf } from '@angular/common';
import { CardComponent } from '../../../../shared/components/card/card.component';

type SortKey = keyof Employee;

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [NgIf,
    AsyncPipe,
    CardComponent,
    CardComponent,
    DataTableComponent,],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent {
    

}
