import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ReportState } from "./report.state";

export const REPORT_FEATURE_KEY = 'report';

export const selectReportState = createFeatureSelector<ReportState>(REPORT_FEATURE_KEY);

export const loading = createSelector(selectReportState, (state: ReportState) => state.loading);
export const bookingReport = createSelector(selectReportState, (state: ReportState) => state.bookReport);
export const bookings = createSelector(selectReportState, (state: ReportState) => state.bookings);
export const trucks = createSelector(selectReportState, (state: ReportState) => state.trucks);
export const customerList = createSelector(selectReportState, (state: ReportState) => state.customerList);