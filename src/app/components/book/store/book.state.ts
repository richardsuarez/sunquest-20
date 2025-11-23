import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../../truck/model/truck.model';

export interface BookState {
  loadingTrucks: boolean;
  trucks: Truck[];
  trips: {[truckId: string]: Trip[]}
  savingBooking: boolean;
  appError: Error | null;
}

export const initialBookState: BookState = {
  loadingTrucks: false,
  trucks: [],
  trips: {},
  savingBooking: false,
  appError: null,
};
