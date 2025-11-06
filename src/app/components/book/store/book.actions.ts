import { createAction, props } from '@ngrx/store';
import { Booking } from '../model/booking.model';


export const addBookingStart = createAction('[Book] Add booking start', props<{ booking: Partial<Booking> }>());
export const addBookingEnd = createAction('[Book] Add booking end');
export const addBookingFail = createAction('[Book] Add booking fail', props<{ error: Error }>());
