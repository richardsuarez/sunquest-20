import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, take, withLatestFrom, concatMap } from 'rxjs/operators';
import { mergeMap, tap } from 'rxjs/operators';
import { of, from, combineLatest } from 'rxjs';
import * as BookActions from './book.actions';
import * as MainActions from '../../main/store/main.actions';
import { BookingService } from '../service/booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TruckService } from '../../truck/services/truck.service';
import { Truck } from '../../truck/model/truck.model';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSeasons } from '../../main/store/main.selectors';

@Injectable()
export class BookEffects {
    private injector = inject(EnvironmentInjector);
    private bookingService = inject(BookingService);
    private snackBar = inject(MatSnackBar);
    private location = inject(Location);
    private truckService = inject(TruckService);
    private store = inject(Store);

    readonly addBookingStart$;
    readonly addBookingEnd$;
    readonly updateBookingStart$;
    readonly updateTripStart$;
    readonly updateTripEnd$;
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
                                if (!action.trip) {
                                    return of(BookActions.addBookingEnd());
                                }
                                let totalWeight = 0
                                if (action.booking.customer?.vehicles) {
                                    totalWeight = action.booking.customer?.vehicles[0].weight ?? 0
                                }
                                const remCarCapDelta = action.trip?.remCarCap ? action.trip.remCarCap - 1 : 0;
                                const remWeightCapDelta = action.trip?.remLoadCap ? action.trip.remLoadCap - totalWeight : 0;
                                const updatedTrip = {
                                    ...action.trip,
                                    remCarCap: remCarCapDelta,
                                    remLoadCap: remWeightCapDelta,
                                    loadNumber: action.trip?.loadNumber || ''
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

        this.updateBookingStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.updateBookingStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.bookingService.updateBooking(action.booking).pipe(
                            switchMap(() => {
                                return of(BookActions.addBookingEnd());
                            }),
                            catchError((err: Error) => of(BookActions.addBookingFail({ error: err })))
                        )
                    )
                )
            )
        );

        this.updateTripStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.updateTripStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.bookingService.updateTrip(action.truckId, action.trip).pipe(
                            map(() => {
                                return BookActions.updateTripEnd();
                            }),
                            catchError((err: Error) => of(BookActions.addTripFail({ error: err })))
                        )
                    )
                )
            )
        );

        this.updateTripEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.updateTripEnd),
                tap(() => {
                    this.snackBar.open('Trip updated', 'Close', { duration: 3000 });
                })
            ),
            { dispatch: false }
        );


        this.addBookingEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addBookingEnd),
                withLatestFrom(this.store.select(selectSeasons)),
                concatMap(([_, seasons]) => {
                    this.snackBar.open('Booking saved', 'Close', { duration: 3000 });
                    this.location.back();
                    
                    // Get the active season (the last one in the seasons list, which should be the most recent)
                    const activeSeason = seasons && seasons.length > 0 ? seasons.find(s => s.isActive === true) : null;
                    
                    if (activeSeason) {
                        return of(MainActions.getPaidBookings({ season: activeSeason }));
                    }
                    return of();
                })
            )
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