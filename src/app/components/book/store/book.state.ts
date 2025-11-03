import { Truck } from '../model/truck.model';

export interface BookState {
  loadingTrucks: boolean;
  trucks: Truck[];
  savingBooking: boolean;
  appError: Error | null;
}

export const initialBookState: BookState = {
  loadingTrucks: false,
  trucks: [],
  savingBooking: false,
  appError: null,
};
