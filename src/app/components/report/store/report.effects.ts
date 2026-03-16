import { inject, Injectable, runInInjectionContext } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";

import * as ReportActions from "./report.actions";
import { ReportService } from "../services/report.service";
import { map, switchMap, catchError, concatMap, tap } from "rxjs/operators";
import { from, of } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Booking } from "../../book/model/booking.model";

@Injectable()
export class ReportEffects {
    private actions$ = inject(Actions);
    private reportService = inject(ReportService);
    private readonly snackBar = inject(MatSnackBar)

    bookingsGeneral$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadBookingsStart),
            switchMap((action) =>
                this.reportService.getBookings(action.start, action.end, action.season, action.origin).pipe(
                    map((bookings) => ReportActions.loadBookingsSuccess({ bookings })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    bookingsForTrip$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadBookingsForTripStart),
            switchMap((action) =>
                this.reportService.fetchBookingsForTrip(action.tripId, action.season).pipe(
                    map((bookings) => ReportActions.loadBookingsSuccess({ bookings })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    tripsBySeason$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadTruckTripsBySeason),
            switchMap((action) =>
                this.reportService.getTruckTripsBySeason(action.season).pipe(
                    map((truckWithTrips) => ReportActions.loadTruckTripsSuccess({ trucks: truckWithTrips })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    tripsByDateRange$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadTruckTripsByDateRange),
            switchMap((action) =>
                this.reportService.getTruckTripsByDateRange(action.start, action.end).pipe(
                    map((truckWithTrips) => ReportActions.loadTruckTripsSuccess({ trucks: truckWithTrips })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    getAllTrucks$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.getAllTrucks),
            switchMap(() =>
                this.reportService.getAllTrucks().pipe(
                    map(trucks => ReportActions.loadTruckTripsSuccess({ trucks })),
                    catchError(error => of(ReportActions.fail({ error })))
                )
            )
        )
    )

    bookReport$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.getBookReport),
            switchMap((action) =>
                this.reportService.transformBookingsReport(action.bookings, action.trucks).pipe(
                    map((bookReport) => ReportActions.getBookReportSuccess({ bookReport })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    customerListByFromTo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.getCustomersByFromTo),
            switchMap((action) =>
                from(this.reportService.getCustomerList(action.from, action.to)).pipe(
                    map((customerList) => ReportActions.getCustomerSuccess({ customerList })),
                    catchError((error) => of(ReportActions.fail({ error })))
                )
            )
        )
    );

    customerListByRecNo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.getCustomersByRecNo),
            switchMap((action) =>
                from(this.reportService.getCustomerListByRecNo(action.recNo)).pipe(
                    map((customerList) => ReportActions.getCustomerSuccess({ customerList })),
                    catchError((error) => of(ReportActions.fail({ error })))
                )
            )
        )
    );

    addTrip$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.addTripStart),
            switchMap((action) =>
                from(this.reportService.addTrip(action.truckId, action.trip)).pipe(
                    map((trip) => {
                        this.snackBar.open('Trip added', 'Close', { duration: 3000 });
                        return ReportActions.addTripSuccess({
                            truckId: action.truckId,
                            trip: trip
                        });
                    }),
                    catchError((err: Error) => {
                        this.snackBar.open('Failed to add trip', 'Close', { duration: 3000 });
                        return of(ReportActions.addTripFail({ error: err }));
                    })
                )
            )
        )
    );

    addTripAndUpdateBookings$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.addTripAndUpdateBookingsStart),
            switchMap(action =>
                from(this.reportService.getLastLoadNumberOfAtruck(action.truckId, action.season)).pipe(
                    switchMap((lastloadNumber) =>
                        from(this.reportService.addTrip(action.truckId, {...action.trip, loadNumber: lastloadNumber + 1})).pipe(
                            concatMap((trip) => {
                                const bookingsToUpdate: Booking[] = []
                                const updateActions: any[] = action.bookings.map(booking => {
                                    if (!booking.tripId && booking.truckId && booking.truckId === action.truckId) {
                                        bookingsToUpdate.push({
                                            ...booking,
                                            tripId: trip.id || '',
                                            truckId: action.truckId,
                                            departureDate: trip.departureDate
                                        })
                                        return ReportActions.updateBooking({
                                            booking: {
                                                ...booking,
                                                tripId: trip.id || '',
                                                truckId: action.truckId,
                                                departureDate: trip.departureDate
                                            }
                                        });
                                    } else {
                                        bookingsToUpdate.push(booking);
                                        return of(null);
                                    }
                                });
                                updateActions.push(ReportActions.addTripAndUpdateBookingsSuccess({ bookings: bookingsToUpdate }));
                                return from(updateActions);
                            }),
                            catchError((err: Error) => {
                                this.snackBar.open('Failed to add trip', 'Close', { duration: 3000 });
                                return of(ReportActions.addTripFail({ error: err }));
                            })
                        )
                    )
                )

            )
        )
    )

    updateBooking$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.updateBooking),
            switchMap((action) =>
                from(this.reportService.updateBooking(action.booking)).pipe(
                    catchError((error: Error) => {
                        this.snackBar.open('Failed to update booking', 'Close', { duration: 3000 });
                        return of(ReportActions.fail({ error }));
                    })
                )
            )
        ), { dispatch: false }
    )

    addTripandUpdateBookingsSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.addTripAndUpdateBookingsSuccess),
            tap(() =>
                this.snackBar.open('Trip added and bookings updated successfully', 'Close', { duration: 3000 }),
            )
        ),
        { dispatch: false },
    )
}

