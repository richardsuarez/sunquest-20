import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, Injectable, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, Subject, takeUntil, withLatestFrom } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInput } from '@angular/material/input';
import { AllowAlphanumericDirective } from "../../../shared/directives/allow-alphanumeric.directive";
import { AllowAlphaAndSpecificCharDirective } from "../../../shared/directives/allow-alpha-and-specific-char.directive";
import { AllowOnlyNumbersDirective } from "../../../shared/directives/allow-only-numbers.directive";
import { Store } from '@ngrx/store';
import { customerViewModel, savingCustomer } from '../store/customer.selectors';
import { Customer } from '../model/customer.model';
import { updateCustomerStart, addCustomerStart } from '../store/customer.actions';

@Component({
  selector: 'app-customer-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatOption,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelect,
    AllowAlphanumericDirective,
    AllowAlphaAndSpecificCharDirective,
    AllowOnlyNumbersDirective,
    AsyncPipe,
  ],
  templateUrl: './customer-edit.html',
  styleUrl: './customer-edit.css',
})
@Injectable()
export class CustomerEdit implements OnInit, OnDestroy {
  crud!: string;
  destroy$ = new Subject<void>()
  isMobile!: boolean;
  savingCustomer$!: Observable<boolean>;
  customerVM$!: Observable<Partial<Customer> | null>;
  currentCustomer!: Partial<Customer> | null;

  customerForm: FormGroup<{
    primaryFirstName: FormControl<string | null>;
    primaryLastName: FormControl<string | null>;
    primaryMiddleName: FormControl<string | null>;
    primaryTitle: FormControl<string | null>;
    secondaryFirstName: FormControl<string | null>;
    secondaryLastName: FormControl<string | null>;
    secondaryMiddleName: FormControl<string | null>;
    secondaryTitle: FormControl<string | null>;
    email: FormControl<string | null>;
    telephone: FormControl<string | null>;
    phone: FormControl<string | null>;
    address1: FormControl<string | null>;
    address2: FormControl<string | null>;
    bldg: FormControl<string | null>;
    apt: FormControl<string | null>;
    city: FormControl<string | null>;
    state: FormControl<string | null>;
    zipCode: FormControl<string | null>;
  }> = new FormGroup({
    primaryFirstName: new FormControl<string | null>('', Validators.required),
    primaryLastName: new FormControl<string | null>('', Validators.required),
    primaryMiddleName: new FormControl<string | null>(''),
    primaryTitle: new FormControl<string | null>('', Validators.required),
    secondaryFirstName: new FormControl<string | null>(''),
    secondaryLastName: new FormControl<string | null>(''),
    secondaryMiddleName: new FormControl<string | null>(''),
    secondaryTitle: new FormControl<string | null>(''),
    email: new FormControl<string | null>('', Validators.email),
    telephone: new FormControl<string | null>(''),
    phone: new FormControl<string | null>('', Validators.required),
    address1: new FormControl<string | null>('', Validators.required),
    address2: new FormControl<string | null>(''),
    bldg: new FormControl<string | null>(''),
    apt: new FormControl<string | null>(''),
    city: new FormControl<string | null>('', Validators.required),
    state: new FormControl<string | null>('', Validators.required),
    zipCode: new FormControl<string | null>(''),
  })

  private store = inject(Store)

  constructor(
    readonly breakpoints: BreakpointObserver,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
  ) {
    this.savingCustomer$ = this.store.select(savingCustomer)
    this.customerVM$ = this.store.select(customerViewModel)

  }

  ngOnInit() {
    this.crud = this.route.snapshot.paramMap.get('crud') ?? '';
    this.breakpoints.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait
    ]).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.isMobile = res.matches;
    })
    this.customerVM$.pipe(takeUntil(this.destroy$)).subscribe((customer) => {
      this.currentCustomer = customer;
      if (customer) {
        this.customerForm.patchValue(customer);
      }
    })
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // only show the popup if the user modifies any fields AND DISCREPANCY VIEW MODAL IN STATE IS NOT NULL 
    // when discrepancyViewModel is null means user SUBMITS form for add/edit discrepancy and we won't show popup message when submit
    if (this.customerForm && !this.customerForm.pristine && this.currentCustomer) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Save Changes',
            message: 'Are you sure you want to leave? Your changes will not be saved',
            cancelButton: 'Discard',
            successButton: 'Save',
          }
        }
      );
      return dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          switch (result) {
            case 'Success': this.onSubmit(); return false;
            case 'Cancel': return true;
            default: return false;
          }  // allow navigation if the user click discard button or click outside modal
        }))
    }
    return true;
  }

  crudTitle() {
    return this.crud === 'new' ? 'New' : 'Edit';
  }

  navigateBack() {
    this.router.navigate(['main/customer/'])
  }

  onSubmit() {
    if (this.customerForm.valid && !this.customerForm.pristine) {
      if (this.crud === 'edit' && this.currentCustomer) {
        this.store.dispatch(updateCustomerStart({customer: this.customerForm.getRawValue()}))
      }
      else if (this.crud === 'new' && this.currentCustomer) {
        this.store.dispatch(addCustomerStart({customer: this.customerForm.getRawValue()}))
      }
    } else {
      this.customerForm.markAllAsTouched();
    }
  }
}

