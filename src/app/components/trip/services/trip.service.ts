import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocsFromServer, getDocsFromCache } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Trip } from '../model/trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);

  getTruckTrips(truckId: string): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
    console.debug('[TripService] getTruckTrips() - requesting trips for truckId:', truckId);
    const p = getDocsFromServer(tripsRef)
      .then(snapshot => {
        console.debug('[TripService] getTruckTrips() - server response, docs:', snapshot.docs.length, 'truckId:', truckId);
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
        console.warn('[TripService] getTruckTrips() - getDocsFromServer failed for truckId:', truckId, 'Error:', err);
        const snapshot = await getDocsFromCache(tripsRef);
        console.debug('[TripService] getTruckTrips() - cache response, docs:', snapshot.docs.length, 'truckId:', truckId);
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

    return from(p);
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

  updateTrip(truckId: string, tripId: string, trip: Partial<Trip>): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, `trucks/${truckId}/trips`, tripId);
      const p = updateDoc(dref, trip as any);
      return from(p) as Observable<void>;
    });
  }

  deleteTrip(truckId: string, tripId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, `trucks/${truckId}/trips`, tripId);
      const p = deleteDoc(dref);
      return from(p) as Observable<void>;
    });
  }
}