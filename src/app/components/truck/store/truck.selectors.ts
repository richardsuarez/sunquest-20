import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TruckState } from './truck.state';
import { TRUCK_FEATURE_KEY } from './truck.reducers';

const feature = createFeatureSelector<TruckState>(TRUCK_FEATURE_KEY);

export const trucks = createSelector(feature, s => s.trucks);
export const trips = createSelector(feature, s => s.trips);
export const loadingTruckList = createSelector(feature, s => s.loading);
export const saving = createSelector(feature, s => s.saving);
export const selectedTruck = createSelector(feature, s => s.selectedTruck);
export const truckError = createSelector(feature, s => s.error);
