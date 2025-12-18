import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from "@angular/core";
import { collection, Firestore, getDocsFromCache, getDocsFromServer, query, where } from "@angular/fire/firestore";
import { Season } from "../../season/models/season.model";
import { from } from "rxjs";
import { Booking } from "../../book/model/booking.model";

@Injectable(
    { providedIn: 'root' }
)
export class ReportService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(EnvironmentInjector);

    getBookingReport(start: Date, end: Date, season: Season) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try{
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
                    } catch(error) {
                        console.error('Error getting booking report from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let bookingReport: Booking[] = [];
                    
                    snapshot.forEach(doc => {
                        const data = doc.data() as any;
                        const arrivalAt = data.arrivalAt ? (typeof data.arrivalAt.toDate === 'function' ? data.arrivalAt.toDate() : new Date(data.arrivalAt)) : null;
                        const departureDate = data.departureDate ? (typeof data.departureDate.toDate === 'function' ? data.departureDate.toDate() : new Date(data.departureDate)) : null;
                        const createdAt = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
                        
                        (bookingReport as Booking[]).push({
                            ...data as Booking,
                            id: doc.id,
                            arrivalAt,
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
                try{
                    const trucksCollection = collection(this.firestore, 'trucks');
                    const q = query(trucksCollection);
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch(error) {
                        console.error('Error getting trucks from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let trucks: any[] = [];
                    snapshot.forEach(doc => {
                        trucks.push({
                            ...(doc.data() as any),
                            id: doc.id,
                        });
                    });
                    return trucks;
                }
                catch (error) {
                    throw error;
                }
            })());
        });
    }

    getTruckTrips(truckId: string, season: Season) {
        return runInInjectionContext(this.injector, () => {
            return from((async () => {
                try{
                    const tripsCollection = collection(this.firestore, `trucks/${truckId}/trips`);
                    const q = query(
                        tripsCollection,
                        where('season', '==', `${season.seasonName}-${season.year}`)
                    );
                    let snapshot;
                    try {
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromServer(q));
                    } catch(error) {
                        console.error('Error getting truck trips from server, trying cache...', error);
                        snapshot = await runInInjectionContext(this.injector, () => getDocsFromCache(q));
                    }
                    let trips: any[] = [];
                    snapshot.forEach(doc => {
                        trips.push({
                            ...(doc.data() as any),
                            id: doc.id,
                        });
                    });
                    return trips;
                }
                catch (error) {
                    throw error;
                }
            })());
        });
    }
}