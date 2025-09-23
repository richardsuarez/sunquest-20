import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SearchCriteria } from './model/customer.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
//import { Store } from '@ngrx/store';
//import { AppState } from '../../store/app.state';
//import { customerList, criteria } from '../../store/customer/customer.selector';
//import * as CustomerActions from '../../store/customer/customer.actions';
//import { Customer } from './model/customer.model';

@Component({
  selector: 'app-customer',
  imports: [
    CommonModule,
    MatIconModule,
    MatFormField,
    ReactiveFormsModule,
    MatCardModule,
    MatInput,
    MatButtonModule
  ],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class Customer implements OnInit, OnDestroy{

  isMobile!: boolean
  destroy$ = new Subject<void>()
  customerListObserver$!: Observable<Customer[]>;
  criteria$!: Observable<SearchCriteria>;
  
  searchCustomer = new FormControl<string | null>('')
  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly router: Router,
    //private readonly store: Store<AppState>,
  ){
    //this.customerListObserver$ = store.select(customerList)
    //this.criteria$ = this.store.select(criteria)
  }

  ngOnInit(){
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait, 
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });

    /* this.criteria$.pipe(takeUntil(this.destroy$))
      .subscribe((criteria) => {
        this.store.dispatch(CustomerActions.getCustomerListStart({criteria}))
      }) */
  }

  ngOnDestroy(){
    this.destroy$.complete()
  }

  addCustomer(){
    this.router.navigate(['main/customer/new'])
  }

  formatLabelEmail(email: string | null){
    return `mailto:${email}`
  }

  formatLabelPhone(phone: string | null){
    return `tel:${phone}`;
  }

}
