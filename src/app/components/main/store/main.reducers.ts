import { createReducer, on } from '@ngrx/store';
import { initialMainState } from './main.state';
import * as MainActions from './main.actions';
import { Booking } from '../../book/model/booking.model';
import { Season } from '../../season/models/season.model';

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
  on(MainActions.openSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.openSeasonSuccess, (state, { season }) => ({
    ...state,
    loading: false,
    error: null,
    seasons: [
      season,
      ...state.seasons.map((s) => {
        if(s.isActive){
          return {
            ...s, 
            isActive: false
          } as Season;
        }
        return s;
      }),
    ]
  })),

  on(MainActions.openSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(MainActions.activateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.activateSeasonSuccess, (state, action) => ({
    ...state,
    loading: false,
    seasons: state.seasons.map((s) => {
      if(s.id === action.season.id){
        return action.season;
      }
      if(s.isActive === true){
        return {
          ...s,
          isActive: false
        } as Season
      }
      return s;
    }),
    error: null,
  })),

  on(MainActions.activateSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Deactivate Season
  on(MainActions.closeSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MainActions.closeSeasonSuccess, (state, { seasonId }) => {
    const updatedSeasons = state.seasons.map(s =>
      s.id === seasonId ? { ...s, isCurrent: false } : s
    );

    return {
      ...state,
      seasons: updatedSeasons,
      activeSeason: null,
      loading: false,
      error: null
    };
  }),

  on(MainActions.closeSeasonFail, (state, { error }) => ({
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