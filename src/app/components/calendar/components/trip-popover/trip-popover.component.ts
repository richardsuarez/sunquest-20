import { Component, Inject, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Truck } from '../../../truck/model/truck.model';
import * as CalendarActions from '../../store/calendar.actions';
import { Trip } from '../../../trip/model/trip.model';

@Component({
    selector: 'app-trip-popover',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './trip-popover.component.html',
    styleUrls: ['./trip-popover.component.scss']
})
export class TripPopoverComponent {
    private store = inject(Store);
    today = new Date();
    private tomorrow = new Date(this.today.getTime() + 86400000);
    private dayAfterTomorrow = new Date(this.today.getTime() + 172800000);
    trip: Trip | null = null;
    originalTruckId: string | null = null;

    tripForm = new FormGroup({
        truckId: new FormControl<string>('', [Validators.required]),
        loadNumber: new FormControl<string>('', [Validators.required]),
        departureDate: new FormControl<Date | null>(this.tomorrow, [Validators.required]),
        arrivalDate: new FormControl<Date | null>(this.dayAfterTomorrow, [Validators.required]),
        origin: new FormControl<string>('', [Validators.required]),
        destination: new FormControl<string>('', [Validators.required]),
    });

    truckList: Truck[] = [];

    constructor(
        public dialogRef: MatDialogRef<TripPopoverComponent>,
        @Inject(MAT_DIALOG_DATA) data: { trucks: Truck[], trip?: Trip | null, truckTrip?: string | null },
    ) {
        this.truckList = data?.trucks || [];
        if (data.trip) {
            this.trip = data.trip;
            this.originalTruckId = data.truckTrip || null;
            this.tripForm.patchValue({
                truckId: data.truckTrip,
                loadNumber: data.trip.loadNumber,
                departureDate: data.trip.departureDate,
                arrivalDate: data.trip.arrivalDate,
                origin: data.trip.origin,
                destination: data.trip.destination,
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.tripForm.invalid) {
            this.tripForm.markAllAsTouched();
            return;
        }

        const tripData = this.tripForm.value;
        if (!tripData.truckId) {
            return;
        }

        const truck = this.truckList.find(t => t.id === tripData.truckId);

        if (this.trip?.id) {
            this.store.dispatch(CalendarActions.updateTripStart({
                truckId: tripData.truckId,
                trip: {
                    ...this.trip,
                    departureDate: tripData.departureDate || new Date(),
                    arrivalDate: tripData.arrivalDate || new Date(),
                    origin: tripData.origin || '',
                    destination: tripData.destination || '',
                    delayDate: null,
                }
            }));
        } else {
            this.store.dispatch(CalendarActions.addTripStart({
                truckId: tripData.truckId,
                trip: {
                    id: this.trip?.id,
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
        }


        this.dialogRef.close('success');
    }

    getErrorMessage(fieldName: string): string {
        const control = this.tripForm.get(fieldName);
        if (control?.hasError('required')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        return '';
    }

    getTitle(): string {
        return this.trip?.id ? 'Edit Trip' : 'New Trip';
    }

    getTruckInfo() {
        const truck = this.truckList.find(t => t.id === this.originalTruckId)
        return `${truck?.truckNumber} (${truck?.companyName}) - Load: ${this.trip?.loadNumber}`
    }

    isEditableTrip() {
        return this.trip?.arrivalDate.getTime()! >= this.today.getTime()
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
}
