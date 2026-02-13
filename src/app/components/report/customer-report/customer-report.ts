import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInput } from "@angular/material/input";
import { AllowOnlyAlphaCharDirective } from "../../../shared/directives/allow-only-alpha-char.directive";
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { customerList, loading } from '../store/report.selectors';

import * as ReportActions from '../store/report.actions'
import { Customer, Vehicle } from '../../customer/model/customer.model';

@Component({
  selector: 'app-book-report',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatDialogModule,
    MatInput,
    AllowOnlyAlphaCharDirective
],
  templateUrl: './customer-report.html',
  styleUrl: './customer-report.css'
})
export class CustomerReport implements OnInit, OnDestroy{

  loading$!: Observable<boolean>;
  customerList$!: Observable<Customer[] | null>;
  searchForm = new FormGroup({
    fromCriteria: new FormControl<string>(''),
    toCriteria: new FormControl<string>(''),
  })

  printFilter: string = '';
  isPrinting = false;
  
  destroy$ = new Subject<void>()

  constructor(
    private readonly store: Store,
  ){
    this.loading$ = this.store.select(loading);
    this.customerList$ = this.store.select(customerList)
  }

  ngOnInit(){
    this.searchForm.controls.fromCriteria.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((from) => {
          const to = this.searchForm.controls.toCriteria.value;
        if(from && to){
          if(from > to){
            this.searchForm.controls.fromCriteria.setErrors({'novalid': true});
          } else {
            this.searchForm.controls.fromCriteria.setErrors(null);
            this.searchForm.controls.toCriteria.setErrors(null);
            
          }
        }
      });

      this.searchForm.controls.toCriteria.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((to) => {
          const from = this.searchForm.controls.fromCriteria.value;
        if(from && to){
          if(from > to){
            this.searchForm.controls.toCriteria.setErrors({'novalid': true});
          } else {
              this.searchForm.controls.toCriteria.setErrors(null);
              this.searchForm.controls.fromCriteria.setErrors(null);
          }
        }
      });
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }

  printRecord(filter: string){
    this.printFilter = filter;
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
      this.printFilter = '';
    }, 300);
  }

  printFullReport(){
    this.printFilter = '';
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
    }, 300);
  }

  searchResult(){
    if(!this.searchForm.valid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const from = this.searchForm.controls.fromCriteria.value;
    const to = this.searchForm.controls.toCriteria.value;
    if(!from || !to) return;

    this.store.dispatch(ReportActions.getCustomersStart({from, to}));
  }

  totalOfRecords(customers: Customer[]): number{
    let counter = 0;
    customers.forEach(c => {
      if(c.vehicles){
        counter = counter + c.vehicles.length;
      }
    });
    return counter;
  }
}


