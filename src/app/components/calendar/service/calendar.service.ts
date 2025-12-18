import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, getDocsFromCache, getDocsFromServer, query, where, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { increment } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { Trip } from '../../trip/model/trip.model';
import { Booking } from '../../book/model/booking.model';
import { Truck } from '../../truck/model/truck.model';
import { Season } from '../../season/models/season.model';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'bookings';

  addTrip(truckId: string, trip: Partial<Trip>): Observable<Trip> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
          const now = new Date();
          const docRef = await addDoc(tripsRef, {
            ...trip,
            truckId,
            createdAt: now
          });
          return {
            ...(trip as Trip),
            id: docRef.id,
            truckId,
            createdAt: now
          } as Trip;
        } catch (error) {
          console.error('[CalendarService] addTrip() - failed to add trip for truckId:', truckId, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  updateTrip(truckId: string, trip: Partial<Trip>): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const dref = doc(this.firestore, `trucks/${truckId}/trips`, trip.id || '');
          await updateDoc(dref, trip as any);
        } catch (error) {
          console.error('[CalendarService] updateTrip() - failed to update trip with id:', trip.id, 'for truckId:', truckId, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  getTrucks(): Observable<Truck[]> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const trucksRef = collection(this.firestore, 'trucks');
          let snapshot;
          
          try {
            snapshot = await getDocsFromServer(trucksRef);
          } catch (err) {
            console.warn('[CalendarService] getTrucks() - getDocsFromServer failed, falling back to cache. Error:', err);
            snapshot = await getDocsFromCache(trucksRef);
          }

          return snapshot.docs.map(d => {
            const data = d.data() as any;
            // normalize Firestore Timestamps to JS Date
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            return ({ ...data, id: d.id, departureDate } as Truck);
          });
        } catch (error) {
          throw error;
        }
      })());
    });
  }

  getTruckTrips(truckId: string, season: Season): Observable<Trip[]> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
          // build a query: get all trips ordered ascending by departureDate
          const q = query(
            tripsRef,
            where('season', '==', `${season.seasonName}-${season.year}`),
            orderBy('departureDate', 'asc')
          );

          let snapshot;
          try {
            snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
          } catch (err) {
            console.error('[CalendarService] getTruckTrips() - getDocsFromServer failed for truckId:', truckId, 'Error:', err);
            snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
          }

          return snapshot.docs.map(d => {
            const data = d.data() as any;
            // normalize Firestore Timestamps to JS Date
            const arrivalDate = data.arrivalDate ? (typeof data.arrivalDate.toDate === 'function' ? data.arrivalDate.toDate() : new Date(data.arrivalDate)) : null;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            const delayDate = data.delayDate ? (typeof data.delayDate.toDate === 'function' ? data.delayDate.toDate() : new Date(data.delayDate)) : null;
            return ({
              ...data,
              id: d.id,
              arrivalDate,
              departureDate,
              createdAt,
              delayDate,
              truckId
            } as Trip);
          });
        } catch (error) {
          console.error('[CalendarService] getTruckTrips() - failed for truckId:', truckId, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  // Get bookings for a specific date range (for calendar)
  getBookingsForDateRange(startDate: Date, endDate: Date, season: Season): Observable<Booking[]> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const bookingsRef = collection(this.firestore, this.collectionName);
          // Query bookings where departureDate is between startDate and endDate
          const q = query(
            bookingsRef,
            where('season', '==', `${season.seasonName}-${season.year}`),
            where('departureDate', '>=', startDate),
            where('departureDate', '<=', endDate),
            orderBy('departureDate', 'asc')
          );

          let snapshot;
          try {
            snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
          } catch(error) {
            console.error('[CalendarService] getBookingsForDateRange() - getDocsFromServer failed, falling back to cache. Error:', error);
            snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
          }

          return snapshot.docs.map(d => {
            const data = d.data() as any;
            // Normalize Firestore Timestamps to JS Date
            const arrivalAt = data.arrivalAt ? (typeof data.arrivalAt.toDate === 'function' ? data.arrivalAt.toDate() : new Date(data.arrivalAt)) : null;
            const pickupAt = data.pickupAt ? (typeof data.pickupAt.toDate === 'function' ? data.pickupAt.toDate() : new Date(data.pickupAt)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            return {
              ...data,
              id: d.id,
              arrivalAt,
              pickupAt,
              createdAt,
              departureDate
            } as Booking;
          });
        } catch (error) {
          console.error('[CalendarService] getBookingsForDateRange() - failed to get bookings for date range. Error:', error);
          throw error;
        }
      })());
    });
  }

  deleteBooking(id: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const bookingDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
          await deleteDoc(bookingDocRef);
        } catch (error) {
          console.error('[CalendarService] deleteBooking() - failed to delete booking with id:', id, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  deleteTrip(truckId: string, tripId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const tripDocRef = doc(this.firestore, `trucks/${truckId}/trips/${tripId}`);
          await deleteDoc(tripDocRef);
        } catch (error) {
          console.error('[CalendarService] deleteTrip() - failed to delete trip with id:', tripId, 'for truckId:', truckId, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  deleteBookingsByTripId(tripId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const bookingsRef = collection(this.firestore, this.collectionName);
          const q = query(bookingsRef, where('tripId', '==', tripId));

          let snapshot;
          try {
            snapshot = await getDocsFromServer(q);
          } catch (err) {
            console.error('[CalendarService] deleteBookingsByTripId() - server query failed', err);
            snapshot = await getDocsFromCache(q);
          }

          // Delete all bookings for this trip
          const deletePromises = snapshot.docs.map(docSnapshot =>
            deleteDoc(doc(this.firestore, `${this.collectionName}/${docSnapshot.id}`))
          );
          await Promise.all(deletePromises);
        } catch (error) {
          console.error('[CalendarService] deleteBookingsByTripId() - failed to delete bookings for tripId:', tripId, 'Error:', error);
          throw error;
        }
      })());
    });
  }
}
