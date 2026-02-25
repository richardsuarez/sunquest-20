import { createReducer, on } from '@ngrx/store';
import { initialMainState } from './main.state';
import * as MainActions from './main.actions';
import { Booking } from '../../book/model/booking.model';

export const mainReducer = createReducer(
  initialMainState,
  // Load Seasons
  on(MainActions.loadSeasons, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.loadSeasonsSuccess, (state, { seasons }) => ({
    ...state,
    seasons,
    loading: false,
    error: null
  })),

  on(MainActions.loadSeasonsFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Activate Season
  on(MainActions.activateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.activateSeasonSuccess, (state, { season }) => ({
    ...state,
    loading: false,
    error: null,
    seasons: [
      season,
      ...state.seasons,
    ]
  })),

  on(MainActions.activateSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Deactivate Season
  on(MainActions.deactivateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.deactivateSeasonSuccess, (state, { seasonId }) => {
    const updatedSeasons = state.seasons.map(s =>
      s.id === seasonId ? { ...s, isActive: false } : s
    );

    return {
      ...state,
      seasons: updatedSeasons,
      activeSeason: updatedSeasons.find(s => s.isActive) || null,
      loading: false,
      error: null
    };
  }),

  on(MainActions.deactivateSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(MainActions.setBreakpoint, (state, { isMobile }) => ({
    ...state,
    isMobile
  })),
  on(MainActions.loadCustomer, (state, action) => ({
    ...state,
    customerViewModel: action.customer
  })),
  on(MainActions.loadBooking, (state, { booking }) => ({
    ...state,
    bookingViewModel: booking
  })),
  on(MainActions.createEmptyBooking, (state) => ({
      ...state,
      bookingViewModel: {} as Booking
  })),
  on(MainActions.deleteBookingStart, (state, action) => ({
      ...state,
      deletingBooking: action.booking.id ?? null,
      error: null,
  })),
  on(MainActions.deleteBookingSuccess, (state) => ({
      ...state,
      deletingBooking: null,
  })),
  on(MainActions.deleteBookingFail, (state, { error }) => ({
      ...state,
      deletingBooking: null,
      error: error.message,
  })),
  on(MainActions.getPaidBookings, (state) => ({
    ...state,
    gettingPaidBookings: true,
  })),
  on(MainActions.getPaidBookingsSuccess, (state, action) => ({
    ...state,
    gettingPaidBookings: false,
    paidBookings: action.paidBookings
  }))
)