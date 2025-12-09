import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, getDocsFromCache, getDocsFromServer, query, where, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { increment } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { Trip } from '../../trip/model/trip.model';
import { Booking } from '../../book/model/booking.model';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'bookings';

  addTrip(truckId: string, trip: Partial<Trip>): Observable<Trip> {
    return runInInjectionContext(this.injector, () => {
      const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
      const now = new Date();
      const p = addDoc(tripsRef, {
        ...trip,
        truckId,
        createdAt: now
      }).then(docRef => ({
        ...(trip as Trip),
        id: docRef.id,
        truckId,
        createdAt: now
      } as Trip));
      return from(p) as Observable<Trip>;
    });
  }

  getTruckTrips(truckId: string): Observable<Trip[]> {
    return runInInjectionContext(this.injector, () => {
      const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
      // build a query: get all trips ordered ascending by departureDate
      const q = query(tripsRef, orderBy('departureDate', 'asc'));

      const p = getDocsFromServer(q)
        .then(snapshot => {
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
        })
        .catch(async (err) => {
          console.warn('[BookingService] getTruckTrips() - getDocsFromServer failed for truckId:', truckId, 'Error:', err);
          const snapshot = await getDocsFromCache(q);
          return snapshot.docs.map(d => {
            const data = d.data() as any;
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
        });

      return from(p) as Observable<Trip[]>;
    });
  }

  // Get bookings for a specific date range (for calendar)
  getBookingsForDateRange(startDate: Date, endDate: Date): Observable<Booking[]> {
    return runInInjectionContext(this.injector, () => {
      const bookingsRef = collection(this.firestore, this.collectionName);
      // Query bookings where departureDate is between startDate and endDate
      const q = query(
        bookingsRef,
        where('departureDate', '>=', startDate),
        where('departureDate', '<=', endDate),
        orderBy('departureDate', 'asc')
      );

      const p = getDocsFromServer(q)
        .then(snapshot => {
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
        })
        .catch(async (err) => {
          console.warn('[BookingService] getBookingsForDateRange() - server query failed', err);
          const snapshot = await getDocsFromCache(q);
          return snapshot.docs.map(d => {
            const data = d.data() as any;
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
        });

      return from(p) as Observable<Booking[]>;
    });
  }

  deleteBooking(id: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const bookingDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
      const p = deleteDoc(bookingDocRef) as Promise<void>;
      return from(p) as Observable<void>;
    });
  }

  deleteTrip(truckId: string, tripId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const tripDocRef = doc(this.firestore, `trucks/${truckId}/trips/${tripId}`);
      const p = deleteDoc(tripDocRef) as Promise<void>;
      return from(p) as Observable<void>;
    });
  }

  deleteBookingsByTripId(tripId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const bookingsRef = collection(this.firestore, this.collectionName);
      const q = query(bookingsRef, where('tripId', '==', tripId));

      const p = getDocsFromServer(q)
        .then(snapshot => {
          // Delete all bookings for this trip
          const deletePromises = snapshot.docs.map(docSnapshot => 
            deleteDoc(doc(this.firestore, `${this.collectionName}/${docSnapshot.id}`))
          );
          return Promise.all(deletePromises);
        })
        .then(() => undefined)
        .catch(async (err) => {
          console.warn('[CalendarService] deleteBookingsByTripId() - server query failed', err);
          // Try cache as fallback
          const snapshot = await getDocsFromCache(q);
          const deletePromises = snapshot.docs.map(docSnapshot => 
            deleteDoc(doc(this.firestore, `${this.collectionName}/${docSnapshot.id}`))
          );
          return Promise.all(deletePromises).then(() => undefined);
        });

      return from(p) as Observable<void>;
    });
  }
}
