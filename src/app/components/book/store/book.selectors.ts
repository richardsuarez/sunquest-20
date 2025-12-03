import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BookState } from './book.state';
import { BOOK_FEATURE_KEY } from './book.reducers';

export const bookFeature = createFeatureSelector<BookState>(BOOK_FEATURE_KEY);

export const loadingTrucks = createSelector(bookFeature, (s) => s.loading);
export const trucks = createSelector(bookFeature, (s) => s.trucks);
export const savingBooking = createSelector(bookFeature, (s) => s.savingBooking);
export const tripsMap = createSelector(bookFeature, (s) => s.trips);
export const bookingVM = createSelector(bookFeature, (s) => s.bookingViewModel);

// sorted trips map: returns trips arrays sorted by departureDate ascending
export const sortedTripsMap = createSelector(tripsMap, (map) => {
	if (!map) return {} as { [truckId: string]: any[] };
	const out: { [truckId: string]: any[] } = {};
	Object.keys(map).forEach(k => {
		const arr = (map[k] || []).slice();
		arr.sort((a: any, b: any) => {
			const da = a && a.departureDate ? new Date(a.departureDate).getTime() : Number.POSITIVE_INFINITY;
			const db = b && b.departureDate ? new Date(b.departureDate).getTime() : Number.POSITIVE_INFINITY;
			return da - db;
		});
		out[k] = arr;
	});
	return out;
});

// helper factory to get trips for a given truck id (sorted)
export const tripsForTruck = (truckId: string) => createSelector(sortedTripsMap,(map) => (map && truckId ? (map[truckId] || []) : []));
