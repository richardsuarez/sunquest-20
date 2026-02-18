import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { bookings, customerList, loading, searchCriteria, totalPagination } from '../store/customer.selectors';
import { Customer, Vehicle } from '../model/customer.model';
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
import { SearchCriteria, CustomerRecord } from '../model/customer.model';
import { Store } from '@ngrx/store';
import * as CustomerActions from '../store/customer.actions'
import * as  BookAction from '../../book/store/book.actions';
import { Season } from '../../season/models/season.model';
import { selectSeasons, selectIsMobile } from '../../main/store/main.selectors';
import { Booking } from '../../book/model/booking.model';
import { MatTableModule } from '@angular/material/table';
import { BookingDetailsPopupComponent } from '../../calendar/components/booking-details-popup/booking-details-popup.component';

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
    MatSuffix,
    MatTableModule,
  ],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class CustomerComponent implements OnInit, OnDestroy {

  @ViewChild('paginator') paginator: MatPaginator | undefined;

  isMobile$!: Observable<boolean>;
  destroy$ = new Subject<void>();
  loading$!: Observable<boolean>;
  customerList$!: Observable<Customer[] | null>;
  searchCustomer = new FormControl<string | null>('');
  searchCriteria!: SearchCriteria;
  totalPagination$!: Observable<number>;
  seasons$!: Observable<Season[]>;
  bookings$!: Observable<Booking[]>;
  customerList: Customer[] = [];
  currentSeason!: Season | null;
  records: CustomerRecord[] = [];
  bookingColumns: string[] = ['season', 'departureDate', 'from', 'to', 'paymentType', 'bank', 'amount', 'notes', 'actions'];

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
  ) {
    this.loading$ = this.store.select(loading);
    this.customerList$ = this.store.select(customerList);
    this.totalPagination$ = this.store.select(totalPagination);
    this.seasons$ = this.store.select(selectSeasons);
    this.bookings$ = this.store.select(bookings);
    this.store.select(searchCriteria).pipe(takeUntil(this.destroy$))
      .subscribe((criteria) => this.searchCriteria = criteria)
    this.isMobile$ = this.store.select(selectIsMobile);
  }

  ngOnInit() {
    //this.store.dispatch(CustomerActions.resetSearchCriteria());
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.currentSeason = seasons.find(s => s.isActive) ?? null;
    });

    this.customerList$.pipe(takeUntil(this.destroy$)).subscribe(customers => {
      if (customers) {
        this.customerList = customers;
        if(customers.length === 0) {
          this.records = [];
        }
        this.store.dispatch(CustomerActions.getBookingsStart({ customers }));
      }
    });

    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => {
      this.records = [];
      if (bookings) {
        for (let customer of this.customerList) {
          const customerBookings = bookings.filter(b =>
            b.customer?.DocumentID === customer.DocumentID);
          if (customer.vehicles && customer.vehicles.length > 0) {
            for (let vehicle of customer.vehicles) {
              const vehicleBookings: Booking[] = [];
              for (let booking of customerBookings) {
                if (booking.vehicleIds) {
                  for (let v of booking.vehicleIds) {
                    if (v === vehicle.id) {
                      vehicleBookings.push(booking);
                      break;
                    }
                  }
                }
              }
              let record: CustomerRecord = {
                recNo: vehicle.recNo,
                customer: customer,
                vehicle: vehicle,
                bookings: vehicleBookings
              }
              this.records = [...this.records, record];
            }
          } else {
            let record: CustomerRecord = {
              recNo: customer.recNo,
              customer: customer,
              vehicle: null,
              bookings: customerBookings ?? []
            }
            this.records = [...this.records, record];
          }
        }
      }
    });

    this.store.dispatch(CustomerActions.resetLastCustomer());
    this.store.dispatch(CustomerActions.getNextCustomerListStart());
    
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete()
  }

  addCustomer() {
    this.store.dispatch(CustomerActions.createCustomer());
    this.router.navigate(['main/customer/new']);
  }

  deleteBookingTooltip(booking: Booking): string {
    if (!this.editableBooking(booking)) {
      return 'Cannot delete past bookings';
    }
    return '';
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
      this.store.dispatch(BookAction.createEmptyBooking());
      this.router.navigate(['main/book/new']);
    }
  }

  deleteBooking(booking: Booking) {
    if (booking && booking.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Delete Booking',
            message: `Are you sure you want to delete this booking from ${booking.from} to ${booking.to} on ${booking.departureDate?.toDateString()}?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result) {
            //this.store.dispatch(BookAction.deleteBookingStart({ id: booking.id! }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();
    }
  }

  editBooking(booking: Booking, customer: Customer) {
    if (booking.customer) {
      this.store.dispatch(CustomerActions.loadCustomer({ customer }));
      this.store.dispatch(BookAction.loadBooking({ booking }));
      this.router.navigate(['main/book/edit']);
    }
  }

  editableBooking(booking: Booking): boolean {
    const today = new Date();
    if (!booking.departureDate) {
      return true;
    }
    return new Date(booking.departureDate) >= today;
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

  viewBooking(booking: Booking) {
    this.matDialog.open(BookingDetailsPopupComponent, {
      data: booking,
      maxWidth: '600px',
      width: '90vw'
    });
  }

}
