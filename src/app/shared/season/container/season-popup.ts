import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Season } from '../models/season.model';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import * as MainActions from '../../../components/main/store/main.actions';
import { selectSeasons, selectSeasonLoading } from '../../../components/main/store/main.selectors';
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatSelectModule, MatOption } from "@angular/material/select";
import { MatProgressBar } from "@angular/material/progress-bar";

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
    MatProgressBar],
  templateUrl: './season-popup.html',
  styleUrl: './season-popup.css'
})
export class SeasonPopup implements OnInit, OnDestroy {
  private store = inject(Store);
  private destroy$ = new Subject<void>();
  newSeason: Season = { id: '', seasonName: '', year: 0, isActive: false };
  seasons: Season[] = [];
  today = new Date();

  seasons$ = this.store.select(selectSeasons);
  loading$ = this.store.select(selectSeasonLoading);

  ngOnInit() {
    this.store.dispatch(MainActions.loadSeasons());
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.seasons = seasons;
    });
  }

  ngOnDestroy() {
    this.destroy$.complete();
  }

  openSeason() {
    if (this.newSeason.seasonName === '' || this.newSeason.year === 0) return;
    this.store.dispatch(MainActions.activateSeason({ season: this.newSeason }));
  }

  closeSeason(season: Season) {
    if (!season.id) return;
    this.store.dispatch(MainActions.deactivateSeason({ seasonId: season.id }));
  }

  isThereAnActiveSeason(){
    let aux = 0;
    for(let s of this.seasons){
      if(s.isActive){
        aux = 1;
        break;
      }
    }
    return aux;
  }

  pickSeasonName(event: any): void {
    this.newSeason.seasonName = event.value;
  }

  pickYear(event: any): void {
    this.newSeason.year = event.value;
  }

  shouldShowOpenButton(season: Season, activeSeason: Season | null, suggestedSeason: Season | null): boolean {
    return !activeSeason && !season.isActive && suggestedSeason?.id === season.id;
  }

  shouldShowCloseButton(season: Season, activeSeason: Season | null): boolean {
    return !!(activeSeason && activeSeason.id === season.id);
  }
}
