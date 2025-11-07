import { createAction, props } from '@ngrx/store';
import { Booking } from '../model/booking.model';
import { Schedule } from '../../schedule/model/schedule.model';

// Booking actions
export const addBookingStart = createAction('[Book] Add booking start', props<{ booking: Partial<Booking> }>());
export const addBookingEnd = createAction('[Book] Add booking end');
export const addBookingFail = createAction('[Book] Add booking fail', props<{ error: Error }>());

// Schedule actions
export const addScheduleStart = createAction('[Book] Add schedule start', props<{ truckId: string, schedule: Schedule }>());
export const addScheduleSuccess = createAction('[Book] Add schedule success', props<{ truckId: string, schedule: Schedule }>());
export const addScheduleFail = createAction('[Book] Add schedule fail', props<{ error: Error }>());

export const loadSchedulesStart = createAction('[Book] Load schedules start', props<{ truckId: string }>());
export const loadSchedulesSuccess = createAction('[Book] Load schedules success', props<{ truckId: string, schedules: Schedule[] }>());
export const loadSchedulesFail = createAction('[Book] Load schedules fail', props<{ error: Error }>());
