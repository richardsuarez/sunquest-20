import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { customerViewModel } from '../../customer/store/customer.selectors';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer } from '../../customer/model/customer.model';
import { getTruckListStart } from '../store/book.actions';
import { getVehiclesStart } from '../../customer/store/customer.actions';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTimepickerModule, MatTimepickerToggle } from '@angular/material/timepicker';
import { map, merge, Observable, Subject, takeUntil } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { savingBooking, sortedTripsMap, trucks } from '../store/book.selectors';
import { Trip } from '../../trip/model/trip.model';
import { Store } from '@ngrx/store';
import { Truck } from '../../truck/model/truck.model';

import * as BookActions from '../store/book.actions';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDatepickerToggle,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInput,
    MatLabel,
    MatListModule,
    MatOption,
    MatSelectModule,
    MatProgressSpinner,
    MatTableModule,
    MatTimepickerModule,
    MatTimepickerToggle,
    ReactiveFormsModule,
  ],
  templateUrl: './book-edit.html',
  styleUrls: ['./book-edit.css'],
  providers: [provideNativeDateAdapter()],
})
export class BookEdit implements OnInit {
  private store = inject(Store);
  public router = inject(Router);
  private snackBar = inject(MatSnackBar);
  customer$!: Observable<Customer | null>;
  truckList$!: Observable<Truck[]>;
  tripsMap$!: Observable<{ [truckId: string]: Trip[] }>;
  truckList: Truck[] = [];
  currentCustomer: Customer | null = null;
  private requestedTrips = new Set<string>();
  isMobile!: boolean;
  savingBooking$!: Observable<boolean>;
  destroy$ = new Subject<void>()
  currentSelectedTrip: Trip | null = null;
  currentSelectedTruckId: string | null = null;
  today = new Date();
  tomorrow = new Date(this.today.getTime() + 86400000)
  dayAfterTomorrow = new Date(this.today.getTime() + 172800000)
  arrivalAt: Date = new Date();
  pickupAt!:Date;
  crud = '';

  vehicleSelection: { [id: string]: boolean } = {};
  vehiclesProperties = ['checkbox', 'year', 'make', 'model', 'plate', 'state', 'weight'];

  // Trip table column definitions
  truckColumns = ['truckNumber', 'trips'];
  tripColumns = ['checkbox', 'loadNumber', 'departureDate', 'delayDate', 'week', 'origin', 'destination', 'remLoadCap', 'remCarCap'];

  // Form for adding new trips
  tripForm = new FormGroup({
    truckId: new FormControl<string>('', [Validators.required]),
    loadNumber: new FormControl<string>('', [Validators.required]),
    departureDate: new FormControl<Date | null>(this.tomorrow, [Validators.required]),
    arrivalDate: new FormControl<Date | null>(this.dayAfterTomorrow, [Validators.required]),
    origin: new FormControl<string>('', [Validators.required]),
    destination: new FormControl<string>('', [Validators.required]),
  });

