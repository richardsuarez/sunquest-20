import { Booking } from "../../book/model/booking.model";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  color?: string; // hex color for event display
  tripId?: string; // reference to trip if type is 'trip'
  truckId?: string; // truck associated with event
  bookings: Booking[]; // associated bookings
}

export interface CalendarEventsByDate {
  [dateKey: string]: CalendarEvent[]; // dateKey format: YYYY-MM-DD
}
