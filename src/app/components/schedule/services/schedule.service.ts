import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocsFromServer, getDocsFromCache } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Schedule } from '../model/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);

  getTruckSchedules(truckId: string): Observable<Schedule[]> {
    return runInInjectionContext(this.injector, () => {
      const schedulesRef = collection(this.firestore, `trucks/${truckId}/schedules`);
      const p = getDocsFromServer(schedulesRef)
        .then(snapshot => snapshot.docs.map(d => {
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
          } as Schedule);
        }))
        .catch(async () => {
          const snapshot = await getDocsFromCache(schedulesRef);
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
            } as Schedule);
          });
        });

      return from(p) as Observable<Schedule[]>;
    });
  }

  addSchedule(truckId: string, schedule: Partial<Schedule>): Observable<Schedule> {
    return runInInjectionContext(this.injector, () => {
      const schedulesRef = collection(this.firestore, `trucks/${truckId}/schedules`);
      const now = new Date();
      const p = addDoc(schedulesRef, { 
        ...schedule, 
        truckId,
        createdAt: now 
      }).then(docRef => ({ 
        ...(schedule as Schedule), 
        id: docRef.id, 
        truckId,
        createdAt: now 
      } as Schedule));
      
      return from(p) as Observable<Schedule>;
    });
  }

  updateSchedule(truckId: string, scheduleId: string, schedule: Partial<Schedule>): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, `trucks/${truckId}/schedules`, scheduleId);
      const p = updateDoc(dref, schedule as any);
      return from(p) as Observable<void>;
    });
  }

  deleteSchedule(truckId: string, scheduleId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const dref = doc(this.firestore, `trucks/${truckId}/schedules`, scheduleId);
      const p = deleteDoc(dref);
      return from(p) as Observable<void>;
    });
  }
}