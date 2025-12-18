import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import { mergeMap, tap } from 'rxjs/operators';
import { of, from, combineLatest } from 'rxjs';
import * as BookActions from './book.actions';
import { BookingService } from '../service/booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TruckService } from '../../truck/services/truck.service';
import { Truck } from '../../truck/model/truck.model';

@Injectable()
export class BookEffects {
    private injector = inject(EnvironmentInjector);
    private bookingService = inject(BookingService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private truckService = inject(TruckService);

    readonly addBookingStart$;
    readonly addBookingEnd$;
    readonly addTrip$;
    readonly loadTrucks$;
    readonly loadTrips$;

    constructor(private actions$: Actions) {
        // Add Booking effect
        this.addBookingStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addBookingStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.bookingService.addBooking(action.booking).pipe(
                            switchMap(() => {
                                const carsBooked = action.booking.vehicleIds || [];
                                let totalWeight = 0
                                for (let carId of carsBooked) {
                                    const vehicle = action.booking.customer?.vehicles?.find(v => v.id === carId);
                                    if (vehicle && vehicle.weight) {
                                        totalWeight = totalWeight + vehicle.weight;
                                    }
                                }
                                const remCarCapDelta = action.trip?.remCarCap ? action.trip.remCarCap - carsBooked.length : 0;
                                const remWeightCapDelta = action.trip?.remLoadCap ? action.trip.remLoadCap - totalWeight : 0;
                                const updatedTrip = {
                                    ...action.trip,
                                    remCarCap: remCarCapDelta,
                                    remLoadCap: remWeightCapDelta
                                }
                                return runInInjectionContext(this.injector, () =>
                                    this.bookingService.updateTrip(action.booking.truckId, updatedTrip).pipe(
                                        map(() => {
                                            return BookActions.addBookingEnd();
                                        }),
                                        catchError((err: Error) => of(BookActions.addBookingFail({ error: err })))
                                    )
                                )
                            }

                            ),
                            catchError((err: Error) => of(BookActions.addBookingFail({ error: err })))
                        )
                    )
                )
            )
        );

        this.addBookingEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addBookingEnd),
                tap(() => {
                    this.snackBar.open('Booking saved', 'Close', { duration: 3000 });
                    this.router.navigate(['/main/customer']);
                })
            ),
            { dispatch: false }
        );

        // Add Trip effect
        this.addTrip$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addTripStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        from(this.bookingService.addTrip(action.truckId, action.trip)).pipe(
                            map((trip) => {
                                this.snackBar.open('Trip added', 'Close', { duration: 3000 });
                                return BookActions.addTripSuccess({
                                    truckId: action.truckId,
                                    trip: trip
                                });
                            }),
                            catchError((err: Error) => {
                                this.snackBar.open('Failed to add trip', 'Close', { duration: 3000 });
                                return of(BookActions.addTripFail({ error: err }));
                            })
                        )
                    )
                )
            )
        );

        this.loadTrucks$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.getTruckListStart),
                switchMap(() => runInInjectionContext(this.injector, () =>
                    this.truckService.getTrucks().pipe(
                        map(trucks => {
                            const truckList = trucks.map(t => {
                                const asCreatedAt = (t as any).createdAt;
                                const createdAt = asCreatedAt ? (typeof asCreatedAt.toDate === 'function' ? asCreatedAt.toDate() : new Date(asCreatedAt)) : null;

                                return ({ ...t, createdAt, });
                            }) as Truck[];
                            return BookActions.getTruckListSuccess({ trucks: truckList });
                        }),
                        catchError(err => of(BookActions.getTruckListFail({ error: err })))
                    )
                ))
            )
        );

        // Load Trips effect
        this.loadTrips$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.loadTripsStart),
                mergeMap((action) =>
                    this.bookingService.getTruckTrips(action.truckId, action.season).pipe(
                        map((trips) => BookActions.loadTripsSuccess({ truckId: action.truckId, trips: trips })),
                        catchError((err: Error) => {
                            console.error('Failed to load trips:', err);
                            return of(BookActions.loadTripsFail({ error: err }));
                        })
                    )
                )
            )
        );
    }
}