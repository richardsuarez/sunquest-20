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
      switchMap((action) => {
        if (action.currentActiveSeason) {
          // deactivate current active season
          return this.mainService.deactivateSeason(action.currentActiveSeason.id).pipe(
            switchMap(() =>
              // then 
              this.mainService.activateSeason(action.seasonToActivate).pipe(
                tap(() => {
                  this.snackBar.open('Season activated', 'Close', { duration: 3000 });
                }),
                map((newActiveSeason) => MainActions.activateSeasonSuccess({ season: newActiveSeason })),
                catchError(error => {
                  console.error('Error activating season:', error);
                  this.snackBar.open('Failed to activate season', 'Close', { duration: 3000 });
                  return of(MainActions.activateSeasonFail({ error: error.message }));
                })
              )
            ),
            catchError((error) => {
              console.error('Error deactivating season:', error);
              this.snackBar.open('Operation failed. Try again', 'Close', { duration: 3000 });
              return of();
            })
          )
        } else {
          return this.mainService.activateSeason(action.seasonToActivate).pipe(
            tap(() => {
              this.snackBar.open('Season activated', 'Close', { duration: 3000 });
            }),
            map((newSeason) => MainActions.activateSeasonSuccess({ season: newSeason ?? action.seasonToActivate })),
            catchError(error => {
              console.error('Error activating season:', error);
              this.snackBar.open('Failed to activate season', 'Close', { duration: 3000 });
              return of(MainActions.activateSeasonFail({ error: error.message }));
            })
          )
        }
      })
    )
  );

  openSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.openSeason),
      switchMap((action) =>
        this.mainService.openSeason(action.season).pipe(
          tap(() => {
            this.snackBar.open('Season opened', 'Close', { duration: 3000 });
          }),
          map((newSeason) => MainActions.openSeasonSuccess({ season: newSeason ?? action.season })),
          catchError(error => {
            console.error('Error opening season:', error);
            this.snackBar.open('Failed to open season', 'Close', { duration: 3000 });
            return of(MainActions.openSeasonFail({ error: error.message }));
          })
        )
      )
    )
  );

  closeSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.closeSeason),
      switchMap(({ seasonId }) =>
        this.mainService.closeSeason(seasonId).pipe(
          tap(() => {
            this.snackBar.open('Season closed', 'Close', { duration: 3000 });
          }),
          map(() => MainActions.closeSeasonSuccess({ seasonId })),
          catchError(error => {
            console.error('Error closing season:', error);
            this.snackBar.open('Failed to close season', 'Close', { duration: 3000 });
            return of(MainActions.closeSeasonFail({ error: error.message }));
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
            const vehicle = booking.customer?.vehicles && booking.customer?.vehicles[0];

            const remCarCapDelta = trip.remCarCap + 1; // Add back the car
            const remLoadCapDelta = trip.remLoadCap + (vehicle?.weight ?? 0); // Add back the weight
            const updatedTrip = {
              ...trip,
              remCarCap: remCarCapDelta,
              remLoadCap: remLoadCapDelta,
              paidBookings: booking.paycheck.amount >= 1200 ? trip.paidBookings - 1 : trip.paidBookings,

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