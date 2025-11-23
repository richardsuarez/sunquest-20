import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../model/truck.model';

export interface TruckState {
  trucks: Truck[];
  trips: Trip[];
  loading: boolean;
  saving: boolean | null;
  error: Error | null;
  selectedTruck: Truck | null;
}

export const initialTruckState: TruckState = {
  trucks: [],
  trips: [],
  loading: false,
  saving: null,
  error: null,
  selectedTruck: null,
};
