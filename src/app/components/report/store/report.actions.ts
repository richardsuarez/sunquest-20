import { createAction, props } from "@ngrx/store";
import { Booking } from "../../book/model/booking.model";
import { Season } from "../../season/models/season.model";
import { Truck } from "../../truck/model/truck.model";
import { BookReport } from "../models/report.models";
import { Customer } from "../../customer/model/customer.model";
import { Trip } from "../../trip/model/trip.model";

export const loadBookingsStart = createAction('[Report] Start loading booking report', props<{start: Date, end: Date, season: Season, origin?: string}>());
export const loadBookingsForTripStart = createAction('[Report] Start loading booking report for trip', props<{tripId: string, season: Season}>());
export const loadBookingsSuccess = createAction('[Report] Successfully loaded booking report', props<{bookings: Booking[]}>());
export const fail = createAction('[Report] Failed to load booking report', props<{error: Error}>());

export const loadTruckTripsBySeason = createAction('[Report] Load truck trips', props<{season: Season}>());
export const loadTruckTripsByDateRange = createAction('[Report] Load truck trips', props<{start: Date, end: Date}>());
export const getAllTrucks = createAction('[Report] Get all trucks');
export const loadTruckTripsSuccess = createAction('[Report] Successfully loaded truck trips', props<{trucks: Truck[]}>());

export const getBookReport = createAction('[Report] Get booking report with trucks', props<{bookings: Booking[], trucks: Truck[]}>());
export const getBookReportSuccess = createAction('[Report] Successfully got booking report with trucks', props<{bookReport: BookReport}>());

export const clearBookReport = createAction('[Report] Set as null bookReport property');
export const clearBookings = createAction('[Report] Reset booking list');

// #region customer-report

export const getCustomersByFromTo = createAction('[Report] Start fetch customer list', props<{from: string, to: string}>());
export const getCustomerSuccess = createAction('[Report] Successsful fetch customer list', props<{customerList: Customer[]}>());
export const getCustomersByRecNo = createAction('[Report] Start fetch customer list by recNo', props<{recNo: string}>());

// #endregion customer-report

export const cleanTruckList = createAction('[Report] Clean truck list in state');

// Trip actions
export const addTripStart = createAction('[Report] Add trip start', props<{ truckId: string, trip: Trip }>());
export const addTripSuccess = createAction('[Report] Add trip success', props<{ truckId: string, trip: Trip }>());
export const addTripFail = createAction('[Report] Add trip fail', props<{ error: Error }>());

export const addTripAndUpdateBookingsStart = createAction('[Report] Add trip and then update all bokings involved with that trip', props<{truckId: string, trip: Trip, bookings: Booking[], season: Season}>());
export const updateBooking = createAction('[Report] Update booking', props<{booking: Booking}>());
export const addTripAndUpdateBookingsSuccess = createAction('[Report] Add trip and update bookings success', props<{bookings: Booking[]}>());