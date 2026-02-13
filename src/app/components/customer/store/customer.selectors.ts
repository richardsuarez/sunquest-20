import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CustomerState } from "./customer.state";

export const customerFeature = createFeatureSelector<CustomerState>('customer')

export const loading = createSelector(customerFeature, (state) => {return state.loading});
export const customerList = createSelector(customerFeature, (state) => {return state.customerList});
export const customerViewModel = createSelector(customerFeature, (state) => {return state.customerViewModel});
export const bookings = createSelector(customerFeature, (state) => {return state.bookingList});
export const searchCriteria = createSelector(customerFeature, (state) => {return state.searchCriteria});
export const firstCustomer = createSelector(customerFeature, (state) => {return state.firstCustomerViewed});
export const lastCustomer = createSelector(customerFeature, (state) => {return state.lastCustomerViewed});
export const savingCustomer = createSelector(customerFeature, (state) => {return state.savingCustomer});
export const totalPagination = createSelector(customerFeature, (state) => {return state.totalPagination});
export const appError = createSelector(customerFeature, (state) => {return state.appError});