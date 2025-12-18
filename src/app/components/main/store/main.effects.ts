import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as MainActions from './main.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainService } from '../services/main.service';

@Injectable()
export class MainEffects {
  private actions$ = inject(Actions);
  private mainService = inject(MainService);
  private snackBar = inject(MatSnackBar);

  loadSeasons$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.loadSeasons),
      switchMap(() =>
        this.mainService.getSeasons().pipe(
          map(seasons => MainActions.loadSeasonsSuccess({ seasons })),
          catchError(error => {
            console.error('Error loading seasons:', error);
            return of(MainActions.loadSeasonsFail({ error: error.message }));
          })
        )
      )
    )
  );

  activateSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.activateSeason),
      switchMap((action) =>
        this.mainService.activateSeason(action.season).pipe(
          tap(() => {
            this.snackBar.open('Season activated', 'Close', { duration: 3000 });
          }),
          map((newSeason) => MainActions.activateSeasonSuccess({ season: newSeason })),
          catchError(error => {
            console.error('Error activating season:', error);
            this.snackBar.open('Failed to activate season', 'Close', { duration: 3000 });
            return of(MainActions.activateSeasonFail({ error: error.message }));
          })
        )
      )
    )
  );

  deactivateSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.deactivateSeason),
      switchMap(({ seasonId }) =>
        this.mainService.deactivateSeason(seasonId).pipe(
          tap(() => {
            this.snackBar.open('Season deactivated', 'Close', { duration: 3000 });
          }),
          map(() => MainActions.deactivateSeasonSuccess({ seasonId })),
          catchError(error => {
            console.error('Error deactivating season:', error);
            this.snackBar.open('Failed to deactivate season', 'Close', { duration: 3000 });
            return of(MainActions.deactivateSeasonFail({ error: error.message }));
          })
        )
      )
    )
  );
}
