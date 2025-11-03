import { createReducer, on } from '@ngrx/store';
import * as BookActions from './book.actions';
import { initialBookState } from './book.state';

export const BOOK_FEATURE_KEY = 'book';

export const bookReducer = createReducer(
  initialBookState,
  on(BookActions.getTrucksStart, (state) => ({ ...state, loadingTrucks: true, appError: null })),
  on(BookActions.getTrucksEnd, (state, action) => ({ ...state, loadingTrucks: false, trucks: action.trucks })),
  on(BookActions.getTrucksFail, (state, action) => ({ ...state, loadingTrucks: false, appError: action.error })),

  on(BookActions.addBookingStart, (state) => ({ ...state, savingBooking: true, appError: null })),
  on(BookActions.addBookingEnd, (state) => ({ ...state, savingBooking: false })),
  on(BookActions.addBookingFail, (state, action) => ({ ...state, savingBooking: false, appError: action.error })),
);
