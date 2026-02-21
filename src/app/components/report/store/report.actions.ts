import { createAction, props } from "@ngrx/store";
import { Booking } from "../../book/model/booking.model";
import { Season } from "../../season/models/season.model";
import { Truck } from "../../truck/model/truck.model";
import { BookReport } from "../models/report.models";
import { Customer } from "../../customer/model/customer.model";

export const loadBookingsStart = createAction(
    '[Report] Start loading booking report',
    props<{start: Date, end: Date, season: Season}>(),
);

export const loadBookingsSuccess = createAction(
    '[Report] Successfully loaded booking report',
    props<{bookings: Booking[]}>(),
);

export const fail = createAction(
    '[Report] Failed to load booking report',
    props<{error: Error}>(),
);

export const loadTruckTrips = createAction(
    '[Report] Load truck trips',
    props<{season: Season}>(),
);

export const loadTruckTripsSuccess = createAction(
    '[Report] Successfully loaded truck trips',
    props<{trucks: Truck[]}>(),
);

export const getBookReport = createAction(
    '[Report] Get booking report with trucks',
    props<{bookings: Booking[], trucks: Truck[]}>(),
);

export const getBookReportSuccess = createAction(
    '[Report] Successfully got booking report with trucks',
    props<{bookReport: BookReport}>(),
);

export const clearBookReport = createAction(
    '[Report] Set as null bookReport property'
);

// #region customer-report

export const getCustomersByFromTo = createAction(
    '[Report] Start fetch customer list',
    props<{from: string, to: string}>()
);

export const getCustomerSuccess = createAction(
    '[Report] Successsful fetch customer list',
    props<{customerList: Customer[]}>(),
);

export const getCustomersByRecNo = createAction(
    '[Report] Start fetch customer list by recNo',
    props<{recNo: string}>()
);

// #endregion customer-report