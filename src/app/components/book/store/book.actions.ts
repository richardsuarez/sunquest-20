import { createAction, props } from '@ngrx/store';
import { Booking } from '../model/booking.model';
import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../../truck/model/truck.model';

// Booking actions
export const addBookingStart = createAction('[Book] Add booking start', props<{ booking: Partial<Booking>, trip: Trip }>());
export const addBookingEnd = createAction('[Book] Add booking end');
export const addBookingFail = createAction('[Book] Add booking fail', props<{ error: Error }>());

// Trip actions
export const addTripStart = createAction('[Book] Add trip start', props<{ truckId: string, trip: Trip }>());
export const addTripSuccess = createAction('[Book] Add trip success', props<{ truckId: string, trip: Trip }>());
export const addTripFail = createAction('[Book] Add trip fail', props<{ error: Error }>());

// Update trip capacities after a booking
export const updateTripStart = createAction('[Book] Update trip', props<{ truckId: string, trip: Trip }>());
export const updateTripEnd = createAction('[Book] Update trip');

export const getTruckListStart = createAction('[Truck] Load trucks start');
export const getTruckListSuccess = createAction('[Truck] Load trucks success', props<{ trucks: Truck[] }>());
export const getTruckListFail = createAction('[Truck] Load trucks fail', props<{ error: Error }>());

export const loadTripsStart = createAction('[Book] Load trips start', props<{ truckId: string }>());
export const loadTripsSuccess = createAction('[Book] Load trips success', props<{ truckId: string, trips: Trip[] }>());
export const loadTripsFail = createAction('[Book] Load trips fail', props<{ error: Error }>());
