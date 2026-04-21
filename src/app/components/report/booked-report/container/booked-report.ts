import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { map, Observable, startWith, Subject, take, takeUntil } from 'rxjs';
import { Booking } from '../../../book/model/booking.model';
import { Store } from '@ngrx/store';
import { Season } from '../../../season/models/season.model';
import { assigningTruck, bookings, loading, trucks } from '../../store/report.selectors';
import { selectSeasons } from '../../../main/store/main.selectors';
import * as ReportActions from '../../store/report.actions'
import * as MainActions from '../../../main/store/main.actions'
import { Router } from '@angular/router';
import { Customer } from '../../../customer/model/customer.model';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PrintViewBookedReport } from '../print-view-booked-report/print-view-booked-report';
import { Truck } from '../../../truck/model/truck.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { Trip } from '../../../trip/model/trip.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../../../../shared/popup/popup.component';

export type TempTrip = {
  trip: Trip,
  truck: Truck,
  depDate: FormControl<Date | null>,
  arrivalDate: FormControl<Date | null>,
}

@Component({
  selector: 'app-booked-report',
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInput,
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
  bookingList!: Booking[] | null;
  seasons$!: Observable<Season[]>
  assigningTruck$!: Observable<string | null>;
  activeSeason: Season | null = null;
  assignTrucks = false;
  truckList: Truck[] | null = null;
  trucks$!: Observable<Truck[] | null>
  destroy$ = new Subject<void>();
  typingTruck = new FormControl('');
  filteredOptions!: Observable<Truck[]>;
  temporaryTrips: TempTrip[] = [];
  creatingTripDepartureDate = new FormControl<Date>(new Date());
  creatingTripArrivalDate = new FormControl<Date>(new Date());
  fromTo = new FormControl<string>('');
  currentAssigningTruck: string | null = null;

  constructor(
    private readonly store: Store,
    private readonly cdr: ChangeDetectorRef,
    private readonly snackbar: MatSnackBar,
    private readonly matDialog: MatDialog,
  ) {
    this.loading$ = this.store.select(loading);
    this.bookings$ = this.store.select(bookings);
    this.seasons$ = this.store.select(selectSeasons);
    this.trucks$ = this.store.select(trucks)
    this.assigningTruck$ = this.store.select(assigningTruck)
  }

  ngOnInit() {
    this.store.dispatch(ReportActions.clearBookings());
    this.store.dispatch(ReportActions.getAllTrucks());

    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.activeSeason = seasons.find(s => s.isActive === true) || null;
      if (this.activeSeason) {
        if (this.activeSeason.seasonName === 'Winter') {
          this.fromTo.setValue('NY to FL');
        } else {
          this.fromTo.setValue('FL to NY');
        }
      }
    });

    this.filteredOptions = this.typingTruck.valueChanges.pipe(
      takeUntil(this.destroy$),
      startWith(''),
      map(value => this.filterTruck(value || '')),
    )

    this.assigningTruck$.pipe(takeUntil(this.destroy$)).subscribe((id) => {
      if (id !== null) {
        this.currentAssigningTruck = id;
      } else {
        if (this.currentAssigningTruck) {
          this.temporaryTrips = this.temporaryTrips.filter(t => t.truck.id !== this.currentAssigningTruck);
          this.currentAssigningTruck = null;
          this.cdr.detectChanges();
        }
      }
    })

    this.trucks$.pipe(takeUntil(this.destroy$)).subscribe(trucks => this.truckList = trucks);
    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => { this.bookingList = bookings });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  alreadyAssignedTruck(truck: Truck) {
    if (this.temporaryTrips.length > 0) {
      const tempTrip = this.temporaryTrips.filter(t => t.truck.id?.localeCompare(truck.id ?? '') === 0);
      return tempTrip ? true : false;
    }
    return false;
  }

  assignTruckTemporarily(truck: Truck) {
    let auxList = [];
    let remCarCap = truck.carCapacity;
    let remLoadCap = truck.loadCapacity;
    if (this.bookingList) {
      for (let b of this.bookingList) {
        let auxBooking = b as Booking;
        if (remCarCap && remCarCap > 0) {
          // still have space for another car
          if (!b.truckId && !b.tripId) {
            // if booking is unassigned
            if (!b.customer?.vehicles) {
              this.snackbar.open(
                `Unable to assign the selected truck. ${b.customer?.primaryLastName} has no vehicles`,
                'Close',
                { duration: 5000 }
              );
              return;
            } else {
              if (!remLoadCap) {
                this.snackbar.open(
                  'Unable to assign the selected truck. Selected truck has no remaining load capacity',
                  'Close',
                  { duration: 5000 }
                );
                return;
              } else {
                if (!b.customer?.vehicles[0].weight) {
                  this.snackbar.open(
                    `Unable to assign the selected truck. ${b.customer?.primaryLastName}'s ${b.customer?.vehicles[0].make} has no weight information`,
                    'Close',
                    { duration: 5000 }
                  );
                  return;
                } else {
                  if (b.customer?.vehicles[0].weight > remLoadCap) {
                    this.snackbar.open(
                      `Unable to assign the selected truck. ${b.customer?.primaryLastName}'s ${b.customer?.vehicles[0].make} weight exceed remaining load capacity of the truck`,
                      'Close',
                      { duration: 5000 }
                    );
                    return;
                  } else {
                    auxBooking = { ...b, truckId: truck.id! } as Booking;
                    remCarCap = remCarCap - 1;
                    remLoadCap = remLoadCap - b.customer?.vehicles[0].weight;
                  }
                }
              }
            }
          }
        }
        auxList.push(auxBooking);
      }
      this.bookingList = auxList;
    }
    this.cdr.detectChanges();
    if (remCarCap !== truck.carCapacity) {
      this.temporaryTrips.push({
        trip: {
          arrivalDate: new Date(),
          delayDate: null,
          departureDate: new Date(),
          destination: this.fromTo.value === 'FL to NY' ? 'New York' : 'Florida',
          loadNumber: 0,
          origin: this.fromTo.value === 'FL to NY' ? 'Florida' : 'New York',
          paidBookings: 0,
          remCarCap: remCarCap,
          remLoadCap: remLoadCap,
          season: this.activeSeason ? `${this.activeSeason.seasonName}-${this.activeSeason.year}` : null,
          truckId: truck.id
        } as Trip,
        truck: truck,
        depDate: new FormControl<Date | null>(new Date()),
        arrivalDate: new FormControl<Date | null>(new Date(new Date().getTime() + 86400000)),
      });
      const element = document.getElementById(truck.id ?? '');
      element?.setAttribute('disabled', 'true');
    } else {
      this.snackbar.open(
        'Unable to assign the selected truck. All bookings are assigned or temporarily assigned',
        'Close',
        { duration: 5000 }
      );
    }
  }

  cancelTrip(tempTrip: TempTrip) {
    this.temporaryTrips = this.temporaryTrips.filter(t => t !== tempTrip);
    const auxBookingList: Booking[] = [];
    if (this.bookingList) {
      for (let booking of this.bookingList) {
        if (booking.truckId === tempTrip.truck.id && !booking.tripId) {
          auxBookingList.push({
            ...booking,
            truckId: null,
          } as Booking);
        } else {
          auxBookingList.push(booking);
        }
      }
    }
    this.bookingList = auxBookingList;
    this.cdr.detectChanges();
  }

  confirmCreationOfTrip(tempTrip: TempTrip) {
    const auxTrip = {
      ...tempTrip.trip,
      departureDate: tempTrip.depDate.value,
      arrivalDate: tempTrip.arrivalDate.value,
    } as Trip;
    if (this.activeSeason && this.activeSeason.isCurrent) {
      this.store.dispatch(ReportActions.addTripAndUpdateBookingsStart({ truckId: tempTrip.truck.id!, trip: auxTrip, bookings: this.bookingList ?? [], season: this.activeSeason }));
    } else {
      this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'No current season',
            message: 'Cannot confirm a new trip because the active season is not the current one. Please go and activate the current season or open a new one.',
            cancelButton: 'Ok',
          }
        }

      )
    }

  }

  duplicatedTrip(tempTrip: TempTrip) {
    const trips = this.temporaryTrips.filter(t =>
      t.truck.id === tempTrip.truck.id &&
      this.sameDate(t.depDate.value, tempTrip.depDate.value)
    );
    return trips && trips.length > 1 ? true : false
  }

  filterTruck(value: string) {
    if (this.truckList) {
      return this.truckList.filter(t => t.companyName?.includes(value) || t.truckNumber?.includes(value));
    }
    return [];
  }

  isTruckAlreadyAssigned(truck: Truck): boolean {
    if (this.temporaryTrips && this.temporaryTrips.length > 0) {
      const tempTrip = this.temporaryTrips.find(t => t.truck.id === truck.id);
      return tempTrip ? true : false;
    }
    return false;
  }

  printReport() {
    this.printing = true;
    setTimeout(() => {
      this.printing = false;
    }, 1000)
  }

  sameDate(date1: Date | null, date2: Date | null): boolean {
    if (date1 && date2) {
      const month1 = date1.getMonth();
      const day1 = date1.getDay();
      const year1 = date1.getFullYear();
      const month2 = date2.getMonth();
      const day2 = date2.getDay();
      const year2 = date2.getFullYear();

      return month1 === month2 && day1 === day2 && year1 === year2;
    }
    return false;
  }

  searchRecNo(booking: Booking): string {
    if (booking.customer && booking.customer.vehicles && booking.customer.vehicles.length > 0) {
      return booking.customer.vehicles[0].recNo || '';
    }
    return 'No provided';
  }

  searchResult() {
    if (!this.activeSeason) {
      this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'No active season',
            message: `There is not any active season. Please activate one season to make a search`,
            cancelButton: 'Ok',
          }
        }
      );
      return;
    }

    if (!this.dateRange.value.start || !this.dateRange.value.end) {

      this.dateRange.setErrors({ 'required': true });
      return;
    }
    this.dateRange.setErrors(null);
    if (this.temporaryTrips.length > 0) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Warning',
            message: `You have temporarily trucks assigned that are not confirm yet. A new search will delete this temporarily trucks assignments. Do you want to proceed ?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );

      dialogRef.afterClosed().pipe(
        take(1),
        map(result => {
          switch (result) {
            case 'Success': this.search(); return true;
            case 'Cancel': return true;
            default: return true;
          }
        }))
    } else {
      this.search();
    }
  }

  search() {
    const origin = this.fromTo.value === 'FL to NY' ? 'Florida' : 'New York'
    this.store.dispatch(ReportActions.loadBookingsStart({
      start: this.dateRange.value.start!,
      end: this.dateRange.value.end!,
      season: this.activeSeason!,
      origin: origin,
    }));
  }

  truckCompanyName(truckId: string | null): string {
    if (truckId && this.truckList) {
      return this.truckList.find(t => t.id?.localeCompare(truckId) === 0)?.companyName ?? '';
    }
    return ''
  }

  vehicleMake(customer: Customer): string {
    if (customer.vehicles) {
      return customer.vehicles[0].make || 'No provided';
    }
    return 'No provided';
  }

  vehicleModel(customer: Customer): string {
    if (customer.vehicles) {
      return customer.vehicles[0].model || 'No provided';
    }
    return 'No provided';
  }
}
