import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Customer} from '../../components/customer/model/customer.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    @Inject(AngularFirestore) private firestore: AngularFirestore,
  ) { }

  // #region Customer

  addCustomer(customer: Customer) {
    const id = this.firestore.createId();
    customer.id = id;
    this.firestore.collection('Customer').add(customer)
      .then(() => {
        console.log('Customer added successfully!');
      }).catch((error) => {
        console.error('Error adding customer: ', error);
      });
  }

  //getCustomerList(criteria: SearchCriteria): Observable

  // #endregion Customer
}
