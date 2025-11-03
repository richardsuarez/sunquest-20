import { createAction, props } from '@ngrx/store';
import { Truck } from '../model/truck.model';
import { Booking } from '../model/booking.model';

export const getTrucksStart = createAction('[Book] Get trucks start');
export const getTrucksEnd = createAction('[Book] Get trucks end', props<{ trucks: Truck[] }>());
export const getTrucksFail = createAction('[Book] Get trucks fail', props<{ error: Error }>());

export const addBookingStart = createAction('[Book] Add booking start', props<{ booking: Partial<Booking> }>());
export const addBookingEnd = createAction('[Book] Add booking end');
export const addBookingFail = createAction('[Book] Add booking fail', props<{ error: Error }>());
