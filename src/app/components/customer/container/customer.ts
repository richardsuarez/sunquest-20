import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { Customer } from '../model/customer.model';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { customerList } from '../store/customer.selectors';
import * as CustomerActions from '../store/customer.actions'

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
    MatPaginatorModule
  ],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class CustomerComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('paginator') paginator: MatPaginator | undefined;

  isMobile!: boolean;
  destroy$ = new Subject<void>();
  customerList$!: Observable<Customer[]>;
  searchCustomer = new FormControl<string | null>('');

  private store = inject(Store)
  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
  ) {
    this.customerList$ = this.store.select(customerList)
  }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    
  }

  ngOnDestroy() {
    this.destroy$.complete()
  }

  ngAfterViewInit(){
      this.store.dispatch(CustomerActions.getCustomerListStart())
  }

  addCustomer() {
    this.store.dispatch(CustomerActions.createCustomer())
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
      this.store.dispatch(CustomerActions.loadCustomer({ customer }));
      this.router.navigate(['main/customer/edit']);
    }
  }

  deleteCustomer(customer: Customer | undefined) {
    if (customer && customer.DocumentID) {
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
            this.store.dispatch(CustomerActions.deleteCustomerStart({ id: customer.DocumentID }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();

    }
  }

  onPageChange(event: any) {
    this.store.dispatch(CustomerActions.updateSearchCriteria({
      criteria: {
        searchValue: this.searchCustomer.value || '',
        pagination:{
          page: event.pageIndex,
          pageSize: event.pageSize
        }
      }
    }));
    this.store.dispatch(CustomerActions.getCustomerListStart());
  }

}
