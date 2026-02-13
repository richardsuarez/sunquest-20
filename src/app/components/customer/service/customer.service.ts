import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, doc, addDoc, deleteDoc, updateDoc, or, where, getDocFromServer, endAt, getDocsFromServer, getDocsFromCache, and, getCountFromServer, endBefore, limitToLast, getDocs } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { Customer, SearchCriteria } from '../model/customer.model';
import { Vehicle } from '../model/customer.model';
import { Season } from '../../season/models/season.model';
import { Booking } from '../../book/model/booking.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  // ✅ Keep the Firestore and EnvironmentInjector injected once
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'customers'

  // #region Customer

  async getCustomerCount(criteria: SearchCriteria): Promise<number> {
    return runInInjectionContext(this.injector, async () => {
      const customerRef = collection(this.firestore, this.collectionName);
      const filter = criteria.searchValue?.trim() || '';
      let totalCount = 0;

      if (filter) {
        const firstNameQuery = query(
          customerRef,
          where('primaryFirstName', '>=', filter),
          where('primaryFirstName', '<=', filter + '\uf8ff')
        );

        const lastNameQuery = query(
          customerRef,
          where('primaryLastName', '>=', filter),
          where('primaryLastName', '<=', filter + '\uf8ff')
        );

        // Firestore safe: one range per query
        const [firstNameSnap, lastNameSnap] = await Promise.all([
          getCountFromServer(firstNameQuery),
          getCountFromServer(lastNameQuery)
        ]);

        totalCount = firstNameSnap.data().count + lastNameSnap.data().count;
      } else {
        // No filter → just count everything
        const allSnap = await getCountFromServer(query(customerRef));
        totalCount = allSnap.data().count;
      }

      return totalCount;
    });
  }

  async getNextCustomerList(criteria: SearchCriteria, lastCustomer: Customer | null | undefined): Promise<Observable<Customer[]>> {
    return runInInjectionContext(this.injector, async () => {
      const pageSize = criteria.pageSize;
      const customerRef = collection(this.firestore, this.collectionName);
      const filter = criteria.searchValue?.trim() || '';
      let q;

      // ✅ CASE 1: Search text provided (prefix search)
      if (filter) {
        let auxQ = or(
          and(
            where('primaryLastName', '>=', filter),
            where('primaryLastName', '<=', filter + '\uf8ff')
          ),
          and(
            where('primaryPhone', '>=', filter),
            where('primaryPhone', '<=', filter + '\uf8ff')
          ),
          and(
            where('secondaryPhone', '>=', filter),
            where('secondaryPhone', '<=', filter + '\uf8ff')
          )
        );

        if (!lastCustomer) {
          // First page — starts-with search
          q = query(
            customerRef,
            auxQ,
            orderBy('primaryLastName'),
            orderBy('primaryFirstName'),
            limit(pageSize)
          );
        } else {
          // Next page — continue after last doc
          const docRef = await getDocFromServer(doc(customerRef, `${lastCustomer.DocumentID}`));
          q = query(
            customerRef,
            auxQ,
            orderBy('primaryLastName'),
            orderBy('primaryFirstName'),
            startAfter(docRef),
            limit(pageSize)
          );
        }
      }

      // ✅ CASE 2: No search text — just paginate normally
      else {
        if (!lastCustomer) {
          q = query(customerRef, orderBy('primaryLastName'), orderBy('primaryFirstName'), limit(pageSize));
        } else {
          const docRef = await getDocFromServer(doc(customerRef, `${lastCustomer.DocumentID}`));
          q = query(
            customerRef,
            orderBy('primaryLastName'),
            orderBy('primaryFirstName'),
            startAfter(docRef),
            limit(pageSize)
          );
        }
      }

      // ✅ Try network first, fallback to cache if offline
      let customers: Customer[] = [];
      try {
        const snapshot = await getDocsFromServer(q);
        customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
      } catch (error) {
        const snapshot = await getDocsFromCache(q);
        customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
      }
      const auxCustomers = await Promise.all(
        customers.map(async customer => {
          const vehicles = await from(this.getVehicles(customer.DocumentID!)).toPromise();
          return { ...customer, vehicles };
        })
      );
      return of(auxCustomers);
    });
  }

  async getPreviousCustomerList(
    criteria: SearchCriteria,
    firstCustomer: Customer
  ): Promise<Observable<Customer[]>> {
    return runInInjectionContext(this.injector, async () => {
      const pageSize = criteria.pageSize;
      const customerRef = collection(this.firestore, this.collectionName);
      const filter = criteria.searchValue?.trim() || '';
      let q;

      // ✅ CASE 1: Search with filter
      if (filter) {
        let auxQ = or(
          and(
            where('primaryLastName', '>=', filter),
            where('primaryLastName', '<=', filter + '\uf8ff')
          ),
          and(
            where('primaryPhone', '>=', filter),
            where('primaryPhone', '<=', filter + '\uf8ff')
          ),
          and(
            where('secondaryPhone', '>=', filter),
            where('secondaryPhone', '<=', filter + '\uf8ff')
          )
        );

        const docRef = await getDocFromServer(doc(customerRef, `${firstCustomer.DocumentID}`));
        q = query(
          customerRef,
          auxQ,
          orderBy('primaryLastName'),
          orderBy('primaryFirstName'),
          endBefore(docRef),
          limitToLast(pageSize)
        );
      }

      // ✅ CASE 2: No search filter
      else {
        const docRef = await getDocFromServer(doc(customerRef, `${firstCustomer.DocumentID}`));
        q = query(
          customerRef,
          orderBy('primaryLastName'),
          orderBy('primaryFirstName'),
          endBefore(docRef),
          limitToLast(pageSize)
        );
      }

      // ✅ Server-first, cache fallback
      let customers: Customer[] = [];
      try {
        const snapshot = await getDocsFromServer(q);
        customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
      } catch (error) {
        console.warn('⚠️ Firestore server unreachable, falling back to cache:', error);
        const snapshot = await getDocsFromCache(q);
        customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
      }
      const auxCustomers = await Promise.all(
        customers.map(async customer => {
          const vehicles = await from(this.getVehicles(customer.DocumentID!)).toPromise();
          return { ...customer, vehicles };
        })
      );
      return of(auxCustomers);
    });
  }

  addCustomer(customer: Partial<Customer>): Observable<any> {
    return from(runInInjectionContext(this.injector, async () => {
      const newCustomerRef = collection(this.firestore, this.collectionName);

      // Validate recNo
      let customerToAdd = { ...customer };
      
      if (customerToAdd.recNo) {
        // If recNo is provided, verify it doesn't belong to any other customer
        const existingRecNo = await this.doesRecNoExist(customerToAdd.recNo);
        if (existingRecNo) {
          throw new Error(`RecNo '${customerToAdd.recNo}' already belongs to another customer in the database.`);
        }
      } else {
        // If recNo is not provided, generate a random 3-digit number and ensure uniqueness
        let randomRecNo = this.generateRandomRecNo();
        while (await this.doesRecNoExist(randomRecNo)) {
          randomRecNo = this.generateRandomRecNo();
        }
        customerToAdd.recNo = randomRecNo;
      }

      // If validation passes, proceed with adding the customer
      return addDoc(newCustomerRef, customerToAdd).then(docRef => {
        // Update the document to include its DocumentID
        return updateDoc(docRef, { DocumentID: docRef.id }).then(() => ({
          ...customerToAdd,
          DocumentID: docRef.id
        }));
      });
    }));
  }

  private async doesRecNoExist(recNo: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const customerRef = collection(this.firestore, this.collectionName);
      const q = query(customerRef, where('recNo', '==', recNo));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    });
  }

  private generateRandomRecNo(): string {
    // Generate a random 3-digit number (000-999)
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }

  deleteCustomer(id: string): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const customerDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
      return from(deleteDoc(customerDocRef));
    });
  }

  updateCustomer(customer: Partial<Customer>): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const customerDocRef = doc(this.firestore, `${this.collectionName}/${customer.DocumentID}`);
      return from(updateDoc(customerDocRef, customer));
    });
  }

  // #endregion Customer

  // #region Vehicle (subcollection under customer)

  addVehicle(customerId: string, vehicle: Partial<Vehicle>): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const vehiclesRef = collection(this.firestore, `${this.collectionName}/${customerId}/vehicles`);
      return from(addDoc(vehiclesRef, { ...vehicle, createdAt: new Date() }));
    });
  }

  getVehicles(customerId: string): Observable<Vehicle[]> {
    return runInInjectionContext(this.injector, () => {
      const vehiclesRef = collection(this.firestore, `${this.collectionName}/${customerId}/vehicles`);
      const p = getDocsFromServer(vehiclesRef)
        .then(snapshot => snapshot.docs.map(doc => ({ ...(doc.data() as Vehicle), id: doc.id } as Vehicle)))
        .catch(async () => {
          const snapshot = await getDocsFromCache(vehiclesRef);
          return snapshot.docs.map(doc => ({ ...(doc.data() as Vehicle), id: doc.id } as Vehicle));
        });

      return from(p) as Observable<Vehicle[]>;
    });
  }

  deleteVehicle(customerId: string, vehicleId: string): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const vehicleDocRef = doc(this.firestore, `${this.collectionName}/${customerId}/vehicles/${vehicleId}`);
      return from(deleteDoc(vehicleDocRef));
    });
  }

  // #endregion Vehicle

  getBookingList(customers: Customer[]): Promise<Observable<Booking[]>> {
    const auxCustomers: string[] = [];
    for(let c of customers){
      auxCustomers.push(c.DocumentID!);
    }
    return runInInjectionContext(this.injector, async () => {
      const bookingsRef = collection(this.firestore, `bookings`);
      const q = query(
        bookingsRef,
        where('customer.DocumentID', 'in', auxCustomers),
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
