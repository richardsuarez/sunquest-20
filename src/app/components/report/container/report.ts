import { Component, OnInit } from '@angular/core';
import { Season } from '../../season/models/season.model';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe, CommonModule } from '@angular/common';

import * as MainSelectors from '../../main/store/main.selectors';
import * as ReportActions from '../store/report.actions';
import * as ReportSelectors from '../store/report.selectors';
import { MatButtonModule } from '@angular/material/button';
import { Truck } from '../../truck/model/truck.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BookReport } from '../models/report.models';
import { Booking } from '../../book/model/booking.model';
import { Address } from '../../customer/model/customer.model';

@Component({
  selector: 'app-report',
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
  ],
  templateUrl: './report.html',
  styleUrl: './report.css',
  providers: [provideNativeDateAdapter()],
})
export class Report implements OnInit {

  today = new Date();
  month = this.today.getMonth();
  year = this.today.getFullYear();
  readonly dateRange = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  activeSeason: Season | null = null;
  seasons$!: Observable<Season[]>;
  loading$!: Observable<boolean>;
  loadingBookReport$!: Observable<boolean>;
  bookReport$!: Observable<BookReport | null>;
  bookings$!: Observable<Booking[] | null>;
  trucks$!: Observable<Truck[] | null>;

  destroy$ = new Subject<void>();

  bookingList: Booking[] = [];
  truckList: Truck[] = [];

  constructor(
    private readonly store: Store,
  ) {
    this.store.dispatch(ReportActions.clearBookReport())
    this.seasons$ = this.store.select(MainSelectors.selectSeasons);
    this.loading$ = this.store.select(ReportSelectors.loading);
    this.loadingBookReport$ = this.store.select(ReportSelectors.loadingBookReport);
    this.bookings$ = this.store.select(ReportSelectors.bookings);
    this.trucks$ = this.store.select(ReportSelectors.trucks);
    this.bookReport$ = this.store.select(ReportSelectors.bookingReport);

  }

  ngOnInit() {
    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe((bookings) => {
      if (bookings && bookings.length > 0) {
        this.bookingList = bookings;
        if (this.truckList.length > 0) {
          this.store.dispatch(ReportActions.getBookReport({ bookings, trucks: this.truckList }));
        }
      }
    });

    this.trucks$.pipe(takeUntil(this.destroy$)).subscribe(trucks => {
      if(trucks){
        this.truckList = trucks;
      }
    })

    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe((seasons) => {
      this.activeSeason = seasons.find(season => season.isActive) || null;
      if (this.activeSeason) {
        this.store.dispatch(ReportActions.loadTruckTrips({
          season: this.activeSeason,
        }));
      }

    });
  }

  allTrips(): number {
    let tripCount = 0;
    this.bookReport$.pipe(takeUntil(this.destroy$)).subscribe(report => {
      tripCount = report ? report.trucks.reduce((acc, truck) => acc + truck.trips.length, 0) : 0
    });
    return tripCount;
  }

  searchResult() {
    if (!this.activeSeason) {
      console.log('No active season selected');
      return;
    }

    if (!this.dateRange.value.start || !this.dateRange.value.end) {

      this.dateRange.setErrors({ 'required': true });
      return;
    }
    this.dateRange.setErrors(null);
    this.store.dispatch(ReportActions.loadBookingsStart({ start: this.dateRange.value.start!, end: this.dateRange.value.end!, season: this.activeSeason! }));
  }

  printFullReport() {
    window.print();
  }

  printTrip(tripId: string) {
    // Store the trip ID to filter in print
    localStorage.setItem('printTripId', tripId);
    window.print();
    // Clear after a short delay to allow print dialog to open
    setTimeout(() => {
      localStorage.removeItem('printTripId');
    }, 500);
  }

  formatAddress(address: Address | null): string {
    if (!address) return 'Not provided';
    const { address1, address2, bldg, apt, city, state, zipCode } = address;
    return `${address1}${address2 ? `, ${address2}` : ''}${bldg ? `, Bldg. ${bldg}` : ''}${apt ? `, Apt. ${apt}` : ''}, ${city}, ${state} ${zipCode}`;
  }

  getTripTotals(bookings: Booking[]): { weight: number; volume: number } {
    return bookings.reduce(
      (acc, booking) => ({
        weight: acc.weight + (booking.paycheck?.amount || 0),
        volume: acc.volume + (booking.vehicleIds?.length || 0)
      }),
      { weight: 0, volume: 0 }
    );
  }

  vehicleInfo(booking: Booking, id: string) {
    let formattedVehicle: string = '';
    if (booking.customer && booking.customer.vehicles && booking.customer.vehicles.length > 0) {
      const vehicle = booking.customer.vehicles.find(v => v.id === id);
      formattedVehicle = `${vehicle?.color || ''} ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.plate || ''})`.trim();
    }
    return formattedVehicle;
  }
}