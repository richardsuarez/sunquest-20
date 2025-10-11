import { inject, Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, doc, addDoc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { from, Observable, Subject, takeUntil } from 'rxjs';
import { Customer, SearchCriteria } from '../model/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  // ✅ Keep the Firestore and EnvironmentInjector injected once
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  private collectionName = 'customers'
  private destroy$ = new Subject<void>()

  // #region Customer

  getCustomerList(criteria: SearchCriteria, lastCustomer: Customer | null | undefined): Observable<any[]> {
    return runInInjectionContext(this.injector, () => {
      const pageSize = criteria.pagination.pageSize;
      const customerRef = collection(this.firestore, this.collectionName);
      let q;

      if (!lastCustomer || criteria.pagination.page === 1) {
        q = query(customerRef, orderBy('primaryLastName'), orderBy('primaryFirstName'), limit(pageSize));
      } else {
        q = query(
          customerRef,
          orderBy('primaryLastName'),
          orderBy('primaryFirstName'),
          startAfter(lastCustomer.primaryLastName, lastCustomer.primaryFirstName, lastCustomer.DocumentID),
          limit(pageSize)
        );
      }
      let result = collectionData(q, { idField: 'DocumentID' }) as Observable<Customer[]>
      return result as Observable<Customer[]>;
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
