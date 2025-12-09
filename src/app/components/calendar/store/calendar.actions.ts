import { createAction, props } from '@ngrx/store';
import { CalendarEvent } from '../model/calendar-event.model';
import { Booking } from '../../book/model/booking.model';
import { Trip } from '../../trip/model/trip.model';

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

export const loadSelectedTrip = createAction('[Calendar] Load selected trip', props<{ trip: Trip | null }>());

export const deleteBookingStart = createAction('[Calendar] Delete Booking Start', props<{ booking: Booking, trip: Trip }>());
export const deleteBookingEnd = createAction('[Calendar] Delete Booking End', props<{ bookingId: string, trip: Trip }>());

export const addTripStart = createAction('[Book] Add trip start', props<{ truckId: string, trip: Trip }>());
export const addTripSuccess = createAction('[Book] Add trip success', props<{ truckId: string, trip: Trip }>());
export const addTripFail = createAction('[Book] Add trip fail', props<{ error: Error }>());

//TODO
export const updateTripStart = createAction('[Trip] Update trip start', props<{ truckId: string; trip: Trip }>());
export const updateTripSuccess = createAction('[Trip] Update trip success', props<{ truckId: string; trip: Partial<Trip> }>());
export const updateTripFail = createAction('[Trip] Update trip fail', props<{ error: Error }>());

export const deleteTripStart = createAction('[Trip] Delete trip start', props<{ truckId: string; trip: Trip }>());
export const deleteTripSuccess = createAction('[Trip] Delete trip success', props<{ truckId: string; tripId: string }>());
export const deleteTripFail = createAction('[Trip] Delete trip fail', props<{ error: Error }>());

export const deleteBookingsByTripStart = createAction('[Trip] Delete bookings by trip start', props<{ tripId: string }>());
export const deleteBookingsByTripSuccess = createAction('[Trip] Delete bookings by trip success', props<{ tripId: string }>());
export const deleteBookingsByTripFail = createAction('[Trip] Delete bookings by trip fail', props<{ error: Error }>());
