import { Customer, SearchCriteria } from "../model/customer.model";

export interface CustomerState{
    loading: boolean;
    customerList: Customer[];
    customerViewModel: Customer | null;
    searchCriteria: SearchCriteria;
    firstCustomerViewed: Customer | null;
    lastCustomerViewed: Customer | null;
    savingCustomer: boolean;
    totalPagination: number;
    appError: Error | null
}