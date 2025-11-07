import { Schedule } from "../../schedule/model/schedule.model";

export interface Truck {
  id?: string;
  truckNumber: string;
  companyName: string;
  loadCapacity: number | null; // lbs
  carCapacity: number | null; // number of cars
  loadNumber?: string | null;
  createdAt?: Date | null;
  schedules?: Schedule[];
}


