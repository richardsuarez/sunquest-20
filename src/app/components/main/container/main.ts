import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as MainActions from '../store/main.actions';

@Component({
  selector: 'app-main',
  imports: [
    Header,
    RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  constructor(
    private router: Router,
    private readonly store: Store,
  ){
    this.store.dispatch(MainActions.loadSeasons());
    router.navigate(['/main/calendar']);
  }
}
