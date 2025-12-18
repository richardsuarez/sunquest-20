import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, updateDoc, doc, getDocsFromServer, getDocsFromCache, orderBy, addDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Season } from '../../../shared/season/models/season.model';

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
            //orderBy('seasonName', 'desc'), 
            );
          
          let querySnapshot;
          try {
            querySnapshot = await getDocsFromServer(q);
          } catch {
            querySnapshot = await getDocsFromCache(q);
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
}