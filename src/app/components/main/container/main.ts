import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as MainActions from '../store/main.actions';
import { Subject, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-main',
  imports: [
    Header,
    RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  destroy$ = new Subject<void>();
  constructor(
    private readonly breakpoints: BreakpointObserver,
    private router: Router,
    private readonly store: Store,
  ){
    this.store.dispatch(MainActions.loadSeasons());
    this.router.navigate(['/main/calendar']);
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.store.dispatch(MainActions.setBreakpoint({ isMobile: res.matches }));
    });
  }
}
