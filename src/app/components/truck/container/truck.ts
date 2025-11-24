import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { Truck } from '../model/truck.model';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../../../shared/popup/popup.component';
import * as TruckActions from '../store/truck.actions';
import { loadingTruckList, trucks as trucksSelector } from '../store/truck.selectors';
import { MatProgressBar } from '@angular/material/progress-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TruckEdit } from '../truck-edit/truck-edit';

@Component({
  selector: 'app-truck-list',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatProgressBar,
  ],
  templateUrl: './truck.html',
  styleUrls: ['./truck.css']
})
export class TruckList implements OnInit {
  private store = inject(Store);
  public router = inject(Router);
  isMobile!: boolean;
  trucks$!: Observable<Truck[]>;
  loading$!: Observable<boolean>

  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly dialog: MatDialog,
  ){}

  ngOnInit(): void {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });
    this.loading$ = this.store.select(loadingTruckList);
    this.trucks$ = this.store.select(trucksSelector as any);
    this.store.dispatch(TruckActions.getTruckListStart());
  }

  edit(truck: Truck) {
    // set selected truck in store then navigate to edit
    if (truck && truck.id) {
      this.store.dispatch(TruckActions.loadTruck({ truck }));
      this.dialog.open(TruckEdit, {
        data: 'Edit',
      });
    }
  }

  create() {
    this.store.dispatch(TruckActions.clearSelectedTruck());
    this.dialog.open(TruckEdit, {
      data: 'New',
    });
  }

  confirmDelete(truck: Truck) {
    const ref = this.dialog.open(PopupComponent, {
      data: {
        title: 'Delete Truck',
        message: 'Are you sure you want to delete this truck? This action cannot be undone.',
        cancelButton: 'Cancel',
        successButton: 'Delete'
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result === 'Success' && truck.id) {
        this.store.dispatch(TruckActions.deleteTruckStart({ id: truck.id }));
      }
    });
  }
}