  form = new FormGroup({
    checkNumber: new FormControl<string | null>(null),
    bankName: new FormControl<string | null>(null),
    amount: new FormControl<number | null>(1200, [Validators.required]),
    origin: new FormControl<string | null>(null),
    destination: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null),
  });

  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly route: ActivatedRoute,
    private readonly matDialog: MatDialog,
  ) {
    this.customer$ = this.store.select(customerViewModel);
    // select trucks from the truck feature (not the book feature)
    this.truckList$ = this.store.select(trucks);
    this.savingBooking$ = this.store.select(savingBooking);
    this.tripsMap$ = this.store.select(sortedTripsMap);
  }

  ngOnInit() {
    this.crud = this.route.snapshot.paramMap.get('crud') ?? '';
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    // ask truck feature to load truck list
    this.store.dispatch(getTruckListStart());

    this.customer$.pipe(takeUntil(this.destroy$)).subscribe(customer => {
      this.currentCustomer = customer;
      if (customer && customer.DocumentID && !customer.vehicles) {
        this.store.dispatch(getVehiclesStart({ customerId: customer.DocumentID }));
        // initialize vehicle selection
      }
      if (customer && customer.vehicles) {
        customer.vehicles.forEach(v => {
          if (v.id) {
            this.vehicleSelection[v.id] = false;
          }
        });
      }
      if (!customer) {
        this.router.navigate(['main/customer/']);
      }
    });

    this.truckList$.pipe(takeUntil(this.destroy$)).subscribe(trucks => {
      trucks.forEach(t => {
        if (t.id) {
          // dispatch load trips for trucks that don't have trips yet
          // and that we haven't already requested during this component lifecycle
          if (!this.requestedTrips.has(t.id)) {
            this.requestedTrips.add(t.id);
            this.store.dispatch(BookActions.loadTripsStart({ truckId: t.id }));
          }
        }
      });
      // keep a local copy for helper lookups (used when adding trip)
      this.truckList = trucks;
    });

    merge(this.tripForm.controls.departureDate.valueChanges, this.tripForm.controls.arrivalDate.valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkDateValidation()
      })
  }

  addTrip() {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const tripData = this.tripForm.value;
    if (!tripData.truckId) {
      this.snackBar.open('Please select a truck', 'Close', { duration: 5000 });
      return;
    }
    const truck = this.truckList.find(t => t.id === tripData.truckId);

    this.store.dispatch(BookActions.addTripStart({
      truckId: tripData.truckId,
      trip: {
        loadNumber: tripData.loadNumber || '',
        departureDate: tripData.departureDate || new Date(),
        arrivalDate: tripData.arrivalDate || new Date(),
        origin: tripData.origin || '',
        destination: tripData.destination || '',
        remLoadCap: truck?.loadCapacity || 0,
        remCarCap: truck?.carCapacity || 0,
        delayDate: null,
      }
    }));

    // Reset form after submission
    this.tripForm.reset();
  }

  areSelectedVehicles(): boolean {
    return Object.values(this.vehicleSelection).some(selected => selected);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
      // only show the popup if the user modifies any fields AND DISCREPANCY VIEW MODAL IN STATE IS NOT NULL 
      // when discrepancyViewModel is null means user SUBMITS form for add/edit discrepancy and we won't show popup message when submit
      if ((this.tripForm && !this.tripForm.pristine) || (this.form && !this.form.pristine) || this.currentSelectedTrip || Object.values(this.vehicleSelection).some(selected => selected)) {
        const dialogRef = this.matDialog.open(
          PopupComponent,
          {
            data: {
              title: 'Save Changes',
              message: 'Are you sure you want to leave? Your changes will not be saved',
              cancelButton: 'Discard',
              successButton: 'Save',
            }
          }
        );
        return dialogRef.afterClosed().pipe(
          takeUntil(this.destroy$),
          map(result => {
            switch (result) {
              case 'Success': this.save(); return false;
              case 'Cancel': return true;
              default: return false;
            }  // allow navigation if the user click discard button or click outside modal
          }))
      }
      return true;
    }

  private checkDateValidation() {
    const depDate = this.tripForm.controls.departureDate.value
    const arrDate = this.tripForm.controls.arrivalDate.value
    if (depDate && arrDate) {
      if (depDate > arrDate) {
        this.tripForm.controls.departureDate.setErrors({ 'wrongDate': true })
        this.tripForm.controls.departureDate.markAsTouched();
        this.tripForm.controls.arrivalDate.setErrors({ 'wrongDate': true })
        this.tripForm.controls.arrivalDate.markAsTouched();
      } else {
        this.tripForm.controls.departureDate.setErrors(null)
        this.tripForm.controls.departureDate.markAsTouched();
        this.tripForm.controls.arrivalDate.setErrors(null)
        this.tripForm.controls.arrivalDate.markAsTouched();
      }
    }
  }

  clickOnDisabledCheckbox(trip: Trip) {
    const routeOrigin = this.form.controls.origin.value
    if (routeOrigin && routeOrigin !== trip.origin) {
      this.snackBar.open(`Selected trip origin (${trip.origin}) does not match route origin (${routeOrigin})`, 'Close', { duration: 5000 });
      return;
    }
  }

  crudTitle() {
    return this.crud === 'new' ? 'New' : 'Edit';
  }

  navigateBack() {
    this.router.navigate(['main/customer'])
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedVehicleIds = Object.keys(this.vehicleSelection).filter(k => this.vehicleSelection[k]);

    if (selectedVehicleIds.length === 0) {
      this.snackBar.open('Please select at least one vehicle to book', 'Close', { duration: 5000 });
      return;
    }

    if(!this.currentSelectedTrip){
      this.snackBar.open('Please select a trip to book', 'Close', { duration: 5000 });
      return;
    }

    const arrivalAt = this.arrivalAt || new Date();
    const pickupAt = this.pickupAt || new Date();
    const booking = {
      customer: this.currentCustomer,
      vehicleIds: selectedVehicleIds,
      paycheck: {
        checkNumber: this.form.controls.checkNumber.value,
        bankName: this.form.controls.bankName.value,
        amount: this.form.controls.amount.value || 1200,
      },
      arrivalAt,
      arrivalWeekOfYear: this.weekNumber(arrivalAt),
      pickupAt,
      pickupWeekOfYear: this.weekNumber(pickupAt),
      from: this.form.controls.origin.value,
      to: this.form.controls.destination.value,
      truckId: this.currentSelectedTruckId,
      tripId: this.currentSelectedTrip ? this.currentSelectedTrip.id : null,
      notes: this.form.controls.notes.value,
      createdAt: new Date()
    };             

    // dispatch booking action — effect will persist and handle snackbar/navigation
    this.store.dispatch(BookActions.addBookingStart({ booking, trip: this.currentSelectedTrip }));
  }

  selectableTrip(trip: Trip): boolean {
    if(this.form.controls.origin.value && trip.origin !== this.form.controls.origin.value){
      return false;
    }
    if(this.arrivalAt && trip.departureDate > this.arrivalAt ){
      return false;
    }
    return true;
  }

  toggleVehicle(id: string) {
    this.vehicleSelection[id] = !this.vehicleSelection[id];
  }

  updateRouteOrigin(event?: any) {
    if (this.form.controls.destination.value === 'Florida') {
      this.form.controls.origin.setValue('New York');
    } else if (this.form.controls.destination.value === 'New York') {
      this.form.controls.origin.setValue('Florida');
    }
  }

  updateRouteDestination(event: any) {
    if (this.form.controls.origin.value === 'Florida') {
      this.form.controls.destination.setValue('New York');
    } else if (this.form.controls.origin.value === 'New York') {
      this.form.controls.destination.setValue('Florida');
    }
  }

  updateTripOrigin(event?: any) {
    if (this.tripForm.controls.destination.value === 'Florida') {
      this.tripForm.controls.origin.setValue('New York');
    } else if (this.tripForm.controls.destination.value === 'New York') {
      this.tripForm.controls.origin.setValue('Florida');
    }
  }

  updateTripDestination(event: any) {
    if (this.tripForm.controls.origin.value === 'Florida') {
      this.tripForm.controls.destination.setValue('New York');
    } else if (this.tripForm.controls.origin.value === 'New York') {
      this.tripForm.controls.destination.setValue('Florida');
    }
  }
  weekNumber(date: Date | null): number {
    if (!date) {
      return 0;
    }
    const yearStart = new Date(date.getFullYear(), 0, 1); // Jan 1st, of the year given
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 604800000));
  }
}

