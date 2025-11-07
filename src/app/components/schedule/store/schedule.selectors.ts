import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScheduleState } from './schedule.state';
import { SCHEDULE_FEATURE_KEY } from './schedule.reducers';

export const selectScheduleState = createFeatureSelector<ScheduleState>(SCHEDULE_FEATURE_KEY);

export const schedules = createSelector(
  selectScheduleState,
  (state: ScheduleState) => state.schedules
);

export const schedulesByTruckId = (truckId: string) => createSelector(
  selectScheduleState,
  (state: ScheduleState) => state.schedules.filter(s => s.truckId === truckId)
);

export const loadingSchedules = createSelector(
  selectScheduleState,
  (state: ScheduleState) => state.loading
);

export const savingSchedule = createSelector(
  selectScheduleState,
  (state: ScheduleState) => state.saving
);

export const scheduleError = createSelector(
  selectScheduleState,
  (state: ScheduleState) => state.error
);