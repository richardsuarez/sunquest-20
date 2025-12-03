import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, mergeMap, tap } from 'rxjs/operators';
import { of, combineLatest } from 'rxjs';
import * as CalendarActions from './calendar.actions';
import { CalendarService } from '../service/calendar.service';
import { TruckService } from '../../truck/services/truck.service';

@Injectable()
export class CalendarEffects {
  private injector = inject(EnvironmentInjector);
  private calendarService = inject(CalendarService);
    private truckService = inject(TruckService);

  readonly loadTrucksAndTrips$;
  readonly loadBookingsForMonth$;
  readonly deleteBooking$;

  constructor(private actions$: Actions) {
    this.loadBookingsForMonth$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.loadBookingsForMonth),
        switchMap(action =>
          runInInjectionContext(this.injector, () =>
            this.calendarService.getBookingsForDateRange(action.startDate, action.endDate).pipe(
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
            const trucks$ = this.truckService.getTrucks();

            return trucks$.pipe(
              switchMap(trucks => {
                // Then load trips for each truck for the date range
                const tripObservables = trucks
                  .filter((truck): truck is { id: string } & any => !!truck.id)
                  .map(truck => {
                    // Filter trips by date range in the service
                    return this.calendarService.getTruckTrips(truck.id).pipe(
                      map(trips => ({
                        truckId: truck.id,
                        trips: trips.filter((trip: any) => {
                          const depDate = new Date(trip.departureDate);
                          return depDate >= action.monthStart && depDate <= action.monthEnd;
                        })
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

    this.deleteBooking$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CalendarActions.deleteBookingStart),
        mergeMap(action =>
          runInInjectionContext(this.injector, () =>
            this.calendarService.deleteBooking(action.id).pipe(
              map(() => {
                return CalendarActions.deleteBookingEnd();
              }),
              catchError((err: Error) => {
                console.error('[CalendarEffects] Failed to delete booking:', err);
                return of(CalendarActions.loadBookingsForMonthFail({ error: err }));
              })
            )
          )
        )
      )
    );
  }
}
