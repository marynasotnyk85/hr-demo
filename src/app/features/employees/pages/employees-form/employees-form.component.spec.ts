import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesFormComponent } from './employees-form.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('EmployeesFormComponent', () => {
  let component: EmployeesFormComponent;
  let fixture: ComponentFixture<EmployeesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesFormComponent],
       providers: [
              provideRouter([]),          
              provideHttpClient(),        
              provideHttpClientTesting(), 
            ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
