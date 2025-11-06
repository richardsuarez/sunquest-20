import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Truck } from '../model/truck.model';
import { getDocsFromServer, getDocsFromCache, getDocFromServer, getDocFromCache, doc as firestoreDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'trucks';

  getTrucks(): Observable<Truck[]> {
    return runInInjectionContext(this.injector, () => {
      const trucksRef = collection(this.firestore, this.collectionName);
      const p = getDocsFromServer(trucksRef)
        .then(snapshot => snapshot.docs.map(d => {
          const data = d.data() as any;
          // normalize Firestore Timestamps to JS Date
          const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
          return ({ ...data, id: d.id, createdAt } as Truck);
        }))
        .catch(async () => {
          const snapshot = await getDocsFromCache(trucksRef);
          return snapshot.docs.map(d => {
            const data = d.data() as any;
            const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
            return ({ ...data, id: d.id, createdAt } as Truck);
          });
        });

      return from(p) as Observable<Truck[]>;
    });
  }

  getTruck(id: string): Observable<Truck> {
    return runInInjectionContext(this.injector, () => {
      const dref = firestoreDoc(this.firestore, this.collectionName, id);
      const p = getDocFromServer(dref)
        .then(s => {
          const data = s.data() as any;
          const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
          return ({ ...data, id: s.id, createdAt } as Truck);
        })
        .catch(async () => {
          const s = await getDocFromCache(dref);
          const data = s.data() as any;
          const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
          return ({ ...data, id: s.id, createdAt } as Truck);
        });

      return from(p) as Observable<Truck>;
    });
  }

  addTruck(truck: Partial<Truck>): Observable<Truck> {
    return runInInjectionContext(this.injector, () => {
      const trucksRef = collection(this.firestore, this.collectionName);
      const now = new Date();
      const p = addDoc(trucksRef, { ...truck, createdAt: now })
        .then(docRef => ({ ...(truck as Truck), id: docRef.id, createdAt: now } as Truck));
      return from(p) as Observable<Truck>;
    });
  }

  updateTruck(id: string, truck: Partial<Truck>): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, this.collectionName, id);
      const p = updateDoc(dref, truck as any);
      return from(p) as Observable<void>;
    });
  }

  deleteTruck(id: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, this.collectionName, id);
      const p = deleteDoc(dref);
      return from(p) as Observable<void>;
    });
  }
}
