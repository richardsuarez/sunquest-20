import { createReducer, on } from '@ngrx/store';
import * as CalendarActions from './calendar.actions';
import { initialCalendarState } from './calendar.state';
import { CalendarEvent } from '../model/calendar-event.model';

export const CALENDAR_FEATURE_KEY = 'calendar';

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cleanCalendarEvents(events: { [key: string]: CalendarEvent[] }): { [key: string]: CalendarEvent[] } {
  const cleaned: { [key: string]: CalendarEvent[] } = {};
  Object.keys(events).forEach(key => {
    if (events[key] && events[key].length > 0) {
      cleaned[key] = events[key];
    }
  });
  return cleaned;
}

export const calendarReducer = createReducer(
  initialCalendarState,

  on(CalendarActions.addCalendarEvent, (state, { event }) => {
    const dateKey = formatDateKey(event.startDate);
    const existingEvents = state.calendarEvents[dateKey] || [];
    return {
      ...state,
      calendarEvents: {
        ...state.calendarEvents,
        [dateKey]: [...existingEvents, event]
      }
    };
  }),

  on(CalendarActions.removeCalendarEvent, (state, { eventId, dateKey }) => {
    const events = state.calendarEvents[dateKey] || [];
    const filtered = events.filter(e => e.id !== eventId);
    const updated = { ...state.calendarEvents };
    if (filtered.length > 0) {
      updated[dateKey] = filtered;
    } else {
      delete updated[dateKey];
    }
    return {
      ...state,
      calendarEvents: cleanCalendarEvents(updated)
    };
  }),

  on(CalendarActions.updateCalendarEvent, (state, { event, oldDateKey }) => {
    const newDateKey = formatDateKey(event.startDate);
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };

    // Remove from old date
    if (oldDateKey !== newDateKey) {
      const oldEvents = (updatedEvents[oldDateKey] || []).filter((e: CalendarEvent) => e.id !== event.id);
      if (oldEvents.length > 0) {
        updatedEvents[oldDateKey] = oldEvents;
      } else {
        delete updatedEvents[oldDateKey];
      }
    } else {
      // Update on same date
      updatedEvents[newDateKey] = (updatedEvents[newDateKey] || []).map((e: CalendarEvent) =>
        e.id === event.id ? event : e
      );
      return {
        ...state,
        calendarEvents: cleanCalendarEvents(updatedEvents)
      };
    }

    // Add to new date
    const newEvents = updatedEvents[newDateKey] || [];
    updatedEvents[newDateKey] = [...newEvents.filter((e: CalendarEvent) => e.id !== event.id), event];

    return {
      ...state,
      calendarEvents: cleanCalendarEvents(updatedEvents)
    };
  }),

  on(CalendarActions.clearCalendarEventsForTruck, (state, { truckId }) => {
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };
    Object.keys(updatedEvents).forEach(dateKey => {
      updatedEvents[dateKey] = (updatedEvents[dateKey] || []).filter(
        (e: CalendarEvent) => e.truckId !== truckId
      );
      if (updatedEvents[dateKey].length === 0) {
        delete updatedEvents[dateKey];
      }
    });

    return {
      ...state,
      calendarEvents: cleanCalendarEvents(updatedEvents)
    };
  }),

  on(CalendarActions.loadBookingsForMonth, (state) => ({
    ...state,
    loading: true
  })),

  on(CalendarActions.loadBookingsForMonthSuccess, (state, { bookings }) => ({
    ...state,
    loading: false,
    currentMonthBookings: bookings
  })),

  on(CalendarActions.loadBookingsForMonthFail, (state, { error }) => ({
    ...state,
    loading: false,
    appError: error
  })),

  on(CalendarActions.loadTrucksAndTrips, (state) => ({
    ...state,
    loading: true
  })),

  on(CalendarActions.loadTrucksAndTripsSuccess, (state, { trucks, trips }) => {
    // Merge trips into calendar events
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };
    const currentMonthBookings = state.currentMonthBookings || [];

    // Process all trips for the month
    Object.keys(trips).forEach(truckId => {
      const truckTrips = trips[truckId];
      const truck = trucks.find(t => t.id === truckId);
      truckTrips.forEach((trip: any) => {
        const bookings = currentMonthBookings.filter(b => b.tripId === trip.id);
        const dateKey = formatDateKey(new Date(trip.departureDate));
        const tripEvent: CalendarEvent = {
          id: `trip-${trip.id}`,
          title: `Truck: ${truck.truckNumber || 'N/A'}`,
          description: `${trip.origin || 'N/A'} → ${trip.destination || 'N/A'}`,
          startDate: trip.delayDate ? new Date(trip.delayedDate) : new Date(trip.departureDate),
          endDate: new Date(trip.arrivalDate), // +1 day to include arrival date,
          color: trip.delayDate ? '#f04539ff' : '#3a89f0ff' , // red for delayed trips, yellow otherwise
          tripId: trip.id,
          truckId: truckId,
          bookings: bookings
        };

        const existing = updatedEvents[dateKey] || [];
        updatedEvents[dateKey] = [...existing.filter((e: CalendarEvent) => e.id !== tripEvent.id), tripEvent];
      });
    });

    return {
      ...state,
      loading: false,
      trucks,
      trips,
      calendarEvents: cleanCalendarEvents(updatedEvents)
    };
  }),

  on(CalendarActions.loadTrucksAndTripsFail, (state, { error }) => ({
    ...state,
    loading: false,
    appError: error
  }))
);
