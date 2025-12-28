import { createReducer, on } from "@ngrx/store";
import { initialReportState } from "./report.state";
import * as ReportActions from './report.actions'
import { Truck } from "../../truck/model/truck.model";

export const reportReducer = createReducer(
    initialReportState,
    on(ReportActions.loadBookingsStart, (state) => ({
        ...state,
        loadingBookReport: true,
        appError: null
    })),
    on(ReportActions.loadBookingsSuccess, (state, action) => ({
        ...state,
        loadingBookReport: false,
        bookings: action.bookings
    })),
    on(ReportActions.fail, (state, action) => ({
        ...state,
        loading: false,
        loadingBookReport: false,
        appError: action.error.message
    })),

    on(ReportActions.loadTruckTrips, (state) => ({
        ...state,
        loading: true,
        appError: null,
    })),

    on(ReportActions.loadTruckTripsSuccess, (state, action) => ({
        ...state,
        loading: false,
        trucks: action.trucks,
        appError: null,
    })),

    on(ReportActions.getBookReport, (state) => ({
        ...state,
        loadingBookReport: true,
        appError: null,
    })),
    on(ReportActions.getBookReportSuccess, (state, action) => ({
        ...state,
        loadingBookReport: false,
        bookReport: action.bookReport,
    })),

    on(ReportActions.clearBookReport, (state) => ({
        ...state,
        bookReport: null,
    }))
);