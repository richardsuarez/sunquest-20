import { createAction, props } from "@ngrx/store";
import { AppError } from "../../../shared/app-error.model";

export const signInStart = createAction(
    '[Login] Start sign in',
    props<{email: string, password: string}>(),
);

export const signInSuccess = createAction(
    '[Login] Sign in successfull'
);

export const signInFailure = createAction(
    '[Login] SignIn failure',
    props<{error: Error}>(),
)