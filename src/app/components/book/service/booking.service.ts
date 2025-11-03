import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Booking } from '../model/booking.model';

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
}
