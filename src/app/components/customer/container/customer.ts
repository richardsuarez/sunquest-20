import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { bookings, customerList, loading, searchCriteria, totalPagination } from '../store/customer.selectors';
import { Customer, Vehicle } from '../model/customer.model';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import * as MainAction from '../../main/store/main.actions';
import { Season } from '../../season/models/season.model';
import { selectSeasons, selectIsMobile, deletingBooking } from '../../main/store/main.selectors';
import { Booking } from '../../book/model/booking.model';
import { MatTableModule } from '@angular/material/table';
import { BookingDetailsPopupComponent } from '../../calendar/components/booking-details-popup/booking-details-popup.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from "@angular/material/tooltip";

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
    MatProgressSpinnerModule,
    MatTooltip
  ],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class CustomerComponent implements OnInit, OnDestroy {

  @ViewChild('paginator') paginator: MatPaginator | undefined;

  isMobile$!: Observable<boolean>;
  deletingBooking$!: Observable<string | null>;
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
  currentBookings: Booking[] | null = null;
  bookingTagForDeletion: string | null = null;

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.loading$ = this.store.select(loading);
    this.customerList$ = this.store.select(customerList);
    this.totalPagination$ = this.store.select(totalPagination);
    this.seasons$ = this.store.select(selectSeasons);
    this.bookings$ = this.store.select(bookings);
    this.store.select(searchCriteria).pipe(takeUntil(this.destroy$))
      .subscribe((criteria) => this.searchCriteria = criteria)
    this.isMobile$ = this.store.select(selectIsMobile);
    this.deletingBooking$ = this.store.select(deletingBooking);
  }

  ngOnInit() {
    //this.store.dispatch(CustomerActions.resetSearchCriteria());
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.currentSeason = seasons.find(s => s.isActive) ?? null;
    });

    this.customerList$.pipe(takeUntil(this.destroy$)).subscribe(customers => {
      if (customers) {
        this.customerList = customers;
        if (customers.length === 0) {
          this.records = [];
        }
        this.store.dispatch(CustomerActions.getBookingsStart({ customers }));
      }
    });

    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => {
      this.currentBookings = bookings;
      this.createRecords(bookings);
    });

    this.deletingBooking$.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === null && this.bookingTagForDeletion !== null) {
        // reset deleting booking state after deletion is done
        const newBookings = this.currentBookings?.filter(b => b.id !== this.bookingTagForDeletion) ?? null;
        this.currentBookings = newBookings;
        this.createRecords(newBookings ?? []);
        this.bookingTagForDeletion = null;
      } else {
        this.bookingTagForDeletion = result;
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

  createRecords(bookings: Booking[]) {
    this.records = [];
    if (bookings) {
      for (let customer of this.customerList) {
        const customerBookings = bookings.filter(b =>
          b.customer?.DocumentID === customer.DocumentID);
        if (customer.vehicles && customer.vehicles.length > 0) {
          for (let vehicle of customer.vehicles) {
            const vehicleBookings: Booking[] = [];
            for (let booking of customerBookings) {
              if (booking.vehicleId && booking.vehicleId === vehicle.id) {
                vehicleBookings.push(booking);
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
    this.cdr.detectChanges();
  }

  deleteBookingTooltip(booking: Booking): string {
    if (this.pastBooking(booking)) {
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

  isCurrentSeason(season: string): boolean {
    const aux = this.currentSeason?.seasonName + '-' + this.currentSeason?.year;
    return season === aux;
  }

  toEditCustomer(customer: Customer | undefined) {
    if (customer) {
      this.store.dispatch(CustomerActions.loadCustomer({ customer }));
      this.router.navigate(['main/customer/edit']);
    }
  }

  deleteRecord(record: CustomerRecord) {
    if (record && record.recNo) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Delete Record',
            message: `Are you sure you want to delete record ${record.recNo}?
            All next bookings for this record will also be deleted.
            Only will remain the previous bookings for reference.
            This action cannot be undone.`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result === 'Success') {
            this.store.dispatch(CustomerActions.deleteRecordStart({ record }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();

    }
  }

  createBooking(customer: Customer | undefined, vehicle: Vehicle | null) {
    if (this.currentSeason) {
      if (customer && vehicle) {
        const auxCustomer: Customer = {
          ...customer,
          vehicles: customer.vehicles?.filter(v => v.id === vehicle.id)
        }
        this.router.navigate(['main/book/new']);
        this.store.dispatch(MainAction.loadCustomer({ customer:  auxCustomer}));
        this.store.dispatch(MainAction.createEmptyBooking()); 
      } else {
        this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'No vehicle provided',
            message: `Cannot create booking because there is no vehicle provided. Please add one and try later.`,
            cancelButton: 'OK',
          }
        }
      );
      }
    } else {
      this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'No active season',
            message: `Cannot create booking because there is no active season. Please create and activate a season first.`,
            cancelButton: 'OK',
          }
        }
      );
    }

  }

  deleteBooking(booking: Booking) {
    if (booking && booking.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Delete Booking',
            message: `Are you sure you want to delete this booking for ${booking.customer?.primaryFirstName} ${booking.customer?.primaryLastName} from ${booking.from} to ${booking.to} on ${booking.departureDate?.toDateString()}?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result === 'Success') {
            this.store.dispatch(MainAction.deleteBookingStart({ booking }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();
    }
  }

  editBooking(booking: Booking, customer: Customer) {
    if (booking.customer) {
      this.router.navigate(['main/book/edit']);
      this.store.dispatch(MainAction.loadCustomer({ customer }));
      this.store.dispatch(MainAction.loadBooking({ booking }));
    }
  }

  pastBooking(booking: Booking): boolean {
    const today = new Date();
    if (!booking.departureDate) {
      return false;
    }
    return new Date(booking.departureDate) < today;
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
