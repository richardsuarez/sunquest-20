import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as BookActions from './book.actions';
import { TruckService } from '../../truck/services/truck.service';
import { BookingService } from '../service/booking.service';
import { ScheduleService } from '../../schedule/services/schedule.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class BookEffects {
    private injector = inject(EnvironmentInjector);
    private truckService = inject(TruckService);
    private bookingService = inject(BookingService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private scheduleService = inject(ScheduleService);

    readonly addBooking$;
    readonly addSchedule$;
    readonly loadSchedules$;

    constructor(private actions$: Actions) {
        // Add Booking effect
        this.addBooking$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addBookingStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.bookingService.addBooking(action.booking).pipe(
                            map(() => {
                                this.snackBar.open('Booking saved', 'Close', { duration: 3000 });
                                this.router.navigate(['/main/customer']);
                                return BookActions.addBookingEnd();
                            }),
                            catchError((err: Error) => of(BookActions.addBookingFail({ error: err })))
                        )
                    )
                )
            )
        );

        // Add Schedule effect
        this.addSchedule$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.addScheduleStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        from(this.scheduleService.addSchedule(action.truckId, action.schedule)).pipe(
                            map((schedule) => {
                                this.snackBar.open('Schedule added', 'Close', { duration: 3000 });
                                return BookActions.addScheduleSuccess({ 
                                    truckId: action.truckId, 
                                    schedule: schedule 
                                });
                            }),
                            catchError((err: Error) => {
                                this.snackBar.open('Failed to add schedule', 'Close', { duration: 3000 });
                                return of(BookActions.addScheduleFail({ error: err }));
                            })
                        )
                    )
                )
            )
        );

        // Load Schedules effect
        this.loadSchedules$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.loadSchedulesStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.scheduleService.getTruckSchedules(action.truckId).pipe(
                            map((schedules) => BookActions.loadSchedulesSuccess({ 
                                truckId: action.truckId, 
                                schedules: schedules 
                            })),
                            catchError((err: Error) => of(BookActions.loadSchedulesFail({ error: err })))
                        )
                    )
                )
            )
        );
    }
}