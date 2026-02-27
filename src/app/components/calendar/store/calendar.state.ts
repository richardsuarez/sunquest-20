import { Booking } from '../../book/model/booking.model';
import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../../truck/model/truck.model';
import { CalendarEventsByDate } from '../model/calendar-event.model';

export interface CalendarState {
  loading: boolean;
  loadingTruckTrips: boolean;
  trucks: Truck[];
  trips: { [truckId: string]: any[] };
  selectedTrip: Trip | null;
  appError: Error | null;
  calendarEvents: CalendarEventsByDate;
  currentMonthBookings: Booking[];
  tempTruckTrips: Trip[] | null;
}

export const initialCalendarState: CalendarState = {
  loading: false,
  loadingTruckTrips: false,
  trucks: [],
  trips: {},
  selectedTrip: null,
  appError: null,
  calendarEvents: {},
  currentMonthBookings: [],
  tempTruckTrips: null,
};
