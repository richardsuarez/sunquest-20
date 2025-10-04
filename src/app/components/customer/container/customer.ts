import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { SearchCriteria } from '../model/customer.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CustomerStateService } from '../state/state';
import { MatDividerModule } from '@angular/material/divider';
//import { Store } from '@ngrx/store';
//import { AppState } from '../../store/app.state';
//import { customerList, criteria } from '../../store/customer/customer.selector';
//import * as CustomerActions from '../../store/customer/customer.actions';
import { Customer } from '../model/customer.model';
import { DataService } from '../../../shared/firebase/data.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-customer',
  imports: [
    CommonModule,
    MatIconModule,
    MatFormField,
    ReactiveFormsModule,
    MatCardModule,
    MatInput,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class CustomerComponent implements OnInit, OnDestroy {

  isMobile!: boolean;
  destroy$ = new Subject<void>();
  customerList$!: Observable<Customer[]>;
  searchCustomer = new FormControl<string | null>('');
  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly router: Router,
    readonly customerState: CustomerStateService,
    private readonly data: DataService,
    private readonly matDialog: MatDialog,
    //private readonly store: Store<AppState>,
  ) {

    this.customerList$ = this.data.getCustomerList();
  }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    /* this.criteria$.pipe(takeUntil(this.destroy$))
      .subscribe((criteria) => {
        this.store.dispatch(CustomerActions.getCustomerListStart({criteria}))
      }) */
  }

  ngOnDestroy() {
    this.destroy$.complete()
  }

  addCustomer() {
    this.customerState.resetCustomerViewModel();
    this.router.navigate(['main/customer/new'])
  }

  formatLabelEmail(email: string | null) {
    return `mailto:${email}`
  }

  formatLabelPhone(phone: string | null) {
    return `tel:${phone}`;
  }

  toEditCustomer(customer: Customer | undefined) {
    if (customer) {
      this.customerState.setCustomerViewModel(customer);
      this.router.navigate(['main/customer/edit']);
    }
  }

  deleteCustomer(customer: Customer | undefined) {
    if (customer && customer.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Delete Customer',
            message: `Are you sure you want to delete ${customer.primaryTitle} ${customer.primaryFirstName} ${customer.primaryLastName}?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result) {
            this.data.deleteCustomer(customer.id);
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();
      
    }
  }

}
