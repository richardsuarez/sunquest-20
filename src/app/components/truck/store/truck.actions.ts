import { createAction, props } from '@ngrx/store';
import { Truck } from '../model/truck.model';

export const getTruckListStart = createAction('[Truck] Load trucks start');
export const getTruckListSuccess = createAction('[Truck] Load trucks success', props<{ trucks: Truck[] }>());
export const getTruckListFail = createAction('[Truck] Load trucks fail', props<{ error: Error }>());

export const addTruckStart = createAction('[Truck] Add truck start', props<{ truck: Partial<Truck> }>());
export const addTruckSuccess = createAction('[Truck] Add truck success', props<{ truck: Truck }>());
export const addTruckFail = createAction('[Truck] Add truck fail', props<{ error: Error }>());

export const updateTruckStart = createAction('[Truck] Update truck start', props<{ id: string; truck: Partial<Truck> }>());
export const updateTruckSuccess = createAction('[Truck] Update truck success', props<{ id: string; truck: Partial<Truck> }>());
export const updateTruckFail = createAction('[Truck] Update truck fail', props<{ error: Error }>());

export const deleteTruckStart = createAction('[Truck] Delete truck start', props<{ id: string }>());
export const deleteTruckSuccess = createAction('[Truck] Delete truck success', props<{ id: string }>());
export const deleteTruckFail = createAction('[Truck] Delete truck fail', props<{ error: Error }>());

export const loadTruck = createAction('[Truck] Select truck', props<{ truck: Truck }>());
export const clearSelectedTruck = createAction('[Truck] Clear selected truck');
