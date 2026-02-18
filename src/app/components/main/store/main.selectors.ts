import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MainState } from './main.state';

export const MAIN_FEATURE_KEY = 'main';

export const selectMainState = createFeatureSelector<MainState>(MAIN_FEATURE_KEY);

export const allCustomer = createSelector(
  selectMainState,
  (state: MainState) => state.customers
)

export const selectSeasons = createSelector(
  selectMainState,
  (state: MainState) => state.seasons
);

export const selectSeasonLoading = createSelector(
  selectMainState,
  (state: MainState) => state.loading
);

export const selectSeasonError = createSelector(
  selectMainState,
  (state: MainState) => state.error
);

export const selectIsMobile = createSelector(
  selectMainState,
  (state: MainState) => state.isMobile
);

export const customerViewModel = createSelector(
  selectMainState,
  (state: MainState) => state.customerViewModel
);


export const bookingVM = createSelector(
  selectMainState,
  (state: MainState) => state.bookingViewModel);
