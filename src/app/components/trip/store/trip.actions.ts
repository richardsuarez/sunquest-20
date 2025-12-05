import { createAction, props } from '@ngrx/store';
import { Trip } from '../model/trip.model';

export const getTripsStart = createAction(
  '[Trip] Get trips start',
  props<{ truckId: string }>()
);

export const getTripsSuccess = createAction(
  '[Trip] Get trips success',
  props<{ trips: Trip[] }>()
);

export const getTripsFail = createAction(
  '[Trip] Get trips fail',
  props<{ error: Error }>()
);

export const addTripStart = createAction(
  '[Trip] Add trip start',
  props<{ truckId: string; trip: Partial<Trip> }>()
);

export const addTripSuccess = createAction(
  '[Trip] Add trip success',
  props<{ trip: Trip }>()
);

export const addTripFail = createAction(
  '[Trip] Add trip fail',
  props<{ error: Error }>()
);

export const updateTripStart = createAction(
  '[Trip] Update trip start',
  props<{ truckId: string; trip: Trip }>()
);

export const updateTripSuccess = createAction(
  '[Trip] Update trip success',
  props<{ truckId: string; trip: Partial<Trip> }>()
);

export const updateTripFail = createAction(
  '[Trip] Update trip fail',
  props<{ error: Error }>()
);

export const deleteTripStart = createAction(
  '[Trip] Delete trip start',
  props<{ truckId: string; tripId: string }>()
);

export const deleteTripSuccess = createAction(
  '[Trip] Delete trip success',
  props<{ truckId: string; tripId: string }>()
);

export const deleteTripFail = createAction(
  '[Trip] Delete trip fail',
  props<{ error: Error }>()
);