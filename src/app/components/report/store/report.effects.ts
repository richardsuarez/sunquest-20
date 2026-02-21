import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";

import * as ReportActions from "./report.actions";
import { ReportService } from "../services/report.service";
import { map, switchMap, catchError } from "rxjs/operators";
import { from, of } from "rxjs";

@Injectable()
export class ReportEffects {
    private actions$ = inject(Actions);
    private reportService = inject(ReportService);

    bookings$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadBookingsStart),
            switchMap((action) =>
                this.reportService.getBookings(action.start, action.end, action.season).pipe(
                    map((bookings) => ReportActions.loadBookingsSuccess({ bookings })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    trips$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadTruckTrips),
            switchMap((action) =>
                this.reportService.getTruckTrips(action.season).pipe(
                    map((truckWithTrips) => ReportActions.loadTruckTripsSuccess({ trucks: truckWithTrips })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

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
                    map((customerList) => ReportActions.getCustomerSuccess({customerList})),
                    catchError((error) => of(ReportActions.fail({error})))
                )
            )
        )
    );

    customerListByRecNo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.getCustomersByRecNo),
            switchMap((action) => 
                from(this.reportService.getCustomerListByRecNo(action.recNo)).pipe(
                    map((customerList) => ReportActions.getCustomerSuccess({customerList})),
                    catchError((error) => of(ReportActions.fail({error})))
                )
            )
        )
    );
    
}

