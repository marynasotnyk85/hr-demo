import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Department } from "../../shared/models/department.model";

@Injectable({providedIn:'root'})
export class DepatmentsApi {
    private http= inject(HttpClient);
    private baseUrl = '/api/departments';

    list$(): Observable<Department[]> {
        return this.http.get<Department[]>(this.baseUrl);
    }

}