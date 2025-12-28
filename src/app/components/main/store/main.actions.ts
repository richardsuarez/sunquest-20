import { createAction, props } from '@ngrx/store';
import { Season } from '../../season/models/season.model';

export const loadSeasons = createAction(
  '[Main] Load Seasons'
);

export const loadSeasonsSuccess = createAction(
  '[Main] Load Seasons Success',
  props<{ seasons: Season[] }>()
);

export const loadSeasonsFail = createAction(
  '[Main] Load Seasons Fail',
  props<{ error: string }>()
);

export const activateSeason = createAction(
  '[Main] Activate Season',
  props<{ season: Season }>()
);

export const activateSeasonSuccess = createAction(
  '[Main] Activate Season Success',
  props<{ season: Season }>()
);

export const activateSeasonFail = createAction(
  '[Main] Activate Season Fail',
  props<{ error: string }>()
);

export const deactivateSeason = createAction(
  '[Main] Deactivate Season',
  props<{ seasonId: string }>()
);

export const deactivateSeasonSuccess = createAction(
  '[Main] Deactivate Season Success',
  props<{ seasonId: string }>()
);

export const deactivateSeasonFail = createAction(
  '[Main] Deactivate Season Fail',
  props<{ error: string }>()
);
