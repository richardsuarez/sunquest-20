import { createReducer, on } from '@ngrx/store';
import * as CalendarActions from './calendar.actions';
import { initialCalendarState } from './calendar.state';
import { CalendarEvent } from '../model/calendar-event.model';
import { Calendar } from '../container/calendar';

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

  on(CalendarActions.clearCalendarEvents, (state) => ({
    ...state,
    calendarEvents: {}
  })),

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
          color: trip.delayDate ? '#f04539ff' : '#3a89f0ff', // red for delayed trips, yellow otherwise
          trip,
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
  })),

  on(CalendarActions.deleteBookingEnd, (state, { bookingId, trip }) => {
    // Remove the deleted booking from currentMonthBookings
    const updatedBookings = state.currentMonthBookings.filter(b => b.id !== bookingId);

    // Update calendar events - rebuild with updated bookings
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };
    Object.keys(updatedEvents).forEach(dateKey => {
      const eventsForDate = updatedEvents[dateKey] || [];
      // Update trip events to remove deleted booking from their bookings list
      updatedEvents[dateKey] = eventsForDate.map((event: CalendarEvent) => {
        if (event.bookings && event.id?.startsWith('trip-')) {
          return {
            ...event,
            bookings: event.bookings.filter(b => b.id !== bookingId)
          };
        }
        return event;
      });
    });

    return {
      ...state,
      currentMonthBookings: updatedBookings,
      calendarEvents: cleanCalendarEvents(updatedEvents),
      selectedTrip: trip,
      loading: false
    };
  }),

  on(CalendarActions.loadSelectedTrip, (state, { trip }) => ({
    ...state,
    selectedTrip: trip
  })),

  on(CalendarActions.addTripSuccess, (state, { truckId, trip }) => {
    // Add trip to the trips list
    const updatedTrips = {
      ...state.trips,
      [truckId]: [
        ...((state.trips && state.trips[truckId]) || []),
        trip
      ]
    };

    // Create a calendar event for the new trip
    const dateKey = formatDateKey(new Date(trip.departureDate));
    const tripEvent: CalendarEvent = {
      id: `trip-${trip.id}`,
      title: `Truck: ${state.trucks.find(t => t.id === truckId)?.truckNumber || 'N/A'}`,
      description: `${trip.origin || 'N/A'} → ${trip.destination || 'N/A'}`,
      startDate: trip.delayDate ? new Date(trip.delayDate) : new Date(trip.departureDate),
      endDate: new Date(trip.arrivalDate),
      color: trip.delayDate ? '#f04539ff' : '#3a89f0ff',
      trip,
      truckId: truckId,
      bookings: []
    };

    // Add the event to calendar events
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };
    const existingEvents = updatedEvents[dateKey] || [];
    updatedEvents[dateKey] = [...existingEvents.filter((e: CalendarEvent) => e.id !== tripEvent.id), tripEvent];

    return {
      ...state,
      trips: updatedTrips,
      calendarEvents: cleanCalendarEvents(updatedEvents)
    };
  }),

  on(CalendarActions.updateTripSuccess, (state, { truckId, trip }) => {
    // Find the old trip to get its date for event removal
    const oldTrips = state.trips[truckId] || [];
    const oldTripIndex = oldTrips.findIndex(t => t.id === trip.id);
    
    if (oldTripIndex === -1) {
      return state; // Trip not found, no update needed
    }

    // Update the trip in the trips list
    const oldTrip = oldTrips[oldTripIndex];
    const updatedTrips = {
      ...state.trips,
      [truckId]: oldTrips.map((t, index) => index === oldTripIndex ? { ...t, ...trip } : t)
    };

    // Update calendar events
    const updatedEvents: { [key: string]: CalendarEvent[] } = { ...state.calendarEvents };
    const oldDateKey = formatDateKey(new Date(oldTrip.departureDate));
    const newDateKey = formatDateKey(new Date(trip.departureDate || oldTrip.departureDate));

    // Remove old event from the old date
    if (oldDateKey !== newDateKey) {
      const oldDateEvents = updatedEvents[oldDateKey] || [];
      updatedEvents[oldDateKey] = oldDateEvents.filter(e => e.id !== `trip-${trip.id}`);
      if (updatedEvents[oldDateKey].length === 0) {
        delete updatedEvents[oldDateKey];
      }
    }

    // Create updated calendar event
    const updatedTripEvent: CalendarEvent = {
      id: `trip-${trip.id}`,
      title: `Truck: ${state.trucks.find(t => t.id === truckId)?.truckNumber || 'N/A'}`,
      description: `${trip.origin || oldTrip.origin || 'N/A'} → ${trip.destination || oldTrip.destination || 'N/A'}`,
      startDate: trip.delayDate ? new Date(trip.delayDate) : new Date(trip.departureDate || oldTrip.departureDate),
      endDate: new Date(trip.arrivalDate || oldTrip.arrivalDate),
      color: trip.delayDate ? '#f04539ff' : '#3a89f0ff',
      trip: { ...oldTrip, ...trip },
      truckId: truckId,
      bookings: oldTrip.bookings || []
    };

    // Add updated event to the new date
    const newDateEvents = updatedEvents[newDateKey] || [];
    updatedEvents[newDateKey] = [
      ...newDateEvents.filter(e => e.id !== `trip-${trip.id}`),
      updatedTripEvent
    ];

    return {
      ...state,
      trips: updatedTrips,
      calendarEvents: cleanCalendarEvents(updatedEvents)
    };
  }),

  on(CalendarActions.deleteTripSuccess, (state, { truckId, tripId }) => {
    // Remove trip from the trips list for the truck
    const updatedTrips = {
      ...state.trips,
      [truckId]: (state.trips[truckId] || []).filter(t => t.id !== tripId)
    };

    // Remove trip from trips object if no trips left for this truck
    if (updatedTrips[truckId].length === 0) {
      const tripsWithoutTruck = { ...updatedTrips };
      delete tripsWithoutTruck[truckId];
      Object.assign(updatedTrips, tripsWithoutTruck);
    }

    // Remove calendar event for the deleted trip
    const updatedEvents: { [key: string]: CalendarEvent[] } = {};
    const tripEventId = `trip-${tripId}`;

    // Search through all dates to remove the trip event
    Object.keys(state.calendarEvents).forEach(dateKey => {
      const eventsForDate = state.calendarEvents[dateKey] || [];
      const filtered = eventsForDate.filter(e => e.id !== tripEventId);

      // Only keep the date key if events remain after filtering
      if (filtered.length > 0) {
        updatedEvents[dateKey] = filtered;
      }
    });

    // Clear selectedTrip if it's the deleted trip
    const isSelectedTripDeleted = state.selectedTrip && state.selectedTrip.id === tripId;

    return {
      ...state,
      trips: updatedTrips,
      calendarEvents: cleanCalendarEvents(updatedEvents),
      selectedTrip: isSelectedTripDeleted ? null : state.selectedTrip,
      loading: false
    };
  }),
);
