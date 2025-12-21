import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, getDocsFromCache, getDocsFromServer, query, where, orderBy, doc, updateDoc } from '@angular/fire/firestore';
import { increment } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { Booking } from '../model/booking.model';
import { Trip } from '../../trip/model/trip.model';
import { Season } from '../../season/models/season.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'bookings';

  addBooking(b: Partial<Booking>): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const bookingsRef = collection(this.firestore, this.collectionName);
      return from(addDoc(bookingsRef, { ...b, createdAt: new Date() }));
    });
  }

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

  getTruckTrips(truckId: string, season: Season): Observable<Trip[]> {
    return runInInjectionContext(this.injector, () => {
      const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
      // build a query: get all trips ordered ascending by departureDate
      const now = new Date()
      const q = query(
        tripsRef, 
        where('season', '==', `${season.seasonName}-${season.year}`),
        where('departureDate', '>=', now), 
        orderBy('departureDate', 'asc'));

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
            const arrivalAt = data.arrivalAt ? (typeof data.arrivalAt.toDate === 'function' ? data.arrivalAt.toDate() : new Date(data.arrivalAt)) : null;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            const delayDate = data.delayDate ? (typeof data.delayDate.toDate === 'function' ? data.delayDate.toDate() : new Date(data.delayDate)) : null;
            return ({
              ...data,
              id: d.id,
              arrivalAt,
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

  updateTrip(truckId: string | null | undefined, trip: Trip): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      if(!trip.id) {
        throw new Error('Trip ID is required for update');
      }
      const dref = doc(this.firestore, `trucks/${truckId}/trips`, trip.id);
      const p = updateDoc(dref, trip as any);
      return from(p) as Observable<void>;
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
}
