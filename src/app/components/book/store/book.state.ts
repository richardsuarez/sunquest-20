import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../../truck/model/truck.model';
import { CalendarEventsByDate } from '../../calendar/model/calendar-event.model';
import { Booking } from '../model/booking.model';

export interface BookState {
  loading: boolean;
  trucks: Truck[];
  trips: {[truckId: string]: Trip[]}
  savingBooking: boolean;
  appError: Error | null;
  calendarEvents: CalendarEventsByDate;
  bookingViewModel: Booking | null;
}

export const initialBookState: BookState = {
  loading: false,
  trucks: [],
  trips: {},
  savingBooking: false,
  appError: null,
  calendarEvents: {},
  bookingViewModel: null,
};
