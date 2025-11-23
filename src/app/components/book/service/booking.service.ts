import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, getDocsFromCache, getDocsFromServer, query, where, orderBy, doc, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Booking } from '../model/booking.model';
import { Trip } from '../../trip/model/trip.model';

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

  getTruckTrips(truckId: string): Observable<Trip[]> {
    return runInInjectionContext(this.injector, () => {
      const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
      const now = new Date();
      // build a query: only trips with departureDate > now, ordered ascending by departureDate
      const q = query(tripsRef, where('departureDate', '>', now), orderBy('departureDate', 'asc'));

      const p = getDocsFromServer(q)
        .then(snapshot => {
          return snapshot.docs.map(d => {
            const data = d.data() as any;
            // normalize Firestore Timestamps to JS Date
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            return ({
              ...data,
              id: d.id,
              departureDate,
              createdAt,
              truckId
            } as Trip);
          });
        })
        .catch(async (err) => {
          console.warn('[BookingService] getTruckTrips() - getDocsFromServer failed for truckId:', truckId, 'Error:', err);
          const snapshot = await getDocsFromCache(q);
          return snapshot.docs.map(d => {
            const data = d.data() as any;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            return ({
              ...data,
              id: d.id,
              departureDate,
              createdAt,
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

}
