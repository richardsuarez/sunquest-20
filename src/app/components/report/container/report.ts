import { Component, OnInit } from '@angular/core';
import { Season } from '../../season/models/season.model';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe, CommonModule } from '@angular/common';

import * as MainSelectors from '../../main/store/main.selectors';
import * as ReportActions from '../store/report.actions';
import * as ReportSelectors from '../store/report.selectors';
import { MatButtonModule } from '@angular/material/button';
import { Truck } from '../../truck/model/truck.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-report',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    AsyncPipe,
],
  templateUrl: './report.html',
  styleUrl: './report.css',
  providers: [provideNativeDateAdapter()],
})
export class Report implements OnInit {

  today = new Date();
  month = this.today.getMonth();
  year = this.today.getFullYear();
  readonly dateRange = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  activeSeason: Season | null = null;
  seasons$!: Observable<Season[]>;
  loading$!: Observable<boolean>;
  loadingBookReport$!: Observable<boolean>;
  bookingReport$!: Observable<any>;
  trucks$!: Observable<Truck[] | null>;

  destroy$ = new Subject<void>();


  constructor(
    private readonly store: Store,
  ) {
    this.seasons$ = this.store.select(MainSelectors.selectSeasons);
    this.loading$ = this.store.select(ReportSelectors.loading);
    this.loadingBookReport$ = this.store.select(ReportSelectors.loadingBookReport);
    this.bookingReport$ = this.store.select(ReportSelectors.bookingReport);
    this.trucks$ = this.store.select(ReportSelectors.trucks);
  }

  ngOnInit() {
    this.store.dispatch(ReportActions.loadTrucks());

    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe((seasons) => {
      this.activeSeason = seasons.find(season => season.isActive) || null;
    });

    this.trucks$.pipe(takeUntil(this.destroy$)).subscribe((trucks) => {
      if(trucks && trucks.length > 0){
        trucks.forEach(t => {
          if(t.id && t.trips === undefined && this.activeSeason){
            this.store.dispatch(ReportActions.loadTruckTrips({
              truckId: t.id, 
              start: this.dateRange.controls.start.value ?? new Date(), 
              end: this.dateRange.controls.end.value ?? new Date(), 
              season: this.activeSeason,
            }));
          }
        })
      }
    });
  }

  searchResult(){
    if(!this.activeSeason){
      console.log('No active season selected');
      return;
    }

    if(!this.dateRange.value.start || !this.dateRange.value.end){

      this.dateRange.setErrors({ 'required': true });
      return;
    }
    this.dateRange.setErrors(null);
    this.store.dispatch(ReportActions.loadBookReportStart({start: this.dateRange.value.start!, end: this.dateRange.value.end!, season: this.activeSeason!}));
  }
}
