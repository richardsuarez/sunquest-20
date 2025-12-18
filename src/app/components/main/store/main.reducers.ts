import { createReducer, on } from '@ngrx/store';
import { initialMainState } from './main.state';
import * as SeasonActions from './main.actions';

export const mainReducer = createReducer(
  initialMainState,
  // Load Seasons
  on(SeasonActions.loadSeasons, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SeasonActions.loadSeasonsSuccess, (state, { seasons }) => ({
    ...state,
    seasons,
    loading: false,
    error: null
  })),

  on(SeasonActions.loadSeasonsFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Activate Season
  on(SeasonActions.activateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SeasonActions.activateSeasonSuccess, (state, { season }) => ({
    ...state,
    loading: false,
    error: null,
    seasons: [
      season,
      ...state.seasons,
    ]
  })),

  on(SeasonActions.activateSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Deactivate Season
  on(SeasonActions.deactivateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SeasonActions.deactivateSeasonSuccess, (state, { seasonId }) => {
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

  on(SeasonActions.deactivateSeasonFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
