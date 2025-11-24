import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { customerList, loading, searchCriteria, totalPagination } from '../store/customer.selectors';
import { Customer } from '../model/customer.model';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';
import { SearchCriteria } from '../model/customer.model';
import { Store } from '@ngrx/store';
import * as CustomerActions from '../store/customer.actions'
import { CustomerService } from '../service/customer.service';

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
    MatListModule,
    MatPaginatorModule,
    MatProgressBar,
    MatSuffix
],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class CustomerComponent implements OnInit, OnDestroy {

  @ViewChild('paginator') paginator: MatPaginator | undefined;

  isMobile!: boolean;
  destroy$ = new Subject<void>();
  loading$!: Observable<boolean>;
  customerList$!: Observable<Customer[]>;
  searchCustomer = new FormControl<string | null>('');
  searchCriteria!: SearchCriteria;
  totalPagination$!: Observable<number>

  private store = inject(Store)
  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
  ) {
    this.loading$ = this.store.select(loading)
    this.customerList$ = this.store.select(customerList)
    this.totalPagination$ = this.store.select(totalPagination)
    this.store.select(searchCriteria).pipe(takeUntil(this.destroy$))
      .subscribe((criteria) => this.searchCriteria = criteria)

  }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });
    this.store.dispatch(CustomerActions.resetSearchCriteria())
    this.store.dispatch(CustomerActions.resetLastCustomer())
    this.store.dispatch(CustomerActions.getNextCustomerListStart())
  }

  ngOnDestroy() {
    this.destroy$.complete()
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

  createBooking(customer: Customer | undefined) {
    if (customer) {
      this.store.dispatch(CustomerActions.loadCustomer({ customer }));
      this.router.navigate(['main/book/new']);
    }
  }

  onPageChange(event: any) {

    if (event.previousPageIndex < event.pageIndex) {
      // looking for the next page
      this.store.dispatch(CustomerActions.updateSearchCriteria({
        criteria: {
          searchValue: this.searchCriteria.searchValue || '',
          pageSize: this.searchCriteria.pageSize
        }
      }));
      this.store.dispatch(CustomerActions.getNextCustomerListStart());
    } else {
      this.store.dispatch(CustomerActions.updateSearchCriteria({
        criteria: {
          searchValue: this.searchCriteria.searchValue || '',
          pageSize: this.searchCriteria.pageSize
        }
      }));
      this.store.dispatch(CustomerActions.getPreviousCustomerListStart());
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  onSearch() {
    if (this.searchCustomer.value === this.searchCriteria.searchValue) return

    this.store.dispatch(CustomerActions.updateSearchCriteria({
      criteria: {
        searchValue: this.searchCustomer.value || '',
        pageSize: this.searchCriteria.pageSize,
      }
    }));
    this.store.dispatch(CustomerActions.resetLastCustomer());
    this.store.dispatch(CustomerActions.getNextCustomerListStart());
  }

}
