import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, tap, mergeMap, withLatestFrom, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as MainActions from './main.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainService } from '../services/main.service';
import { selectSeasons } from './main.selectors';
import { Store } from '@ngrx/store';

@Injectable()
export class MainEffects {
  private actions$ = inject(Actions);
  private mainService = inject(MainService);
  private snackBar = inject(MatSnackBar);
  private readonly store = inject(Store)

  loadSeasons$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.loadSeasons),
      switchMap(() =>
        this.mainService.getSeasons().pipe(
          map(seasons => MainActions.loadSeasonsSuccess({ seasons })),
          catchError(error => {
            console.error('Error loading seasons:', error);
            return of(MainActions.loadSeasonsFail({ error: error.message }));
          })
        )
      )
    )
  );

  activateSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.activateSeason),
      switchMap((action) =>
        this.mainService.activateSeason(action.season).pipe(
          tap(() => {
            this.snackBar.open('Season activated', 'Close', { duration: 3000 });
          }),
          map((newSeason) => MainActions.activateSeasonSuccess({ season: newSeason })),
          catchError(error => {
            console.error('Error activating season:', error);
            this.snackBar.open('Failed to activate season', 'Close', { duration: 3000 });
            return of(MainActions.activateSeasonFail({ error: error.message }));
          })
        )
      )
    )
  );

  deactivateSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.deactivateSeason),
      switchMap(({ seasonId }) =>
        this.mainService.deactivateSeason(seasonId).pipe(
          tap(() => {
            this.snackBar.open('Season deactivated', 'Close', { duration: 3000 });
          }),
          map(() => MainActions.deactivateSeasonSuccess({ seasonId })),
          catchError(error => {
            console.error('Error deactivating season:', error);
            this.snackBar.open('Failed to deactivate season', 'Close', { duration: 3000 });
            return of(MainActions.deactivateSeasonFail({ error: error.message }));
          })
        )
      )
    )
  );

  deleteBookingStart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.deleteBookingStart),
      switchMap(action =>
        this.mainService.deleteBooking(action.booking.id!).pipe(
          switchMap(() => {
            // After booking is deleted, update the trip with restored capacity
            const booking = action.booking;
            const tripId = booking.tripId;
            const truckId = booking.truckId;

            if (!tripId || !truckId) {
              console.warn('[MainEffects] Booking does not have tripId or truckId, skipping trip update');
              return of(MainActions.deleteBookingSuccess());
            }
            return of(MainActions.updateTripAfterDeleteBooking({ tripId, truckId, booking }));

          }),
          catchError((err: Error) => {
            console.error('[MainEffects] Failed to delete booking:', err);
            return of(MainActions.deleteBookingFail({ error: err }));
          })
        )
      )
    )
  );

  deleteBookingSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.deleteBookingSuccess),
      withLatestFrom(this.store.select(selectSeasons)),
      concatMap(([_, seasons]) => {
        this.snackBar.open('Booking deleted successfully', 'Close', { duration: 3000 });
        const activeSeason = seasons && seasons.length > 0 ? seasons.find(s => s.isActive === true) : null;
        if (activeSeason) {
          return of(MainActions.getPaidBookings({ season: activeSeason }));
        }
        return of();
      })
    )
  );

  updateTripAfterDeleteBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.updateTripAfterDeleteBooking),
      switchMap(action => {
        const { tripId, truckId, booking } = action;
        if (!tripId || !truckId) {
          console.warn('[MainEffects] updateTripAfterDeleteBooking - missing tripId or truckId, cannot update trip after booking deletion');
          return of(MainActions.deleteBookingSuccess());
        }
        return this.mainService.getTrip(tripId, truckId).pipe(
          switchMap(trip => {
            if (!trip) {
              console.warn(`[MainEffects] Trip with id ${tripId} not found for truck ${truckId}, cannot update after booking deletion`);
              return of(MainActions.deleteBookingSuccess());
            }
            const vehicleIds = booking.vehicleIds || [];

            // Calculate the capacity to restore
            let totalWeight = trip.remLoadCap;
            let totalCars = trip.remCarCap;
            const vehicles = booking.customer?.vehicles || [];
            for (let vehicleId of vehicleIds) {
              const vehicle = vehicles.find(v => v.id === vehicleId);
              if (vehicle && vehicle.weight) {
                totalWeight += vehicle.weight;
              }
            }
            const remCarCapDelta = totalCars + vehicleIds.length; // Add back the cars
            const remLoadCapDelta = totalWeight; // Add back the weight
            const updatedTrip = {
              ...trip,
              remCarCap: remCarCapDelta,
              remLoadCap: remLoadCapDelta
            };

            return this.mainService.updateTrip(truckId, updatedTrip).pipe(
              map(() => MainActions.deleteBookingSuccess()),
              catchError((err: Error) => {
                console.error('[MainEffects] updateTripAfterDeleteBooking - failed to update trip:', err);
                return of(MainActions.deleteBookingFail({ error: err }));
              })
            );
          }),
          catchError((err: Error) => {
            console.error('[MainEffects] updateTripAfterDeleteBooking - failed to get trip:', err);
            return of(MainActions.deleteBookingFail({ error: err }));
          })
        );
      })
    )
  );

  getPaidBookings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.getPaidBookings),
      switchMap((action) =>
        this.mainService.getPaidBookings(action.season).pipe(
          map(paidBookings => MainActions.getPaidBookingsSuccess({ paidBookings })),
          catchError(error => {
            console.error('Error loading seasons:', error);
            return of(MainActions.loadSeasonsFail({ error: error.message }));
          })
        )
      )
    )
  );
}