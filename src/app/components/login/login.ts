import { Component } from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

import * as packageJson from '../../../../package.json';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../../shared/firebase/auth.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

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
    MatButton
  ],
  templateUrl: 'login.html',
  styleUrls: ['login.css']
})
export class Login {
  isMobile!: boolean;
  isVisible = false;
  appVersion = packageJson.version

  destroy$ = new Subject<void>();
  constructor(
    readonly breakpoints: BreakpointObserver,
    private readonly auth: AuthService
  ) { }

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
  })

  signIn() {
    if (this.form_login.valid &&
      this.form_login.controls.email.value &&
      this.form_login.controls.password.value
    ) {
      this.auth.login(this.form_login.controls.email.value, this.form_login.controls.password.value)
    } else {
      this.form_login.markAllAsTouched();
    }
  }


}
