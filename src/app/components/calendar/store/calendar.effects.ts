import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, mergeMap, tap, concatMap, withLatestFrom, delay } from 'rxjs/operators';
import { of, combineLatest, from } from 'rxjs';
import * as CalendarActions from './calendar.actions';
import * as MainActions from '../../main/store/main.actions'
import { CalendarService } from '../service/calendar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { selectSeasons } from '../../main/store/main.selectors';
import { Trip } from '../../trip/model/trip.model';
import { error } from '../../login/store/login.selectors';

@Injectable()
export class CalendarEffects {
  private injector = inject(EnvironmentInjector);
  private calendarService = inject(CalendarService);
  private snackBar = inject(MatSnackBar);

  readonly loadTrucksAndTrips$;
  readonly getAllTruckTrips$;
  readonly loadBookingsForMonth$;
  readonly deleteBooking$;
  readonly addTrip$;
  readonly addTripSuccess$;
  readonly updateTrip$;
  readonly updateTripSuccess$;
  readonly updateTripFail$;
  readonly deleteTrip$;
  readonly deleteBookingsByTrip$;
  readonly deleteBookingsEnd$;
  readonly changeTruckForTrip$;
  readonly changeTruckForTripSuccess$;
  readonly changeTruckForTripFail$

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store
  ) {
    this.loadBookingsForMonth$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.loadBookingsForMonth),
        switchMap(action =>
          runInInjectionContext(this.injector, () =>
            this.calendarService.getBookingsForDateRange(action.startDate, action.endDate, action.season).pipe(
              map(bookings => CalendarActions.loadBookingsForMonthSuccess({ bookings })),
              catchError(err => {
                console.error('[CalendarEffects] Failed to load bookings:', err);
                return of(CalendarActions.loadBookingsForMonthFail({ error: err }));
              })
            )
          )
        )
      )
    );

    this.loadTrucksAndTrips$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.loadTrucksAndTrips),
        switchMap(action =>
          runInInjectionContext(this.injector, () => {
            // First load all trucks
            const trucks$ = this.calendarService.getTrucks();

            return trucks$.pipe(
              switchMap(trucks => {
                // Then load trips for each truck for the date range
                const tripObservables = trucks
                  .filter((truck): truck is { id: string } & any => !!truck.id)
                  .map(truck => {
                    // Filter trips by date range in the service
                    return this.calendarService.getTruckTrips(truck.id, action.season).pipe(
                      map(trips => ({
                        truckId: truck.id,
                        trips: (action.monthStart && action.monthEnd)
                          ? trips.filter((trip: any) => {
                            const depDate = new Date(trip.departureDate);
                            return depDate >= action.monthStart! && depDate <= action.monthEnd!;
                          })
                          : trips
                      }))
                    );
                  });

                if (tripObservables.length === 0) {
                  return of(CalendarActions.loadTrucksAndTripsSuccess({
                    trucks: [],
                    trips: {}
                  }));
                }

                return combineLatest(tripObservables).pipe(
                  map(tripArrays => {
                    const tripsMap: { [key: string]: any[] } = {};
                    tripArrays.forEach(({ truckId, trips }) => {
                      tripsMap[truckId] = trips;
                    });
                    return CalendarActions.loadTrucksAndTripsSuccess({
                      trucks,
                      trips: tripsMap
                    });
                  })
                );
              }),
              catchError(err => {
                console.error('[CalendarEffects] Failed to load trucks and trips:', err);
                return of(CalendarActions.loadTrucksAndTripsFail({ error: err }));
              })
            );
          })
        )
      )
    );

    this.getAllTruckTrips$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.getAllTruckTripsOnThisSeason),
        switchMap(action =>
          this.calendarService.getTruckTrips(action.truckId, action.season).pipe(
            switchMap(trips => {
              return of(CalendarActions.getAllTruckTripsOnThisSeasonSuccess({ trips }))
            })
          )
        )
      )
    );

    this.deleteBooking$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.deleteBookingStart),
        mergeMap(action =>
          runInInjectionContext(this.injector, () => {
            // First delete the booking
            return this.calendarService.deleteBooking(action.booking.id!).pipe(
              switchMap(() => {
                // After booking is deleted, update the trip with restored capacity
                const booking = action.booking;
                const trip = action.trip;
                const vehicle = booking.customer?.vehicles && booking.customer?.vehicles[0];

                const remCarCapDelta = trip.remCarCap + 1; // Add back the car
                const remLoadCapDelta = trip.remLoadCap + (vehicle?.weight ?? 0); // Add back the weight
                const updatedTrip = {
                  ...trip,
                  remCarCap: remCarCapDelta,
                  remLoadCap: remLoadCapDelta,
                  paidBookings: booking.paycheck.amount >= 1200 ? trip.paidBookings - 1 : trip.paidBookings,
                };

                // Update the trip with the restored capacity
                if (booking.tripId && booking.truckId) {
                  return this.calendarService.updateTrip(
                    booking.truckId,
                    updatedTrip
                  ).pipe(
                    map(() => CalendarActions.deleteBookingEnd({ booking: action.booking!, trip: updatedTrip })),
                    catchError((err: Error) => {
                      console.error('[CalendarEffects] Failed to update trip after booking deletion:', err);
                      return of(CalendarActions.loadBookingsForMonthFail({ error: err }));
                    })
                  );
                } else {
                  return of(CalendarActions.deleteBookingEnd({ booking: action.booking!, trip: updatedTrip }));
                }
              }),
              catchError((err: Error) => {
                console.error('[CalendarEffects] Failed to delete booking:', err);
                return of(CalendarActions.loadBookingsForMonthFail({ error: err }));
              })
            );
          })
        )
      )
    );

    this.deleteBookingsEnd$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.deleteBookingEnd),
        withLatestFrom(this.store.select(selectSeasons)),
        concatMap(([action, seasons]) => {
          const activeSeason = seasons && seasons.length > 0 ? seasons.find(s => s.isActive === true) : null;

          if (activeSeason && action.booking.season === `${activeSeason.seasonName}-${activeSeason.year}`) {
            // if the deleted booking belongs to the current season
            return of(MainActions.getPaidBookings({ season: activeSeason }));
          }
          return of();
        })
      )
    )

    this.addTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.addTripStart),
        switchMap((action) =>
          runInInjectionContext(this.injector, () =>
            from(this.calendarService.addTrip(action.truckId, action.trip)).pipe(
              map((trip) => {
                this.snackBar.open('Trip added', 'Close', { duration: 3000 });
                return CalendarActions.addTripSuccess({
                  truckId: action.truckId,
                  trip: trip
                });
              }),
              catchError((err: Error) => {
                this.snackBar.open('Failed to add trip', 'Close', { duration: 3000 });
                return of(CalendarActions.addTripFail({ error: err }));
              })
            )
          )
        )
      )
    );

    this.addTripSuccess$ = createEffect(() => 
      this.actions$.pipe(
        ofType(CalendarActions.addTripSuccess),
        tap(() => {
          this.snackBar.open('Trip added successfully. Proceed to close the Add Trip window', 'Close', {duration: 5000});
        })
      ), {dispatch: false},
    )

    this.updateTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.updateTripStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.calendarService.updateTrip(action.truckId, action.trip).pipe(
            switchMap(() =>
              this.calendarService.updateDepartureDateofBookings(action.trip).pipe(
                map(() => CalendarActions.updateTripSuccess({
                  truckId: action.truckId,
                  trip: action.trip
                })),
                catchError(err => of(CalendarActions.updateTripFail({ error: err })))
              )
            ),
            catchError(err => of(CalendarActions.updateTripFail({ error: err })))
          )
        ))
      )
    );

    this.updateTripSuccess$ = createEffect(() => 
      this.actions$.pipe(
        ofType(CalendarActions.updateTripSuccess),
        tap(() => {
          this.snackBar.open('Trip updateded successfully. Proceed to close the Edit Trip window', 'Close', {duration: 5000});
        })
      ), {dispatch: false},
    )

    this.updateTripFail$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.updateTripFail),
        tap((action) => {
          console.error(action.error);
          this.snackBar.open('Error when trying to update trip', 'Close', { duration: 3000 })
        })
      ), { dispatch: false }
    )

    this.deleteTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.deleteTripStart),
        switchMap(action =>
          runInInjectionContext(this.injector, () =>
            this.calendarService.deleteTrip(action.truckId, action.trip.id!).pipe(
              concatMap(() =>
                // After trip is deleted successfully, dispatch action to delete its bookings
                [
                  CalendarActions.deleteTripSuccess({ truckId: action.truckId, tripId: action.trip.id! }),
                  CalendarActions.deleteBookingsByTripStart({ tripId: action.trip.id! }),
                ]
              ),
              catchError(err => {
                this.snackBar.open('Failed to delete trip', 'Close', { duration: 3000 });
                console.error('[CalendarEffects] Failed to delete trip:', err);
                return of(CalendarActions.deleteTripFail({ error: err }));
              })
            )
          )
        )
      )
    );

    this.deleteBookingsByTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.deleteBookingsByTripStart),
        switchMap(action =>
          runInInjectionContext(this.injector, () =>
            this.calendarService.deleteBookingsByTripId(action.tripId).pipe(
              map(() => {
                this.snackBar.open('Trip and bookings deleted', 'Close', { duration: 3000 });
                // Note: The tripId comes from the initial deleteTripStart action
                // We need to extract truckId from the trip data stored in the first effect
                // For now, we dispatch success - the reducer will handle state cleanup
                return CalendarActions.deleteBookingsByTripSuccess({ tripId: action.tripId });
              }),
              catchError(err => {
                this.snackBar.open('Failed to delete trip bookings', 'Close', { duration: 3000 });
                console.error('[CalendarEffects] Failed to delete bookings by trip:', err);
                return of(CalendarActions.deleteBookingsByTripFail({ error: err }));
              })
            )
          )
        )
      )
    );

    this.changeTruckForTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.changeTruckForTripStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.calendarService.deleteTrip(action.originaltruckId, action.originalTrip.id!).pipe(
            switchMap(() =>
              this.calendarService.addTrip(
                action.newTruck,
                {
                  loadNumber: action.newTrip.loadNumber,
                  departureDate: action.newTrip.departureDate,
                  arrivalDate: action.newTrip.arrivalDate,
                  origin: action.newTrip.origin,
                  destination: action.newTrip.destination,
                  remLoadCap: action.newTrip.remLoadCap,
                  remCarCap: action.newTrip.remCarCap,
                  delayDate: action.newTrip.delayDate,
                  season: action.newTrip.season,
                  paidBookings: action.newTrip.paidBookings,
                } as Partial<Trip>).pipe(
                  switchMap((trip) =>
                    this.calendarService.updateNewTripForBookings(action.bookings, trip.id ?? '', action.newTruck ?? '', action.newTrip.departureDate).pipe(
                      map(() => CalendarActions.changeTruckForTripSuccess({originaltruckId: action.originaltruckId, oldTrip: action.originalTrip, trip: action.newTrip, newTruck: action.newTruck})),
                      catchError(err => of(CalendarActions.changeTruckForTripFail({ error: err }))),
                    )
                  ),
                  catchError(err => of(CalendarActions.changeTruckForTripFail({ error: err }))),
                )
            ),
            catchError(err => of(CalendarActions.changeTruckForTripFail({ error: err }))),
          )
        ))
      )
    );

    this.changeTruckForTripSuccess$ = createEffect(() => 
      this.actions$.pipe(
        ofType(CalendarActions.changeTruckForTripSuccess),
        tap(() => {
          this.snackBar.open('Trip saved successfully. Proceed to close the Edit Trip window', 'Close', {duration: 5000});
        })
      ), {dispatch: false},
    )

    this.changeTruckForTripFail$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.changeTruckForTripFail),
        tap((action) => {
          console.error(action.error);
          this.snackBar.open('Error when trying to change truck for a trip', 'Close', { duration: 3000 });
        })
      )
    )
  }
}
