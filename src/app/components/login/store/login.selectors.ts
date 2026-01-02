import { createFeatureSelector, createSelector } from "@ngrx/store";
import { LoginState } from "./login.state";

export const customerFeature = createFeatureSelector<LoginState>('login')

export const signing = createSelector(customerFeature, (state) => {return state.signing});
export const error = createSelector(customerFeature, (state) => {return state.appError});
