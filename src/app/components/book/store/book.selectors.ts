import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BookState } from './book.state';
import { BOOK_FEATURE_KEY } from './book.reducers';

export const bookFeature = createFeatureSelector<BookState>(BOOK_FEATURE_KEY);

export const loadingTrucks = createSelector(bookFeature, (s) => s.loadingTrucks);
export const trucks = createSelector(bookFeature, (s) => s.trucks);
export const savingBooking = createSelector(bookFeature, (s) => s.savingBooking);
