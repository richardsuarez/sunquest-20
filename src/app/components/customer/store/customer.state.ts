import { Booking } from "../../book/model/booking.model";
import { Customer, SearchCriteria } from "../model/customer.model";

export interface CustomerState{
    loading: boolean;
    customerList: Customer[] | null;
    bookingList: Booking[];
    customerViewModel: Customer | null;
    searchCriteria: SearchCriteria;
    savingCustomer: boolean;
    totalPagination: number;
    appError: Error | null;
}