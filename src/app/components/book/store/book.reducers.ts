import { createReducer, on } from '@ngrx/store';
import * as BookActions from './book.actions';
import { initialBookState } from './book.state';
import { CalendarEvent } from '../../calendar/model/calendar-event.model';
import { Booking } from '../model/booking.model';

export const BOOK_FEATURE_KEY = 'book';

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cleanCalendarEvents(events: { [key: string]: CalendarEvent[] }): { [key: string]: CalendarEvent[] } {
  const cleaned: { [key: string]: CalendarEvent[] } = {};
  Object.keys(events).forEach(key => {
    if (events[key] && events[key].length > 0) {
      cleaned[key] = events[key];
    }
  });
  return cleaned;
}

export const bookReducer = createReducer(
  initialBookState,

  on(BookActions.addBookingStart, (state) => ({
    ...state,
    savingBooking: true,
    appError: null
  })),
  on(BookActions.addBookingEnd, (state) => ({
    ...state,
    savingBooking: false
  })),
  on(BookActions.addBookingFail, (state, action) => ({
    ...state,
    savingBooking: false,
    appError: action.error
  })),
  on(BookActions.loadTripsSuccess, (state, { truckId, trips }) => ({
    ...state,
    trips: {
      ...state.trips,
      [truckId]: trips
    }
  })),
  on(BookActions.addTripSuccess, (state, { truckId, trip }) => ({
    ...state,
    trips: {
      ...state.trips,
      [truckId]: [
        ...((state.trips && state.trips[truckId]) || []),
        trip
      ]
    }
  })),
  // Optimistically update a trip's remaining capacities (decrease by provided deltas)
  on(BookActions.getTruckListStart, (s) => ({ ...s, loading: true, appError: null })),
  on(BookActions.getTruckListSuccess, (s, a) => ({ ...s, loading: false, trucks: a.trucks })),
  on(BookActions.getTruckListFail, (s, a) => ({ ...s, loading: false, appError: a.error })),

  on(BookActions.createEmptyBooking, (state) => ({
    ...state,
    bookingViewModel: {} as Booking
  })),
  on(BookActions.loadBooking, (state, { booking }) => ({
    ...state,
    bookingViewModel: booking
  }))
);
