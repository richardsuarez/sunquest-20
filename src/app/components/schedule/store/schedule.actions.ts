import { createAction, props } from '@ngrx/store';
import { Schedule } from '../model/schedule.model';

export const getSchedulesStart = createAction(
  '[Schedule] Get schedules start',
  props<{ truckId: string }>()
);

export const getSchedulesSuccess = createAction(
  '[Schedule] Get schedules success',
  props<{ schedules: Schedule[] }>()
);

export const getSchedulesFail = createAction(
  '[Schedule] Get schedules fail',
  props<{ error: Error }>()
);

export const addScheduleStart = createAction(
  '[Schedule] Add schedule start',
  props<{ truckId: string; schedule: Partial<Schedule> }>()
);

export const addScheduleSuccess = createAction(
  '[Schedule] Add schedule success',
  props<{ schedule: Schedule }>()
);

export const addScheduleFail = createAction(
  '[Schedule] Add schedule fail',
  props<{ error: Error }>()
);

export const updateScheduleStart = createAction(
  '[Schedule] Update schedule start',
  props<{ truckId: string; scheduleId: string; schedule: Partial<Schedule> }>()
);

export const updateScheduleSuccess = createAction(
  '[Schedule] Update schedule success',
  props<{ truckId: string; scheduleId: string; schedule: Partial<Schedule> }>()
);

export const updateScheduleFail = createAction(
  '[Schedule] Update schedule fail',
  props<{ error: Error }>()
);

export const deleteScheduleStart = createAction(
  '[Schedule] Delete schedule start',
  props<{ truckId: string; scheduleId: string }>()
);

export const deleteScheduleSuccess = createAction(
  '[Schedule] Delete schedule success',
  props<{ truckId: string; scheduleId: string }>()
);

export const deleteScheduleFail = createAction(
  '[Schedule] Delete schedule fail',
  props<{ error: Error }>()
);