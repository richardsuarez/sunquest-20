import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, updateDoc, doc, getDocsFromServer, getDocsFromCache, orderBy, addDoc, deleteDoc, getDoc, getDocFromCache } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Season } from '../../season/models/season.model';
import { Trip } from '../../trip/model/trip.model';

@Injectable({
  providedIn: 'root'
})
export class MainService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);

  /**
   * Get all seasons from Firestore
   */
  getSeasons(): Observable<Season[]> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const seasonsCollection = collection(this.firestore, 'seasons');
          const q = query(
            seasonsCollection, 
            orderBy('year', 'desc'), 
            orderBy('seasonName', 'desc'), 
            );
          
          let querySnapshot;
          try {
            querySnapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
          } catch(error) {
            console.error('Error getting seasons from server, trying cache...', error);
            querySnapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
          }

          const seasons: Season[] = [];
          querySnapshot.forEach(doc => {
            seasons.push({
              ...doc.data() as Season,
              id: doc.id,
            });
          });

          return seasons;
        } catch (error) {
          throw error;
        }
      })());
    });
  }

  /**
   * Deactivate a season
   */
  deactivateSeason(seasonId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const seasonDoc = doc(this.firestore, 'seasons', seasonId);
          await updateDoc(seasonDoc, { isActive: false });
        } catch (error) {
          throw error;
        }
      })());
    });
  }

  /**
   * Activate a season
   */
  activateSeason(season: Season): Observable<Season> {
    return runInInjectionContext(this.injector, () => {
      const seasonsCollection = collection(this.firestore, 'seasons');
      const storedSeason = {...season, isActive: true}
      const s = addDoc(seasonsCollection, storedSeason)
        .then((docRef) => ({ ...storedSeason, id: docRef.id }));
        return from(s) as Observable<Season>
    });
  }

  deleteBooking(id: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from((async () => {
        try {
          const bookingDocRef = doc(this.firestore, `bookings/${id}`);
          await deleteDoc(bookingDocRef);
        } catch (error) {
          console.error('[MainService] deleteBooking() - failed to delete booking with id:', id, 'Error:', error);
          throw error;
        }
      })());
    });
  }

  getTrip(tripId: string, truckId: string): Observable<Trip> {
    return runInInjectionContext(this.injector, () => {
      const tripDocRef = doc(this.firestore, `trucks/${truckId}/trips/${tripId}`);
      const p = getDoc(tripDocRef)
        .then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            const arrivalDate = data.arrivalDate ? (typeof data.arrivalDate.toDate === 'function' ? data.arrivalDate.toDate() : new Date(data.arrivalDate)) : null;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            const delayDate = data.delay
              ? (typeof data.delayDate.toDate === 'function' ? data.delayDate.toDate() : new Date(data.delayDate))
              : null;
            return ({
              ...data,
              id: docSnap.id,
              arrivalDate,
              departureDate,
              createdAt,
              delayDate,
              truckId
            } as Trip);
          } else {
            throw new Error(`Trip with id ${tripId} not found for truck ${truckId}`);
          }
        })
        .catch(async (err) => {
          console.warn('[MainService] getTrip() - getDocFromServer failed for tripId:', tripId, 'truckId:', truckId, 'Error:', err);
          const docSnap = await getDocFromCache(tripDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            const arrivalDate = data.arrivalDate ? (typeof data.arrivalDate.toDate === 'function' ? data.arrivalDate.toDate() : new Date(data.arrivalDate)) : null;
            const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            const delayDate = data.delay
              ? (typeof data.delayDate.toDate === 'function' ? data.delayDate.toDate() : new Date(data.delayDate))
              : null;
            return ({
              ...data,
              id: docSnap.id,
              arrivalDate,
              departureDate,
              createdAt,
              delayDate,
              truckId
            } as Trip);
          }
          throw err;
        });
      return from(p) as Observable<Trip>;
    });
  }

  updateTrip(truckId: string | null | undefined, trip: Trip | null): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      if(!trip || !trip.id) {
        throw new Error('Trip ID is required for update');
      }
      const dref = doc(this.firestore, `trucks/${truckId}/trips`, trip.id);
      const p = updateDoc(dref, trip as any);
      return from(p) as Observable<void>;
    });
  }
}