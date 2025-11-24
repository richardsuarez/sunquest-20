import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as TripActions from './trip.actions';
import { TripService } from '../../trip/services/trip.service';

@Injectable()
export class TripEffects {
  private injector = inject(EnvironmentInjector);
  readonly loadTrips$;
  readonly addTrip$;
  readonly updateTrip$;
  readonly deleteTrip$;

  constructor(
    private actions$: Actions,
    private tripService: TripService  
  ) {
    this.loadTrips$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TripActions.getTripsStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.tripService.getTruckTrips(action.truckId).pipe(
            map(trips => TripActions.getTripsSuccess({ trips })),
            catchError(err => of(TripActions.getTripsFail({ error: err })))
          )
        ))
      )
    );

    this.addTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TripActions.addTripStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.tripService.addTrip(action.truckId, action.trip).pipe(
            map(trip => TripActions.addTripSuccess({ trip })),
            catchError(err => of(TripActions.addTripFail({ error: err })))
          )
        ))
      )
    );

    this.updateTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TripActions.updateTripStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.tripService.updateTrip(action.truckId, action.trip.id || '', action.trip).pipe(
            map(() => TripActions.updateTripSuccess({ 
              truckId: action.truckId, 
              tripId: action.trip.id || '', 
              trip: action.trip 
            })),
            catchError(err => of(TripActions.updateTripFail({ error: err })))
          )
        ))
      )
    );

    this.deleteTrip$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TripActions.deleteTripStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.tripService.deleteTrip(action.truckId, action.tripId).pipe(
            map(() => TripActions.deleteTripSuccess({ 
              truckId: action.truckId, 
              tripId: action.tripId 
            })),
            catchError(err => of(TripActions.deleteTripFail({ error: err })))
          )
        ))
      )
    );
  }
}