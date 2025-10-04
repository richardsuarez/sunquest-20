import { Injectable } from '@angular/core';
import { Customer, SearchCriteria} from '../../components/customer/model/customer.model';
import { addDoc, collection, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, withLatestFrom } from 'rxjs';
import { CustomerStateService } from '../../components/customer/state/state';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private readonly firestore: Firestore,
    private readonly state: CustomerStateService,
  ) { }

  // #region Customer

  addCustomer(customer: Customer) {
    const newCustomerRef = collection(this.firestore, 'customers');
    return addDoc(newCustomerRef, customer);
  }

  getCustomerList(): Observable<Customer[]>{
    const CustomerListRef = collection(this.firestore, 'customers');
    return collectionData(CustomerListRef, { idField: 'id' }) as Observable<Customer[]>;
  }

  deleteCustomer(id: string) {
    const customerDocRef = doc(this.firestore, `customers/${id}`);
    return deleteDoc(customerDocRef);
  }

  updateCustomer(customer: Partial<Customer>) {
    const cvm = this.state.customerViewModel()
    if(!cvm) return Promise.reject('No customer to update');
    const customerDocRef = doc(this.firestore, `customers/${cvm.id}`);
    return updateDoc(customerDocRef, { ...customer });
  }

  // #endregion Customer
}
