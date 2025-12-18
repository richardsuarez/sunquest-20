import { createReducer, on } from "@ngrx/store";
import { initialReportState } from "./report.state";
import * as ReportActions from './report.actions'
import { Truck } from "../../truck/model/truck.model";

export const reportReducer = createReducer(
    initialReportState,
    on(ReportActions.loadBookReportStart, (state) => ({
        ...state,
        loadingBookReport: true,
        appError: null
    })),
    on(ReportActions.loadBookReportSuccess, (state, action) => ({
        ...state,
        loadingBookReport: false,
        bookingReport: action.bookingReport
    })),
    on(ReportActions.fail, (state, action) => ({
        ...state,
        loading: false,
        loadingBookReport: false,
        appError: action.error.message
    })),

    on(ReportActions.loadTrucks, (state) => ({
        ...state,
        loading: true,
        appError: null,
    })),
    on(ReportActions.loadTrucksSuccess, (state, action) => ({
        ...state,
        loading: false,
        trucks: action.trucks,
    })),

    on(ReportActions.loadTruckTrips, (state) => ({
        ...state,
        loading: true,
        appError: null,
    })),

    on(ReportActions.loadTruckTripsSuccess, (state, action) => ({
        ...state,
        loading: false,
        trucks: (state.trucks as Truck[]).map(truck => 
            truck.id === action.truckId ? { ...truck, trips: action.trips } : truck
        ),
        appError: null,
    })),
);