import { Trip } from "../../trip/model/trip.model";

export interface Truck {
  id?: string;
  truckNumber: string | null;
  companyName: string | null;
  loadCapacity: number | null; // lbs
  carCapacity: number | null; // number of cars
  createdAt?: Date | null;
  trips?: Trip[];
}


