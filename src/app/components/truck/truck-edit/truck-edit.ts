import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Truck } from '../model/truck.model';
import { selectedTruck, saving } from '../store/truck.selectors';
import * as TruckActions from '../store/truck.actions';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-truck-edit',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormField, 
    MatLabel, 
    MatInput, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './truck-edit.html',
  styleUrls: ['./truck-edit.css']
})
export class TruckEdit implements OnDestroy {
  private store = inject(Store);
  public router = inject(Router);
  destroy$ = new Subject<void>();

  saving$ = this.store.select(saving as any);

  form = new FormGroup({
    truckNumber: new FormControl<string | null>(null, Validators.required),
    companyName: new FormControl<string | null>(null, Validators.required),
    loadCapacity: new FormControl<number | null>(null, [Validators.required]),
    carCapacity: new FormControl<number | null>(null, [Validators.required]),
    loadNumber: new FormControl<string | null>(null),
  });
  selectedTruck: Truck | null = null;

  constructor(
  public dialogRef: MatDialogRef<TruckEdit>,
    @Inject(MAT_DIALOG_DATA) readonly data: string,
  ) {
    this.store.select(selectedTruck as any).pipe(takeUntil(this.destroy$)).subscribe((t: Truck | null) => {
      this.selectedTruck = t;
      if (t) {
        this.form.patchValue({
          truckNumber: t.truckNumber,
          companyName: t.companyName,
          loadCapacity: t.loadCapacity,
          carCapacity: t.carCapacity,
          loadNumber: t.loadNumber
        });
      }
    });

    this.saving$.pipe(takeUntil(this.destroy$)).subscribe(savingState => {
      if (savingState === false) {
        this.dialogRef.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

  const payload = this.form.getRawValue() as Partial<Truck>;
    if (this.data === 'New') {
      this.store.dispatch(TruckActions.addTruckStart({ truck: payload }));
    } else {
      // selectedTruck should be present
      this.store.select(selectedTruck as any).pipe(takeUntil(this.destroy$)).subscribe(s => {
        if (s && s.id) {
          this.store.dispatch(TruckActions.updateTruckStart({ id: s.id, truck: payload }));
        }
      }).unsubscribe();
    }

    this.router.navigate(['/main/truck']);
  }

  cancel() {
    this.router.navigate(['/main/truck']);
  }
}
