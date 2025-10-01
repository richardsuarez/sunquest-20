import { Injectable, signal } from "@angular/core";
import { Customer } from "../model/customer.model";

@Injectable({ providedIn: 'root' })
export class CustomerStateService {

  customerList = signal<Customer[]>([]);
  customerViewModel = signal<Customer | null>(null)


  setCustomer(newCustomer: Customer) {
    this.customerList.set([...(this.customerList() || []), newCustomer]);
  }

  setCustomerViewModel(customer: Customer) {
    this.customerViewModel.set(customer)
  }

  resetCustomerViewModel() {
    this.customerViewModel.set({
      id: '',
      primaryFirstName: '',
      primaryLastName: '',
      primaryMiddleName: '',
      primaryTitle: '',
      secondaryFirstName: '',
      secondaryLastName: '',
      secondaryMiddleName: '',
      secondaryTitle: '',
      email: '',
      telephone: '',
      phone: '',
      address1: '',
      address2: '',
      bldg: '',
      apt: '',
      city: '',
      state: '',
      zipCode: '',
    } as Customer)
  }

  deleteCustomer(id: string) {
    const updatedList = this.customerList().filter(c => c.id !== id);
    this.customerList.set(updatedList);
  }
}