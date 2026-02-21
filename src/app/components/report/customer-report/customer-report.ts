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
import { Customer } from '../../customer/model/customer.model';
import { AllowAlphanumericDirective } from "../../../shared/directives/allow-alphanumeric.directive";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

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
    MatSelectModule,
    AllowOnlyAlphaCharDirective,
    AllowAlphanumericDirective,
  ],
  templateUrl: './customer-report.html',
  styleUrl: './customer-report.css'
})
export class CustomerReport implements OnInit, OnDestroy {

  loading$!: Observable<boolean>;
  customerList$!: Observable<Customer[] | null>;
  searchForm = new FormGroup({
    recNoCriteria: new FormControl<string>(''),
    fromCriteria: new FormControl<string>(''),
    toCriteria: new FormControl<string>(''),
  })

  searchCriteriaSelector = new FormControl<string>('recNo');

  printFilter: string = '';
  isPrinting = false;

  destroy$ = new Subject<void>()

  constructor(
    private readonly store: Store,
    private readonly snackBar: MatSnackBar
  ) {
    this.loading$ = this.store.select(loading);
    this.customerList$ = this.store.select(customerList)
  }

  ngOnInit() {
    this.searchForm.controls.fromCriteria.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((from) => {
        const to = this.searchForm.controls.toCriteria.value;
        if (from && to) {
          if (from > to) {
            this.searchForm.controls.fromCriteria.setErrors({ 'novalid': true });
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
        if (from && to) {
          if (from > to) {
            this.searchForm.controls.toCriteria.setErrors({ 'novalid': true });
          } else {
            this.searchForm.controls.toCriteria.setErrors(null);
            this.searchForm.controls.fromCriteria.setErrors(null);
          }
        }
      });

    this.searchForm.controls.fromCriteria.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((from) => {
        const to = this.searchForm.controls.toCriteria.value;
        if (!to && from) {
          this.searchForm.controls.toCriteria.setErrors(null);
        }
      });

    this.searchForm.controls.toCriteria.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((to) => {
        const from = this.searchForm.controls.fromCriteria.value;
        if (from && to) {
          this.searchForm.controls.fromCriteria.setErrors(null);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  printRecord(filter: string) {
    this.printFilter = filter;
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
      this.printFilter = '';
    }, 300);
  }

  printFullReport() {
    this.printFilter = '';
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
    }, 300);
  }

  searchResult() {
    const recNo = this.searchForm.controls.recNoCriteria.value;
    const from = this.searchForm.controls.fromCriteria.value;
    const to = this.searchForm.controls.toCriteria.value;

    if (this.searchCriteriaSelector.value === 'recNo') {
      this.searchForm.controls.fromCriteria.setValue('');
      this.searchForm.controls.toCriteria.setValue('');

      if (!recNo) {
        this.searchForm.controls.recNoCriteria.setErrors({ 'required': true });
        this.snackBar.open('Please enter Rec No as search criteria', 'Close', { duration: 3000 });
        return;
      } else {
        this.store.dispatch(ReportActions.getCustomersByRecNo({ recNo }));
      }
    } else {
      if (!this.searchForm.valid) {
        this.searchForm.markAllAsTouched();
        return;
      }

      if (from && !to) {
        this.searchForm.controls.toCriteria.setErrors({ 'required': true });
        return;
      }
      if (!from && to) {
        this.searchForm.controls.fromCriteria.setErrors({ 'required': true });
        return;
      }

      if (!recNo && !from && !to) {
        this.snackBar.open('Please enter at least one search criteria', 'Close', { duration: 3000 });
        return;
      }

      this.store.dispatch(ReportActions.getCustomersByFromTo({ from: from!, to: to! }));
    }

  }

  totalOfRecords(customers: Customer[]): number {
    let counter = 0;
    customers.forEach(c => {
      if (c.vehicles && c.vehicles.length > 0) {
        counter = counter + c.vehicles.length;
      } else{
        counter = counter + 1;
      }
    });
    return counter;
  }
}


