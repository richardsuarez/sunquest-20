import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as TruckActions from './truck.actions';
import { TruckService } from '../services/truck.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Truck } from '../model/truck.model';

@Injectable()
export class TruckEffects {
    private injector = inject(EnvironmentInjector);
    private truckService = inject(TruckService);
    readonly loadTrucks$;
    readonly addTruckStart$;
    readonly addTruckEnd$;
    readonly updateTruckStart$;
    readonly updateTruckEnd$;
    readonly deleteTruck$;

    constructor(
        private actions$: Actions,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.loadTrucks$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.getTruckListStart),
                switchMap(() => runInInjectionContext(this.injector, () =>
                    this.truckService.getTrucks().pipe(
                        map(trucks => {
                            const truckList = trucks.map(t => {
                                const asCreatedAt = (t as any).createdAt;
                                const createdAt = asCreatedAt ? (typeof asCreatedAt.toDate === 'function' ? asCreatedAt.toDate() : new Date(asCreatedAt)) : null;

                                return ({ ...t, createdAt,});
                            }) as Truck[];
                            return TruckActions.getTruckListSuccess({ trucks: truckList });
                        }),
                        catchError(err => of(TruckActions.getTruckListFail({ error: err })))
                    )
                ))
            )
        );

        this.addTruckStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.addTruckStart),
                switchMap(action => runInInjectionContext(this.injector, () =>
                    this.truckService.addTruck(action.truck).pipe(
                        map(truck => TruckActions.addTruckSuccess({ truck })),
                        catchError(err => of(TruckActions.addTruckFail({ error: err })))
                    )
                ))
            )
        );

        this.addTruckEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.addTruckSuccess),
                tap(() => {
                    this.snackBar.open('Truck added successfully', 'Close', { duration: 3000 });
                })
            ), { dispatch: false }
        );

        this.updateTruckStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.updateTruckStart),
                switchMap(action => runInInjectionContext(this.injector, () =>
                    this.truckService.updateTruck(action.id, action.truck).pipe(
                        map(() => TruckActions.updateTruckSuccess({ id: action.id, truck: action.truck })),
                        catchError(err => of(TruckActions.updateTruckFail({ error: err })))
                    )
                ))
            )
        );

        this.updateTruckEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.updateTruckSuccess),
                tap(() => {
                    this.snackBar.open('Truck updated successfully', 'Close', { duration: 3000 });
                })
            ), { dispatch: false }
        );

        this.deleteTruck$ = createEffect(() =>
            this.actions$.pipe(
                ofType(TruckActions.deleteTruckStart),
                switchMap(action => runInInjectionContext(this.injector, () =>
                    this.truckService.deleteTruck(action.id).pipe(
                        map(() => TruckActions.deleteTruckSuccess({ id: action.id })),
                        catchError(err => of(TruckActions.deleteTruckFail({ error: err })))
                    )
                ))
            )
        );
    }
}
