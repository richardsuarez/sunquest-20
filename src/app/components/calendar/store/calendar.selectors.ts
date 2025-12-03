import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CalendarState } from './calendar.state';
import { CALENDAR_FEATURE_KEY } from './calendar.reducers';

export const calendarFeatureSelector = createFeatureSelector<CalendarState>(CALENDAR_FEATURE_KEY);

export const selectTrucks = createSelector(calendarFeatureSelector, (state: CalendarState) => state.trucks);
export const selectTrips = createSelector(calendarFeatureSelector, (state: CalendarState) => state.trips);
export const selectLoadingTrucks = createSelector(calendarFeatureSelector, (state: CalendarState) => state.loading);
export const selectAppError = createSelector(calendarFeatureSelector, (state: CalendarState) => state.appError);
export const selectCalendarEvents = createSelector(calendarFeatureSelector, (state: CalendarState) => state.calendarEvents);
export const currentMonthBookings = createSelector(calendarFeatureSelector, (state: CalendarState) => state.currentMonthBookings);
