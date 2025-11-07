import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as ScheduleActions from './schedule.actions';
import { ScheduleService } from '../services/schedule.service';

@Injectable()
export class ScheduleEffects {
  private injector = inject(EnvironmentInjector);
  private scheduleService = inject(ScheduleService);
  readonly loadSchedules$;
  readonly addSchedule$;
  readonly updateSchedule$;
  readonly deleteSchedule$;

  constructor(private actions$: Actions) {
    this.loadSchedules$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ScheduleActions.getSchedulesStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.scheduleService.getTruckSchedules(action.truckId).pipe(
            map(schedules => ScheduleActions.getSchedulesSuccess({ schedules })),
            catchError(err => of(ScheduleActions.getSchedulesFail({ error: err })))
          )
        ))
      )
    );

    this.addSchedule$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ScheduleActions.addScheduleStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.scheduleService.addSchedule(action.truckId, action.schedule).pipe(
            map(schedule => ScheduleActions.addScheduleSuccess({ schedule })),
            catchError(err => of(ScheduleActions.addScheduleFail({ error: err })))
          )
        ))
      )
    );

    this.updateSchedule$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ScheduleActions.updateScheduleStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.scheduleService.updateSchedule(action.truckId, action.scheduleId, action.schedule).pipe(
            map(() => ScheduleActions.updateScheduleSuccess({ 
              truckId: action.truckId, 
              scheduleId: action.scheduleId, 
              schedule: action.schedule 
            })),
            catchError(err => of(ScheduleActions.updateScheduleFail({ error: err })))
          )
        ))
      )
    );

    this.deleteSchedule$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ScheduleActions.deleteScheduleStart),
        switchMap(action => runInInjectionContext(this.injector, () =>
          this.scheduleService.deleteSchedule(action.truckId, action.scheduleId).pipe(
            map(() => ScheduleActions.deleteScheduleSuccess({ 
              truckId: action.truckId, 
              scheduleId: action.scheduleId 
            })),
            catchError(err => of(ScheduleActions.deleteScheduleFail({ error: err })))
          )
        ))
      )
    );
  }
}