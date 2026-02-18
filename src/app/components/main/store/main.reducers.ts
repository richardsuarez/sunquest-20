import { createReducer, on } from '@ngrx/store';
import { initialMainState } from './main.state';
import * as MainActions from './main.actions';

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
  }))
);
