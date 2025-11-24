import { Trip } from '../model/trip.model';

export interface TripState {
  trips: Trip[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
}

export const initialTripState: TripState = {
  trips: [],
  loading: false,
  saving: false,
  error: null
};