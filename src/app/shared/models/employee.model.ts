export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;
  title: string;
  status: EmployeeStatus;
  salary: number;
  hireDate: string; 
  managerId: number | null;
  avatarUrl?: string;
  notes?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
