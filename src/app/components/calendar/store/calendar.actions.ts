import { createAction, props } from '@ngrx/store';
import { CalendarEvent } from '../model/calendar-event.model';
import { Booking } from '../../book/model/booking.model';

export const addCalendarEvent = createAction('[Calendar] Add Event', props<{ event: CalendarEvent }>());
export const removeCalendarEvent = createAction('[Calendar] Remove Event', props<{ eventId: string; dateKey: string }>());
export const updateCalendarEvent = createAction('[Calendar] Update Event', props<{ event: CalendarEvent; oldDateKey: string }>());
export const clearCalendarEventsForTruck = createAction('[Calendar] Clear Events For Truck', props<{ truckId: string }>());
export const loadBookingsForMonth = createAction('[Calendar] Load Bookings For Month', props<{ startDate: Date; endDate: Date; }>());
export const loadBookingsForMonthSuccess = createAction('[Calendar] Load Bookings For Month Success', props<{ bookings: Booking[] }>());
export const loadBookingsForMonthFail = createAction('[Calendar] Load Bookings For Month Fail', props<{ error: Error }>());
export const loadTrucksAndTrips = createAction('[Calendar] Load Trucks And Trips', props<{ monthStart: Date; monthEnd: Date }>());
export const loadTrucksAndTripsSuccess = createAction('[Calendar] Load Trucks And Trips Success', props<{ trucks: any[]; trips: { [truckId: string]: any[] } }>());
export const loadTrucksAndTripsFail = createAction('[Calendar] Load Trucks And Trips Fail', props<{ error: Error }>());

export const deleteBookingStart = createAction('[Calendar] Delete Booking Start', props<{ id: string }>());
export const deleteBookingEnd = createAction('[Calendar] Delete Booking End');
