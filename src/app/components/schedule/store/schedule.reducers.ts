import { createReducer, on } from '@ngrx/store';
import * as ScheduleActions from './schedule.actions';
import { initialScheduleState, ScheduleState } from './schedule.state';

export const SCHEDULE_FEATURE_KEY = 'schedule';

export const scheduleReducer = createReducer<ScheduleState>(
  initialScheduleState,
  on(ScheduleActions.getSchedulesStart, (s) => ({ ...s, loading: true, error: null })),
  on(ScheduleActions.getSchedulesSuccess, (s, a) => ({ ...s, loading: false, schedules: a.schedules })),
  on(ScheduleActions.getSchedulesFail, (s, a) => ({ ...s, loading: false, error: a.error })),

  on(ScheduleActions.addScheduleStart, (s) => ({ ...s, saving: true, error: null })),
  on(ScheduleActions.addScheduleSuccess, (s, a) => ({ 
    ...s, 
    saving: false, 
    schedules: [...s.schedules, a.schedule] 
  })),
  on(ScheduleActions.addScheduleFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(ScheduleActions.updateScheduleStart, (s) => ({ ...s, saving: true, error: null })),
  on(ScheduleActions.updateScheduleSuccess, (s, a) => ({
    ...s,
    saving: false,
    schedules: s.schedules.map(schedule => 
      schedule.id === a.scheduleId && schedule.truckId === a.truckId
        ? { ...schedule, ...a.schedule }
        : schedule
    )
  })),
  on(ScheduleActions.updateScheduleFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(ScheduleActions.deleteScheduleStart, (s) => ({ ...s, saving: true, error: null })),
  on(ScheduleActions.deleteScheduleSuccess, (s, a) => ({
    ...s,
    saving: false,
    schedules: s.schedules.filter(schedule => 
      !(schedule.id === a.scheduleId && schedule.truckId === a.truckId)
    )
  })),
  on(ScheduleActions.deleteScheduleFail, (s, a) => ({ ...s, saving: false, error: a.error }))
);