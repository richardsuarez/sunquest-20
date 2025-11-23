import { createReducer, on } from '@ngrx/store';
import * as TripActions from './trip.actions';
import { initialTripState, TripState } from './trip.state';

export const SCHEDULE_FEATURE_KEY = 'trip';

export const tripReducer = createReducer<TripState>(
  initialTripState,
  on(TripActions.getTripsStart, (s) => ({ ...s, loading: true, error: null })),
  on(TripActions.getTripsSuccess, (s, a) => ({ ...s, loading: false, trips: a.trips })),
  on(TripActions.getTripsFail, (s, a) => ({ ...s, loading: false, error: a.error })),

  on(TripActions.addTripStart, (s) => ({ ...s, saving: true, error: null })),
  on(TripActions.addTripSuccess, (s, a) => ({ 
    ...s, 
    saving: false, 
    trips: [...s.trips, a.trip] 
  })),
  on(TripActions.addTripFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(TripActions.updateTripStart, (s) => ({ ...s, saving: true, error: null })),
  
  on(TripActions.updateTripFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(TripActions.deleteTripStart, (s) => ({ ...s, saving: true, error: null })),

  on(TripActions.deleteTripFail, (s, a) => ({ ...s, saving: false, error: a.error }))
);