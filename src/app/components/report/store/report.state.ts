import { Booking } from "../../book/model/booking.model";
import { Customer } from "../../customer/model/customer.model";
import { Truck } from "../../truck/model/truck.model";
import { BookReport } from "../models/report.models";

export interface ReportState{
    loading: boolean;
    appError: string | null;
    startDateCriteria: Date | null;
    endDateCriteria: Date | null;
    bookReport: BookReport | null;
    bookings: Booking[] | null;
    trucks: Truck[] | null;
    customerList: Customer[] | null;
}

export const initialReportState: ReportState = {
    loading: false,
    appError: null,
    startDateCriteria: null,
    endDateCriteria: null,
    bookReport: null,
    bookings: null,
    trucks: null,
    customerList: null,
};