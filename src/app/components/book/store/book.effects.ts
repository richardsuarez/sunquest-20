import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as BookActions from './book.actions';
import { TruckService } from '../service/truck.service';
import { BookingService } from '../service/booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class BookEffects {
    private injector = inject(EnvironmentInjector);
    private truckService = inject(TruckService);
    private bookingService = inject(BookingService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);

    readonly loadTrucks$;
    readonly addBooking$;

    constructor(private actions$: Actions) {

        this.loadTrucks$ = createEffect(() =>
            this.actions$.pipe(
                ofType(BookActions.getTrucksStart),
                switchMap(() =>
                    runInInjectionContext(this.injector, () =>
                        this.truckService.getTrucks().pipe(
                            map((t) => BookActions.getTrucksEnd({ trucks: t })),
                            catchError((err: Error) => of(BookActions.getTrucksFail({ error: err })))
                        )
                    )
                )
            )
        );

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
    }
}