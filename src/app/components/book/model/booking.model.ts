import { Address, Customer } from '../../customer/model/customer.model';

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
  arrivalAddress: Address | null;
  arrivalAt: Date | null; // ISO datetime
  arrivalWeekOfYear: number | null;
  pickupAddress: Address | null;
  pickupAt: Date | null; // ISO datetime
  pickupWeekOfYear: number | null;
  from: string | null;
  to: string | null;
  departureDate: Date | null;
  tripId: string | null;
  truckId: string | null;
  notes: string | null;
  createdAt?: Date;
  season: string | null;
}
