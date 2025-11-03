import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
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
import { Truck } from './model/truck.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './book.html',
  styleUrls: ['./book.css']
})
export class Book implements OnInit{
  private store = inject(Store);
  public router = inject(Router);
  private snackBar = inject(MatSnackBar);
  isMobile!: boolean;
  customer$ = this.store.select(customerViewModel);
  trucks$!: Observable<Truck[]>;
  savingBooking$!: Observable<boolean>;
  destroy$ = new Subject<void>()

  vehicleSelection: { [id: string]: boolean } = {};

  form = new FormGroup({
    floridaInstructions: new FormControl<string | null>(null),
    newYorkInstructions: new FormControl<string | null>(null),
    checkNumber: new FormControl<string | null>(null),
    bankName: new FormControl<string | null>(null),
    amount: new FormControl<number | null>(1200, [Validators.required]),
    arrivalAt: new FormControl<string | null>(null, [Validators.required]), // ISO datetime
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
    this.store.dispatch(BookActions.getTrucksStart());
  }

  ngOnInit(){
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    this.customer$.pipe(takeUntil(this.destroy$)).subscribe(customer => {
      if(customer && customer.DocumentID){
        this.store.dispatch(getVehiclesStart({ customerId: customer.DocumentID }));
        // initialize vehicle selection
        if (customer.vehicles) {
          customer.vehicles.forEach(v => {
            if(v.id){
              this.vehicleSelection[v.id] = false;
            }
          });
        }
      }
    })
  }

  toggleVehicle(id: string) {
    this.vehicleSelection[id] = !this.vehicleSelection[id];
  }

  public weekNumber(dateString: string | null): number {
    if (!dateString) return 0;
    const d = new Date(dateString);
    // Copy date so don't modify original
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // ISO week date weeks start on Monday
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    const week = 1 + Math.round((firstThursday - target.valueOf()) /  (7 * 24 * 60 * 60 * 1000));
    return week;
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

    const arrivalAt = this.form.controls.arrivalAt.value || new Date().toISOString();
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
}
 
