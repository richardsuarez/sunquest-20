import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, doc, addDoc, deleteDoc, updateDoc, or, where, getDocFromServer, endAt, getDocsFromServer, getDocsFromCache, and, getCountFromServer, endBefore, limitToLast } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { Customer, SearchCriteria } from '../model/customer.model';

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

  async getNextCustomerList(
    criteria: SearchCriteria,
    lastCustomer: Customer | null | undefined
  ): Promise<Observable<Customer[]>> {
    return runInInjectionContext(this.injector, async () => {
      const pageSize = criteria.pageSize;
      const customerRef = collection(this.firestore, this.collectionName);
      const filter = criteria.searchValue?.trim() || '';
      let q;

      // ✅ CASE 1: Search text provided (prefix search)
      if (filter) {
        const firstNameQuery = and(
          where('primaryFirstName', '>=', filter),
          where('primaryFirstName', '<=', filter + '\uf8ff')
        );
        const lastNameQuery = and(
          where('primaryLastName', '>=', filter),
          where('primaryLastName', '<=', filter + '\uf8ff')
        );

        if (!lastCustomer) {
          // First page — starts-with search
          q = query(
            customerRef,
            or(firstNameQuery, lastNameQuery),
            orderBy('primaryLastName'),
            orderBy('primaryFirstName'),
            limit(pageSize)
          );
        } else {
          // Next page — continue after last doc
          const docRef = await getDocFromServer(doc(customerRef, `${lastCustomer.DocumentID}`));
          q = query(
            customerRef,
            or(firstNameQuery, lastNameQuery),
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
      try {
        const snapshot = await getDocsFromServer(q);
        const customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
        return of(customers);
      } catch (error) {
        console.warn('⚠️ Firestore server unreachable, falling back to cache:', error);
        const snapshot = await getDocsFromCache(q);
        const customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));
        return of(customers);
      }
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
        const firstNameQuery = and(
          where('primaryFirstName', '>=', filter),
          where('primaryFirstName', '<=', filter + '\uf8ff')
        );
        const lastNameQuery = and(
          where('primaryLastName', '>=', filter),
          where('primaryLastName', '<=', filter + '\uf8ff')
        );

        const docRef = await getDocFromServer(doc(customerRef, `${firstCustomer.DocumentID}`));
        q = query(
          customerRef,
          or(firstNameQuery, lastNameQuery),
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
      try {
        const snapshot = await getDocsFromServer(q);
        const customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));

        // Reverse the result since we’re paginating backwards
        return of(customers);
      } catch (error) {
        console.warn('⚠️ Firestore server unreachable, falling back to cache:', error);
        const snapshot = await getDocsFromCache(q);
        const customers = snapshot.docs.map(doc => ({
          ...doc.data() as Customer,
          DocumentID: doc.id,
        }));

        return of(customers);
      }
    });
  }

  addCustomer(customer: Partial<Customer>): Observable<any> {
    return runInInjectionContext(this.injector, () => {
      const newCustomerRef = collection(this.firestore, this.collectionName);
      return from(addDoc(newCustomerRef, customer));
    });
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
}
