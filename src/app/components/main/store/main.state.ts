import { Booking } from "../../book/model/booking.model";
import { Customer } from "../../customer/model/customer.model";
import { Season } from "../../season/models/season.model";

export interface MainState {
  customers: Customer[];
  seasons: Season[];
  loading: boolean;
  error: string | null;
  isMobile: boolean;
  customerViewModel: Customer | null;
  bookingViewModel: Booking | null;
}

export const initialMainState: MainState = {
  customers: [],
  seasons: [],
  loading: false,
  error: null,
  isMobile: false,
  customerViewModel: null,
  bookingViewModel: null,
};
