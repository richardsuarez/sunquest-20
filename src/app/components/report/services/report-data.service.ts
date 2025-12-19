import { Injectable } from '@angular/core';
import { Booking } from '../../book/model/booking.model';
import { Trip } from '../../trip/model/trip.model';
import { Truck } from '../../truck/model/truck.model';

export interface BookingGroup {
  trip: Trip;
  bookings: Booking[];
}

export interface TruckReport {
  truck: Truck;
  trips: BookingGroup[];
}

export interface BookReport {
  trucks: TruckReport[];
  totalBookings: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportDataService {

  /**
   * Transform flat booking list into hierarchical structure:
   * Trucks → Trips → Bookings
   */
  transformBookingsReport(
    bookings: Booking[],
    trucks: Truck[] | null
  ): BookReport {
    if (!bookings || bookings.length === 0 || !trucks) {
      return {
        trucks: [],
        totalBookings: 0
      };
    }

    // Group bookings by tripId
    const bookingsByTrip = new Map<string | null, Booking[]>();
    bookings.forEach(booking => {
      const tripId = booking.tripId || null;
      if (!bookingsByTrip.has(tripId)) {
        bookingsByTrip.set(tripId, []);
      }
      bookingsByTrip.get(tripId)!.push(booking);
    });

    // Group trips by truckId and organize with bookings
    const truckReports: TruckReport[] = [];

    trucks.forEach(truck => {
      if (!truck.trips || truck.trips.length === 0) {
        return;
      }

      const relevantTrips: BookingGroup[] = [];

      truck.trips.forEach(trip => {
        const tripBookings = bookingsByTrip.get(trip.id || '') || [];
        if (tripBookings.length > 0) {
          relevantTrips.push({
            trip,
            bookings: tripBookings.sort((a, b) => {
              // Sort bookings by customer name
              const nameA = (a.customer?.primaryFirstName || '') + (a.customer?.primaryLastName || '');
              const nameB = (b.customer?.primaryFirstName || '') + (b.customer?.primaryLastName || '');
              return nameA.localeCompare(nameB);
            })
          });
        }
      });

      // Only add truck if it has relevant trips
      if (relevantTrips.length > 0) {
        truckReports.push({
          truck,
          trips: relevantTrips.sort((a, b) => {
            // Sort trips by departure date
            const dateA = new Date(a.trip.departureDate || 0).getTime();
            const dateB = new Date(b.trip.departureDate || 0).getTime();
            return dateA - dateB;
          })
        });
      }
    });

    // Sort trucks by truckNumber
    truckReports.sort((a, b) => {
      const nameA = a.truck.truckNumber || '';
      const nameB = b.truck.truckNumber || '';
      return nameA.localeCompare(nameB);
    });

    return {
      trucks: truckReports,
      totalBookings: bookings.length
    };
  }

  /**
   * Get bookings for a specific trip
   */
  getBookingsForTrip(tripId: string, bookings: Booking[]): Booking[] {
    return bookings
      .filter(b => b.tripId === tripId)
      .sort((a, b) => {
        const nameA = (a.customer?.primaryFirstName || '') + (a.customer?.primaryLastName || '');
        const nameB = (b.customer?.primaryFirstName || '') + (b.customer?.primaryLastName || '');
        return nameA.localeCompare(nameB);
      });
  }

  /**
   * Get total weight and volume for a trip
   */
  getTripTotals(bookings: Booking[]): { weight: number; volume: number } {
    return bookings.reduce(
      (acc, booking) => ({
        weight: acc.weight + (booking.paycheck?.amount || 0),
        volume: acc.volume + (booking.vehicleIds?.length || 0)
      }),
      { weight: 0, volume: 0 }
    );
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
