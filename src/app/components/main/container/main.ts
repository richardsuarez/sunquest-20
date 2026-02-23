import { Component, OnInit } from '@angular/core';
import { Header } from '../../header/header';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as MainActions from '../store/main.actions';
import { Observable, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Season } from '../../season/models/season.model';
import { gettingPaidBookings, paidBookings, selectSeasons } from '../store/main.selectors';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [
    CommonModule,
    Header,
    MatProgressSpinnerModule,
    RouterOutlet,
  ],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main implements OnInit{
  destroy$ = new Subject<void>();
  gettingPaidBookings$!: Observable<boolean>;
  paidBookings$!: Observable<string>; // this will have the form <paid bookings>/<total bookings>
  seasons$!: Observable<Season[]>

  constructor(
    private readonly breakpoints: BreakpointObserver,
    private router: Router,
    private readonly store: Store,
  ){
    this.seasons$ = this.store.select(selectSeasons);
    this.gettingPaidBookings$ = this.store.select(gettingPaidBookings)
    this.paidBookings$ = this.store.select(paidBookings)
    this.store.dispatch(MainActions.loadSeasons());

    this.router.navigate(['/main/calendar']);

    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.store.dispatch(MainActions.setBreakpoint({ isMobile: res.matches }));
    });
  }

  ngOnInit(){
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      const activeSeason = seasons.find(s => s.isActive === true);
      if(activeSeason){
        this.store.dispatch(MainActions.getPaidBookings({season: activeSeason}))
      }
    })
  }
}
