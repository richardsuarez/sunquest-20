import { createReducer, on } from '@ngrx/store';
import * as TruckActions from './truck.actions';
import { initialTruckState, TruckState } from './truck.state';

export const TRUCK_FEATURE_KEY = 'truck';

export const truckReducer = createReducer<TruckState>(
  initialTruckState,
  on(TruckActions.getTruckListStart, (s) => ({ ...s, loading: true, error: null })),
  on(TruckActions.getTruckListSuccess, (s, a) => ({ ...s, loading: false, trucks: a.trucks })),
  on(TruckActions.getTruckListFail, (s, a) => ({ ...s, loading: false, error: a.error })),

  on(TruckActions.addTruckStart, (s) => ({ ...s, saving: true, error: null })),
  on(TruckActions.addTruckSuccess, (s, a) => ({ ...s, saving: false, trucks: [...s.trucks, a.truck] })),
  on(TruckActions.addTruckFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(TruckActions.updateTruckStart, (s) => ({ ...s, saving: true, error: null })),
  on(TruckActions.updateTruckSuccess, (s, a) => ({
    ...s,
    saving: false,
    trucks: s.trucks.map(t => t.id === a.id ? { ...t, ...(a.truck as any) } : t)
  })),
  on(TruckActions.updateTruckFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(TruckActions.deleteTruckStart, (s) => ({ ...s, saving: true, error: null })),
  on(TruckActions.deleteTruckSuccess, (s, a) => ({ ...s, saving: false, trucks: s.trucks.filter(t => t.id !== a.id) })),
  on(TruckActions.deleteTruckFail, (s, a) => ({ ...s, saving: false, error: a.error })),

  on(TruckActions.loadTruck, (state, action) => ({ 
    ...state, 
    selectedTruck: action.truck 
})),
  on(TruckActions.clearSelectedTruck, (s) => ({ ...s, selectedTruck: null }))
);
