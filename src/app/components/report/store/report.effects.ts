import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";

import * as ReportActions from "./report.actions";
import { ReportService } from "../services/report.service";
import { map, switchMap, catchError } from "rxjs/operators";
import { of } from "rxjs";

@Injectable()
export class ReportEffects {
    private actions$ = inject(Actions);
    private reportService = inject(ReportService);

    bookReport$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadBookReportStart),
            switchMap((action) =>
                this.reportService.getBookingReport(action.start, action.end, action.season).pipe(
                    map((bookingReport) => ReportActions.loadBookReportSuccess({ bookingReport })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );

    trucks$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReportActions.loadTrucks),
            switchMap(() =>
                this.reportService.getTrucks().pipe(
                    map((trucks) => ReportActions.loadTrucksSuccess({ trucks })),
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
                this.reportService.getTruckTrips(action.truckId, action.season).pipe(
                    map((trips) => ReportActions.loadTruckTripsSuccess({ truckId: action.truckId, trips })),
                    catchError((error) =>
                        of(ReportActions.fail({ error }))
                    )
                )
            )
        )
    );
    
}

