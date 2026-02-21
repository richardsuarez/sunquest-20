import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from "@angular/core";
import { collection, collectionGroup, Firestore, getDocFromServer, getDocs, getDocsFromCache, getDocsFromServer, orderBy, query, where } from "@angular/fire/firestore";
import { Season } from "../../season/models/season.model";
import { from, Observable, of } from "rxjs";
import { Booking } from "../../book/model/booking.model";
import { BookingGroup, BookReport, TruckReport } from "../models/report.models";
import { Truck } from "../../truck/model/truck.model";
import { Customer, Vehicle } from "../../customer/model/customer.model";

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