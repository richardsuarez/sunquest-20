import { Truck } from '../model/truck.model';

export interface TruckState {
  trucks: Truck[];
  loading: boolean;
  saving: boolean | null;
  error: Error | null;
  selectedTruck: Truck | null;
}

export const initialTruckState: TruckState = {
  trucks: [],
  loading: false,
  saving: null,
  error: null,
  selectedTruck: null,
};
