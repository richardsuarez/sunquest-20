import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Truck } from '../../../truck/model/truck.model';
import * as ReportActions from '../../store/report.actions';
import * as MainSelectors from '../../../main/store/main.selectors';
import * as MainAction from '../../../main/store/main.actions';
import { bookings, loading, trucks } from '../../store/report.selectors';
import { Store } from '@ngrx/store';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Trip } from '../../../trip/model/trip.model';
import { MatTableModule } from "@angular/material/table";
import { Booking } from '../../../book/model/booking.model';
import { Season } from '../../../season/models/season.model';
import { PrintViewPaymentReport } from "../print-view-payment-report/print-view-payment-report";
import { Router } from '@angular/router';
import { Customer } from '../../../customer/model/customer.model';

export type TableData = {
  recNo: string;
  lastName: string;
  amount: number;
  check: string;
  bank: string;
}

@Component({
  selector: 'app-payment-report',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatTableModule,
    PrintViewPaymentReport
  ],
  templateUrl: './payment-report.html',
  styleUrl: './payment-report.css',
  providers: [provideNativeDateAdapter()],
})
export class PaymentReport implements OnInit, OnDestroy {
  readonly dateRange = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });
  loading$!: Observable<boolean>;
  seasons$!: Observable<Season[]>;
  trucks$!: Observable<Truck[] | null>;
  selectedTrip: Trip | null = null;
  selectedTruck: Truck | null = null;
  printing: boolean = false;
  printData = {
    truck: {} as Truck,
    trip: {} as Trip,
    data: [] as TableData[],
  }
  destroy$ = new Subject<void>();
  bookings$!: Observable<Booking[] | null>;
  activeSeason: Season | null = null;
  tableData: TableData[] = [];

  constructor(
    private readonly store: Store,
    private readonly router: Router
  ) {
    this.trucks$ = this.store.select(trucks);
    this.loading$ = this.store.select(loading);
    this.seasons$ = this.store.select(MainSelectors.selectSeasons);
    this.bookings$ = this.store.select(bookings);
  }

  ngOnInit(): void {
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe((seasons) => {
      this.activeSeason = seasons.find(season => season.isActive) || null;
    });

    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => {
      if (bookings && this.selectedTrip) {
        bookings.forEach(booking => {
          const auxData = {
            recNo: this.searchRecNo(booking),
            lastName: booking.customer ? booking.customer.primaryLastName || '' : '',
            amount: booking.paycheck.amount ? booking.paycheck.amount : 0,
            check: booking.paycheck.checkNumber ? booking.paycheck.checkNumber : '',
            bank: booking.paycheck.bankName ? booking.paycheck.bankName : ''
          };
          this.tableData.push(auxData);
        });
      }
    });

    this.store.dispatch(ReportActions.cleanTruckList());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  allTrips(): number {
    let tripCount = 0;
    this.trucks$.pipe(takeUntil(this.destroy$)).subscribe(trucks => {
      tripCount = trucks ? trucks.reduce((acc, truck) => acc + (truck.trips?.length || 0), 0) : 0
    });
    return tripCount;
  }

  editBooking(booking: Booking) {
    this.router.navigate(['main/book/edit']);
    this.store.dispatch(MainAction.loadCustomer({ customer: booking.customer as Customer }));
    this.store.dispatch(MainAction.loadBooking({ booking }));
  }

  paidBookings(bookings: Booking[] | null){
    return bookings?.filter(booking => booking.paycheck && booking.paycheck.amount > 0).length || 0;
  }

  searchRecNo(booking: Booking): string {
    if (booking.vehicleIds && booking.vehicleIds.length > 0) {
      const vehicleId = booking.vehicleIds[0];
      if (booking.customer && booking.customer.vehicles && booking.customer.vehicles.length > 0) {
        const recNo = booking.customer.vehicles.find(v => v.id === vehicleId)?.recNo;
        return recNo || '';
      }
    }
    return 'No provided';
  }

  searchResult() {
    this.selectedTrip = null;
    this.selectedTruck = null;

    if (!this.activeSeason) {
      console.log('No active season selected');
      return;
    }
    if (!this.dateRange.value.start || !this.dateRange.value.end) {
      this.dateRange.setErrors({ 'required': true });
      return;
    }
    this.dateRange.setErrors(null);
    this.store.dispatch(ReportActions.loadTruckTripsByDateRange({ start: this.dateRange.value.start, end: this.dateRange.value.end }));
  }

  selectTrip(trip: Trip, truck: Truck) {
    if (!this.activeSeason) {
      console.log('No active season selected');
      return;
    }
    this.selectedTrip = trip;
    this.selectedTruck = truck;
    this.store.dispatch(ReportActions.loadBookingsForTripStart({ tripId: trip.id!, season: this.activeSeason! }));
  }

  printReport() {
    this.printing = true;
    this.printData = {
      truck: this.selectedTruck!,
      trip: this.selectedTrip!,
      data: this.tableData,
    }
    setTimeout(() => {
      this.printing = false;
      this.printData = {
        truck: {} as Truck,
        trip: {} as Trip,
        data: [] as TableData[],
      }
    }, 1000)
  }
}
