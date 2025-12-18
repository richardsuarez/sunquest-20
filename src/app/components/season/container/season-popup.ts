import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Season } from '../models/season.model';
import { merge, Subject, takeUntil } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import * as MainActions from '../../main/store/main.actions';
import { selectSeasons, selectSeasonLoading } from '../../main/store/main.selectors';
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatSelectModule, MatOption } from "@angular/material/select";
import { MatProgressBar } from "@angular/material/progress-bar";
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-season-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatLabel,
    MatSelectModule,
    MatOption,
    MatProgressBar,
    ReactiveFormsModule],
  templateUrl: './season-popup.html',
  styleUrl: './season-popup.css'
})
export class SeasonPopup implements OnInit, OnDestroy {
  private store = inject(Store);
  private destroy$ = new Subject<void>();
  newSeason: Season = { id: '', seasonName: '', year: 0, isActive: false };
  seasons: Season[] = [];
  today = new Date();

  seasonNameControl = new FormControl<string>('');
  yearControl = new FormControl<number | null>(null);

  seasons$ = this.store.select(selectSeasons);
  loading$ = this.store.select(selectSeasonLoading);

  constructor(
    public dialogRef: MatDialogRef<SeasonPopup>,
  ) { }

  ngOnInit() {
    this.store.dispatch(MainActions.loadSeasons());
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.seasons = seasons;
    });

    merge(this.seasonNameControl.valueChanges, this.yearControl.valueChanges).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const seasonName = this.seasonNameControl.value || '';
      const year = this.yearControl.value || 0;

      if(seasonName && year && this.seasons && this.seasons.length > 0) {
        const season = this.seasons.find(s => s.seasonName === seasonName && s.year === year);
        if(season){
          this.seasonNameControl.setErrors({'seasonExists': true});
          this.yearControl.setErrors({'seasonExists': true});
          this.newSeason = { id: '', seasonName: '', year: 0, isActive: false };
        } else {
          this.seasonNameControl.setErrors(null);
          this.yearControl.setErrors(null);
          this.newSeason.seasonName = seasonName;
          this.newSeason.year = year;
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closePopup() {
    this.dialogRef.close();
  }

  closeSeason(season: Season) {
    if (!season.id) return;
    this.store.dispatch(MainActions.deactivateSeason({ seasonId: season.id }));
  }

  openSeason() {
    if (this.newSeason.seasonName === '' || this.newSeason.year === 0) return;
    this.store.dispatch(MainActions.activateSeason({ season: this.newSeason }));
  }

  isThereAnActiveSeason() {
    let aux = 0;
    for (let s of this.seasons) {
      if (s.isActive) {
        aux = 1;
        break;
      }
    }
    return aux;
  }

  shouldShowOpenButton(season: Season, activeSeason: Season | null, suggestedSeason: Season | null): boolean {
    return !activeSeason && !season.isActive && suggestedSeason?.id === season.id;
  }

  shouldShowCloseButton(season: Season, activeSeason: Season | null): boolean {
    return !!(activeSeason && activeSeason.id === season.id);
  }
}
