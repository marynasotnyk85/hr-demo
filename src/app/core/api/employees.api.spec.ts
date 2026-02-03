import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { EmployeesApi } from "./employees.api"
import { TestBed } from "@angular/core/testing";
import { Employee } from "../../shared/models/employee.model";

describe('EmployeesApi test', () => {
    let api : EmployeesApi;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [EmployeesApi]
        })

        api = TestBed.inject(EmployeesApi);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(()=> {
        httpMock.verify();
    });

    it('getById$ should GET /api/employees/:id and return the employee', () =>{
         const id = 7;
    const mockEmployee: Employee = {
      id: 7,
      firstName: "Paolo",
      lastName: "Gallo",
      email: "paolo.gallo@example.com",
      departmentId: 3,
      title: "HR Manager",
      status: "active",
      salary: 83000,
      hireDate: "2021-10-01",
      managerId: null,
      avatarUrl: "",
      notes: "HR strategy and policies."
    } as Employee;

    let result: Employee | undefined;

    api.getById$(id).subscribe((e) => (result=e));

    const req = httpMock.expectOne(`/api/employees/${id}`);
    expect(req.request.method).toBe('GET');

    req.flush(mockEmployee);

    // final result
    expect(result).toEqual(mockEmployee);
    })
})