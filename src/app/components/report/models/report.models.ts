import { Booking } from "../../book/model/booking.model";
import { Trip } from "../../trip/model/trip.model";
import { Truck } from "../../truck/model/truck.model";

export interface BookingGroup {
  trip: Trip;
  bookings: Booking[];
}

export interface TruckReport {
  truck: Truck;
  trips: BookingGroup[];
}

export interface BookReport {
  trucks: TruckReport[];
  totalBookings: number;
}