import { createAction, props } from '@ngrx/store';
import { Season } from '../../season/models/season.model';

export const loadSeasons = createAction(
  '[Season] Load Seasons'
);

export const loadSeasonsSuccess = createAction(
  '[Season] Load Seasons Success',
  props<{ seasons: Season[] }>()
);

export const loadSeasonsFail = createAction(
  '[Season] Load Seasons Fail',
  props<{ error: string }>()
);

export const activateSeason = createAction(
  '[Season] Activate Season',
  props<{ season: Season }>()
);

export const activateSeasonSuccess = createAction(
  '[Season] Activate Season Success',
  props<{ season: Season }>()
);

export const activateSeasonFail = createAction(
  '[Season] Activate Season Fail',
  props<{ error: string }>()
);

export const deactivateSeason = createAction(
  '[Season] Deactivate Season',
  props<{ seasonId: string }>()
);

export const deactivateSeasonSuccess = createAction(
  '[Season] Deactivate Season Success',
  props<{ seasonId: string }>()
);

export const deactivateSeasonFail = createAction(
  '[Season] Deactivate Season Fail',
  props<{ error: string }>()
);
