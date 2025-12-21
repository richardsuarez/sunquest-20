import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from "@angular/core";
import { collection, Firestore, getDocsFromCache, getDocsFromServer, query, where } from "@angular/fire/firestore";
import { Season } from "../../season/models/season.model";
import { from, Observable, of } from "rxjs";
import { Booking } from "../../book/model/booking.model";
import { BookingGroup, BookReport, TruckReport } from "../models/report.models";
import { Truck } from "../../truck/model/truck.model";

@Injectable(
    { providedIn: 'root' }
)
export class ReportService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(EnvironmentInjector);

    getBookings(start: Date, end: Date, season: Season) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try {
                    const bookingsCollection = collection(this.firestore, 'bookings');
                    const q = query(
                        bookingsCollection,
                        where('season', '==', `${season.seasonName}-${season.year}`),
                        where('departureDate', '>=', start),
                        where('departureDate', '<=', end)
                    );
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        console.error('Error getting booking report from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let bookingReport: Booking[] = [];

                    snapshot.forEach(doc => {
                        const data = doc.data() as any;
                        const arrivalAt = data.arrivalAt ? (typeof data.arrivalAt.toDate === 'function' ? data.arrivalAt.toDate() : new Date(data.arrivalAt)) : null;
                        const pickupAt = data.pickupAt ? (typeof data.pickupAt.toDate === 'function' ? data.pickupAt.toDate() : new Date(data.pickupAt)) : null;
                        const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                        const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;

                        (bookingReport as Booking[]).push({
                            ...data as Booking,
                            id: doc.id,
                            arrivalAt,
                            pickupAt,
                            departureDate,
                            createdAt,
                        });
                    });

                    return bookingReport;
                }
                catch (error) {
                    throw error;
                }
            })());
        });
    }

    getTrucks() {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {

            })());
        });
    }

    getTruckTrips(season: Season) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {

                // loading trucks
                let trucks: Truck[] = [];
                try {
                    const trucksCollection = collection(this.firestore, 'trucks');
                    const q = query(trucksCollection);
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        console.error('Error getting trucks from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    snapshot.forEach(doc => {
                        trucks.push({
                            ...(doc.data() as any),
                            id: doc.id,
                        });
                    });
                }
                catch (error) {
                    throw error;
                }

                //loading trips
                const trucksWithTrips = await Promise.all(
                    trucks.map(async (truck) => {
                        try {
                            const tripsCollection = collection(this.firestore, `trucks/${truck.id}/trips`);
                            const q = query(
                                tripsCollection,
                                where('season', '==', `${season.seasonName}-${season.year}`),
                            );
                            let snapshot;
                            try {
                                snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                            } catch (error) {
                                console.error('Error getting truck trips from server, trying cache...', error);
                                snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                            }
                            let trips: any[] = [];
                            snapshot.forEach(doc => {
                                const data = doc.data() as any;
                                const arrivalDate = data.arrivalDate ? (typeof data.arrivalDate.toDate === 'function' ? data.arrivalDate.toDate() : new Date(data.arrivalDate)) : null;
                                const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                                const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
                                const delayDate = data.delayDate ? (typeof data.delayDate.toDate === 'function' ? data.delayDate.toDate() : new Date(data.delayDate)) : null;

                                trips.push({
                                    ...data,
                                    id: doc.id,
                                    arrivalDate,
                                    departureDate,
                                    createdAt,
                                    delayDate,
                                });
                            });
                            return {
                                ...truck,
                                trips,
                            };
                        }
                        catch (error) {
                            throw error;
                        }
                    })
                );
                return trucksWithTrips;
            })());
        });
    }

    transformBookingsReport(
        bookings: Booking[],
        trucks: Truck[] | null
    ): Observable<BookReport> {
        if (!bookings || bookings.length === 0 || !trucks) {
            return of({
                trucks: [],
                totalBookings: 0
            });
        }

        // Group bookings by tripId
        const bookingsByTrip = new Map<string | null, Booking[]>();
        bookings.forEach(booking => {
            const tripId = booking.tripId || null;
            if (!bookingsByTrip.has(tripId)) {
                bookingsByTrip.set(tripId, []);
            }
            bookingsByTrip.get(tripId)!.push(booking);
        });

        // Group trips by truckId and organize with bookings
        const truckReports: TruckReport[] = [];

        trucks.forEach(truck => {
            if (!truck.trips || truck.trips.length === 0) {
                return;
            }

            const relevantTrips: BookingGroup[] = [];

            truck.trips.forEach(trip => {
                const tripBookings = bookingsByTrip.get(trip.id || '') || [];
                if (tripBookings.length > 0) {
                    relevantTrips.push({
                        trip,
                        bookings: tripBookings.sort((a, b) => {
                            // Sort bookings by customer name
                            const nameA = (a.customer?.primaryFirstName || '') + (a.customer?.primaryLastName || '');
                            const nameB = (b.customer?.primaryFirstName || '') + (b.customer?.primaryLastName || '');
                            return nameA.localeCompare(nameB);
                        })
                    });
                }
            });

            // Only add truck if it has relevant trips
            if (relevantTrips.length > 0) {
                truckReports.push({
                    truck,
                    trips: relevantTrips.sort((a, b) => {
                        // Sort trips by departure date
                        const dateA = new Date(a.trip.departureDate || 0).getTime();
                        const dateB = new Date(b.trip.departureDate || 0).getTime();
                        return dateA - dateB;
                    })
                });
            }
        });

        // Sort trucks by truckNumber
        truckReports.sort((a, b) => {
            const nameA = a.truck.truckNumber || '';
            const nameB = b.truck.truckNumber || '';
            return nameA.localeCompare(nameB);
        });

        return of({
            trucks: truckReports,
            totalBookings: bookings.length
        });
    }

    /**
     * Get bookings for a specific trip
     */
    getBookingsForTrip(tripId: string, bookings: Booking[]): Booking[] {
        return bookings
            .filter(b => b.tripId === tripId)
            .sort((a, b) => {
                const nameA = (a.customer?.primaryFirstName || '') + (a.customer?.primaryLastName || '');
                const nameB = (b.customer?.primaryFirstName || '') + (b.customer?.primaryLastName || '');
                return nameA.localeCompare(nameB);
            });
    }

    /**
     * Format date for display
     */
    formatDate(date: Date | null): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}