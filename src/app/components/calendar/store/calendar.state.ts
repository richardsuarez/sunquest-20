import { Booking } from '../../book/model/booking.model';
import { CalendarEventsByDate } from '../model/calendar-event.model';

export interface CalendarState {
  loading: boolean;
  trucks: any[];
  trips: { [truckId: string]: any[] };
  appError: Error | null;
  calendarEvents: CalendarEventsByDate;
  currentMonthBookings: Booking[]
}

export const initialCalendarState: CalendarState = {
  loading: false,
  trucks: [],
  trips: {},
  appError: null,
  calendarEvents: {},
  currentMonthBookings: []
};
