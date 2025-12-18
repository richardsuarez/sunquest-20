import { createAction, props } from "@ngrx/store";
import { Booking } from "../../book/model/booking.model";
import { Season } from "../../season/models/season.model";
import { Truck } from "../../truck/model/truck.model";

export const loadBookReportStart = createAction(
    '[Report] Start loading booking report',
    props<{start: Date, end: Date, season: Season}>(),
);

export const loadBookReportSuccess = createAction(
    '[Report] Successfully loaded booking report',
    props<{bookingReport: Booking[]}>(),
);

export const fail = createAction(
    '[Report] Failed to load booking report',
    props<{error: Error}>(),
);

export const loadTrucks = createAction(
    '[Report] Load trucks',
);

export const loadTrucksSuccess = createAction(
    '[Report] Successfully loaded trucks',
    props<{trucks: Truck[]}>(),
); 

export const loadTruckTrips = createAction(
    '[Report] Load truck trips',
    props<{truckId: string, start: Date, end: Date, season: Season}>(),
);

export const loadTruckTripsSuccess = createAction(
    '[Report] Successfully loaded truck trips',
    props<{truckId: string, trips: any[]}>(),
);