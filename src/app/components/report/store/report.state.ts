import { Booking } from "../../book/model/booking.model";
import { Truck } from "../../truck/model/truck.model";

export interface ReportState{
    loading: boolean;
    loadingBookReport: boolean;
    appError: string | null;
    startDateCriteria: Date | null;
    endDateCriteria: Date | null;
    bookingReport: Booking[] | null;
    trucks: Truck[] | null
}

export const initialReportState: ReportState = {
    loading: false,
    loadingBookReport: false,
    appError: null,
    startDateCriteria: null,
    endDateCriteria: null,
    bookingReport: null,
    trucks: null,
};