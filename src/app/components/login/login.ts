import { Component } from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

import * as packageJson from '../../../../package.json';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';

import { signInStart } from './store/login.actions';
import { error, signing } from './store/login.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatIcon,
    MatInput,
    MatButton,
    MatProgressSpinnerModule,
],
  templateUrl: 'login.html',
  styleUrls: ['login.css']
})
export class Login {
  isMobile!: boolean;
  isVisible = false;
  appVersion = packageJson.version;
  signing$!: Observable<boolean>;
  appError$!: Observable<Error | null>

  destroy$ = new Subject<void>();
  constructor(
    readonly breakpoints: BreakpointObserver,
    private readonly store: Store,
  ) { 
    this.signing$ = this.store.select(signing);
    this.appError$ = this.store.select(error);
  }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete()
  }

  form_login: FormGroup<{
    email: FormControl<string | null>,
    password: FormControl<string | null>,
  }> = new FormGroup({
    email: new FormControl('', [Validators.email]),
    password: new FormControl('',)
  });

  formatError(error: any){
    if(error.code.localeCompare('auth/network-request-failed') === 0){
      return 'Network request failed. Make sure you\'re connected to internet.'
    }
    if(error.code.localeCompare('auth/invalid-credential') === 0){
      return 'Invalid credentials. Try again.'
    }
    return error;
  }

  signIn() {
    const email = this.form_login.controls.email.value;
    const password = this.form_login.controls.password.value;
    if (this.form_login.valid && email && password) {
      this.store.dispatch(signInStart({email, password}));
    } else {
      this.form_login.markAllAsTouched();
    }
  }


}
