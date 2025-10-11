import { Customer, SearchCriteria } from "../model/customer.model";

export interface CustomerState{
    loading: boolean;
    customerList: Customer[];
    customerViewModel: Partial<Customer> | null;
    searchCriteria: SearchCriteria;
    lastCustomer: Customer | null;
    savingCustomer: boolean;

    appError: Error | null
}