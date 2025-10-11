import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CustomerState } from "./customer.state";

export const customerFeature = createFeatureSelector<CustomerState>('customer')

export const loading = createSelector(customerFeature, (state) => {return state.loading});
export const customerList = createSelector(customerFeature, (state) => {return state.customerList});
export const customerViewModel = createSelector(customerFeature, (state) => {return state.customerViewModel});
export const searchCriteria = createSelector(customerFeature, (state) => {return state.searchCriteria});
export const lastCustomer = createSelector(customerFeature, (state) => {return state.lastCustomer});
export const savingCustomer = createSelector(customerFeature, (state) => {return state.savingCustomer});
export const appError = createSelector(customerFeature, (state) => {return state.appError});