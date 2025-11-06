import { Vehicle } from '../../customer/model/customer.model';

export interface Paycheck {
  checkNumber: string | null;
  bankName: string | null;
  amount: number;
}

export interface RouteInfo {
  origin: string | null;
  destination: string | null;
}

export interface TruckBookingInfo {
  truckId: string | null;
  departureDate: string | null; // ISO
  arrivalDate: string | null; // ISO
}

export interface Booking {
  id?: string;
  customerId: string;
  customerSnapshot: any;
  vehicleIds: string[];
  vehiclesSnapshot?: Vehicle[];
  floridaInstructions?: string | null;
  newYorkInstructions?: string | null;
  paycheck: Paycheck;
  arrivalAt: Date; // ISO datetime
  arrivalWeekOfYear: number;
  route: RouteInfo;
  truck: TruckBookingInfo;
  createdAt?: any;
}
