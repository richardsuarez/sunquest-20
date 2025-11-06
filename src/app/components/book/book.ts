import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { customerViewModel } from '../customer/store/customer.selectors';
import * as BookActions from './store/book.actions';
import { getVehiclesStart } from '../customer/store/customer.actions';
import { trucks as trucksSelector, savingBooking as savingBookingSelector } from './store/book.selectors';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Truck } from '../truck/model/truck.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatTimepickerModule, MatTimepickerToggle } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Vehicle } from '../customer/model/customer.model';
import { getTruckListStart } from '../truck/store/truck.actions';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    FormsModule,
    MatLabel,
    MatInput,
    MatSelectModule,
    MatOption,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDatepickerToggle,
    MatListModule,
    MatIconModule,
    MatTableModule,
    MatTimepickerModule,
    MatTimepickerToggle
  ],
  templateUrl: './book.html',
  styleUrls: ['./book.css'],
  providers: [provideNativeDateAdapter()],
})
export class Book implements OnInit {
  private store = inject(Store);
  public router = inject(Router);
  private snackBar = inject(MatSnackBar);
  isMobile!: boolean;
  customer$ = this.store.select(customerViewModel);
  trucks$!: Observable<Truck[]>;
  savingBooking$!: Observable<boolean>;
  destroy$ = new Subject<void>()
  weekOfYear: number = 0;

  vehicleSelection: { [id: string]: boolean } = {};
  vehiclesProperties = ['checkbox', 'year', 'make', 'model', 'plate', 'state', 'weight'];

  form = new FormGroup({
    floridaInstructions: new FormControl<string | null>(null),
    newYorkInstructions: new FormControl<string | null>(null),
    checkNumber: new FormControl<string | null>(null),
    bankName: new FormControl<string | null>(null),
    amount: new FormControl<number | null>(1200, [Validators.required]),
    arrivalAt: new FormControl<Date | null>(null, [Validators.required]), // ISO datetime
    origin: new FormControl<string | null>(null),
    destination: new FormControl<string | null>(null),
    truckId: new FormControl<string | null>(null),
    truckDeparture: new FormControl<string | null>(null),
    truckArrival: new FormControl<string | null>(null),
  });

  constructor(
    private readonly breakpoints: BreakpointObserver,
  ) {
    // load trucks via actions/effects
    this.trucks$ = this.store.select(trucksSelector as any);
    this.savingBooking$ = this.store.select(savingBookingSelector as any);
  this.store.dispatch(getTruckListStart());
  }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    this.customer$.pipe(takeUntil(this.destroy$)).subscribe(customer => {
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
      if(!customer){
        this.router.navigate(['main/customer/']);
      }
    });

    this.form.controls.arrivalAt.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(date => {
      if (date) {
        this.weekOfYear = this.weekNumber(date);
        // we could set a form control for weekOfYear if needed
      } 
    });
  }

  toggleVehicle(id: string) {
    this.vehicleSelection[id] = !this.vehicleSelection[id];
  }

  public weekNumber(date: Date | null): number {
    if(!date){
      return 0;
    }
    const yearStart = new Date(date.getFullYear(), 0, 1); // Jan 1st, of the year given
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 604800000));
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const customer = await this.customer$.pipe().toPromise();
    if (!customer || !customer.DocumentID) {
      this.snackBar.open('No customer selected', 'Close', { duration: 3000 });
      return;
    }

    const selectedVehicleIds = Object.keys(this.vehicleSelection).filter(k => this.vehicleSelection[k]);

    const arrivalAt = this.form.controls.arrivalAt.value || new Date();
    const booking = {
      customerId: customer.DocumentID,
      customerSnapshot: customer,
      vehicleIds: selectedVehicleIds,
      vehiclesSnapshot: customer.vehicles || [],
      floridaInstructions: this.form.controls.floridaInstructions.value,
      newYorkInstructions: this.form.controls.newYorkInstructions.value,
      paycheck: {
        checkNumber: this.form.controls.checkNumber.value,
        bankName: this.form.controls.bankName.value,
        amount: this.form.controls.amount.value || 1200,
      },
      arrivalAt,
      arrivalWeekOfYear: this.weekNumber(arrivalAt),
      route: {
        origin: this.form.controls.origin.value,
        destination: this.form.controls.destination.value,
      },
      truck: {
        truckId: this.form.controls.truckId.value,
        departureDate: this.form.controls.truckDeparture.value,
        arrivalDate: this.form.controls.truckArrival.value,
      },
    };

    // dispatch booking action — effect will persist and handle snackbar/navigation
    this.store.dispatch(BookActions.addBookingStart({ booking }));
  }

  navigateBack() {
    this.router.navigate(['main/customer/'])
  }

  updateOrigin(event?: any){
    if(this.form.controls.destination.value === 'Florida'){
      this.form.controls.origin.setValue('New York');
    } else if(this.form.controls.destination.value === 'New York'){
      this.form.controls.origin.setValue('Florida');
    }
  }

  updateDestination(event: any){
    if(this.form.controls.origin.value === 'Florida'){
      this.form.controls.destination.setValue('New York');
    } else if(this.form.controls.origin.value === 'New York'){
      this.form.controls.destination.setValue('Florida');
    }
  }
}

