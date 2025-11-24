import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TripState } from './trip.state';
import { SCHEDULE_FEATURE_KEY } from './trip.reducers';

export const selectTripState = createFeatureSelector<TripState>(SCHEDULE_FEATURE_KEY);

export const trips = createSelector(
  selectTripState,
  (state: TripState) => state.trips
);

export const loadingTrips = createSelector(
  selectTripState,
  (state: TripState) => state.loading
);

export const savingTrip = createSelector(
  selectTripState,
  (state: TripState) => state.saving
);

export const tripError = createSelector(
  selectTripState,
  (state: TripState) => state.error
);