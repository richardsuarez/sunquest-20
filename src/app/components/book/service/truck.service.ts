import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Truck } from '../model/truck.model';
import { getDocsFromServer, getDocsFromCache } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'trucks';

  getTrucks(): Observable<Truck[]> {
    return runInInjectionContext(this.injector, () => {
      const trucksRef = collection(this.firestore, this.collectionName);
      const p = getDocsFromServer(trucksRef)
        .then(snapshot => snapshot.docs.map(d => ({ ...(d.data() as Truck), id: d.id } as Truck)))
        .catch(async () => {
          const snapshot = await getDocsFromCache(trucksRef);
          return snapshot.docs.map(d => ({ ...(d.data() as Truck), id: d.id } as Truck));
        });

      return from(p) as Observable<Truck[]>;
    });
  }
}
