import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AuthService } from "../../../shared/firebase/auth.service";
import { Router } from "@angular/router";
import { switchMap, map, catchError, tap } from "rxjs/operators";
import { of } from "rxjs";

import * as LoginActions from './login.actions'

@Injectable()
export class LoginEffects {
    readonly startSignIn$;
    readonly endSignIn$;
    readonly failureSignIn$;

    constructor(
        private readonly actions$: Actions,
        private readonly authService: AuthService,
        private router: Router,
    ) {
        this.startSignIn$ = createEffect(() =>
            this.actions$.pipe(
                ofType(LoginActions.signInStart),
                switchMap((action) => {
                    return this.authService.login(action.email, action.password).then(
                        () => LoginActions.signInSuccess(),
                        (error: Error) => LoginActions.signInFailure({ error })
                    ).catch((error: Error) => LoginActions.signInFailure({ error }));
                }),
                catchError((error: Error) => of(LoginActions.signInFailure({ error })))
            )
        );

        this.endSignIn$ = createEffect(() =>
            this.actions$.pipe(
                ofType(LoginActions.signInSuccess),
                tap(() => {
                    localStorage.setItem('token', 'true');
                    this.router.navigate(['/main/calendar']);
                }),
            ),
            { dispatch: false },
        );

        this.failureSignIn$ = createEffect(() => 
            this.actions$.pipe(
                ofType(LoginActions.signInFailure),
                tap(() => {
                    this.router.navigate(['/']);
                })
            ),
            { dispatch: false },
        )

    }
}