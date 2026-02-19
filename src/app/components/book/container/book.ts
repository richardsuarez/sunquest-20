import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Address, Customer } from '../../customer/model/customer.model';
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
import * as MainSelectors from '../../main/store/main.selectors';
import { Booking } from '../model/booking.model';
import { AllowOnlyNumbersDirective } from '../../../shared/directives/allow-only-numbers.directive';
import { AllowAlphanumericDirective } from '../../../shared/directives/allow-alphanumeric.directive';
import { Season } from '../../season/models/season.model';
import { selectIsMobile } from '../../main/store/main.selectors';

@Component({
  selector: 'app-book-edit',
  standalone: true,
  imports: [
    AllowAlphanumericDirective,
    AllowOnlyNumbersDirective,
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
  templateUrl: './book.html',
  styleUrls: ['./book.css'],
  providers: [provideNativeDateAdapter()],
})
export class Book implements OnInit, OnDestroy {
  private store = inject(Store);
  public router = inject(Router);
  private snackBar = inject(MatSnackBar);
  customer$!: Observable<Customer | null>;
  truckList$!: Observable<Truck[]>;
  tripsMap$!: Observable<{ [truckId: string]: Trip[] }>;
  trips: { [truckId: string]: Trip[] } = {};
  truckList: Truck[] = [];
  currentCustomer: Customer | null = null;
  private requestedTrips = new Set<string>();
  isMobile$!: Observable<boolean>;
  savingBooking$!: Observable<boolean>;
  destroy$ = new Subject<void>()
  currentSelectedTrip: Trip | null = null;
  currentSelectedTruckId: string | null = null;
  today = new Date();
  tomorrow = new Date(this.today.getTime() + 86400000);
  dayAfterTomorrow = new Date(this.today.getTime() + 172800000);
  arrivalAddress: Address | null = null;
  arrivalAt: Date = new Date();
  pickupAddress: Address | null = null;
  pickupAt!: Date;
  crud = '';
  isMadeChange = false;

  bookingVM$!: Observable<Booking | null>;

  vehicleSelection: { [id: string]: boolean } = {};
  vehiclesProperties = ['checkbox', 'year', 'make', 'model', 'plate', 'state', 'weight'];

  // Trip table column definitions
  truckColumns = ['truckNumber', 'trips'];
  tripColumns = ['checkbox', 'loadNumber', 'departureDate', 'origin', 'destination', 'remLoadCap', 'remCarCap'];

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
    amount: new FormControl<number | null>(0),
    origin: new FormControl<string | null>(null),
    destination: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null),
  });

  deliveryAddressForm = new FormGroup({
    address1: new FormControl<string | null>(null),
    address2: new FormControl<string | null>(null),
    bldg: new FormControl<string | null>(null),
    apt: new FormControl<string | null>(null),
    city: new FormControl<string | null>(null),
    state: new FormControl<string | null>(null),
    zipCode: new FormControl<string | null>(null),
  });

  pickupAddressForm = new FormGroup({
    address1: new FormControl<string | null>(null),
    address2: new FormControl<string | null>(null),
    bldg: new FormControl<string | null>(null),
    apt: new FormControl<string | null>(null),
    city: new FormControl<string | null>(null),
    state: new FormControl<string | null>(null),
    zipCode: new FormControl<string | null>(null),
  });

  activeSeason: Season | null = null;
  seasons$!: Observable<Season[]>;
  originalBooking: Booking | null = null;
  originalTrip: Trip | null = null;
  originalTruckId: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly matDialog: MatDialog,
  ) {
    this.customer$ = this.store.select(MainSelectors.customerViewModel);
    // select trucks from the truck feature (not the book feature)
    this.truckList$ = this.store.select(trucks);
    this.savingBooking$ = this.store.select(savingBooking);
    this.tripsMap$ = this.store.select(sortedTripsMap);
    this.bookingVM$ = this.store.select(MainSelectors.bookingVM);
    this.seasons$ = this.store.select(MainSelectors.selectSeasons);
    this.isMobile$ = this.store.select(selectIsMobile);
  }

  async ngOnInit() {
    this.crud = this.route.snapshot.paramMap.get('crud') ?? '';

    // ask truck feature to load truck list
    this.store.dispatch(getTruckListStart());

    this.customer$.pipe(takeUntil(this.destroy$)).subscribe(customer => {
      this.currentCustomer = customer;
      if (customer) {
        if (customer.DocumentID && !customer.vehicles) {
          this.store.dispatch(getVehiclesStart({ customerId: customer.DocumentID }));
        }
        if (customer.vehicles) {
          customer.vehicles.forEach(v => {
            if (v.id) {
              this.vehicleSelection[v.id] = false;
            }
          });
        }
      }

      if (!customer) {
        console.log('No customer found, navigating back to customer list');
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
            if (this.activeSeason) {
              this.store.dispatch(BookActions.loadTripsStart({ truckId: t.id, season: this.activeSeason }));
            }
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
      });

    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.activeSeason = seasons.find(s => s.isActive) || null;
      if (this.activeSeason && this.truckList && this.truckList.length > 0) {
        this.truckList.forEach(t => {
          if (t.id && this.activeSeason) {
            this.store.dispatch(BookActions.loadTripsStart({ truckId: t.id, season: this.activeSeason }));
          }
        });
      }
    });

    this.tripsMap$.pipe(takeUntil(this.destroy$)).subscribe((tripMap) => {
      this.trips = tripMap;
      if (this.originalBooking && this.originalBooking.truckId && this.trips[this.originalBooking.truckId]) {
          for (const trip of this.trips[this.originalBooking.truckId]) {
            if (trip.id === this.originalBooking.tripId) {
              this.originalTrip = trip;
              this.originalTruckId = this.originalBooking.truckId;
              this.currentSelectedTrip = trip;
              this.currentSelectedTruckId = this.originalBooking.truckId;
              break;
            }
          }
        }
    });

    this.tripForm.controls.truckId.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((truckId) => {
      this.onSelectTruck(truckId);
    })

    this.bookingVM$.pipe(takeUntil(this.destroy$)).subscribe((booking) => {
      if (booking) {
        this.originalBooking = booking;
        this.form.controls.checkNumber.setValue(booking.paycheck?.checkNumber || null);
        this.form.controls.bankName.setValue(booking.paycheck?.bankName || null);
        this.form.controls.amount.setValue(booking.paycheck?.amount || 0);
        this.form.controls.origin.setValue(booking.from || null);
        this.form.controls.destination.setValue(booking.to || null);
        this.form.controls.notes.setValue(booking.notes || null);

        this.arrivalAt = booking.arrivalAt || new Date();
        this.pickupAt = booking.pickupAt || new Date();
        this.currentSelectedTruckId = booking.truckId || null;
        this.arrivalAddress = booking.arrivalAddress || null;
        this.pickupAddress = booking.pickupAddress || null;
        if (this.arrivalAddress) {
          this.deliveryAddressForm.patchValue(this.arrivalAddress);
        }
        if (this.pickupAddress) {
          this.pickupAddressForm.patchValue(this.pickupAddress);
        }
        if (booking.vehicleIds) {
          booking.vehicleIds.forEach(id => {
            this.vehicleSelection[id] = true;
          });
        }

        if (booking.truckId && this.trips[booking.truckId]) {
          for (const trip of this.trips[booking.truckId]) {
            if (trip.id === booking.tripId) {
              this.originalTrip = trip;
              this.originalTruckId = booking.truckId;
              this.currentSelectedTrip = trip;
              this.currentSelectedTruckId = booking.truckId;
              break;
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTrip() {
    if (!this.activeSeason) return;

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
        season: `${this.activeSeason.seasonName}-${this.activeSeason.year}`,
      }
    }));

    // Reset form after submission
    this.tripForm.reset();
  }

  allTripsAreUpcoming(trips: Trip[]) {
    if (trips.length === 0) return false;
    const now = new Date();
    let aux = true;
    trips.forEach((t) => {
      if (t.departureDate > now) {
        aux = false;
      }
    });
    return aux;
  }

  areSelectedVehicles(): boolean {
    return Object.values(this.vehicleSelection).some(selected => selected);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // only show the popup if the user modifies any fields AND DISCREPANCY VIEW MODAL IN STATE IS NOT NULL 
    // when discrepancyViewModel is null means user SUBMITS form for add/edit discrepancy and we won't show popup message when submit
    if ((this.tripForm && !this.tripForm.pristine) || (this.form && !this.form.pristine) || this.isMadeChange) {
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

  clickOnCheckbox(trip: Trip, truckId: string) {
    this.isMadeChange = true;
    const routeOrigin = this.form.controls.origin.value;
    if (routeOrigin && routeOrigin !== trip.origin) {
      this.snackBar.open(`Selected trip origin (${trip.origin}) does not match route origin (${routeOrigin})`, 'Close', { duration: 5000 });
    } else if (trip.remCarCap < Object.values(this.vehicleSelection).length) {
      this.snackBar.open(`Selected trip only allows ${trip.remCarCap} more vehicle(s)`, 'Close', { duration: 5000 });
    } else if (trip.remLoadCap < this.selectedVehiclesLoad()) {
      this.snackBar.open(`Selected trip does not have enough load capacity`, 'Close', { duration: 5000 });
    } else if (this.arrivalAt && trip.departureDate > this.arrivalAt) {
      this.snackBar.open(`Selected trip departs after the desired arrival date`, 'Close', { duration: 5000 });
    } else if (this.pickupAt && trip.departureDate < this.pickupAt) {
      this.snackBar.open(`Selected trip departs before the desired pickup date`, 'Close', { duration: 5000 });
    } else {
      // if user checks the checkbox then this currentSelectedTrip = trip, 
      // if user unchecks the checkbox then currentSelectedTrip = null
      if (this.currentSelectedTrip?.id === trip.id) {
        this.currentSelectedTrip = null;
        this.currentSelectedTruckId = null;
      } else {
        this.currentSelectedTrip = trip;
        this.currentSelectedTruckId = truckId;
      }
    }
  }

  crudTitle() {
    return this.crud === 'new' ? 'New' : 'Edit';
  }

  navigateBack() {
    this.router.navigate(['main/customer'])
  }

  nextTrips(trips: any[]) {
    const now = new Date();
    return trips.filter(t => t.departureDate >= now);
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

    const arrivalAt = this.arrivalAt || new Date();
    const pickupAt = this.pickupAt || new Date();
    const booking = {
      id: this.originalBooking? this.originalBooking.id : undefined,
      customer: this.currentCustomer,
      vehicleIds: selectedVehicleIds,
      paycheck: {
        checkNumber: this.form.controls.checkNumber.value,
        bankName: this.form.controls.bankName.value,
        amount: this.form.controls.amount.value || 0,
      },
      arrivalAt,
      arrivalAddress: this.deliveryAddressForm.getRawValue(),
      arrivalWeekOfYear: this.weekNumber(arrivalAt),
      pickupAt,
      pickupAddress: this.pickupAddressForm.getRawValue(),
      pickupWeekOfYear: this.weekNumber(pickupAt),
      from: this.form.controls.origin.value,
      to: this.form.controls.destination.value,
      departureDate: this.currentSelectedTrip ? this.currentSelectedTrip.departureDate : null,
      tripId: this.currentSelectedTrip ? this.currentSelectedTrip.id : null,
      truckId: this.currentSelectedTruckId,
      notes: this.form.controls.notes.value,
      createdAt: new Date(),
      season: this.activeSeason ? `${this.activeSeason.seasonName}-${this.activeSeason.year}` : null,
    };

    // dispatch booking action — effect will persist and handle snackbar/navigation
    if (this.crud === 'new') {
      this.store.dispatch(BookActions.addBookingStart({ booking, trip: this.currentSelectedTrip }));
    } else {
      if (this.originalTrip && this.currentSelectedTrip) {
        if (this.originalTrip.id !== this.currentSelectedTrip.id) {
          // if user changes trip, then we need to update the original trip and then update new trip
          this.updateOriginalTrip();
          this.updateCurrentTrip(booking); 
        }
      } else {
        // if user unselects the original trip and does not select any, then we need to update the original trip capacity by adding back the booked load and cars
        if(this.originalTrip && !this.currentSelectedTrip) {
          this.updateOriginalTrip();
        } else {
          // if user selects a new trip without having an original trip, then we just need to update the new trip capacity by subtracting the booked load and cars
          this.updateCurrentTrip(booking); 
        }
      }
      // whatever the case, we always update the booking info because user might change other booking info without changing trip (e.g. change notes or change check number, etc..)
           
      this.store.dispatch(BookActions.updateBookingStart({ booking }));
    }

    this.tripForm.reset();
    this.form.reset();
    this.currentSelectedTrip = null;
    this.vehicleSelection = {};
    this.isMadeChange = false;
  }

  private updateOriginalTrip() {
    if (this.originalTrip) {
      let originalBookingVehicleLoad = 0;
      if (this.originalBooking && this.originalBooking.vehicleIds) {
        originalBookingVehicleLoad = this.originalBooking.vehicleIds.reduce((totalLoad, vehicleId) => {
          const vehicle = this.originalBooking?.customer?.vehicles?.find(v => v.id === vehicleId);
          return totalLoad + (vehicle?.weight || 0);
        }, 0);
      }
      const originalTripForUpdate = {
        ...this.originalTrip,
        remLoadCap: this.originalTrip.remLoadCap + originalBookingVehicleLoad,
        remCarCap: this.originalTrip.remCarCap + (this.originalBooking?.vehicleIds?.length || 0)
      }
      this.store.dispatch(BookActions.updateTripStart({ truckId: this.originalTruckId!, trip: originalTripForUpdate }));
    }
  }

  private updateCurrentTrip(booking: Partial<Booking>) {
    if (this.currentSelectedTrip) {
      let currentBookingVehicleLoad = 0;
      if (booking && booking.vehicleIds) {
        currentBookingVehicleLoad = booking.vehicleIds.reduce((totalLoad, vehicleId) => {
          const vehicle = booking?.customer?.vehicles?.find(v => v.id === vehicleId);
          return totalLoad + (vehicle?.weight || 0);
        }, 0);
      }
      const currentTripForUpdate = {
        ...this.currentSelectedTrip,
        remLoadCap: this.currentSelectedTrip.remLoadCap - currentBookingVehicleLoad,
        remCarCap: this.currentSelectedTrip.remCarCap - (booking.vehicleIds?.length || 0)
      }
      this.store.dispatch(BookActions.updateTripStart({ truckId: this.currentSelectedTruckId!, trip: currentTripForUpdate }));
    }
  }

  onSelectTruck(truckId: string | null) {
    // Calculate the next load number for the selected truck
    if (truckId) {
      const trips = this.trips[truckId!];
      let highestLoadNumber = 0;
      trips.forEach(t => {
        if (Number.parseInt(t.loadNumber) > highestLoadNumber) {
          highestLoadNumber = Number.parseInt(t.loadNumber);
        }
      });
      highestLoadNumber += 1;
      this.tripForm.controls.loadNumber.setValue(highestLoadNumber.toString());
    }
  }

  selectableTrip(trip: Trip): boolean {
    if ((this.form.controls.origin.value && trip.origin !== this.form.controls.origin.value) ||
      (this.arrivalAt && trip.departureDate > this.arrivalAt) ||
      (this.pickupAt && trip.departureDate < this.pickupAt) ||
      (this.vehicleSelection && Object.values(this.vehicleSelection).filter(v => v).length > trip.remCarCap) ||
      (this.vehicleSelection && this.selectedVehiclesLoad() > trip.remLoadCap)) {
      return false;
    }
    return true;
  }

  selectedVehiclesLoad(): number {
    let totalLoad = 0;
    Object.keys(this.vehicleSelection).forEach(id => {
      if (this.vehicleSelection[id] && this.currentCustomer && this.currentCustomer.vehicles) {
        const vehicle = this.currentCustomer.vehicles.find(v => v.id === id);
        if (vehicle) {
          totalLoad += vehicle.weight || 0;
        }
      }
    });
    return totalLoad;
  }

  toggleVehicle(id: string) {
    this.vehicleSelection[id] = !this.vehicleSelection[id];
  }

  updateRouteOrigin(event?: any) {
    if (this.form.controls.destination.value === 'Florida') {
      this.form.controls.origin.setValue('New York');
      if (this.currentCustomer && this.currentCustomer.newYorkAddress) {
        this.pickupAddressForm.controls.address1.setValue(this.currentCustomer.newYorkAddress.address1);
        this.pickupAddressForm.controls.address2.setValue(this.currentCustomer.newYorkAddress.address2);
        this.pickupAddressForm.controls.bldg.setValue(this.currentCustomer.newYorkAddress.bldg);
        this.pickupAddressForm.controls.apt.setValue(this.currentCustomer.newYorkAddress.apt);
        this.pickupAddressForm.controls.city.setValue(this.currentCustomer.newYorkAddress.city);
        this.pickupAddressForm.controls.state.setValue(this.currentCustomer.newYorkAddress.state);
        this.pickupAddressForm.controls.zipCode.setValue(this.currentCustomer.newYorkAddress.zipCode);
      }

      if (this.currentCustomer && this.currentCustomer.floridaAddress) {
        this.deliveryAddressForm.controls.address1.setValue(this.currentCustomer.floridaAddress.address1);
        this.deliveryAddressForm.controls.address2.setValue(this.currentCustomer.floridaAddress.address2);
        this.deliveryAddressForm.controls.bldg.setValue(this.currentCustomer.floridaAddress.bldg);
        this.deliveryAddressForm.controls.apt.setValue(this.currentCustomer.floridaAddress.apt);
        this.deliveryAddressForm.controls.city.setValue(this.currentCustomer.floridaAddress.city);
        this.deliveryAddressForm.controls.state.setValue(this.currentCustomer.floridaAddress.state);
        this.deliveryAddressForm.controls.zipCode.setValue(this.currentCustomer.floridaAddress.zipCode);
      }
    } else if (this.form.controls.destination.value === 'New York') {
      this.form.controls.origin.setValue('Florida');
      if (this.currentCustomer && this.currentCustomer.floridaAddress) {
        this.pickupAddressForm.controls.address1.setValue(this.currentCustomer.floridaAddress.address1);
        this.pickupAddressForm.controls.address2.setValue(this.currentCustomer.floridaAddress.address2);
        this.pickupAddressForm.controls.bldg.setValue(this.currentCustomer.floridaAddress.bldg);
        this.pickupAddressForm.controls.apt.setValue(this.currentCustomer.floridaAddress.apt);
        this.pickupAddressForm.controls.city.setValue(this.currentCustomer.floridaAddress.city);
        this.pickupAddressForm.controls.state.setValue(this.currentCustomer.floridaAddress.state);
        this.pickupAddressForm.controls.zipCode.setValue(this.currentCustomer.floridaAddress.zipCode);
      }

      if (this.currentCustomer && this.currentCustomer.newYorkAddress) {
        this.deliveryAddressForm.controls.address1.setValue(this.currentCustomer.newYorkAddress.address1);
        this.deliveryAddressForm.controls.address2.setValue(this.currentCustomer.newYorkAddress.address2);
        this.deliveryAddressForm.controls.bldg.setValue(this.currentCustomer.newYorkAddress.bldg);
        this.deliveryAddressForm.controls.apt.setValue(this.currentCustomer.newYorkAddress.apt);
        this.deliveryAddressForm.controls.city.setValue(this.currentCustomer.newYorkAddress.city);
        this.deliveryAddressForm.controls.state.setValue(this.currentCustomer.newYorkAddress.state);
        this.deliveryAddressForm.controls.zipCode.setValue(this.currentCustomer.newYorkAddress.zipCode);
      }
    }
  }

  updateRouteDestination(event: any) {
    if (this.form.controls.origin.value === 'Florida') {
      this.form.controls.destination.setValue('New York');
      if (this.currentCustomer && this.currentCustomer.newYorkAddress) {
        this.deliveryAddressForm.controls.address1.setValue(this.currentCustomer.newYorkAddress.address1);
        this.deliveryAddressForm.controls.address2.setValue(this.currentCustomer.newYorkAddress.address2);
        this.deliveryAddressForm.controls.bldg.setValue(this.currentCustomer.newYorkAddress.bldg);
        this.deliveryAddressForm.controls.apt.setValue(this.currentCustomer.newYorkAddress.apt);
        this.deliveryAddressForm.controls.city.setValue(this.currentCustomer.newYorkAddress.city);
        this.deliveryAddressForm.controls.state.setValue(this.currentCustomer.newYorkAddress.state);
        this.deliveryAddressForm.controls.zipCode.setValue(this.currentCustomer.newYorkAddress.zipCode);
      }

      if (this.currentCustomer && this.currentCustomer.floridaAddress) {
        this.pickupAddressForm.controls.address1.setValue(this.currentCustomer.floridaAddress.address1);
        this.pickupAddressForm.controls.address2.setValue(this.currentCustomer.floridaAddress.address2);
        this.pickupAddressForm.controls.bldg.setValue(this.currentCustomer.floridaAddress.bldg);
        this.pickupAddressForm.controls.apt.setValue(this.currentCustomer.floridaAddress.apt);
        this.pickupAddressForm.controls.city.setValue(this.currentCustomer.floridaAddress.city);
        this.pickupAddressForm.controls.state.setValue(this.currentCustomer.floridaAddress.state);
        this.pickupAddressForm.controls.zipCode.setValue(this.currentCustomer.floridaAddress.zipCode);
      }
    } else if (this.form.controls.origin.value === 'New York') {
      this.form.controls.destination.setValue('Florida');
      if (this.currentCustomer && this.currentCustomer.floridaAddress) {
        this.deliveryAddressForm.controls.address1.setValue(this.currentCustomer.floridaAddress.address1);
        this.deliveryAddressForm.controls.address2.setValue(this.currentCustomer.floridaAddress.address2);
        this.deliveryAddressForm.controls.bldg.setValue(this.currentCustomer.floridaAddress.bldg);
        this.deliveryAddressForm.controls.apt.setValue(this.currentCustomer.floridaAddress.apt);
        this.deliveryAddressForm.controls.city.setValue(this.currentCustomer.floridaAddress.city);
        this.deliveryAddressForm.controls.state.setValue(this.currentCustomer.floridaAddress.state);
        this.deliveryAddressForm.controls.zipCode.setValue(this.currentCustomer.floridaAddress.zipCode);
      }

      if (this.currentCustomer && this.currentCustomer.newYorkAddress) {
        this.pickupAddressForm.controls.address1.setValue(this.currentCustomer.newYorkAddress.address1);
        this.pickupAddressForm.controls.address2.setValue(this.currentCustomer.newYorkAddress.address2);
        this.pickupAddressForm.controls.bldg.setValue(this.currentCustomer.newYorkAddress.bldg);
        this.pickupAddressForm.controls.apt.setValue(this.currentCustomer.newYorkAddress.apt);
        this.pickupAddressForm.controls.city.setValue(this.currentCustomer.newYorkAddress.city);
        this.pickupAddressForm.controls.state.setValue(this.currentCustomer.newYorkAddress.state);
        this.pickupAddressForm.controls.zipCode.setValue(this.currentCustomer.newYorkAddress.zipCode);
      }
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

