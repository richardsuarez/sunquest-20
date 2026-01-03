import { CommonModule, AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInput } from "@angular/material/input";
import { AllowOnlyAlphaCharDirective } from "../../../../shared/directives/allow-only-alpha-char.directive";
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { customerList, loading } from '../../store/report.selectors';

import * as ReportActions from '../../store/report.actions'
import { Customer } from '../../../customer/model/customer.model';

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
export class CustomerReport {

  loading$!: Observable<boolean>;
  customerList$!: Observable<Customer[] | null>;
  searchFrom = new FormControl<string>('');
  searchTo = new FormControl<string>('');

  constructor(
    private readonly store: Store,
  ){
    this.loading$ = this.store.select(loading);
    this.customerList$ = this.store.select(customerList)
  }

  searchResult(){
    const from = this.searchFrom.value;
    const to = this.searchTo.value;
    if(!from || !to) return;

    this.store.dispatch(ReportActions.getCustomersStart({from, to}));
  }
}
