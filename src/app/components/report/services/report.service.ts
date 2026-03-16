import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from "@angular/core";
import { addDoc, collection, collectionGroup, doc, Firestore, getDocFromServer, getDocs, getDocsFromCache, getDocsFromServer, orderBy, query, updateDoc, where } from "@angular/fire/firestore";
import { Season } from "../../season/models/season.model";
import { from, Observable, of } from "rxjs";
import { Booking } from "../../book/model/booking.model";
import { BookingGroup, BookReport, TruckReport } from "../models/report.models";
import { Truck } from "../../truck/model/truck.model";
import { Customer, Vehicle } from "../../customer/model/customer.model";
import { Trip } from "../../trip/model/trip.model";

@Injectable(
    { providedIn: 'root' }
)
export class ReportService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(EnvironmentInjector);

    addTrip(truckId: string, trip: Partial<Trip>): Observable<Trip> {
        return runInInjectionContext(this.injector, () => {
            const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
            const now = new Date();
            const p = addDoc(tripsRef, {
                ...trip,
                truckId,
                createdAt: now
            }).then(docRef => ({
                ...(trip as Trip),
                id: docRef.id,
                truckId,
                createdAt: now
            } as Trip));
            return from(p) as Observable<Trip>;
        });
    }

    getBookings(start: Date, end: Date, season: Season, origin?: string) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try {
                    const bookingsCollection = collection(this.firestore, 'bookings');
                    let q;
                    if (!origin) {
                        q = query(
                            bookingsCollection,
                            where('season', '==', `${season.seasonName}-${season.year}`),
                            where('pickupAt', '>=', start),
                            where('pickupAt', '<=', end)
                        );
                    } else {
                        q = query(
                            bookingsCollection,
                            where('season', '==', `${season.seasonName}-${season.year}`),
                            where('from', '==', origin),
                            where('pickupAt', '>=', start),
                            where('pickupAt', '<=', end)
                        );
                    }

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

    getTruckTripsBySeason(season: Season) {
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
                                orderBy('departureDate', 'asc')
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

    getTruckTripsByDateRange(start: Date, end: Date) {
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
                                where('departureDate', '>=', start),
                                where('departureDate', '<=', end),
                                orderBy('departureDate', 'asc')
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

    getAllTrucks(): Observable<Truck[]> {
        return runInInjectionContext(this.injector, () => {
            const trucksRef = collection(this.firestore, 'trucks');

            const p = getDocsFromServer(trucksRef)
                .then(snapshot => {
                    return snapshot.docs.map(d => {
                        const data = d.data() as any;
                        // normalize Firestore Timestamps to JS Date
                        const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                        return ({ ...data, id: d.id, departureDate } as Truck);
                    });
                })
                .catch(async (err) => {
                    console.warn('[TruckService] getTrucks() - getDocsFromServer failed, falling back to cache. Error:', err);
                    const snapshot = await getDocsFromCache(trucksRef);
                    return snapshot.docs.map(d => {
                        const data = d.data() as any;
                        const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                        return ({ ...data, id: d.id, departureDate } as Truck);
                    });
                });

            return from(p) as Observable<Truck[]>;
        });
    }

    getCustomerList(searchFrom: string, searchTo: string) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                const alphabet = [
                    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
                    "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
                    "u", "v", "w", "x", "y", "z"
                ];
                // loading trucks
                let customerList: Customer[] = [];
                try {
                    const customersCollection = collection(this.firestore, 'customers');
                    const q = query(
                        customersCollection,
                        orderBy('primaryLastName', 'asc'),
                        orderBy('primaryFirstName', 'asc')
                    );
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    alphabet.forEach((letter) => {
                        //logic to search from searchFrom to searchTo
                        if (letter.localeCompare(searchFrom.toLowerCase()) >= 0 && letter.localeCompare(searchTo.toLowerCase()) <= 0) {
                            snapshot.docs.map(doc => {
                                if ((doc.data() as Customer).primaryLastName?.toLowerCase().startsWith(letter.toLowerCase())) {
                                    customerList.push({
                                        ...(doc.data() as any),
                                        DocumentId: doc.id,
                                    });
                                }
                            });
                        }
                    })
                }
                catch (error) {
                    throw error;
                }

                //loading vehicels
                return this.getCustomersVehicles(customerList);
            })());
        });
    }

    getCustomerListByRecNo(recNo: string): Promise<Customer[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const customersCollection = collection(this.firestore, 'customers');
                const q = query(
                    customersCollection,
                    where('recNo', '>=', recNo),
                    where('recNo', '<', recNo + '\uf8ff'),
                    orderBy('recNo', 'asc')
                );
                let snapshot;
                try {
                    snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                } catch (error) {
                    snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                }
                let customerList: Customer[] = [];
                snapshot.forEach(doc => {
                    customerList.push({
                        ...(doc.data() as any),
                        DocumentId: doc.id,
                    });
                });
                if (!customerList.length) {
                    // let's try to search for the recNo of the vehicles
                    const vehicleRef = collectionGroup(this.firestore, 'vehicles');
                    const vehicleQuery = query(
                        vehicleRef,
                        where('recNo', '>=', recNo),
                        where('recNo', '<', recNo + '\uf8ff'),
                        orderBy('recNo'),
                    );
                    const vehicleSnapshot = await runInInjectionContext(this.injector, () => getDocs(vehicleQuery));
                    const customerRefs = vehicleSnapshot.docs.map(doc => ({
                        customerReference: doc.ref.parent.parent, //customers/{id}
                    }));

                    if (customerRefs.length) {
                        const customerPromises = customerRefs.map(async (ref) => {
                            const customerDoc = await runInInjectionContext(this.injector, () => getDocFromServer(ref.customerReference!));
                            return {
                                ...customerDoc.data() as Customer,
                            };
                        });
                        customerList = await Promise.all(customerPromises);
                    }
                }
                resolve(this.getCustomersVehicles(customerList));
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCustomersVehicles(customerList: Customer[]) {
        const customersWithVehicles = await Promise.all(
            customerList.map(async (customer) => {
                try {
                    const vehiclesCollection = collection(this.firestore, `customers/${customer.DocumentID}/vehicles`);
                    const q = query(
                        vehiclesCollection,
                        orderBy('recNo', 'asc')
                    );
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let vehicles: Vehicle[] = [];
                    snapshot.forEach(doc => {
                        const data = doc.data() as any;
                        const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;

                        vehicles.push({
                            ...data,
                            id: doc.id,
                            createdAt,
                        });
                    });
                    return {
                        ...customer,
                        vehicles,
                    };
                }
                catch (error) {
                    throw error;
                }
            })
        );
        return customersWithVehicles;
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

    fetchBookingsForTrip(tripId: string, season: Season): Observable<Booking[]> {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try {
                    const bookingsCollection = collection(this.firestore, 'bookings');
                    const q = query(
                        bookingsCollection,
                        where('season', '==', `${season.seasonName}-${season.year}`),
                        where('tripId', '==', tripId)
                    );
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        console.error('Error getting bookings for trip from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let bookings: Booking[] = [];
                    snapshot.forEach(doc => {
                        const data = doc.data() as any;
                        const arrivalAt = data.arrivalAt ? (typeof data.arrivalAt.toDate === 'function' ? data.arrivalAt.toDate() : new Date(data.arrivalAt)) : null;
                        const pickupAt = data.pickupAt ? (typeof data.pickupAt.toDate === 'function' ? data.pickupAt.toDate() : new Date(data.pickupAt)) : null;
                        const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                        const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;


                        bookings.push({
                            ...doc.data() as Booking,
                            id: doc.id,
                            arrivalAt,
                            pickupAt,
                            departureDate,
                            createdAt
                        });
                    });
                    return bookings;
                } catch (error) {
                    console.error('Error fetching bookings for trip:', error);
                    throw error;
                }
            })());
        });
    }

    updateBooking(booking: Booking): Observable<void> {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try {
                    const bookingDocRef = doc(this.firestore, `bookings/${booking.id}`);
                    await updateDoc(bookingDocRef, {
                        tripId: booking.tripId,
                        truckId: booking.truckId,
                        departureDate: booking.departureDate
                    });
                } catch (error) {
                    console.error('Error updating booking with id:', booking.id, 'Error:', error);
                    throw error;
                }
            })());
        });
    }

    getLastLoadNumberOfAtruck(truckId: string, season: Season): Observable<number> {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try {
                    const tripsRef = collection(this.firestore, `trucks/${truckId}/trips`);
                    const q = query(
                        tripsRef,
                        where('season', '==', `${season.seasonName}-${season.year}`)
                    );

                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch (error) {
                        console.error('[ReportService] getLastLoadNumberOfAtruck() - server query failed', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }

                    let maxLoadNumber = 0;
                    snapshot.forEach(doc => {
                        const data = doc.data() as any;
                        if (data.loadNumber && typeof data.loadNumber === 'number') {
                            maxLoadNumber = Math.max(maxLoadNumber, data.loadNumber);
                        }
                    });

                    return maxLoadNumber;
                } catch (error) {
                    console.error('[ReportService] getLastLoadNumberOfAtruck() - failed to get load number for truckId:', truckId, 'Error:', error);
                    throw error;
                }
            })());
        });
    }
}