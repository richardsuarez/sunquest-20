import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Booking } from '../../../book/model/booking.model';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { currentMonthBookings, selectedTrip, selectTrucks } from '../../store/calendar.selectors';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { BookingDetailsPopupComponent } from '../booking-details-popup/booking-details-popup.component';
import { deleteBookingStart } from '../../store/calendar.actions';
import { Router } from '@angular/router';
import { Trip } from '../../../trip/model/trip.model';
import { MatTableModule } from "@angular/material/table";
import { TripPopoverComponent } from '../trip-popover/trip-popover.component';
import * as CalendarActions from '../../store/calendar.actions';

@Component({
  selector: 'app-calendar-popover',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './calendar-popover.html',
  styleUrl: './calendar-popover.css'
})
export class CalendarPopoverComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  @ViewChild('popoverContainer') popoverContainer: ElementRef | undefined;

  trip: Trip | null = null;
  isMobile: boolean = false;
  truckId: string | null = null;
  startDate: Date = new Date();
  endDate: Date = new Date();
  
  tripBookings: Booking[] = []
  selectedTrip$!: Observable<Trip | null>;
  bookings$!: Observable<Booking[] | null>;
  loading = false;
  error: string | null = null;
  destroy$ = new Subject<void>()
  adjustedPosition: { top: number; left: number } = { top: 0, left: 0 };
  truckList: any[] = [];
  truckList$: Observable<any[]>;

  currentBooking!: Booking;
  bookingIndex = 0;

  bookingTableColumns: string[] = ['customer', 'year', 'make', 'model', 'plate', 'vin', 'actions'];
  vehicelColumns: string[] = ['year', 'make', 'model', 'plate', 'vin'];

  constructor(
    public dialogRef: MatDialogRef<CalendarPopoverComponent>,
    @Inject(MAT_DIALOG_DATA) data: { isMobile: boolean, truckId: string, startDate: Date, endDate: Date },
  ) {
    this.isMobile = data.isMobile;
    this.truckId = data.truckId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.bookings$ = this.store.select(currentMonthBookings)
    this.selectedTrip$ = this.store.select(selectedTrip);
    this.truckList$ = this.store.select(selectTrucks);
  }

  ngOnInit() {
    this.selectedTrip$.pipe(takeUntil(this.destroy$)).subscribe(trip => {
      this.trip = trip;
    });

    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => {
      if (bookings) {
        this.tripBookings = bookings.filter(b => b.tripId === this.trip?.id);
        this.currentBooking = this.tripBookings[0];
      }
    })

    this.truckList$.pipe(takeUntil(this.destroy$)).subscribe(trucks => {
      this.truckList = trucks || [];
    });
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(){
    this.dialogRef.close();
  }

  deleteBooking(booking: Booking) {
    if (booking && booking.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Cancel Booking',
            message: `Are you sure you want to cancel booking for ${booking.customer?.primaryFirstName} ${booking.customer?.primaryLastName}?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result === 'Success') {
            this.store.dispatch(deleteBookingStart({ booking, trip: this.trip! }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();

    }
  }

  getVehicleInfo(booking: Booking): string[] {
    const vehicleIds = booking.vehicleIds || [];
    const vehicles = booking.customer?.vehicles;
    const returnedVehicles: string[] = [];

    if (vehicles && vehicles.length > 0) {
      for (let v of vehicles) {
        // Check if this vehicle's ID is in the booking's vehicleIds array
        if (v.id && vehicleIds.includes(v.id)) {
          returnedVehicles.push(`${v.year} ${v.make} ${v.model} (${v.plate})`);
        }
      }
    }

    return returnedVehicles.length > 0 ? returnedVehicles : ['No vehicles'];
  }

  getBookingVehicles(booking: Booking): any[] {
    const vehicleIds = booking.vehicleIds || [];
    const vehicles = booking.customer?.vehicles || [];

    // Filter vehicles to only include those in this booking
    return vehicles.filter(v => v.id && vehicleIds.includes(v.id));
  }

  getPrimaryCustomer(booking: Booking): string {
    if (!booking.customer || !booking.customer.primaryFirstName || !booking.customer.primaryLastName) {
      return 'Unknown Customer';
    }
    return booking.customer.primaryFirstName + ' ' + booking.customer.primaryMiddleName + ' ' + booking.customer.primaryLastName;
  }

  displayBooking(booking: Booking) {
    if (!booking) return;

    this.matDialog.open(BookingDetailsPopupComponent, {
      data: booking,
      maxWidth: '600px',
      width: '90vw'
    }).afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'edit') {
        this.toEditBooking(booking);
      }
    });
  }

  nextBooking(){
    if(this.bookingIndex <= this.tripBookings.length - 1){
      this.bookingIndex = this.bookingIndex + 1;
      this.currentBooking = this.tripBookings[this.bookingIndex];
    }
  }

  previousBooking(){
    if(this.bookingIndex > 0){
      this.bookingIndex = this.bookingIndex - 1;
      this.currentBooking = this.tripBookings[this.bookingIndex];
    }
  }

  toEditBooking(booking: Booking) {
    if (booking.id) {
      this.router.navigate(['main', 'book', 'edit', booking.id]);
    }
  }

  editTrip() {
    
    this.matDialog.open(TripPopoverComponent, {
      data: {
        trucks: this.truckList,
        trip: this.trip,
        truckTrip: this.truckId,
      },
      maxWidth: '500px',
      width: '90vw',
    });
  }

  deleteTrip() {
    if (this.trip && this.trip.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Delete Trip',
            message: `Are you sure you want to delete this trip? All bookings for this trip will also be deleted.`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result === 'Success') {
            // Dispatch action to delete the trip
            this.store.dispatch(CalendarActions.deleteTripStart({
              truckId: this.truckId || '',
              trip: this.trip!
            }));
          }
        })
      ).subscribe();
    }
  }
}
