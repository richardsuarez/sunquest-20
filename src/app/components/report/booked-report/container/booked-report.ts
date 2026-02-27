import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Booking } from '../../../book/model/booking.model';
import { Store } from '@ngrx/store';
import { Season } from '../../../season/models/season.model';
import { bookings, loading } from '../../store/report.selectors';
import { selectSeasons } from '../../../main/store/main.selectors';
import * as ReportActions from '../../store/report.actions'
import * as MainActions from '../../../main/store/main.actions'
import { Router } from '@angular/router';
import { Customer, Vehicle } from '../../../customer/model/customer.model';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PrintViewBookedReport } from '../print-view-booked-report/print-view-booked-report';

@Component({
  selector: 'app-booked-report',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    PrintViewBookedReport,
    ReactiveFormsModule,
  ],
  templateUrl: './booked-report.html',
  styleUrl: './booked-report.css',
  providers: [provideNativeDateAdapter()],
})
export class BookedReport implements OnInit, OnDestroy {
  printing: boolean = false;
  loading$!: Observable<boolean>;
  readonly dateRange = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });
  bookings$!: Observable<Booking[] | null>
  seasons$!: Observable<Season[]>
  activeSeason: Season | null = null;

  destroy$ = new Subject<void>()

  constructor(
    private readonly store: Store,
    private readonly router: Router,
  ) {
    this.loading$ = this.store.select(loading);
    this.bookings$ = this.store.select(bookings);
    this.seasons$ = this.store.select(selectSeasons);
  }

  ngOnInit() {
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.activeSeason = seasons.find(s => s.isActive === true) || null;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  editBooking(booking: Booking) {
    this.router.navigate(['main/book/edit']);
    this.store.dispatch(MainActions.loadCustomer({ customer: booking.customer as Customer }));
    this.store.dispatch(MainActions.loadBooking({ booking }));
  }

  printReport() {
    this.printing = true;
    setTimeout(() => {
      this.printing = false;
    }, 1000)
  }

  searchRecNo(booking: Booking): string {
    if (booking.customer && booking.customer.vehicles && booking.customer.vehicles.length > 0) {
      return booking.customer.vehicles[0].recNo || '';
    }
    return 'No provided';
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

  
  vehicleMake(customer: Customer): string{
    if(customer.vehicles){
      return customer.vehicles[0].make || 'No provided';
    }
    return 'No provided';
  }

  vehicleModel(customer: Customer): string{
    if(customer.vehicles){
      return customer.vehicles[0].model || 'No provided';
    }
    return 'No provided';
  }

  weekNumber(date: Date | null): number {
    if (!date) {
      return 0;
    }
    const yearStart = new Date(date.getFullYear(), 0, 1); // Jan 1st, of the year given
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 604800000));
  }
}
