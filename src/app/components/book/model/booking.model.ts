import { Customer, Vehicle } from '../../customer/model/customer.model';
import { Trip } from '../../trip/model/trip.model';

export interface Paycheck {
  checkNumber: string | null;
  bankName: string | null;
  amount: number;
}

export interface Booking {
  id?: string;
  customer: Customer | null;
  vehicleIds: string[];
  paycheck: Paycheck;
  arrivalAt: Date | null; // ISO datetime
  arrivalWeekOfYear: number | null;
  pickupAt: Date | null; // ISO datetime
  pickupWeekOfYear: number | null;
  from: string | null;
  to: string | null;
  departureDate: Date | null;
  tripId: string | null;
  truckId: string | null;
  notes: string | null;
  createdAt?: Date;
}
