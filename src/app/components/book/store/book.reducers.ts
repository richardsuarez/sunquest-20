import { createReducer, on } from '@ngrx/store';
import * as BookActions from './book.actions';
import { initialBookState } from './book.state';
import { Booking } from '../model/booking.model';

export const BOOK_FEATURE_KEY = 'book';

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

  
  on(BookActions.updateBookingStart, (state) => ({
    ...state,
    savingBooking: true,
    appError: null
  })),
  on(BookActions.updateBookingEnd, (state) => ({
    ...state,
    savingBooking: false
  })),
  on(BookActions.updateBookingFail, (state, action) => ({
    ...state,
    savingBooking: false,
    appError: action.error
  })),
);