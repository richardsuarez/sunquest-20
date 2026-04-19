import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../model/truck.model';

export interface TruckState {
  trucks: Truck[];
  trips: Trip[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
  selectedTruck: Truck | null;
}

export const initialTruckState: TruckState = {
  trucks: [],
  trips: [],
  loading: false,
  saving: false,
  error: null,
  selectedTruck: null,
};
