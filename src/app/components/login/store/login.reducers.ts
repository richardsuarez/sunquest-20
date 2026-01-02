import { createReducer, on } from "@ngrx/store";
import { LoginState } from "./login.state";

import * as LoginActions from './login.actions'

export const CUSTOMER_FEATURE_KEY = 'customer';

const initialState: LoginState = {
    signing: false,
    appError: null,
}

export const loginReducers = createReducer(
    initialState,
    on(LoginActions.signInStart, () => ({
        signing: true,
        appError: null,
    })),
    on(LoginActions.signInSuccess, () => ({
        signing: false,
        appError: null,
    })),
    on(LoginActions.signInFailure, (state, action) => ({
        signing: false,
        appError: action.error
    }))
)